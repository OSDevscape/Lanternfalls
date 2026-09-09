(function () {
    var FORGE_GROUPS = [
        'fantasy',
        'horror',
        'adventure',
        'historical',
        'mystery',
        'science-fiction'
    ];

    function page() {
        return document.getElementById('navPlaceholder');
    }

    function equipment() {
        return window.LanternfallsEquipment || null;
    }

    function navigation() {
        return window.ReadQuestNavigation || null;
    }

    function escape(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[character];
        });
    }

    function back() {
        var realmTab = document.querySelector(
            '#bottomNavigation [data-page="realm"]'
        );

        if (realmTab) {
            realmTab.click();
            return;
        }

        var target = page();

        if (target) {
            target.classList.remove('forge-page');
            target.classList.add('hidden');
        }
    }

    function groupLabel(api, groupId) {
        return typeof api.essenceName === 'function'
            ? api.essenceName(groupId).replace(' Essence', '')
            : String(groupId || 'Genre');
    }

    function relicQuantity(items) {
        return Object.keys(items || {}).reduce(function (total, name) {
            return total + Math.max(
                0,
                Math.floor(Number(items[name]) || 0)
            );
        }, 0);
    }

    function relicGroups() {
        var loot;

        try {
            loot = JSON.parse(
                localStorage.getItem('bookshelf-adventure-loot-v1') ||
                '{"relics":{}}'
            );
        } catch (_) {
            loot = { relics: {} };
        }

        var source = loot &&
            loot.relics &&
            typeof loot.relics === 'object' &&
            !Array.isArray(loot.relics)
            ? loot.relics
            : {};

        return FORGE_GROUPS.map(function (groupId) {
            var group = source[groupId];
            var items = group &&
                group.items &&
                typeof group.items === 'object' &&
                !Array.isArray(group.items)
                ? group.items
                : {};

            return {
                id: groupId,
                label: String((group || {}).label || ''),
                items: items,
                quantity: relicQuantity(items)
            };
        });
    }

    function forgeIcon(groupId) {
        var icons = {
            fantasy: '✦',
            horror: '☾',
            adventure: '⌁',
            historical: '⚒',
            mystery: '◈',
            'science-fiction': '◌'
        };

        return icons[groupId] || '✧';
    }

    function ownedUpgradeableWeapons(api) {
        return api.getWeapons().filter(function (weapon) {
            return weapon &&
                weapon.owned &&
                weapon.upgradeable;
        });
    }

    function essenceRows(api) {
        return FORGE_GROUPS.map(function (groupId) {
            var amount = typeof api.getEssence === 'function'
                ? api.getEssence(groupId)
                : 0;

            return (
                '<article class="forge-essence-row">' +
                '<span class="forge-essence-icon" aria-hidden="true">' +
                forgeIcon(groupId) +
                '</span>' +
                '<div>' +
                '<b>' + escape(groupLabel(api, groupId)) + ' Essence</b>' +
                '<small>Refined from named ' +
                escape(groupLabel(api, groupId)) +
                ' relics</small>' +
                '</div>' +
                '<em>' + amount + '</em>' +
                '</article>'
            );
        }).join('');
    }

    function relicRows(api) {
        var groups = relicGroups().filter(function (group) {
            return group.quantity > 0;
        });

        if (!groups.length) {
            return (
                '<p class="forge-empty">' +
                'No named genre relics are ready for refinement. ' +
                'Claim reading-session rewards to recover relics.' +
                '</p>'
            );
        }

        return groups.map(function (group) {
            var itemNames = Object.keys(group.items)
                .sort(function (first, second) {
                    return first.localeCompare(second);
                })
                .map(function (name) {
                    return (
                        '<span>' + escape(name) + ' ×' +
                        Math.max(0, Math.floor(Number(group.items[name]) || 0)) +
                        '</span>'
                    );
                })
                .join('');

            return (
                '<article class="forge-relic-row">' +
                '<span class="forge-essence-icon" aria-hidden="true">' +
                forgeIcon(group.id) +
                '</span>' +
                '<div class="forge-relic-copy">' +
                '<b>' + escape(groupLabel(api, group.id)) + ' Relics</b>' +
                '<small>' + group.quantity +
                ' relic' + (group.quantity === 1 ? '' : 's') +
                ' available · 1 relic = 1 Essence</small>' +
                '<div class="forge-relic-names">' + itemNames + '</div>' +
                '</div>' +
                '<div class="forge-refine-actions">' +
                '<button type="button" data-refine-group="' +
                escape(group.id) + '" data-refine-amount="1">Crush 1</button>' +
                '<button type="button" data-refine-group="' +
                escape(group.id) + '" data-refine-amount="5"' +
                (group.quantity < 5 ? ' disabled' : '') +
                '>Crush 5</button>' +
                '<button type="button" data-refine-group="' +
                escape(group.id) + '" data-refine-amount="' +
                group.quantity + '">Crush All</button>' +
                '</div>' +
                '</article>'
            );
        }).join('');
    }

    function weaponRows(api) {
        var weapons = ownedUpgradeableWeapons(api);

        if (!weapons.length) {
            return (
                '<p class="forge-empty">' +
                'Reader’s Orb is a fixed starter focus. ' +
                'Purchase a relic weapon from the Bazaar Equipment shop to forge upgrades.' +
                '</p>'
            );
        }

        return weapons.map(function (weapon) {
            var next = api.nextUpgrade(weapon.id);
            var essence = typeof api.getEssence === 'function'
                ? api.getEssence(weapon.relicGroup)
                : 0;

            if (!next) {
                return (
                    '<article class="forge-weapon-row forge-weapon-final">' +
                    '<span class="forge-essence-icon" aria-hidden="true">' +
                    forgeIcon(weapon.relicGroup) +
                    '</span>' +
                    '<div>' +
                    '<b>' + escape(weapon.name) + '</b>' +
                    '<small>Tier ' + weapon.tier +
                    ' of 3 · Final form reached</small>' +
                    '</div>' +
                    '<em>Complete</em>' +
                    '</article>'
                );
            }

            return (
                '<article class="forge-weapon-row">' +
                '<span class="forge-essence-icon" aria-hidden="true">' +
                forgeIcon(weapon.relicGroup) +
                '</span>' +
                '<div>' +
                '<b>' + escape(weapon.name) + '</b>' +
                '<small>Tier ' + weapon.tier + ' of 3 · Next: ' +
                escape(next.name) + '</small>' +
                '<small>Requires ' + next.cost + ' ' +
                escape(next.relicLabel.replace('Relics', 'Essence')) +
                ' · You have ' + essence + '</small>' +
                '</div>' +
                '<button type="button" class="forge-upgrade-button" ' +
                'data-forge-upgrade="' + escape(weapon.id) + '"' +
                (essence < next.cost ? ' disabled' : '') +
                '>Forge Upgrade</button>' +
                '</article>'
            );
        }).join('');
    }

    function render() {
        var target = page();
        var api = equipment();

        if (
            !target ||
            !api ||
            typeof api.getWeapons !== 'function' ||
            typeof api.refineRelics !== 'function' ||
            typeof api.getEssence !== 'function'
        ) {
            return;
        }

        target.classList.add('forge-page');

        target.innerHTML =
            '<header class="forge-header">' +
            '<button type="button" class="forge-back" aria-label="Return to Realm">‹ Realm</button>' +
            '<div>' +
            '<h1>Forge</h1>' +
            '<p>Refine relics and reforge your weapons.</p>' +
            '</div>' +
            '</header>' +

            '<main class="equipment-content forge-content">' +
            '<section class="forge-hero">' +
            '<span class="forge-mark" aria-hidden="true">⚒</span>' +
            '<span class="equipment-label">Relic Forge</span>' +
            '<h2>Refine. Reforge. Rise.</h2>' +
            '<p>Crush named genre relics into matching Essence. ' +
            'Spend Essence to strengthen the relic weapons you own.</p>' +
            '</section>' +

            '<section class="forge-card">' +
            '<span class="equipment-label">Essence Reserves</span>' +
            '<div class="forge-essence-list">' +
            essenceRows(api) +
            '</div>' +
            '</section>' +

            '<section class="forge-card">' +
            '<span class="equipment-label">Crush Relics</span>' +
            '<p class="forge-intro">Refining is permanent: each named relic becomes one Essence of its genre.</p>' +
            '<div class="forge-relic-list">' +
            relicRows(api) +
            '</div>' +
            '</section>' +

            '<section class="forge-card">' +
            '<span class="equipment-label">Weapon Upgrades</span>' +
            '<p class="forge-intro">Only owned relic weapons can be upgraded here.</p>' +
            '<div class="forge-weapon-list">' +
            weaponRows(api) +
            '</div>' +
            '</section>' +

            '<section class="forge-card forge-starter-note">' +
            '<span class="equipment-label">Starter Focus</span>' +
            '<h3>Reader’s Orb</h3>' +
            '<p>Reader’s Orb is a dependable universal focus. It does not require forging and cannot be upgraded.</p>' +
            '</section>' +
            '</main>';

        var backButton = target.querySelector('.forge-back');
        if (backButton) {
            backButton.onclick = back;
        }

        target.querySelectorAll('[data-refine-group]').forEach(function (button) {
            button.onclick = function () {
                var result = api.refineRelics(
                    button.dataset.refineGroup,
                    Number(button.dataset.refineAmount)
                );

                if (!result || !result.ok) {
                    window.alert(
                        (result && result.reason) ||
                        'Those relics could not be refined.'
                    );
                    return;
                }

                render();
            };
        });

        target.querySelectorAll('[data-forge-upgrade]').forEach(function (button) {
            button.onclick = function () {
                var result = api.upgradeWeapon(
                    button.dataset.forgeUpgrade
                );

                if (!result || !result.ok) {
                    window.alert(
                        (result && result.reason) ||
                        'That weapon could not be upgraded.'
                    );
                    return;
                }

                render();
            };
        });
    }

    function open() {
        render();
    }

    function install() {
        var style = document.createElement('style');

        style.textContent = `
#navPlaceholder.forge-page {    display: flex;
    flex-direction: column;
    padding: 0;
    overflow: hidden;
}

#navPlaceholder .equipment-header {
    flex: 0 0 auto;
}

#navPlaceholder .forge-content {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    padding: 16px 20px calc(190px + env(safe-area-inset-bottom));
}

#navPlaceholder.forge-page .forge-header {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 0 0 auto;
    padding: 20px;
    border-bottom: 1px solid rgba(168, 130, 60, .24);
}

#navPlaceholder.forge-page .forge-header h1 {
    margin: 0;
    color: var(--paper-light, #F6F1E4);
    font: 27px Georgia, serif;
}

#navPlaceholder.forge-page .forge-header p {
    margin: 4px 0 0;
    color: var(--muted, #8A8378);
    font-size: 12px;
}

#navPlaceholder.forge-page .forge-back {
    flex: 0 0 auto;
    min-height: 34px;
    padding: 8px 10px;
    border: 1px solid rgba(168, 130, 60, .55);
    border-radius: 4px;
    background: rgba(0, 0, 0, .18);
    color: var(--accent, #8B3A3A);
    font: inherit;
    font-size: 11px;
    font-weight: bold;
    cursor: pointer;
    white-space: nowrap;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .05);
}

#navPlaceholder.forge-page .forge-back:active {
    transform: translateY(1px);
    background: rgba(168, 130, 60, .18);
}

#navPlaceholder.forge-page .forge-back:focus-visible {
    outline: 2px solid var(--gold, #A8823C);
    outline-offset: 2px;
}

.forge-hero,
.forge-card {
    margin-top: 14px;
    padding: 15px;
    border: 1px solid rgba(168, 130, 60, .40);
    border-radius: 7px;
    background: var(--bg-elevated, #1B2129);
    color: var(--paper-light, #F6F1E4);
}

.forge-hero {
    margin-top: 0;
    text-align: center;
    background: linear-gradient(135deg, rgba(168, 130, 60, .18), rgba(0, 0, 0, .14));
}

.forge-mark {
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    margin: 0 auto 11px;
    border: 1px solid rgba(168, 130, 60, .64);
    border-radius: 50%;
    background: rgba(168, 130, 60, .12);
    color: var(--gold, #A8823C);
    font-size: 29px;
}

.forge-hero h2 {
    margin: 5px 0 0;
    font: 23px Georgia, serif;
}

.forge-hero p,
.forge-intro,
.forge-starter-note p {
    margin: 8px 0 0;
    color: var(--muted, #8A8378);
    font-size: 12px;
    line-height: 1.45;
}

.forge-card > .equipment-label {
    margin-bottom: 10px;
}

.forge-essence-list,
.forge-relic-list,
.forge-weapon-list {
    border-top: 1px solid rgba(168, 130, 60, .18);
}

.forge-essence-row,
.forge-relic-row,
.forge-weapon-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 0;
    border-bottom: 1px solid rgba(168, 130, 60, .16);
}

.forge-essence-row:last-child,
.forge-relic-row:last-child,
.forge-weapon-row:last-child {
    border-bottom: 0;
}

.forge-essence-icon {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 37px;
    height: 37px;
    border: 1px solid rgba(168, 130, 60, .52);
    border-radius: 50%;
    background: rgba(168, 130, 60, .10);
    color: var(--gold, #A8823C);
    font-size: 18px;
}

.forge-essence-row > div,
.forge-relic-copy,
.forge-weapon-row > div {
    min-width: 0;
    flex: 1;
}

.forge-essence-row b,
.forge-essence-row small,
.forge-relic-row b,
.forge-relic-row small,
.forge-weapon-row b,
.forge-weapon-row small {
    display: block;
}

.forge-essence-row b,
.forge-relic-row b,
.forge-weapon-row b {
    font: 16px Georgia, serif;
}

.forge-essence-row small,
.forge-relic-row small,
.forge-weapon-row small {
    margin-top: 4px;
    color: var(--muted, #8A8378);
    font-size: 10px;
    line-height: 1.35;
}

.forge-essence-row em,
.forge-weapon-row em {
    flex: 0 0 auto;
    color: var(--gold, #A8823C);
    font: 19px Georgia, serif;
    font-style: normal;
    white-space: nowrap;
}

.forge-relic-row {
    align-items: flex-start;
}

.forge-relic-names {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 7px;
}

.forge-relic-names span {
    padding: 3px 5px;
    border: 1px solid rgba(168, 130, 60, .28);
    border-radius: 3px;
    color: var(--muted, #8A8378);
    font-size: 9px;
}

.forge-refine-actions {
    display: grid;
    gap: 5px;
    flex: 0 0 auto;
}

.forge-refine-actions button,
.forge-upgrade-button {
    padding: 7px 8px;
    border: 1px solid rgba(168, 130, 60, .64);
    border-radius: 3px;
    background: rgba(168, 130, 60, .14);
    color: var(--gold, #A8823C);
    font: 10px var(--font-body, -apple-system);
    cursor: pointer;
    white-space: nowrap;
}

.forge-upgrade-button {
    background: var(--accent, #8B3A3A);
    color: var(--paper-light, #F6F1E4);
}

.forge-refine-actions button:disabled,
.forge-upgrade-button:disabled {
    opacity: .42;
    cursor: not-allowed;
}

.forge-empty {
    margin: 0;
    padding: 13px 0 2px;
    color: var(--muted, #8A8378);
    font-size: 12px;
    line-height: 1.45;
    text-align: center;
}

.forge-weapon-final {
    opacity: .8;
}

.forge-starter-note h3 {
    margin: 5px 0 0;
    font: 18px Georgia, serif;
}

/* Light appearance mode */
body.light-mode .forge-hero,
body.light-mode .forge-card,
[data-theme="light"] .forge-hero,
[data-theme="light"] .forge-card,
.light-theme .forge-hero,
.light-theme .forge-card {
    border-color: rgba(126, 88, 26, .38);
    background: #F7F0E2;
    color: #30271D;
}

body.light-mode .forge-hero,
[data-theme="light"] .forge-hero,
.light-theme .forge-hero {
    background: linear-gradient(135deg, #F2E4C6, #FCF8EE);
}

body.light-mode .forge-hero p,
body.light-mode .forge-intro,
body.light-mode .forge-starter-note p,
body.light-mode .forge-essence-row small,
body.light-mode .forge-relic-row small,
body.light-mode .forge-weapon-row small,
body.light-mode .forge-empty,
[data-theme="light"] .forge-hero p,
[data-theme="light"] .forge-intro,
[data-theme="light"] .forge-starter-note p,
[data-theme="light"] .forge-essence-row small,
[data-theme="light"] .forge-relic-row small,
[data-theme="light"] .forge-weapon-row small,
[data-theme="light"] .forge-empty,
.light-theme .forge-hero p,
.light-theme .forge-intro,
.light-theme .forge-starter-note p,
.light-theme .forge-essence-row small,
.light-theme .forge-relic-row small,
.light-theme .forge-weapon-row small,
.light-theme .forge-empty {
    color: #6E6253;
}
`;

        document.head.appendChild(style);

        window.LanternfallsEquipmentPanel = {
            open: open,
            render: render
        };

        window.addEventListener(
            'bookshelf-adventure-equipment-changed',
            function () {
                var target = page();

                if (target && !target.classList.contains('hidden')) {
                    render();
                }
            }
        );

        window.addEventListener(
            'bookshelf-adventure-relics-changed',
            function () {
                var target = page();

                if (target && !target.classList.contains('hidden')) {
                    render();
                }
            }
        );
    }

    install();
})();