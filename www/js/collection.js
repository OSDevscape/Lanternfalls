(function () {
    var LOOT_KEY = 'bookshelf-adventure-loot-v1';
    var ARTIFACT_KEY = 'bookshelf-adventure-artifacts-v1';

    var RARITIES = [
        'Common',
        'Uncommon',
        'Rare',
        'Epic',
        'Legendary',
        'Mythic'
    ];

    var ARTIFACT_EFFECTS = {
        'Inkstone Charm': {
            scope: 'session',
            label: '+2% XP on claimed reading sessions'
        },
        'Paperbound Token': {
            scope: 'session',
            label: '+1 gold on claimed reading sessions'
        },
        'Reader’s Candle': {
            scope: 'session',
            label: '+2% critical-hit chance'
        },
        'Gilded Bookmark': {
            scope: 'session',
            label: '+5% XP on claimed reading sessions'
        },
        'Lantern of Focus': {
            scope: 'session',
            label: '+20 XP on 30+ minute reading sessions'
        },
        'Wanderer’s Satchel': {
            scope: 'session',
            label: '+10% gold on claimed reading sessions'
        },
        'Archivist’s Key': {
            scope: 'completion',
            label: '+15% gold on boss rewards'
        },
        'Moonlit Quill': {
            scope: 'session',
            label: '+10% XP on claimed reading sessions'
        },
        'Chronicle Compass': {
            scope: 'session',
            label: '+8% critical-hit chance'
        },
        'Runeshelf Reliquary': {
            scope: 'completion',
            label: 'Raises the minimum boss-loot rarity to Uncommon'
        },
        'Starlit Codex': {
            scope: 'session',
            label: '+18% XP on claimed reading sessions'
        },
        'Dragonhide Journal': {
            scope: 'completion',
            label: '+20% XP on boss rewards'
        },
        'Crown of the First Library': {
            scope: 'all',
            label: '+25% XP on all claimed rewards'
        },
        'Everscript Grimoire': {
            scope: 'completion',
            label: 'Raises the minimum boss-loot rarity to Rare'
        },
        'The Infinite Bookmark': {
            scope: 'all',
            label: '+35% XP on all claimed rewards'
        }
    };

    function read(key, fallback) {
        try {
            return JSON.parse(localStorage.getItem(key) || fallback);
        } catch (_) {
            return JSON.parse(fallback);
        }
    }

    function write(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function escape(value) {
        return String(value == null ? '' : value).replace(/[&<>'"]/g, function (character) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[character];
        });
    }

    function page() {
        return document.getElementById('navPlaceholder');
    }

    function number(value) {
        return Math.max(0, Number(value) || 0);
    }

    function raritySlug(value) {
        return String(value || 'Common')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-');
    }

    function hash(value) {
        var result = 0;

        String(value || '').split('').forEach(function (character) {
            result = ((result << 5) - result) + character.charCodeAt(0);
            result |= 0;
        });

        return Math.abs(result);
    }

    function lootState() {
        var value = read(
            LOOT_KEY,
            '{"items":[],"events":[],"relics":{},"equippedItemId":""}'
        );

        if (!value || typeof value !== 'object') {
            value = {};
        }

        value.items = Array.isArray(value.items) ? value.items : [];
        value.events = Array.isArray(value.events) ? value.events : [];

        value.relics = value.relics &&
            typeof value.relics === 'object' &&
            !Array.isArray(value.relics)
            ? value.relics
            : {};

        return value;
    }

    function artifactState() {
        var value = read(
            ARTIFACT_KEY,
            '{"version":1,"equippedId":"","equippedName":""}'
        );

        if (!value || typeof value !== 'object') {
            value = {};
        }

        value.version = 1;
        value.equippedId = String(value.equippedId || '');
        value.equippedName = String(value.equippedName || '');

        return value;
    }

    function artifactEffect(item) {
        var definition = ARTIFACT_EFFECTS[item && item.name];

        return definition
            ? definition.label
            : 'Artifact effect has not been defined yet.';
    }

    function artifacts() {
        return lootState().items.filter(function (item) {
            return item && !!ARTIFACT_EFFECTS[item.name];
        });
    }

    function artifactId(item) {
        if (!item) {
            return '';
        }

        return String(item.instanceId || item.id || '');
    }

    function equippedArtifact() {
        var allArtifacts = artifacts();
        var state = artifactState();

        return allArtifacts.filter(function (item) {
            return artifactId(item) === state.equippedId;
        })[0] || null;
    }

    function isEquipped(item, equipped) {
        return !!(
            item &&
            equipped &&
            artifactId(item) &&
            artifactId(item) === artifactId(equipped)
        );
    }

    function saveEquip(item) {
        var itemId = artifactId(item);

        if (!itemId) {
            return {
                ok: false,
                reason: 'This artifact does not have a saved inventory ID.'
            };
        }

        write(ARTIFACT_KEY, {
            version: 1,
            equippedId: itemId,
            equippedName: String(item.name || '')
        });

        window.dispatchEvent(
            new CustomEvent('bookshelf-adventure-artifact-changed', {
                detail: {
                    equipped: item
                }
            })
        );

        return {
            ok: true,
            item: item
        };
    }

    function saveUnequip() {
        write(ARTIFACT_KEY, {
            version: 1,
            equippedId: '',
            equippedName: ''
        });

        window.dispatchEvent(
            new CustomEvent('bookshelf-adventure-artifact-changed', {
                detail: {
                    equipped: null
                }
            })
        );

        return { ok: true };
    }

    function formatDate(value) {
        if (!value) {
            return 'Unknown date';
        }

        var date = new Date(value);

        if (isNaN(date.getTime())) {
            return 'Unknown date';
        }

        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function rarityCounts(items) {
        var counts = {};

        RARITIES.forEach(function (rarity) {
            counts[rarity] = 0;
        });

        items.forEach(function (item) {
            var rarity = String((item || {}).rarity || 'Common');

            if (Object.prototype.hasOwnProperty.call(counts, rarity)) {
                counts[rarity] += 1;
            }
        });

        return counts;
    }

    function relicGroups(relics) {
        var source = relics &&
            typeof relics === 'object' &&
            !Array.isArray(relics)
            ? relics
            : {};

        return Object.keys(source).map(function (groupId) {
            var group = source[groupId] || {};
            var items = group.items &&
                typeof group.items === 'object' &&
                !Array.isArray(group.items)
                ? group.items
                : {};

            var entries = Object.keys(items)
                .map(function (name) {
                    return {
                        key: String(name || ''),
                        name: String(name || 'Unknown relic'),
                        quantity: number(items[name])
                    };
                })
                .filter(function (entry) {
                    return entry.name && entry.quantity > 0;
                })
                .sort(function (first, second) {
                    return first.name.localeCompare(second.name);
                });

            return {
                id: String(groupId || 'relics'),
                label: String(group.label || groupId || 'Recovered Relics'),
                entries: entries,
                total: entries.reduce(function (total, entry) {
                    return total + entry.quantity;
                }, 0)
            };
        }).filter(function (group) {
            return group.entries.length > 0;
        }).sort(function (first, second) {
            return first.label.localeCompare(second.label);
        });
    }

    function relicSummary(groups) {
        var total = 0;
        var distinct = 0;

        groups.forEach(function (group) {
            total += number(group.total);
            distinct += group.entries.length;
        });

        return {
            total: total,
            distinct: distinct
        };
    }

    function equippedCardHtml(equipped) {
        if (!equipped) {
            return (
                '<section class="collection-card collection-equipped-card">' +
                '<span class="collection-label">Equipped Artifact</span>' +
                '<h2>No artifact equipped</h2>' +
                '<p class="collection-muted">' +
                'Defeat book bosses and claim their rewards to discover artifacts. ' +
                'Then choose one here to influence future rewards.' +
                '</p>' +
                '</section>'
            );
        }

        var rarity = String(equipped.rarity || 'Common');

        return (
            '<section class="collection-card collection-equipped-card rarity-' +
            raritySlug(rarity) +
            '">' +
            '<span class="collection-label">Equipped Artifact</span>' +
            '<div class="collection-equipped-row">' +
            '<span class="collection-artifact-mark">◆</span>' +
            '<div>' +
            '<h2>' + escape(equipped.name || 'Unknown Artifact') + '</h2>' +
            '<p class="collection-rarity">' + escape(rarity) + ' Artifact</p>' +
            '</div>' +
            '</div>' +
            '<p class="collection-effect">' +
            escape(artifactEffect(equipped)) +
            '</p>' +
            '<p class="collection-muted">' +
            'Equipped artifacts persist until you choose a different one.' +
            '</p>' +
            '<button type="button" class="collection-secondary-button" ' +
            'data-artifact-unequip>' +
            'Unequip Artifact' +
            '</button>' +
            '</section>'
        );
    }

    function artifactListHtml(items, equipped) {
        if (!items.length) {
            return (
                '<p class="collection-empty">' +
                'No artifacts yet. Claim a completed book reward to add your first find.' +
                '</p>'
            );
        }

        return (
            '<div class="collection-artifact-list">' +
            items.map(function (item) {
                var rarity = String(item.rarity || 'Common');
                var itemId = artifactId(item);
                var equippedNow = isEquipped(item, equipped);

                return (
                    '<article class="collection-artifact-item rarity-' +
                    raritySlug(rarity) +
                    '">' +
                    '<span class="collection-artifact-mark">◆</span>' +
                    '<div class="collection-item-copy">' +
                    '<b>' + escape(item.name || 'Unknown Artifact') + '</b>' +
                    '<span>' +
                    escape(rarity) + ' · ' +
                    escape(artifactEffect(item)) +
                    '</span>' +
                    '<small>Found from ' +
                    escape(item.bookTitle || 'a completed book') +
                    ' · ' +
                    escape(formatDate(item.earnedAt)) +
                    '</small>' +
                    '</div>' +
                    (
                        equippedNow
                            ? '<em class="collection-equipped-badge">Equipped</em>'
                            : '<button type="button" class="collection-equip-button" ' +
                            'data-artifact-equip="' + escape(itemId) + '">' +
                            'Equip' +
                            '</button>'
                    ) +
                    '</article>'
                );
            }).join('') +
            '</div>'
        );
    }

    function trophyMetrics(bookId, event) {
        var game = read('bookshelf-adventure-progression-v1', '{}');
        var stats = game.stats || {};
        var strength = Math.max(10, number(stats.str) || 10);
        var luck = Math.max(10, number(stats.lck) || 10);

        var sessions = read('bookshelf-reading-log-v1', '[]').filter(function (session) {
            return session &&
                session.bookId === bookId &&
                number(session.minutes);
        });

        var minutes = sessions.reduce(function (total, session) {
            return total + number(session.minutes);
        }, 0);

        var criticals = 0;
        var damage = 0;
        var critChance = Math.min(25, 5 + luck / 20);

        sessions.forEach(function (session) {
            var base = Math.floor(
                number(session.minutes) * (1 + strength / 500)
            );

            var critical = (hash(session.id) % 10000) <
                Math.round(critChance * 100);

            damage += critical
                ? Math.floor(base * 1.5)
                : base;

            if (critical) {
                criticals += 1;
            }
        });

        var readingXP = minutes * 10;

        var readingGold = sessions.reduce(function (total, session) {
            return total + Math.max(
                1,
                Math.floor(number(session.minutes) / 2)
            );
        }, 0);

        var bossXP = event.xp === undefined
            ? 0
            : number(event.xp);

        return {
            sessions: sessions,
            minutes: minutes,
            sessionXP: readingXP,
            bossXP: bossXP,
            totalXP: readingXP + bossXP,
            gold: number(event.gold) + readingGold,
            damage: damage,
            criticals: criticals,
            critChance: critChance
        };
    }

    function trophyDate(event, sessions) {
        var latest = (sessions || []).slice().sort(function (first, second) {
            var firstDate = String(
                first.date ||
                first.createdAt ||
                first.endedAt ||
                ''
            );

            var secondDate = String(
                second.date ||
                second.createdAt ||
                second.endedAt ||
                ''
            );

            return secondDate.localeCompare(firstDate);
        })[0] || {};

        return (
            event.earnedAt ||
            event.defeatedAt ||
            event.claimedAt ||
            event.createdAt ||
            latest.date ||
            latest.createdAt ||
            latest.endedAt
        );
    }

    function detailedTrophyListHtml(events) {
        if (!events.length) {
            return (
                '<p class="collection-empty">' +
                'Claim a completed book reward to earn your first boss trophy.' +
                '</p>'
            );
        }

        var bookData = read('bookshelf-data', '{"books":[]}');
        var books = Array.isArray(bookData.books) ? bookData.books : [];

        return (
            '<div class="collection-trophy-list collection-trophy-detail-list">' +
            events.slice(0, 20).map(function (event) {
                var stat = trophyMetrics(event.bookId, event);
                var rarity = String(event.rarity || 'Common');
                var boss = event.bossName || 'Defeated boss';

                var book = books.filter(function (item) {
                    return item && item.id === event.bookId;
                })[0];

                if (
                    book &&
                    window.BookShelfBosses &&
                    typeof window.BookShelfBosses.get === 'function'
                ) {
                    boss = window.BookShelfBosses.get(book).name || boss;
                }

                var bookTitle = event.title || (
                    book && book.title
                        ? book.title
                        : 'Unknown book'
                );

                var sessionsHtml = stat.sessions.length
                    ? stat.sessions.slice().sort(function (first, second) {
                        var firstDate = String(
                            first.date ||
                            first.createdAt ||
                            first.endedAt ||
                            ''
                        );

                        var secondDate = String(
                            second.date ||
                            second.createdAt ||
                            second.endedAt ||
                            ''
                        );

                        return secondDate.localeCompare(firstDate);
                    }).map(function (session) {
                        return (
                            '<li>' +
                            '<span>' +
                            escape(formatDate(
                                session.date ||
                                session.createdAt ||
                                session.endedAt
                            )) +
                            '</span>' +
                            '<b>' + number(session.minutes) + ' min</b>' +
                            '</li>'
                        );
                    }).join('')
                    : '<li><span>No time entries retained</span></li>';

                return (
                    '<details class="collection-trophy-detail rarity-' +
                    raritySlug(rarity) +
                    '">' +
                    '<summary class="collection-trophy-toggle">' +
                    '<span class="collection-trophy-toggle-title">' +
                    '<b>★ ' + escape(boss) + '</b>' +
                    '<em>' + escape(rarity) + ' Boss</em>' +
                    '</span>' +
                    '<strong>' +
                    '+' + stat.totalXP + ' XP' +
                    '<i>+' + stat.gold + ' gold</i>' +
                    '</strong>' +
                    '</summary>' +
                    '<div class="collection-trophy-detail-body">' +
                    '<div class="collection-trophy-stats">' +
                    '<div><b>' + stat.minutes + '</b><span>Minutes logged</span></div>' +
                    '<div><b>' + stat.sessions.length + '</b><span>Sessions logged</span></div>' +
                    '<div><b>' + stat.damage + '</b><span>Damage dealt</span></div>' +
                    '<div><b>' + stat.criticals + '</b><span>Critical hits</span></div>' +
                    '<div><b>' + stat.sessionXP + '</b><span>Reading XP</span></div>' +
                    '<div><b>+' + stat.bossXP + '</b><span>Boss XP</span></div>' +
                    '</div>' +
                    '<div class="collection-trophy-recap">' +
                    '<p><b>Book:</b> ' + escape(bookTitle) + '</p>' +
                    '<p><b>Rarity:</b> ' + escape(rarity) + '</p>' +
                    '<p><b>Rewards:</b> ' +
                    stat.totalXP + ' XP · ' +
                    stat.gold + ' gold · ' +
                    escape(event.loot || 'Trophy') +
                    '</p>' +
                    '<p><b>Defeated:</b> ' +
                    escape(formatDate(trophyDate(event, stat.sessions))) +
                    ' · Crit chance used: ' +
                    stat.critChance.toFixed(1) +
                    '%' +
                    '</p>' +
                    '</div>' +
                    '<div class="collection-session-history">' +
                    '<b>Reading sessions</b>' +
                    '<ul>' + sessionsHtml + '</ul>' +
                    '</div>' +
                    '</div>' +
                    '</details>'
                );
            }).join('') +
            '</div>'
        );
    }

    function rarityProgressHtml(counts) {
        return (
            '<div class="collection-rarity-progress">' +
            RARITIES.map(function (rarity) {
                return (
                    '<span class="rarity-' + raritySlug(rarity) + '">' +
                    '<b>' + counts[rarity] + '</b>' +
                    '<small>' + escape(rarity) + '</small>' +
                    '</span>'
                );
            }).join('') +
            '</div>'
        );
    }

    function relicListHtml(groups) {
  if (!groups.length) {
    return (
      '<div class="collection-relic-empty">' +
      '<b>No relics recovered yet</b>' +
      '<span>' +
      'Complete reading encounters to leave traces of your journeys in the Reading Realm.' +
      '</span>' +
      '</div>'
    );
  }

  return (
    '<div class="collection-relic-groups">' +
    groups.map(function (group) {
      return (
        '<details class="collection-relic-group" ' +
        'data-relic-group="' + escape(group.id) + '">' +

        '<summary class="collection-relic-group-header">' +
        '<span class="collection-relic-group-title">' +
        '<b>' + escape(group.label) + '</b>' +
        '<small>' +
        group.entries.length + ' relic type' +
        (group.entries.length === 1 ? '' : 's') +
        '</small>' +
        '</span>' +

        '<em>' + group.total + ' recovered</em>' +
        '</summary>' +

        '<div class="collection-relic-list">' +
        group.entries.map(function (entry) {
          return (
            '<article class="collection-relic-item">' +
            '<span class="collection-relic-mark">✦</span>' +

            '<div class="collection-relic-copy">' +
            '<b>' + escape(entry.name) + '</b>' +
            '<span>' +
            escape(group.label) + ' encounter relic' +
            '</span>' +
            '</div>' +

            '<em>×' + entry.quantity + '</em>' +
            '</article>'
          );
        }).join('') +
        '</div>' +

        '</details>'
      );
    }).join('') +
    '</div>'
  );
}

    function render() {
        var target = page();

        if (!target || target.classList.contains('hidden')) {
            return;
        }

        if (!target.classList.contains('collection-page')) {
            return;
        }

        var artifactCodexWasOpen = !!target.querySelector(
            '.collection-artifact-details[open]'
        );

        var trophiesWereOpen = !!target.querySelector(
            '.collection-boss-trophies-details[open]'
        );

        var relicsWereOpen = !!target.querySelector(
            '.collection-relic-details[open]'
        );

        var loot = lootState();
        var allArtifacts = artifacts();
        var equipped = equippedArtifact();
        var counts = rarityCounts(allArtifacts);
        var groups = relicGroups(loot.relics);
        var relics = relicSummary(groups);

        var discoveredTiers = RARITIES.filter(function (rarity) {
            return counts[rarity] > 0;
        }).length;

        target.innerHTML =
            '<header class="collection-header">' +
            '<button type="button" class="collection-back" data-collection-back ' +
            'aria-label="Return to Realm">‹ Realm</button>' +
            '<div><h1>Collection</h1>' +
            '<p>Your trophies, artifacts, relics, and rare finds.</p></div>' +
            '</header>' +

            '<main class="collection-content">' +

            equippedCardHtml(equipped) +

            '<section class="collection-card collection-collapsible-card">' +
            '<span class="collection-label">Artifact Codex</span>' +
            '<h2>Collected Artifacts</h2>' +
            '<p class="collection-muted">' +
            allArtifacts.length + ' discovered · ' +
            discoveredTiers + ' of ' + RARITIES.length +
            ' rarity tiers found' +
            '</p>' +
            '<details class="collection-details collection-artifact-details" ' +
            (artifactCodexWasOpen ? 'open' : '') +
            '>' +
            '<summary>' +
            '<span>View artifacts</span>' +
            '<em>' + allArtifacts.length + ' found</em>' +
            '</summary>' +
            '<div class="collection-collapsible-body">' +
            rarityProgressHtml(counts) +
            artifactListHtml(allArtifacts, equipped) +
            '</div>' +
            '</details>' +
            '</section>' +

            '<section class="collection-card collection-collapsible-card">' +
            '<span class="collection-label">Boss Trophies</span>' +
            '<h2>Defeated Bosses</h2>' +
            '<p class="collection-muted">' +
            'A permanent record of completed books whose rewards you claimed.' +
            '</p>' +
            '<details class="collection-details collection-boss-trophies-details" ' +
            (trophiesWereOpen ? 'open' : '') +
            '>' +
            '<summary>' +
            '<span>View defeated bosses</span>' +
            '<em>' + loot.events.length + ' defeated</em>' +
            '</summary>' +
            '<div class="collection-collapsible-body">' +
            detailedTrophyListHtml(loot.events) +
            '</div>' +
            '</details>' +
            '</section>' +

            '<section class="collection-card collection-collapsible-card collection-relic-card">' +
            '<span class="collection-label">Encounter Relics</span>' +
            '<h2>Recovered Relics</h2>' +
            '<p class="collection-muted">' +
            'Permanent traces recovered during reading encounters. ' +
            'Relics are cosmetic for now and may later be traded, refined, sold, or crafted at the Bazaar.' +
            '</p>' +
            '<details class="collection-details collection-relic-details" ' +
            (relicsWereOpen ? 'open' : '') +
            '>' +
            '<summary>' +
            '<span>View relics</span>' +
            '<em>' + relics.total + ' recovered</em>' +
            '</summary>' +
            '<div class="collection-collapsible-body">' +
            '<p class="collection-relic-summary">' +
            relics.distinct + ' distinct relic stack' +
            (relics.distinct === 1 ? '' : 's') +
            ' across ' +
            groups.length + ' collection' +
            (groups.length === 1 ? '' : 's') +
            '.' +
            '</p>' +
            relicListHtml(groups) +
            '</div>' +
            '</details>' +
            '</section>' +

            '</main>';

        var backButton = target.querySelector('[data-collection-back]');

        if (backButton) {
            backButton.onclick = function (event) {
                event.preventDefault();

                var realmTab = document.querySelector(
                    '#bottomNavigation [data-page="realm"]'
                );

                if (realmTab) {
                    realmTab.click();
                }
            };
        }

        target.querySelectorAll('[data-artifact-equip]').forEach(function (button) {
            button.onclick = function (event) {
                event.preventDefault();
                event.stopPropagation();

                var wantedId = String(
                    button.getAttribute('data-artifact-equip') || ''
                );

                var selected = allArtifacts.filter(function (artifact) {
                    return artifactId(artifact) === wantedId;
                })[0];

                if (!selected) {
                    return;
                }

                saveEquip(selected);
                render();
            };
        });

        var unequipButton = target.querySelector('[data-artifact-unequip]');

        if (unequipButton) {
            unequipButton.onclick = function (event) {
                event.preventDefault();
                event.stopPropagation();

                saveUnequip();
                render();
            };
        }

        var bossTrophiesDetails = target.querySelector(
            '.collection-boss-trophies-details'
        );

        if (bossTrophiesDetails) {
            bossTrophiesDetails.addEventListener('toggle', function () {
                if (bossTrophiesDetails.open) {
                    return;
                }

                bossTrophiesDetails.querySelectorAll(
                    '.collection-trophy-detail[open]'
                ).forEach(function (bossDetail) {
                    bossDetail.removeAttribute('open');
                });
            });
        }
                var relicDetails = target.querySelector(
            '.collection-relic-details'
        );

        if (relicDetails) {
            relicDetails.addEventListener('toggle', function () {
                if (relicDetails.open) {
                    return;
                }

                relicDetails.querySelectorAll(
                    '.collection-relic-group[open]'
                ).forEach(function (groupDetail) {
                    groupDetail.removeAttribute('open');
                });
            });
        }
    }

    

    function installStyles() {
        if (document.getElementById('collectionPageStyles')) {
            return;
        }

        var style = document.createElement('style');

        style.id = 'collectionPageStyles';

        style.textContent =
            '#navPlaceholder.collection-page{' +
            'display:flex;flex-direction:column;padding:0;overflow:hidden;' +
            'background:var(--bg,#14181C)}' +

            '.collection-header{' +
            'display:flex;align-items:center;gap:14px;padding:20px;' +
            'border-bottom:1px solid rgba(168,130,60,.24)}' +

            '.collection-header h1{' +
            'margin:0;color:var(--paper-light,#F6F1E4);font:27px Georgia,serif}' +

            '.collection-header p{' +
            'margin:4px 0 0;color:var(--muted,#8A8378);font-size:12px}' +

            '.collection-back{' +
            'flex:0 0 auto;padding:7px 0;border:0;background:transparent;' +
            'color:var(--gold,#A8823C);font:600 12px inherit;cursor:pointer}' +

            '.collection-back:focus-visible,.collection-equip-button:focus-visible,' +
            '.collection-secondary-button:focus-visible{' +
            'outline:2px solid var(--gold,#A8823C);outline-offset:2px}' +

            '.collection-content{' +
            'flex:1;overflow:auto;padding:16px 20px 130px;' +
            '-webkit-overflow-scrolling:touch;overscroll-behavior:contain}' +

            '.collection-card{' +
            'margin:0 0 13px;padding:16px;background:var(--bg-elevated,#1B2129);' +
            'border:1px solid rgba(168,130,60,.28);border-radius:5px}' +

            '.collection-card h2{' +
            'margin:5px 0;color:var(--paper-light,#F6F1E4);font:21px Georgia,serif}' +

            '.collection-label{' +
            'display:block;color:var(--gold,#A8823C);font-size:11px;font-weight:700;' +
            'letter-spacing:.08em;text-transform:uppercase}' +

            '.collection-muted,.collection-empty{' +
            'margin:7px 0 0;color:var(--muted,#8A8378);font-size:12px;line-height:1.5}' +

            '.collection-equipped-row{' +
            'display:flex;align-items:center;gap:11px;margin-top:12px}' +

            '.collection-artifact-mark{' +
            'display:inline-flex;align-items:center;justify-content:center;' +
            'width:26px;height:26px;flex:0 0 26px;color:var(--gold,#A8823C);' +
            'font-size:21px;line-height:1}' +

            '.collection-rarity{' +
            'margin:2px 0 0;color:var(--muted,#8A8378);font-size:12px}' +

            '.collection-effect{' +
            'margin:14px 0 0;color:var(--paper,#D7D0C4);font-size:13px;line-height:1.45}' +

            '.collection-secondary-button,.collection-equip-button{' +
            'min-height:34px;border:1px solid rgba(168,130,60,.6);border-radius:3px;' +
            'background:transparent;color:var(--gold,#A8823C);font:600 11px inherit;cursor:pointer}' +

            '.collection-secondary-button{' +
            'width:100%;margin-top:14px;padding:9px 10px}' +

            '.collection-equip-button{' +
            'flex:0 0 auto;padding:8px 10px}' +

            '.collection-secondary-button:active,.collection-equip-button:active{' +
            'transform:translateY(1px)}' +

            '.collection-details{' +
            'margin-top:14px;border-top:1px solid rgba(168,130,60,.18)}' +

            '.collection-details > summary{' +
            'display:flex;align-items:center;justify-content:space-between;gap:12px;' +
            'padding:12px 0 0;color:var(--paper-light,#F6F1E4);cursor:pointer;' +
            'list-style:none;font-size:13px;font-weight:700}' +

            '.collection-details > summary::-webkit-details-marker{' +
            'display:none}' +

            '.collection-details > summary:before{' +
            'content:"▸";margin-right:8px;color:var(--gold,#A8823C);' +
            'font-size:15px;transition:transform .15s ease}' +

            '.collection-details[open] > summary:before{' +
            'transform:rotate(90deg)}' +

            '.collection-details > summary span{' +
            'flex:1}' +

            '.collection-details > summary em{' +
            'color:var(--muted,#8A8378);font-size:11px;font-style:normal;font-weight:400;' +
            'white-space:nowrap}' +

            '.collection-collapsible-body{' +
            'padding:14px 0 0}' +

            '.collection-rarity-progress{' +
            'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));' +
            'gap:8px;margin-bottom:13px}' +

            '.collection-rarity-progress > span{' +
            'display:flex;flex-direction:column;gap:2px;padding:9px 7px;' +
            'background:rgba(0,0,0,.14);border:1px solid rgba(255,255,255,.05);' +
            'border-radius:3px;text-align:center}' +

            '.collection-rarity-progress b{' +
            'color:var(--paper-light,#F6F1E4);font:700 17px Georgia,serif}' +

            '.collection-rarity-progress small{' +
            'color:var(--muted,#8A8378);font-size:10px}' +

            '.collection-artifact-list{' +
            'border-top:1px solid rgba(168,130,60,.16)}' +

            '.collection-artifact-item{' +
            'display:flex;align-items:center;gap:9px;padding:12px 0;' +
            'border-bottom:1px solid rgba(168,130,60,.14)}' +

            '.collection-item-copy{' +
            'min-width:0;flex:1}' +

            '.collection-item-copy b,.collection-item-copy span,.collection-item-copy small{' +
            'display:block}' +

            '.collection-item-copy b{' +
            'color:var(--paper-light,#F6F1E4);font:16px Georgia,serif}' +

            '.collection-item-copy span{' +
            'margin-top:3px;color:var(--paper,#D7D0C4);font-size:11px;line-height:1.4}' +

            '.collection-item-copy small{' +
            'margin-top:4px;color:var(--muted,#8A8378);font-size:10px;line-height:1.4}' +

            '.collection-equipped-badge{' +
            'flex:0 0 auto;color:var(--gold,#A8823C);font-size:11px;font-style:normal;' +
            'font-weight:700;white-space:nowrap}' +

            '.collection-trophy-detail-list{' +
            'border-top:1px solid rgba(168,130,60,.16)}' +

            '.collection-trophy-detail{' +
            'border-bottom:1px solid rgba(168,130,60,.14)}' +

            '.collection-trophy-toggle{' +
            'display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;' +
            'align-items:center;padding:12px 0;cursor:pointer;list-style:none}' +

            '.collection-trophy-toggle::-webkit-details-marker{' +
            'display:none}' +

            '.collection-trophy-toggle:before{' +
            'content:"▸";position:absolute;color:var(--gold,#A8823C);' +
            'font-size:13px;transform:translateX(0);transition:transform .15s ease}' +

            '.collection-trophy-detail[open] > .collection-trophy-toggle:before{' +
            'transform:rotate(90deg)}' +

            '.collection-trophy-toggle-title{' +
            'display:block;min-width:0;padding-left:18px}' +

            '.collection-trophy-toggle-title b,.collection-trophy-toggle-title em{' +
            'display:block}' +

            '.collection-trophy-toggle-title b{' +
            'color:var(--paper-light,#F6F1E4);font:16px Georgia,serif}' +

            '.collection-trophy-toggle-title em{' +
            'margin-top:3px;color:var(--muted,#8A8378);font-size:10px;font-style:normal;' +
            'letter-spacing:.04em;text-transform:uppercase}' +

            '.collection-trophy-toggle strong{' +
            'display:flex;flex-direction:column;align-items:flex-end;gap:3px;' +
            'color:var(--gold,#A8823C);font:700 12px Georgia,serif;white-space:nowrap}' +

            '.collection-trophy-toggle strong i{' +
            'color:var(--muted,#8A8378);font:400 10px inherit;font-style:normal}' +

            '.collection-trophy-detail-body{' +
            'padding:0 0 13px}' +

            '.collection-trophy-stats{' +
            'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;' +
            'padding:10px;background:rgba(0,0,0,.13);border:1px solid rgba(168,130,60,.13)}' +

            '.collection-trophy-stats div{' +
            'min-width:0;text-align:center}' +

            '.collection-trophy-stats b,.collection-trophy-stats span{' +
            'display:block}' +

            '.collection-trophy-stats b{' +
            'color:var(--paper-light,#F6F1E4);font:16px Georgia,serif}' +

            '.collection-trophy-stats span{' +
            'margin-top:3px;color:var(--muted,#8A8378);font-size:9px;line-height:1.2}' +

            '.collection-trophy-recap{' +
            'margin-top:11px;color:var(--paper,#D7D0C4);font-size:11px;line-height:1.5}' +

            '.collection-trophy-recap p{' +
            'margin:5px 0}' +

            '.collection-trophy-recap b{' +
            'color:var(--gold,#A8823C)}' +

            '.collection-session-history{' +
            'margin-top:12px;padding-top:10px;border-top:1px solid rgba(168,130,60,.16)}' +

            '.collection-session-history > b{' +
            'display:block;margin-bottom:7px;color:var(--gold,#A8823C);font-size:10px;' +
            'letter-spacing:.08em;text-transform:uppercase}' +

            '.collection-session-history ul{' +
            'max-height:130px;margin:0;padding:0;overflow-y:auto;overflow-x:hidden;' +
            'list-style:none;touch-action:pan-y;overscroll-behavior:contain;' +
            '-webkit-overflow-scrolling:touch}' +

            '.collection-session-history li{' +
            'display:flex;justify-content:space-between;gap:10px;padding:7px 1px;' +
            'border-bottom:1px solid rgba(168,130,60,.12);color:var(--muted,#8A8378);' +
            'font-size:11px}' +

            '.collection-session-history li:last-child{' +
            'border-bottom:0}' +

            '.collection-session-history li b{' +
            'color:var(--paper,#D7D0C4);font-weight:600;white-space:nowrap}' +

            '.collection-relic-summary{' +
            'margin:0 0 12px;color:var(--muted,#8A8378);font-size:11px;line-height:1.45}' +

            '.collection-relic-empty{' +
            'display:flex;flex-direction:column;gap:5px;padding:15px 0 3px;' +
            'color:var(--muted,#8A8378);font-size:12px;line-height:1.45}' +

            '.collection-relic-empty b{' +
            'color:var(--paper-light,#F6F1E4);font:16px Georgia,serif}' +

                        '.collection-relic-groups{' +
            'display:flex;flex-direction:column;gap:10px}' +

            '.collection-relic-group{' +
            'margin:0;border:1px solid rgba(168,130,60,.16);' +
            'background:rgba(0,0,0,.11)}' +

            '.collection-relic-group > summary{' +
            'display:flex;align-items:center;justify-content:space-between;gap:12px;' +
            'padding:10px;cursor:pointer;list-style:none}' +

            '.collection-relic-group > summary::-webkit-details-marker{' +
            'display:none}' +

            '.collection-relic-group > summary:before{' +
            'content:"▸";flex:0 0 auto;color:var(--gold,#A8823C);font-size:13px;' +
            'transition:transform .15s ease}' +

            '.collection-relic-group[open] > summary:before{' +
            'transform:rotate(90deg)}' +

            '.collection-relic-group-title{' +
            'display:block;min-width:0;flex:1}' +

            '.collection-relic-group-title b,' +
            '.collection-relic-group-title small{' +
            'display:block}' +

            '.collection-relic-group-title b{' +
            'color:var(--paper-light,#F6F1E4);font:15px Georgia,serif}' +

            '.collection-relic-group-title small{' +
            'margin-top:3px;color:var(--muted,#8A8378);font-size:10px}' +

            '.collection-relic-group-header > em{' +
            'flex:0 0 auto;color:var(--gold,#A8823C);font-size:10px;font-style:normal;' +
            'white-space:nowrap}' +

            '.collection-relic-list{' +
            'padding:0 10px 2px;border-top:1px solid rgba(168,130,60,.16)}' +

            '.collection-relic-item{' +
            'display:flex;align-items:center;gap:9px;padding:10px 0;' +
            'border-bottom:1px solid rgba(168,130,60,.12)}' +

            '.collection-relic-item:last-child{' +
            'border-bottom:0}' +

            '.collection-relic-mark{' +
            'display:inline-flex;align-items:center;justify-content:center;' +
            'width:20px;height:20px;flex:0 0 20px;color:var(--gold,#A8823C);font-size:14px}' +

            '.collection-relic-copy{' +
            'min-width:0;flex:1}' +

            '.collection-relic-copy b,' +
            '.collection-relic-copy span{' +
            'display:block}' +

            '.collection-relic-copy b{' +
            'color:var(--paper,#D7D0C4);font:14px Georgia,serif}' +

            '.collection-relic-copy span{' +
            'margin-top:2px;color:var(--muted,#8A8378);font-size:10px}' +

            '.collection-relic-item > em{' +
            'min-width:34px;padding:4px 6px;color:var(--gold,#A8823C);' +
            'border:1px solid rgba(168,130,60,.34);background:rgba(168,130,60,.08);' +
            'font-size:11px;font-style:normal;text-align:center}' +

            '.collection-equipped-card.rarity-common .collection-artifact-mark,' +
            '.collection-artifact-item.rarity-common .collection-artifact-mark{' +
            'color:#d7d0c4}' +

            '.collection-equipped-card.rarity-common h2,' +
            '.collection-artifact-item.rarity-common .collection-item-copy b{' +
            'color:#d7d0c4}' +

            '.collection-equipped-card.rarity-uncommon .collection-artifact-mark,' +
            '.collection-artifact-item.rarity-uncommon .collection-artifact-mark{' +
            'color:#79bd8d}' +

            '.collection-equipped-card.rarity-uncommon h2,' +
            '.collection-artifact-item.rarity-uncommon .collection-item-copy b{' +
            'color:#79bd8d}' +

            '.collection-equipped-card.rarity-rare .collection-artifact-mark,' +
            '.collection-artifact-item.rarity-rare .collection-artifact-mark{' +
            'color:#74a8e7}' +

            '.collection-equipped-card.rarity-rare h2,' +
            '.collection-artifact-item.rarity-rare .collection-item-copy b{' +
            'color:#74a8e7}' +

            '.collection-equipped-card.rarity-epic .collection-artifact-mark,' +
            '.collection-artifact-item.rarity-epic .collection-artifact-mark{' +
            'color:#c28ad9}' +

            '.collection-equipped-card.rarity-epic h2,' +
            '.collection-artifact-item.rarity-epic .collection-item-copy b{' +
            'color:#c28ad9}' +

            '.collection-equipped-card.rarity-legendary .collection-artifact-mark,' +
            '.collection-artifact-item.rarity-legendary .collection-artifact-mark{' +
            'color:#d4a64f}' +

            '.collection-equipped-card.rarity-legendary h2,' +
            '.collection-artifact-item.rarity-legendary .collection-item-copy b{' +
            'color:#d4a64f}' +

            '.collection-equipped-card.rarity-mythic .collection-artifact-mark,' +
            '.collection-artifact-item.rarity-mythic .collection-artifact-mark{' +
            'color:#e55353}' +

            '.collection-equipped-card.rarity-mythic h2,' +
            '.collection-artifact-item.rarity-mythic .collection-item-copy b{' +
            'color:#e55353}' +

            '.collection-trophy-detail.rarity-common .collection-trophy-toggle-title b{' +
            'color:#d7d0c4}' +

            '.collection-trophy-detail.rarity-uncommon .collection-trophy-toggle-title b{' +
            'color:#79bd8d}' +

            '.collection-trophy-detail.rarity-rare .collection-trophy-toggle-title b{' +
            'color:#74a8e7}' +

            '.collection-trophy-detail.rarity-epic .collection-trophy-toggle-title b{' +
            'color:#c28ad9}' +

            '.collection-trophy-detail.rarity-legendary .collection-trophy-toggle-title b{' +
            'color:#d4a64f}' +

            '.collection-trophy-detail.rarity-mythic .collection-trophy-toggle-title b{' +
            'color:#e55353}' +

            '@media (max-width:360px){' +
            '.collection-content{padding-left:14px;padding-right:14px}' +
            '.collection-header{padding-left:14px;padding-right:14px}' +
            '.collection-trophy-stats{grid-template-columns:repeat(2,minmax(0,1fr))}' +
            '}';

        document.head.appendChild(style);
    }

    function install() {
        installStyles();

        window.addEventListener('bookshelf-navigation-changed', function (event) {
            if (event.detail && event.detail.page === 'collection') {
                setTimeout(render, 0);
            }
        });

        window.addEventListener('bookshelf-adventure-artifact-changed', function () {
            if (page() && page().classList.contains('collection-page')) {
                render();
            }
        });

        window.addEventListener('storage', function (event) {
            if (
                event.key === LOOT_KEY ||
                event.key === ARTIFACT_KEY
            ) {
                if (page() && page().classList.contains('collection-page')) {
                    render();
                }
            }
        });

        if (page() && page().classList.contains('collection-page')) {
            render();
        }
    }

    window.BookShelfCollection = {
        render: render,
        artifacts: artifacts,
        equipped: equippedArtifact,
        equip: saveEquip,
        unequip: saveUnequip,
        relicGroups: function () {
            return relicGroups(lootState().relics);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', install);
    } else {
        install();
    }
})();