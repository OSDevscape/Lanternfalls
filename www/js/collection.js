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

    function raritySlug(value) {
        return String(value || 'Common')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-');
    }

    function lootState() {
        var value = read(LOOT_KEY, '{"items":[],"events":[]}');

        value.items = Array.isArray(value.items) ? value.items : [];
        value.events = Array.isArray(value.events) ? value.events : [];

        return value;
    }

    function artifactState() {
        var value = read(
            ARTIFACT_KEY,
            '{"version":1,"equippedId":"","equippedName":""}'
        );

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
            return !!ARTIFACT_EFFECTS[item.name];
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

        /*
          Collection is the source of truth for the selected persistent artifact.
          Do not call BookShelfArtifacts.equip() here because its current API may
          expect a different object or identifier than the loot record uses.
        */
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
            var rarity = String(item.rarity || 'Common');

            if (Object.prototype.hasOwnProperty.call(counts, rarity)) {
                counts[rarity] += 1;
            }
        });

        return counts;
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

    function trophyListHtml(events) {
        if (!events.length) {
            return (
                '<p class="collection-empty">' +
                'Claim a completed book reward to earn your first boss trophy.' +
                '</p>'
            );
        }

        return (
            '<div class="collection-trophy-list">' +
            events.slice(0, 20).map(function (event) {
                var rarity = String(event.rarity || 'Common');
                var enhanced = event.enhanced
                    ? ' · Loot raised from ' +
                    escape(event.naturalRarity || 'Common') +
                    ' to ' +
                    escape(rarity)
                    : '';

                return (
                    '<article class="collection-trophy-item rarity-' +
                    raritySlug(rarity) +
                    '">' +

                    '<span class="collection-trophy-star">★</span>' +

                    '<div class="collection-trophy-copy">' +
                    '<b>' + escape(event.title || 'Completed book') + '</b>' +

                    '<span>' +
                    escape(rarity) +
                    ' · ' +
                    escape(event.loot || 'Trophy claimed') +
                    enhanced +
                    '</span>' +

                    '<small>' +
                    'Defeated ' +
                    escape(formatDate(event.earnedAt)) +
                    ' · +' + (Number(event.xp) || 0) + ' XP' +
                    '</small>' +
                    '</div>' +

                    '<em>+' + (Number(event.gold) || 0) + ' gold</em>' +

                    '</article>'
                );
            }).join('') +
            '</div>'
        );
    }

    function number(value) {
        return Math.max(0, Number(value) || 0);
    }

    function hash(value) {
        var result = 0;

        String(value || '').split('').forEach(function (character) {
            result = ((result << 5) - result) + character.charCodeAt(0);
            result |= 0;
        });

        return Math.abs(result);
    }

    function trophyMetrics(bookId, event) {
        var game = read('bookshelf-adventure-progression-v1', '{}');
        var stats = game.stats || {};
        var strength = Math.max(10, number(stats.str) || 10);
        var luck = Math.max(10, number(stats.lck) || 10);

        var sessions = read('bookshelf-reading-log-v1', '[]').filter(function (session) {
            return session && session.bookId === bookId && number(session.minutes);
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

        return (
            '<div class="collection-trophy-list collection-trophy-detail-list">' +
            events.slice(0, 20).map(function (event) {
                var stat = trophyMetrics(event.bookId, event);
                var rarity = String(event.rarity || 'Common');

                var boss = event.bossName || 'Book Boss';

                /*
                  If the boss system is available, regenerate the saved boss identity
                  from the book record. This supports trophies that were earned before
                  bossName was saved in the trophy event.
                */
                var bookData = read('bookshelf-data', '{"books":[]}');
                var book = (bookData.books || []).filter(function (item) {
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
                    '<em>' +
                    escape(rarity) +
                    ' Boss' +
                    '</em>' +
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
                    '<p><b>Rewards:</b> ' +
                    stat.totalXP + ' XP · ' +
                    stat.gold + ' gold · ' +
                    escape(event.loot || 'Trophy') +
                    '</p>' +
                    '<p><b>Book:</b> ' +
                    escape(bookTitle) +
                    ' · <b>Rarity:</b> ' +
                    escape(rarity) +
                    '</p>' +

                    '<p><b>Defeated:</b> ' +
                    escape(formatDate(trophyDate(event, stat.sessions))) +
                    ' · Crit chance used: ' +
                    stat.critChance.toFixed(1) +
                    '%</p>' +
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

    function render() {
        var target = page();

        var artifactCodexWasOpen = !!target &&
            !!target.querySelector('.collection-artifact-details[open]');

        var trophiesWereOpen = !!target &&
            !!target.querySelector('.collection-trophy-details[open]');

        if (!target || target.classList.contains('hidden')) {
            return;
        }

        if (!target.classList.contains('collection-page')) {
            return;
        }

        var loot = lootState();
        var allArtifacts = artifacts();
        var equipped = equippedArtifact();
        var counts = rarityCounts(allArtifacts);

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

            '<details class="collection-details collection-boss-trophies-details">' +
            '<summary>' +
            '<span>View defeated bosses</span>' +
            '<em>' + loot.events.length + ' defeated</em>' +
            '</summary>' +

            '<div class="collection-collapsible-body">' +
            detailedTrophyListHtml(loot.events) +
            '</div>' +
            '</details>' +
            '</section>' +

            '<section class="collection-card collection-relic-card">' +
            '<span class="collection-label">Encounter Relics</span>' +
            '<h2>Recovered Relics</h2>' +
            '<p class="collection-muted">' +
            'Relics recovered during reading encounters are collectible for now. ' +
            'A future Bazaar update can give them uses such as trading, refining, or crafting.' +
            '</p>' +
            '<span class="collection-future-badge">Future feature</span>' +
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
            'margin:0;font:27px Georgia,serif}' +

            '.collection-header p{' +
            'margin:4px 0 0;color:var(--muted,#8A8378);font-size:12px}' +

            '.collection-back{' +
            'flex:0 0 auto;padding:7px 0;border:0;background:transparent;' +
            'color:var(--gold,#A8823C);font:600 12px inherit;cursor:pointer}' +

            '.collection-back:focus-visible,.collection-equip-button:focus-visible,' +
            '.collection-secondary-button:focus-visible{' +
            'outline:2px solid var(--gold,#A8823C);outline-offset:2px}' +

            '.collection-content{' +
            'flex:1;overflow:auto;padding:16px 20px 130px}' +

            '.collection-card{' +
            'margin:0 0 13px;padding:16px;background:var(--bg-elevated,#1B2129);' +
            'border:1px solid rgba(168,130,60,.28);border-radius:5px}' +

            '.collection-card h2{' +
            'margin:5px 0;font:21px Georgia,serif}' +

            '.collection-label{' +
            'display:block;color:var(--gold,#A8823C);font-size:11px;font-weight:700;' +
            'letter-spacing:.08em;text-transform:uppercase}' +

            '.collection-muted,.collection-empty{' +
            'margin:7px 0 0;color:var(--muted,#8A8378);font-size:12px;line-height:1.45}' +

            '.collection-empty{' +
            'padding:13px 0 2px}' +

            '.collection-equipped-card{' +
            'border-color:rgba(168,130,60,.55);' +
            'background:linear-gradient(135deg,rgba(168,130,60,.13),rgba(0,0,0,.14))}' +

            '.collection-equipped-row{' +
            'display:flex;align-items:center;gap:11px;margin-top:7px}' +

            '.collection-artifact-mark{' +
            'display:grid;place-items:center;flex:0 0 auto;width:36px;height:36px;' +
            'border:1px solid currentColor;border-radius:4px;background:rgba(255,255,255,.03);' +
            'color:var(--gold,#A8823C);font-size:18px}' +

            '.collection-equipped-row h2{' +
            'margin:0}' +

            '.collection-rarity{' +
            'margin:3px 0 0;color:var(--muted,#8A8378);font-size:11px}' +

            '.collection-effect{' +
            'margin:12px 0 0;color:var(--paper-light,#F6F1E4);font-size:13px;line-height:1.4}' +

            '.collection-secondary-button,.collection-equip-button{' +
            'border:1px solid rgba(168,130,60,.58);border-radius:3px;background:transparent;' +
            'color:var(--paper-light,#F6F1E4);font:600 12px inherit;cursor:pointer}' +

            '.collection-secondary-button{' +
            'width:100%;margin-top:14px;padding:10px}' +

            '.collection-equip-button{' +
            'align-self:center;padding:7px 10px}' +

            '.collection-details{' +
            'margin-top:14px;border-top:1px solid rgba(168,130,60,.20)}' +

            '.collection-details summary{' +
            'display:flex;align-items:center;justify-content:space-between;gap:10px;' +
            'padding:12px 0 0;cursor:pointer;list-style:none;' +
            'color:var(--paper-light,#F6F1E4);font:15px Georgia,serif}' +

            '.collection-details summary::-webkit-details-marker{' +
            'display:none}' +

            '.collection-details summary span{' +
            'display:flex;align-items:center;gap:7px}' +

            '.collection-details summary span:before{' +
            'content:"▸";color:var(--gold,#A8823C);font:17px sans-serif;' +
            'transition:transform .15s ease}' +

            '.collection-details[open] summary span:before{' +
            'transform:rotate(90deg)}' +

            '.collection-details summary em{' +
            'color:var(--muted,#8A8378);font:11px var(--font-body,-apple-system);' +
            'font-style:normal;white-space:nowrap}' +

            '.collection-collapsible-body{' +
            'margin-top:12px}' +

            '.collection-rarity-progress{' +
            'display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:14px 0 5px}' +

            '.collection-rarity-progress span{' +
            'min-width:0;padding:8px 5px;border:1px solid rgba(168,130,60,.18);' +
            'border-radius:3px;text-align:center}' +

            '.collection-rarity-progress b,.collection-rarity-progress small{' +
            'display:block}' +

            '.collection-rarity-progress b{' +
            'font:17px Georgia,serif;color:var(--paper-light,#F6F1E4)}' +

            '.collection-rarity-progress small{' +
            'margin-top:2px;color:var(--muted,#8A8378);font-size:9px}' +

            '.collection-artifact-list,.collection-trophy-list{' +
            'margin-top:13px;border-top:1px solid rgba(168,130,60,.18)}' +

            '.collection-artifact-item{' +
            'display:flex;align-items:center;gap:10px;padding:11px 0;' +
            'border-bottom:1px solid rgba(168,130,60,.15)}' +

            '.collection-item-copy{' +
            'min-width:0;flex:1}' +

            '.collection-item-copy b,.collection-item-copy span,.collection-item-copy small{' +
            'display:block}' +

            '.collection-item-copy b{' +
            'font:16px Georgia,serif}' +

            '.collection-item-copy span{' +
            'margin-top:3px;color:var(--paper-light,#F6F1E4);font-size:11px;line-height:1.35}' +

            '.collection-item-copy small{' +
            'margin-top:4px;color:var(--muted,#8A8378);font-size:10px;line-height:1.35}' +

            '.collection-equipped-badge{' +
            'align-self:center;color:var(--gold,#A8823C);font-size:10px;font-style:normal;' +
            'white-space:nowrap}' +

            '.collection-trophy-item{' +
            'display:flex;align-items:center;gap:10px;padding:11px 0;' +
            'border-bottom:1px solid rgba(168,130,60,.15)}' +

            '.collection-trophy-star{' +
            'display:grid;place-items:center;flex:0 0 auto;width:29px;height:29px;' +
            'color:var(--gold,#A8823C);font-size:17px}' +

            '.collection-trophy-copy{' +
            'min-width:0;flex:1}' +

            '.collection-trophy-copy b,' +
            '.collection-trophy-copy span,' +
            '.collection-trophy-copy small{' +
            'display:block}' +

            '.collection-trophy-copy b{' +
            'font:15px Georgia,serif}' +

            '.collection-trophy-copy span{' +
            'margin-top:3px;color:var(--paper-light,#F6F1E4);font-size:10px;line-height:1.35}' +

            '.collection-trophy-copy small{' +
            'margin-top:4px;color:var(--muted,#8A8378);font-size:10px;line-height:1.35}' +

            '.collection-trophy-item em{' +
            'align-self:center;color:var(--gold,#A8823C);font-size:11px;font-style:normal;' +
            'white-space:nowrap}' +

            '.collection-future-badge{' +
            'display:inline-block;margin-top:12px;padding:5px 7px;' +
            'border:1px solid rgba(168,130,60,.32);border-radius:3px;' +
            'color:var(--gold,#A8823C);font-size:10px;text-transform:uppercase;' +
            'letter-spacing:.06em}' +

            '.collection-artifact-item.rarity-common .collection-artifact-mark,' +
            '.collection-artifact-item.rarity-common b,' +
            '.collection-equipped-card.rarity-common .collection-artifact-mark,' +
            '.collection-equipped-card.rarity-common h2,' +
            '.collection-rarity-progress .rarity-common b{' +
            'color:#d7d0c4}' +

            '.collection-artifact-item.rarity-uncommon .collection-artifact-mark,' +
            '.collection-artifact-item.rarity-uncommon b,' +
            '.collection-equipped-card.rarity-uncommon .collection-artifact-mark,' +
            '.collection-equipped-card.rarity-uncommon h2,' +
            '.collection-rarity-progress .rarity-uncommon b{' +
            'color:#79bd8d}' +

            '.collection-artifact-item.rarity-rare .collection-artifact-mark,' +
            '.collection-artifact-item.rarity-rare b,' +
            '.collection-equipped-card.rarity-rare .collection-artifact-mark,' +
            '.collection-equipped-card.rarity-rare h2,' +
            '.collection-rarity-progress .rarity-rare b{' +
            'color:#74a8e7}' +

            '.collection-artifact-item.rarity-epic .collection-artifact-mark,' +
            '.collection-artifact-item.rarity-epic b,' +
            '.collection-equipped-card.rarity-epic .collection-artifact-mark,' +
            '.collection-equipped-card.rarity-epic h2,' +
            '.collection-rarity-progress .rarity-epic b{' +
            'color:#c28ad9}' +

            '.collection-artifact-item.rarity-legendary .collection-artifact-mark,' +
            '.collection-artifact-item.rarity-legendary b,' +
            '.collection-equipped-card.rarity-legendary .collection-artifact-mark,' +
            '.collection-equipped-card.rarity-legendary h2,' +
            '.collection-rarity-progress .rarity-legendary b{' +
            'color:#d4a64f}' +

            '.collection-artifact-item.rarity-mythic .collection-artifact-mark,' +
            '.collection-artifact-item.rarity-mythic b,' +
            '.collection-equipped-card.rarity-mythic .collection-artifact-mark,' +
            '.collection-equipped-card.rarity-mythic h2,' +
            '.collection-rarity-progress .rarity-mythic b{' +
            'color:#e55353}' +

            '.collection-trophy-detail{' +
            'margin:0;border-bottom:1px solid rgba(168,130,60,.18)}' +

            '.collection-trophy-detail:last-child{' +
            'border-bottom:0}' +

            '.collection-trophy-detail summary{' +
            'display:flex;align-items:center;justify-content:space-between;gap:10px;' +
            'width:100%;padding:13px 0;border:0;background:transparent;' +
            'color:var(--paper-light,#F6F1E4);cursor:pointer;list-style:none;' +
            'text-align:left;touch-action:manipulation}' +

            '.collection-trophy-detail summary::-webkit-details-marker{' +
            'display:none}' +

            '.collection-trophy-toggle-title{' +
            'display:block;min-width:0;flex:1}' +

            '.collection-trophy-toggle-title:before{' +
            'content:"▸";display:inline-block;margin-right:7px;color:var(--gold,#A8823C);' +
            'font:15px sans-serif;transition:transform .15s ease}' +

            '.collection-trophy-detail[open] .collection-trophy-toggle-title:before{' +
            'transform:rotate(90deg)}' +

            '.collection-trophy-toggle-title b,' +
            '.collection-trophy-toggle-title em{' +
            'display:block}' +

            '.collection-trophy-toggle-title b{' +
            'font:16px Georgia,serif;line-height:1.2}' +

            '.collection-trophy-toggle-title em{' +
            'margin:5px 0 0 22px;color:var(--muted,#8A8378);' +
            'font:10px var(--font-body,-apple-system);font-style:normal;line-height:1.35}' +

            '.collection-trophy-toggle strong{' +
            'flex:0 0 auto;color:var(--gold,#A8823C);font:13px Georgia,serif;' +
            'line-height:1.35;text-align:right;white-space:nowrap}' +

            '.collection-trophy-toggle strong i{' +
            'display:block;margin-top:3px;color:var(--muted,#8A8378);' +
            'font:10px var(--font-body,-apple-system);font-style:normal}' +

            '.collection-trophy-detail-body{' +
            'margin:0 0 14px;padding:13px 0 0;' +
            'border-top:1px solid rgba(168,130,60,.16)}' +

            '.collection-trophy-stats{' +
            'display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 0 14px}' +

            '.collection-trophy-stats div{' +
            'min-width:0;padding:10px 5px;background:rgba(0,0,0,.14);' +
            'border:1px solid rgba(168,130,60,.12);border-radius:3px;text-align:center}' +

            '.collection-trophy-stats b,' +
            '.collection-trophy-stats span{' +
            'display:block}' +

            '.collection-trophy-stats b{' +
            'color:var(--paper-light,#F6F1E4);font:16px Georgia,serif}' +

            '.collection-trophy-stats span{' +
            'margin-top:4px;color:var(--muted,#8A8378);font-size:9px;line-height:1.2}' +

            '.collection-trophy-recap{' +
            'margin:0;padding:11px 0;border-top:1px solid rgba(168,130,60,.14);' +
            'color:var(--muted,#8A8378);font-size:11px;line-height:1.45}' +

            '.collection-trophy-recap p{' +
            'margin:5px 0}' +

            '.collection-trophy-recap b{' +
            'color:var(--gold,#A8823C)}' +

            '.collection-session-history{' +
            'margin-top:10px;padding:11px 0 0;border-top:1px solid rgba(168,130,60,.14);' +
            'font-size:11px}' +

            '.collection-session-history>b{' +
            'display:block;color:var(--gold,#A8823C);font-weight:700}' +

            '.collection-session-history ul{' +
            'margin:8px 0 0;padding:0 14px 0 0;box-sizing:border-box;' +
            'max-height:130px;overflow-x:hidden;overflow-y:auto;list-style:none;' +
            'border-top:1px solid rgba(168,130,60,.12);' +
            '-webkit-overflow-scrolling:touch;overscroll-behavior:contain;' +
            'scrollbar-gutter:stable;touch-action:pan-y}' +

            '.collection-session-history li{' +
            'display:flex;justify-content:space-between;gap:12px;padding:7px 0;' +
            'border-bottom:1px solid rgba(168,130,60,.12)}' +

            '.collection-session-history li span{' +
            'flex:0 0 auto;color:var(--muted,#8A8378);padding-right:2px}' +

            '.collection-session-history li b{' +
            'color:var(--paper-light,#F6F1E4);font-weight:normal}' +

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
            'color:#e55353}';

        document.head.appendChild(style);
    }

    function install() {
        var target = page();

        if (!target || target.dataset.collectionReady) {
            return;
        }

        target.dataset.collectionReady = 'true';

        installStyles();

        window.addEventListener('bookshelf-navigation-changed', function (event) {
            if (event.detail && event.detail.page === 'collection') {
                render();
            }
        });

        window.addEventListener('bookshelf-adventure-artifact-changed', render);
        window.addEventListener('bookshelf-adventure-completion-claimed', render);
        window.addEventListener('bookshelf-adventure-claim-complete', render);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', install);
    } else {
        install();
    }

    window.BookShelfCollection = {
        render: render,
        artifacts: artifacts,
        equipped: equippedArtifact,
        equip: saveEquip,
        unequip: saveUnequip
    };
})();