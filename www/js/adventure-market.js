(function () {
    var VIEWS = {
        HOME: 'home',
        CATEGORIES: 'categories',
        TIERS: 'tiers',
        ITEMS: 'items',
        INVENTORY: 'inventory',
        ITEM_DETAIL: 'item-detail'
    };

    var currentItemId = null;

    var currentView = VIEWS.HOME;
    var currentTier = 'potion';
    function navigation() {
        return window.ReadQuestNavigation || null;
    }

    function routeForView(view, extra) {
        var route = {
            page: 'bazaar',
            view: view
        };

        Object.keys(extra || {}).forEach(function (key) {
            route[key] = extra[key];
        });

        return route;
    }

    function navigateBazaar(view, extra) {
        var route = routeForView(view, extra);

        if (navigation() && typeof navigation().navigate === 'function') {
            navigation().navigate(route);
            return;
        }

        applyRoute(route);
    }

    function backBazaar() {
        var nav = navigation();

        if (nav && typeof nav.back === 'function') {
            nav.back();
            return;
        }

        closeBazaar();
    }

    function applyRoute(route) {
        route = route || routeForView(VIEWS.HOME);

        currentView = route.view || VIEWS.HOME;
        currentTier = route.tier || currentTier || 'potion';
        currentItemId = route.itemId || null;

        removeItemPreview();

        var bazaar = document.getElementById('bookwyrmBazaar');

        if (!bazaar) return;

        bazaar.classList.remove('hidden');

        requestAnimationFrame(function () {
            bazaar.classList.add('is-open');
        });

        renderBazaar();
    }

    var TABS = ['potion', 'scroll', 'tome'];

    var TAB_LABELS = {
        potion: 'Potions',
        scroll: 'Scrolls',
        tome: 'Tomes'
    };

    var FAMILY_ORDER = [
        'insight',
        'fortune',
        'focus',
        'momentum',
        'hunt',
        'wonders'
    ];

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

    function read(key, fallback) {
        try {
            return JSON.parse(localStorage.getItem(key) || fallback);
        } catch (_) {
            return JSON.parse(fallback);
        }
    }

    function economy() {
        return window.BookShelfEconomy || null;
    }

    function adventurePage() {
        return document.getElementById('navPlaceholder');
    }

    function isAdventureVisible() {
        var page = adventurePage();

        return (
            page &&
            !page.classList.contains('hidden') &&
            page.classList.contains('adventure-page')
        );
    }

    function readableScope(item) {
        if (item.appliesTo === 'session-only') return 'Session only';
        if (item.appliesTo === 'completion-only') return 'Completion only';
        return 'Session or completion';
    }

    function readableEffect(item) {
        if (item.valueType === 'percent-xp') {
            return '+' + item.value + '% XP on next eligible claim';
        }

        if (item.valueType === 'percent-gold') {
            return '+' + item.value + '% gold on next eligible claim';
        }

        if (item.valueType === 'flat-xp-long-session') {
            return '+' + item.value + ' XP on a 30+ minute session';
        }

        if (item.valueType === 'flat-gold-short-session') {
            return '+' + item.value + ' gold on a 10–25 minute session';
        }

        if (item.valueType === 'percent-completion-gold') {
            return '+' + item.value + '% gold on next completion claim';
        }

        if (item.valueType === 'loot-luck') {
            if (item.tier === 'potion') {
                return 'Small loot-quality boost on next completion';
            }

            if (item.tier === 'scroll') {
                return 'Medium loot-quality boost on next completion';
            }

            return 'Large loot-quality boost on next completion';
        }

        return item.description || '';
    }

    function art(item, size) {
        var dimensions = size === 'preview' ? ' bazaar-art-preview' : '';

        if (item.image) {
            return (
                '<div class="bazaar-art' + dimensions + ' bazaar-art-potion">' +
                '<img src="' + escape(item.image) + '" alt="" loading="lazy">' +
                '</div>'
            );
        }

        if (item.artType === 'scroll') {
            return (
                '<div class="bazaar-art' + dimensions + ' bazaar-art-scroll" aria-hidden="true">' +
                '<span>✦</span>' +
                '<b>Scroll</b>' +
                '</div>'
            );
        }

        return (
            '<div class="bazaar-art' + dimensions + ' bazaar-art-tome" aria-hidden="true">' +
            '<span>✧</span>' +
            '<b>Tome</b>' +
            '</div>'
        );
    }

    function toast(message) {
        var target = document.getElementById('toast');

        if (!target) return;

        target.textContent = message;
        target.classList.remove('hidden');

        clearTimeout(window.__bookwyrmBazaarToastTimer);

        window.__bookwyrmBazaarToastTimer = setTimeout(function () {
            target.classList.add('hidden');
        }, 2600);
    }

    function removeItemPreview() {
        var preview = document.getElementById('bookwyrmItemPreview');

        if (preview) preview.remove();
    }

    function closeBazaar() {
        removeItemPreview();

        var nav = navigation();

        if (nav && typeof nav.sync === 'function') {
            nav.sync(null);
        }

        var bazaar = document.getElementById('bookwyrmBazaar');

        if (!bazaar) return;

        bazaar.classList.remove('is-open');

        setTimeout(function () {
            if (bazaar && !bazaar.classList.contains('is-open')) {
                bazaar.classList.add('hidden');
            }
        }, 260);
    }

    function showBazaar() {
        var route = routeForView(VIEWS.HOME, { tier: 'potion' });
        var nav = navigation();

        if (nav && typeof nav.reset === 'function') {
            nav.reset(route);
            return;
        }

        applyRoute(route);
    }

    function itemPreview(item) {
        var api = economy();

        if (!api || !item) return;
        if (currentView !== VIEWS.ITEM_DETAIL) {
            navigateBazaar(VIEWS.ITEM_DETAIL, {
                tier: item.tier,
                itemId: item.id
            });
            return;
        }

        removeItemPreview();

        var state = api.state();
        var progress = api.game();
        var level = api.levelFor(progress.xp);
        var unlocked = api.isUnlocked(item, level);
        var affordable = progress.gold >= item.price;
        var owned = state.ownedItems.filter(function (ownedItem) {
            return ownedItem.id === item.id;
        }).length;

        var status = '';
        var action = '';

        if (!unlocked) {
            status =
                '<p class="bookwyrm-preview-status">Unlocks at Level ' +
                api.unlockLevel(item) +
                '.</p>';
        } else if (!affordable) {
            status =
                '<p class="bookwyrm-preview-status">You need ' +
                item.price +
                ' gold. You currently have ' +
                progress.gold +
                '.</p>';
        } else {
            status =
                '<p class="bookwyrm-preview-status">You have ' +
                progress.gold +
                ' gold.</p>';
        }

        if (unlocked && affordable) {
            action =
                '<button type="button" class="bookwyrm-preview-buy" data-bazaar-buy="' +
                escape(item.id) +
                '">Buy for ' + item.price + ' Gold</button>';
        } else {
            action =
                '<button type="button" class="bookwyrm-preview-buy" disabled>' +
                (unlocked
                    ? 'Need ' + item.price + ' Gold'
                    : 'Unlocks at Level ' + api.unlockLevel(item)) +
                '</button>';
        }

        var ownedNote = owned
            ? '<p class="bookwyrm-preview-owned">In your inventory: ' +
            owned +
            '</p>'
            : '';

        var preview = document.createElement('section');
        preview.id = 'bookwyrmItemPreview';
        preview.className = 'bookwyrm-preview-overlay';
        preview.setAttribute('role', 'dialog');
        preview.setAttribute('aria-modal', 'true');
        preview.setAttribute('aria-label', item.name);

        preview.innerHTML =
            '<div class="bookwyrm-preview-card">' +
            '<button type="button" class="bookwyrm-preview-close" aria-label="Close item preview">×</button>' +
            '<div class="bookwyrm-preview-hero">' +
            art(item, 'preview') +
            '<div>' +
            '<span class="adventure-label">' +
            escape(api.tiers[item.tier] || item.tier) +
            '</span>' +
            '<h2>' + escape(item.name) + '</h2>' +
            '<p>' + escape(item.description) + '</p>' +
            '</div>' +
            '</div>' +
            '<div class="bookwyrm-preview-effect">' +
            '<b>' + escape(readableEffect(item)) + '</b>' +
            '<span>' + escape(readableScope(item)) + '</span>' +
            '</div>' +
            '<div class="bookwyrm-preview-rule">' +
            '<b>How it works</b>' +
            '<p>After purchase, this item goes into your Bazaar Inventory. Activate it when you are ready. It is consumed only after it successfully applies to a matching reward claim.</p>' +
            '</div>' +
            status +
            ownedNote +
            action +
            '</div>';

        preview.querySelector('.bookwyrm-preview-close').onclick = backBazaar;

        preview.onclick = function (event) {
            if (event.target === preview) backBazaar();
        };

        var buy = preview.querySelector('[data-bazaar-buy]');

        if (buy) {
            buy.onclick = function () {
                var result = api.purchase(item.id);

                if (!result.ok) {
                    toast(result.reason || 'This item could not be purchased.');
                    return;
                }

                toast(result.item.name + ' added to Bazaar Inventory.');
                itemPreview(item);
            };
        }

        document.body.appendChild(preview);
    }

    function inventoryModal() {
        var api = economy();
        var bazaar = document.getElementById('bookwyrmBazaar');

        if (!api || !bazaar) return;

        var state = api.state();
        var active = state.activeItem;
        var items = state.ownedItems;

        var loot = read('bookshelf-adventure-loot-v1', '{"relics":{}}');

        var relicGroups = loot &&
            loot.relics &&
            typeof loot.relics === 'object' &&
            !Array.isArray(loot.relics)
            ? Object.keys(loot.relics)
                .map(function (groupId) {
                    var group = loot.relics[groupId];

                    if (
                        !group ||
                        typeof group !== 'object' ||
                        Array.isArray(group) ||
                        !group.items ||
                        typeof group.items !== 'object' ||
                        Array.isArray(group.items)
                    ) {
                        return null;
                    }

                    var items = Object.keys(group.items)
                        .map(function (name) {
                            return {
                                name: name,
                                quantity: Math.max(
                                    0,
                                    Math.floor(Number(group.items[name]) || 0)
                                )
                            };
                        })
                        .filter(function (relic) {
                            return relic.quantity > 0;
                        })
                        .sort(function (first, second) {
                            return first.name.localeCompare(second.name);
                        });

                    if (!items.length) {
                        return null;
                    }

                    return {
                        id: groupId,
                        label: String(group.label || groupId),
                        items: items
                    };
                })
                .filter(function (group) {
                    return !!group;
                })
            : [];

        relicGroups.sort(function (first, second) {
            /*
              Keep newly earned themed groups first.
              Reading Realm and Legacy stacks belong at the bottom because their
              original drops did not preserve genre information.
            */
            var firstLegacy = first.id === 'legacy' || first.id === 'reading-realm';
            var secondLegacy = second.id === 'legacy' || second.id === 'reading-realm';

            if (firstLegacy !== secondLegacy) {
                return firstLegacy ? 1 : -1;
            }

            return first.label.localeCompare(second.label);
        });

        var relicTypeCount = relicGroups.reduce(function (total, group) {
            return total + group.items.length;
        }, 0);

        var activeHtml = active
            ? (
                '<section class="bookwyrm-inventory-active">' +
                '<span class="adventure-label">Active Enchantment</span>' +
                '<div>' +
                art(active) +
                '<p><b>' + escape(active.name) + '</b>' +
                '<span>' + escape(readableEffect(active)) + '</span></p>' +
                '</div>' +
                '<small>Armed until a successful eligible claim consumes it.</small>' +
                '</section>'
            )
            : (
                '<section class="bookwyrm-inventory-active bookwyrm-inventory-empty">' +
                '<span class="adventure-label">Active Enchantment</span>' +
                '<p>No enchantment is active. Activate one stored item when you are ready.</p>' +
                '</section>'
            );

        var rows = items.length
            ? items.map(function (item) {
                return (
                    '<article class="bookwyrm-inventory-row">' +
                    art(item) +
                    '<div>' +
                    '<b>' + escape(item.name) + '</b>' +
                    '<span>' + escape(readableEffect(item)) + '</span>' +
                    '<small>' + escape(readableScope(item)) + '</small>' +
                    '</div>' +
                    '<button type="button" data-bazaar-activate="' +
                    escape(item.instanceId) + '"' +
                    (active ? ' disabled' : '') +
                    '>' +
                    (active ? 'Active slot full' : 'Activate') +
                    '</button>' +
                    '</article>'
                );
            }).join('')
            : '<p class="bookwyrm-inventory-none">Your inventory is empty. Visit the market to buy an enchantment.</p>';

        var relicRows = relicGroups.length
            ? relicGroups.map(function (group) {
                var itemCount = group.items.length;

                return (
                    '<details class="bookwyrm-relic-group">' +
                    '<summary class="bookwyrm-relic-group-summary">' +
                    '<b>' + escape(group.label) + '</b>' +
                    '<span>' + itemCount + ' type' +
                    (itemCount === 1 ? '' : 's') +
                    '</span>' +
                    '<em aria-hidden="true">›</em>' +
                    '</summary>' +

                    '<div class="bookwyrm-relic-group-items">' +
                    group.items.map(function (relic) {
                        return (
                            '<article class="bookwyrm-relic-row">' +
                            '<span class="bookwyrm-relic-icon" aria-hidden="true">✦</span>' +
                            '<b>' + escape(relic.name) + '</b>' +
                            '<em>×' + relic.quantity + '</em>' +
                            '</article>'
                        );
                    }).join('') +
                    '</div>' +

                    '</details>'
                );
            }).join('')
            : '<p class="bookwyrm-relic-none">No relics recovered yet. Claim reading-session rewards to collect them.</p>';

        var relicHtml =
            '<details class="bookwyrm-relics-section">' +
            '<summary class="bookwyrm-relics-heading">' +
            '<div>' +
            '<span class="adventure-label">Encounter Relics</span>' +
            '<h3>Recovered Relics</h3>' +
            '</div>' +
            '<div class="bookwyrm-relics-summary-meta">' +
            '<em>' + relicTypeCount + ' type' +
            (relicTypeCount === 1 ? '' : 's') +
            '</em>' +
            '<span aria-hidden="true">›</span>' +
            '</div>' +
            '</summary>' +
            '<div class="bookwyrm-relics-body">' +
            '<p class="bookwyrm-relics-description">Stackable materials recovered from reading encounters.</p>' +
            '<div class="bookwyrm-relic-list">' +
            relicRows +
            '</div>' +
            '</div>' +
            '</details>';

        bazaar.innerHTML =
            headerMarkup(Math.max(0, Number(api.game().gold) || 0)) +
            '<main class="bookwyrm-page-content">' +
            '<section class="bookwyrm-page-intro">' +
            '<span class="adventure-label">The Bookwyrm Bazaar</span>' +
            '<h2>Bazaar Inventory <em>' + items.length + '</em></h2>' +
            '<p>Stored enchantments can be activated before an eligible reward claim.</p>' +
            '</section>' +
            activeHtml +
            '<section class="bookwyrm-inventory-list">' +
            rows +
            '</section>' +
            relicHtml +
            '</main>';

        bazaar.querySelectorAll('[data-bazaar-back]').forEach(function (button) {
            button.onclick = backBazaar;
        });

        bazaar.querySelectorAll('[data-bazaar-activate]').forEach(function (button) {
            button.onclick = function () {
                var result = api.activate(button.dataset.bazaarActivate);

                if (!result.ok) {
                    toast(result.reason || 'This item could not be activated.');
                    return;
                }

                toast(result.item.name + ' is now active.');
                inventoryModal();
            };
        });
    }

    function headerMarkup(gold) {
        var back = '';
        var label = '‹ Realm';

        if (currentView === VIEWS.CATEGORIES) label = '‹ Bazaar';
        if (currentView === VIEWS.TIERS) label = '‹ Market';
        if (currentView === VIEWS.ITEMS) label = '‹ Consumables';
        if (currentView === VIEWS.INVENTORY) label = '‹ Bazaar';
        if (currentView === VIEWS.ITEM_DETAIL) {
            label = '‹ ' + (TAB_LABELS[currentTier] || 'Items');
        }

        back =
            '<button type="button" class="bookwyrm-page-nav" data-bazaar-back>' +
            escape(label) +
            '</button>';

        return (
            '<header class="bookwyrm-page-header">' +
            back +
            '<div><span>The Bookwyrm</span><h1>Bazaar</h1></div>' +
            '<b>◉ ' + gold + '</b>' +
            '</header>'
        );
    }

    function homeMarkup(state) {
        var active = state.activeItem;

        var activeHtml = active
            ? (
                '<section class="bookwyrm-home-active">' +
                '<span class="adventure-label">Active Enchantment</span>' +
                '<div>' +
                art(active) +
                '<p><b>' + escape(active.name) + '</b>' +
                '<span>' + escape(readableEffect(active)) + '</span></p>' +
                '</div>' +
                '<small>Armed · ' + escape(readableScope(active)) + '</small>' +
                '</section>'
            )
            : (
                '<section class="bookwyrm-home-active bookwyrm-home-empty">' +
                '<span class="adventure-label">Active Enchantment</span>' +
                '<b>No active enchantment</b>' +
                '<p>Browse the Market, buy an item, then activate it from your inventory.</p>' +
                '</section>'
            );

        return (
            '<main class="bookwyrm-page-content">' +
            '<section class="bookwyrm-home-intro">' +
            '<span class="adventure-label">Curios for the committed reader</span>' +
            '<h2>Spend wisely. Read boldly.</h2>' +
            '<p>Enchant your next eligible reward claim with a tonic, scroll, or tome.</p>' +
            '</section>' +
            activeHtml +
            '<button type="button" class="bookwyrm-home-button" data-bazaar-inventory>' +
            '<span>▣</span><div><b>Bazaar Inventory</b><small>' +
            state.ownedItems.length +
            ' stored item' +
            (state.ownedItems.length === 1 ? '' : 's') +
            '</small></div><em>›</em>' +
            '</button>' +
            '<button type="button" class="bookwyrm-home-button bookwyrm-enter-market" data-bazaar-nav="categories">' +
            '<span>✦</span><div><b>Enter the Market</b><small>Browse enchantments for your next reading reward.</small></div><em>›</em>' +
            '</button>' +
            '</main>'
        );
    }

    function categoriesMarkup() {
        return (
            '<main class="bookwyrm-page-content">' +
            '<section class="bookwyrm-page-intro">' +
            '<span class="adventure-label">Market Directory</span>' +
            '<h2>What are you seeking?</h2>' +
            '<p>Choose a collection to browse the Bazaar’s current wares.</p>' +
            '</section>' +
            '<div class="bookwyrm-navigation-list">' +
            '<button type="button" class="bookwyrm-navigation-button" data-bazaar-nav="tiers">' +
            '<span class="bookwyrm-navigation-icon">⚗</span>' +
            '<div><b>Consumables</b><small>Potions, scrolls, and tomes that empower future eligible claims.</small></div>' +
            '<em>›</em>' +
            '</button>' +
            '<button type="button" class="bookwyrm-navigation-button bookwyrm-navigation-locked" disabled>' +
            '<span class="bookwyrm-navigation-icon">⚔</span>' +
            '<div><b>Equipment</b><small>Weapons, armor, trinkets, and other permanent gear are coming in a future release.</small></div>' +
            '<em>Coming soon</em>' +
            '</button>' +
            '</div>' +
            '</main>'
        );
    }

    function tiersMarkup() {
        return (
            '<main class="bookwyrm-page-content">' +
            '<section class="bookwyrm-page-intro">' +
            '<span class="adventure-label">Consumables</span>' +
            '<h2>Choose your shelf</h2>' +
            '<p>Each tier holds the same six enchantment families at a different power and price.</p>' +
            '</section>' +
            '<div class="bookwyrm-navigation-list">' +
            TABS.map(function (tier) {
                var icon = tier === 'potion'
                    ? '⚗'
                    : tier === 'scroll'
                        ? '✦'
                        : '✧';

                var description = tier === 'potion'
                    ? 'Affordable tactical enchantments for your next eligible claim.'
                    : tier === 'scroll'
                        ? 'Stronger strategic enchantments for planned reward claims.'
                        : 'Premium enchantments worth saving for.';

                return (
                    '<button type="button" class="bookwyrm-navigation-button" data-bazaar-tier="' +
                    tier + '">' +
                    '<span class="bookwyrm-navigation-icon">' + icon + '</span>' +
                    '<div><b>' + TAB_LABELS[tier] + '</b><small>' +
                    description +
                    '</small></div><em>›</em>' +
                    '</button>'
                );
            }).join('') +
            '</div>' +
            '</main>'
        );
    }

    function itemsMarkup(api, level, gold) {
        var items = api.catalog
            .filter(function (item) {
                return item.tier === currentTier;
            })
            .sort(function (a, b) {
                return FAMILY_ORDER.indexOf(a.family) - FAMILY_ORDER.indexOf(b.family);
            });

        return (
            '<main class="bookwyrm-page-content">' +
            '<section class="bookwyrm-page-intro">' +
            '<span class="adventure-label">' + TAB_LABELS[currentTier] + '</span>' +
            '<h2>Choose an enchantment</h2>' +
            '<p>Inspect an item to see its full rule, price, and unlock requirement.</p>' +
            '</section>' +
            '<div class="bookwyrm-effect-list">' +
            items.map(function (item) {
                var unlocked = api.isUnlocked(item, level);
                var affordable = gold >= item.price;
                var stateClass = !unlocked
                    ? ' locked'
                    : !affordable
                        ? ' unaffordable'
                        : '';

                var price = !unlocked
                    ? 'Level ' + api.unlockLevel(item)
                    : item.price + ' Gold';

                return (
                    '<button type="button" class="bookwyrm-effect-row' + stateClass +
                    '" data-bazaar-item="' + escape(item.id) + '">' +
                    art(item) +
                    '<span class="bookwyrm-effect-copy">' +
                    '<b>' + escape(item.name) + '</b>' +
                    '<small>' + escape(readableEffect(item)) + '</small>' +
                    '</span>' +
                    '<em>' + escape(price) + '</em>' +
                    '</button>'
                );
            }).join('') +
            '</div>' +
            '</main>'
        );
    }

    function contentMarkup(api, state, level, gold) {
        if (currentView === VIEWS.CATEGORIES) {
            return categoriesMarkup();
        }

        if (currentView === VIEWS.TIERS) {
            return tiersMarkup();
        }

        if (currentView === VIEWS.ITEMS) {
            return itemsMarkup(api, level, gold);
        }

        return homeMarkup(state);
    }

    function renderBazaar() {
        var api = economy();
        var bazaar = document.getElementById('bookwyrmBazaar');

        if (!api || !bazaar) return;

        var state = api.state();
        var progress = api.game();
        var level = api.levelFor(progress.xp);
        var gold = Math.max(0, Number(progress.gold) || 0);

        bazaar.innerHTML =
            headerMarkup(gold) +
            contentMarkup(api, state, level, gold);

        if (currentView === VIEWS.INVENTORY) {
            inventoryModal();
            return;
        }

        if (currentView === VIEWS.ITEM_DETAIL) {
            bazaar.innerHTML = headerMarkup(gold);
            itemPreview(api.item(currentItemId));
            return;
        }

        bazaar.querySelectorAll('[data-bazaar-back]').forEach(function (button) {
            button.onclick = backBazaar;
        });

        bazaar.querySelectorAll('[data-bazaar-nav]').forEach(function (button) {
            button.onclick = function () {
                navigateBazaar(button.dataset.bazaarNav);
            };
        });

        bazaar.querySelectorAll('[data-bazaar-tier]').forEach(function (button) {
            button.onclick = function () {
                navigateBazaar(VIEWS.ITEMS, {
                    tier: button.dataset.bazaarTier
                });
            };
        });

        bazaar.querySelectorAll('[data-bazaar-item]').forEach(function (button) {
            button.onclick = function () {
                var item = api.item(button.dataset.bazaarItem);

                if (!item) return;

                navigateBazaar(VIEWS.ITEM_DETAIL, {
                    tier: item.tier,
                    itemId: item.id
                });
            };
        });

        bazaar.querySelectorAll('[data-bazaar-inventory]').forEach(function (button) {
            button.onclick = function () {
                navigateBazaar(VIEWS.INVENTORY);
            };
        });
        api.markViewed();
    }

    function install() {
        var page = adventurePage();

        if (!page || page.dataset.bookwyrmBazaarReady) return;

        page.dataset.bookwyrmBazaarReady = 'true';

        var bazaar = document.createElement('section');
        bazaar.id = 'bookwyrmBazaar';
        bazaar.className = 'bookwyrm-bazaar-page hidden';
        bazaar.setAttribute('aria-label', 'The Bookwyrm Bazaar');
        document.body.appendChild(bazaar);

        var style = document.createElement('style');
        style.textContent =
            '.bookwyrm-bazaar-page{position:fixed;z-index:1100;inset:0;display:flex;flex-direction:column;overflow:hidden;background:var(--bg,#14181C);color:var(--paper-light,#F6F1E4);transform:translateX(100%);transition:transform .26s ease}' +
            '.bookwyrm-bazaar-page.hidden{display:none!important}' +
            '.bookwyrm-bazaar-page.is-open{transform:translateX(0)}' +
            '.bookwyrm-page-header{display:grid;grid-template-columns:minmax(72px,1fr) auto minmax(72px,1fr);align-items:center;gap:8px;padding:calc(14px + env(safe-area-inset-top)) 16px 14px;border-bottom:1px solid rgba(168,130,60,.3);background:var(--bg-elevated,#1B2129)}' +
            '.bookwyrm-page-header>div{text-align:center}.bookwyrm-page-header>div span{display:block;color:var(--gold,#A8823C);font-size:9px;letter-spacing:.13em;text-transform:uppercase}.bookwyrm-page-header h1{margin:2px 0 0;font:20px Georgia,serif}.bookwyrm-page-header>b{justify-self:end;color:var(--gold,#A8823C);font:16px Georgia,serif;white-space:nowrap}' +
            '.bookwyrm-page-nav{justify-self:start;min-height:34px;padding:8px 10px;border:1px solid rgba(168,130,60,.55);border-radius:4px;background:rgba(0,0,0,.18);color:var(--gold,#A8823C);font:inherit;font-size:11px;font-weight:bold;cursor:pointer;white-space:nowrap;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}' +
            '.bookwyrm-page-nav:active{transform:translateY(1px);background:rgba(168,130,60,.18)}' +
            '.bookwyrm-page-nav:focus-visible{outline:2px solid var(--gold,#A8823C);outline-offset:2px}' +
            '.bookwyrm-page-content{flex:1;overflow:auto;padding:18px 16px calc(120px + env(safe-area-inset-bottom))}' +
            '.bookwyrm-home-intro,.bookwyrm-page-intro{padding:4px 2px 15px}.bookwyrm-home-intro h2,.bookwyrm-page-intro h2{margin:5px 0;font:23px Georgia,serif}.bookwyrm-home-intro p,.bookwyrm-page-intro p{margin:6px 0 0;color:var(--muted,#8A8378);font-size:12px;line-height:1.45}' +
            '.bookwyrm-home-active{padding:14px;border:1px solid rgba(168,130,60,.42);border-radius:5px;background:rgba(0,0,0,.15)}' +
            '.bookwyrm-home-active>div{display:flex;align-items:center;gap:11px;margin-top:8px}.bookwyrm-home-active p{margin:0}.bookwyrm-home-active p b,.bookwyrm-home-active p span{display:block}.bookwyrm-home-active p b{font:17px Georgia,serif}.bookwyrm-home-active p span{margin-top:4px;color:var(--gold,#A8823C);font-size:11px}.bookwyrm-home-active small{display:block;margin-top:8px;color:var(--muted,#8A8378);font-size:10px}.bookwyrm-home-empty>b{display:block;margin-top:7px;font:17px Georgia,serif}.bookwyrm-home-empty p{margin:5px 0 0;color:var(--muted,#8A8378);font-size:12px;line-height:1.4}' +
            '.bookwyrm-home-button,.bookwyrm-navigation-button{display:flex;align-items:center;gap:12px;width:100%;margin-top:11px;padding:13px;border:1px solid rgba(168,130,60,.38);border-radius:5px;background:rgba(0,0,0,.14);color:var(--paper-light,#F6F1E4);font:inherit;text-align:left;cursor:pointer}.bookwyrm-home-button>span,.bookwyrm-navigation-icon{display:grid;place-items:center;flex:0 0 auto;width:42px;height:42px;border:1px solid rgba(168,130,60,.42);border-radius:4px;background:rgba(168,130,60,.12);color:var(--gold,#A8823C);font-size:21px}.bookwyrm-home-button div,.bookwyrm-navigation-button div{min-width:0;flex:1}.bookwyrm-home-button b,.bookwyrm-home-button small,.bookwyrm-navigation-button b,.bookwyrm-navigation-button small{display:block}.bookwyrm-home-button b,.bookwyrm-navigation-button b{font:17px Georgia,serif}.bookwyrm-home-button small,.bookwyrm-navigation-button small{margin-top:4px;color:var(--muted,#8A8378);font-size:11px;line-height:1.35}.bookwyrm-home-button em,.bookwyrm-navigation-button em{color:var(--gold,#A8823C);font-size:23px;font-style:normal}.bookwyrm-enter-market{border-color:rgba(212,166,79,.65);background:linear-gradient(135deg,rgba(168,130,60,.17),rgba(0,0,0,.14))}' +
            '.bookwyrm-navigation-list{display:grid;gap:11px}.bookwyrm-navigation-button{margin:0}.bookwyrm-navigation-locked{opacity:.52;cursor:not-allowed}.bookwyrm-navigation-locked em{font-size:10px;white-space:nowrap}' +
            '.bookwyrm-effect-list{margin-top:2px;border-top:1px solid rgba(168,130,60,.2)}.bookwyrm-effect-row{display:flex;align-items:center;gap:11px;width:100%;padding:11px 0;border:0;border-bottom:1px solid rgba(168,130,60,.16);background:transparent;color:var(--paper-light,#F6F1E4);font:inherit;text-align:left;cursor:pointer}.bookwyrm-effect-copy{min-width:0;flex:1}.bookwyrm-effect-copy b,.bookwyrm-effect-copy small{display:block}.bookwyrm-effect-copy b{font:17px Georgia,serif}.bookwyrm-effect-copy small{margin-top:3px;color:var(--muted,#8A8378);font-size:10px;line-height:1.35}.bookwyrm-effect-row em{color:var(--gold,#A8823C);font-size:11px;font-style:normal;text-align:right;white-space:nowrap}.bookwyrm-effect-row.locked{opacity:.57}.bookwyrm-effect-row.unaffordable{opacity:.76}' +
            '.bazaar-art{display:grid;place-items:center;flex:0 0 48px;width:48px;height:48px;min-width:48px;max-width:48px;overflow:hidden;border:1px solid rgba(168,130,60,.48);border-radius:4px;background:#11161c}.bazaar-art-preview{width:72px;height:72px}.bazaar-art-potion img{display:block;max-width:100%;max-height:100%;width:100%;height:100%;object-fit:contain;object-position:center}.bazaar-art-scroll{background:linear-gradient(135deg,#c9b17a,#80633b);color:#2c2012;box-shadow:inset 0 0 0 3px rgba(255,245,205,.25)}.bazaar-art-tome{background:linear-gradient(135deg,#542f44,#211a2f);color:#efcf78;box-shadow:inset 0 0 0 3px rgba(255,219,126,.14)}.bazaar-art-scroll span,.bazaar-art-tome span{font-size:19px;line-height:1}.bazaar-art-scroll b,.bazaar-art-tome b{margin-top:2px;font-size:8px;letter-spacing:.07em;text-transform:uppercase}.bazaar-art-preview span{font-size:26px}.bazaar-art-preview b{font-size:9px}' +
            '.bookwyrm-preview-overlay{position:fixed;z-index:1250;inset:0;display:grid;place-items:center;padding:18px;background:rgba(3,5,8,.78);backdrop-filter:blur(5px)}.bookwyrm-preview-card{position:relative;width:min(100%,480px);max-height:88vh;overflow:auto;padding:22px 18px calc(22px + env(safe-area-inset-bottom));border:1px solid var(--gold,#A8823C);border-radius:7px;background:var(--bg-elevated,#1B2129);color:var(--paper-light,#F6F1E4);box-shadow:0 18px 60px rgba(0,0,0,.55)}.bookwyrm-preview-close{position:absolute;top:9px;right:11px;border:0;background:transparent;color:var(--muted,#8A8378);font-size:27px;line-height:1;cursor:pointer}.bookwyrm-preview-hero{display:flex;align-items:center;gap:14px;padding-right:24px}.bookwyrm-preview-hero h2{margin:4px 0;font:23px Georgia,serif}.bookwyrm-preview-hero p{margin:6px 0 0;color:var(--muted,#8A8378);font-size:12px;line-height:1.4}.bookwyrm-preview-effect{margin-top:17px;padding:12px;border-left:3px solid var(--gold,#A8823C);background:rgba(0,0,0,.14)}.bookwyrm-preview-effect b,.bookwyrm-preview-effect span{display:block}.bookwyrm-preview-effect b{color:var(--gold,#A8823C);font:16px Georgia,serif}.bookwyrm-preview-effect span{margin-top:5px;color:var(--muted,#8A8378);font-size:11px}.bookwyrm-preview-rule{margin-top:14px;padding-top:13px;border-top:1px solid rgba(168,130,60,.2)}.bookwyrm-preview-rule b{font-size:12px;letter-spacing:.07em;text-transform:uppercase}.bookwyrm-preview-rule p,.bookwyrm-preview-status,.bookwyrm-preview-owned{margin:6px 0 0;color:var(--muted,#8A8378);font-size:12px;line-height:1.45}.bookwyrm-preview-owned{color:var(--gold,#A8823C)}.bookwyrm-preview-buy{width:100%;margin-top:18px;padding:12px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4);font:inherit;font-weight:bold;cursor:pointer}.bookwyrm-preview-buy:disabled{opacity:.45;cursor:not-allowed}' +
            '.bookwyrm-inventory-card h2{margin:5px 0 15px;font:23px Georgia,serif}.bookwyrm-inventory-card h2 em{color:var(--muted,#8A8378);font:12px var(--font-body,-apple-system);font-style:normal}.bookwyrm-inventory-active{padding:12px;border:1px solid rgba(168,130,60,.32);border-radius:4px;background:rgba(0,0,0,.14)}.bookwyrm-inventory-active>div{display:flex;align-items:center;gap:10px;margin-top:8px}.bookwyrm-inventory-active p{margin:0}.bookwyrm-inventory-active p b,.bookwyrm-inventory-active p span{display:block}.bookwyrm-inventory-active p b{font:16px Georgia,serif}.bookwyrm-inventory-active p span{margin-top:3px;color:var(--gold,#A8823C);font-size:11px}.bookwyrm-inventory-active small{display:block;margin-top:8px;color:var(--muted,#8A8378);font-size:10px}.bookwyrm-inventory-empty p{margin:8px 0 0;color:var(--muted,#8A8378);font-size:12px;line-height:1.4}.bookwyrm-inventory-list{margin-top:14px;border-top:1px solid rgba(168,130,60,.2)}.bookwyrm-inventory-row{display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid rgba(168,130,60,.15)}.bookwyrm-inventory-row>div{min-width:0;flex:1}.bookwyrm-inventory-row b,.bookwyrm-inventory-row span,.bookwyrm-inventory-row small{display:block}.bookwyrm-inventory-row b{font:15px Georgia,serif}.bookwyrm-inventory-row span{margin-top:3px;color:var(--muted,#8A8378);font-size:11px}.bookwyrm-inventory-row small{margin-top:3px;color:var(--gold,#A8823C);font-size:10px}.bookwyrm-inventory-row button{padding:8px 9px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4);font:inherit;font-size:11px;cursor:pointer}.bookwyrm-inventory-row button:disabled{opacity:.42;cursor:not-allowed}.bookwyrm-inventory-none{margin:16px 0 0;color:var(--muted,#8A8378);font-size:12px;text-align:center}' + '.bookwyrm-relics-section{' +
            'margin-top:18px;border:1px solid rgba(168,130,60,.32);border-radius:5px;background:rgba(0,0,0,.14)' +
            '}' +
            '.bookwyrm-relics-heading{' +
            'display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px;cursor:pointer;list-style:none' +
            '}' +
            '.bookwyrm-relics-heading::-webkit-details-marker{display:none}' +
            '.bookwyrm-relics-heading>div:first-child{min-width:0}' +
            '.bookwyrm-relics-heading h3{' +
            'margin:4px 0 0;font:20px Georgia,serif;color:var(--paper-light,#F6F1E4)' +
            '}' +
            '.bookwyrm-relics-summary-meta{' +
            'display:flex;align-items:center;gap:8px;color:var(--muted,#8A8378);white-space:nowrap' +
            '}' +
            '.bookwyrm-relics-summary-meta em{' +
            'font-size:11px;font-style:normal' +
            '}' +
            '.bookwyrm-relics-summary-meta span{' +
            'display:inline-block;color:var(--gold,#A8823C);font-size:22px;line-height:1;transition:transform .16s ease' +
            '}' +
            '.bookwyrm-relics-section[open] .bookwyrm-relics-summary-meta span{' +
            'transform:rotate(90deg)' +
            '}' +
            '.bookwyrm-relics-body{' +
            'padding:0 13px 13px;border-top:1px solid rgba(168,130,60,.18)' +
            '}' +
            '.bookwyrm-relics-description{' +
            'margin:10px 0;color:var(--muted,#8A8378);font-size:12px;line-height:1.4' +
            '}' +
            '.bookwyrm-relic-list{' +
            'border-top:1px solid rgba(168,130,60,.18)' +
            '}' + '.bookwyrm-relic-group{' +
            'border-bottom:1px solid rgba(168,130,60,.18)' +
            '}' +
            '.bookwyrm-relic-group:last-child{' +
            'border-bottom:0' +
            '}' +
            '.bookwyrm-relic-group-summary{' +
            'display:flex;align-items:center;gap:9px;padding:11px 0;cursor:pointer;list-style:none' +
            '}' +
            '.bookwyrm-relic-group-summary::-webkit-details-marker{' +
            'display:none' +
            '}' +
            '.bookwyrm-relic-group-summary b{' +
            'flex:1;color:var(--gold,#A8823C);font-size:11px;letter-spacing:.08em;text-transform:uppercase' +
            '}' +
            '.bookwyrm-relic-group-summary span{' +
            'color:var(--muted,#8A8378);font-size:10px;white-space:nowrap' +
            '}' +
            '.bookwyrm-relic-group-summary em{' +
            'display:inline-block;color:var(--gold,#A8823C);font-size:20px;font-style:normal;line-height:1;transition:transform .16s ease' +
            '}' +
            '.bookwyrm-relic-group[open] .bookwyrm-relic-group-summary em{' +
            'transform:rotate(90deg)' +
            '}' +
            '.bookwyrm-relic-group-items{' +
            'padding:0 0 5px;border-top:1px solid rgba(168,130,60,.12)' +
            '}' +
            '.bookwyrm-relic-row{' +
            '.bookwyrm-relic-icon{' +
            'display:inline-flex;align-items:center;justify-content:center;width:25px;height:25px;border:1px solid rgba(168,130,60,.48);border-radius:50%;color:var(--gold,#A8823C);font-size:13px' +
            '}' +
            '.bookwyrm-relic-row b{' +
            'flex:1;color:var(--paper-light,#F6F1E4);font:15px Georgia,serif' +
            '}' +
            '.bookwyrm-relic-row em{' +
            'color:var(--gold,#A8823C);font-size:14px;font-style:normal;font-weight:bold;white-space:nowrap' +
            '}' +
            '.bookwyrm-relic-none{' +
            'margin:0;padding:12px 0;color:var(--muted,#8A8378);font-size:12px' +
            '}'
            ;

        document.head.appendChild(style);

        window.addEventListener('bookshelf-adventure-economy-changed', function () {
            var openBazaar = document.getElementById('bookwyrmBazaar');

            if (openBazaar && openBazaar.classList.contains('is-open')) {
                renderBazaar();
            }
        });

        window.BookwyrmBazaar = {
            open: showBazaar,

            close: closeBazaar,

            back: backBazaar,

            inventory: function () {
                navigateBazaar(VIEWS.INVENTORY);
            }
        };
        window.addEventListener('bookshelf-navigation-changed', function (event) {
            var route = event.detail && event.detail.route;

            if (route && route.page === 'bazaar') {
                applyRoute(route);
                return;
            }

            if (route && route.page === 'bazaar-item') {
                var itemRoute = {
                    page: 'bazaar',
                    view: VIEWS.ITEM_DETAIL,
                    tier: route.tier,
                    itemId: route.itemId
                };
                var nav = navigation();

                if (nav && typeof nav.sync === 'function') {
                    nav.sync(itemRoute);
                }

                applyRoute(itemRoute);
                return;
            }

            var bazaar = document.getElementById('bookwyrmBazaar');

            if (bazaar) {
                removeItemPreview();
                bazaar.classList.remove('is-open');
                bazaar.classList.add('hidden');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', install);
    } else {
        install();
    }
})();