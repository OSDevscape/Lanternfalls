(function () {
    var VIEWS = {
        HOME: 'home',
        CATEGORIES: 'categories',
        TIERS: 'tiers',
        ITEMS: 'items',
        EQUIPMENT: 'equipment',
        WEAPONS: 'weapons',
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
        if (currentView === VIEWS.WEAPONS) {
            navigateBazaar(VIEWS.EQUIPMENT);
            return;
        }

        if (currentView === VIEWS.EQUIPMENT) {
            navigateBazaar(VIEWS.CATEGORIES);
            return;
        }
        if (currentView === VIEWS.WEAPONS) {
            navigateBazaar(VIEWS.EQUIPMENT);
            return;
        }

        if (currentView === VIEWS.EQUIPMENT) {
            navigateBazaar(VIEWS.CATEGORIES);
            return;
        }

        if (currentView === VIEWS.ITEMS) {
            navigateBazaar(VIEWS.TIERS, {
                tier: currentTier
            });
            return;
        }

        if (currentView === VIEWS.TIERS) {
            navigateBazaar(VIEWS.CATEGORIES);
            return;
        }

        if (currentView === VIEWS.CATEGORIES) {
            navigateBazaar(VIEWS.HOME);
            return;
        }

        if (currentView === VIEWS.ITEM_DETAIL) {
            navigateBazaar(VIEWS.ITEMS, {
                tier: currentTier
            });
            return;
        }

        if (currentView === VIEWS.INVENTORY) {
            navigateBazaar(VIEWS.HOME);
            return;
        }

        closeBazaar();

        var realmTab = document.querySelector(
            '#bottomNavigation [data-page="realm"]'
        );

        if (realmTab) {
            realmTab.click();
        }
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
            '<p>After purchase, this item goes into your Inventory. Activate it when you are ready. It is consumed only after it successfully applies to a matching reward claim.</p>' +
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

                toast(result.item.name + ' added to Inventory.');
                itemPreview(item);
            };
        }

        document.body.appendChild(preview);
    }

    function inventoryModal() {
        var api = economy();
        var bazaar = document.getElementById('bookwyrmBazaar');
        var equipment = window.LanternfallsEquipment || null;

        if (!api || !bazaar) return;

        var state = api.state();
        var active = state.activeItem;
        var items = state.ownedItems || [];
        var equippedWeapon = equipment &&
            typeof equipment.getEquippedWeapon === 'function'
            ? equipment.getEquippedWeapon()
            : null;
        var weapons = equipment &&
            typeof equipment.getWeapons === 'function'
            ? equipment.getWeapons()
            : [];

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

        function weaponIcon(weapon) {
            var icons = {
                'readers-orb': '◉',
                quillstaff: '⚔',
                inkblaster: '✦',
                'bookmark-boomerang': '↻',
                'letterpress-hammer': '⚒',
                'librarians-bell': '♬',
                'reading-glass': '◌'
            };

            if (weapon.image) {
                return (
                    '<img class="bookwyrm-weapon-image" src="' +
                    escape(weapon.image) +
                    '" alt="" loading="lazy">'
                );
            }

            return (
                '<span class="bookwyrm-weapon-icon" aria-hidden="true">' +
                (icons[weapon.id] || '✧') +
                '</span>'
            );
        }

        function weaponEffect(weapon) {
            if (!weapon || !weapon.effect) {
                return '';
            }

            return String(
                weapon.effect.description ||
                weapon.effect.label ||
                ''
            );
        }

        function weaponStatus(weapon) {
            var status = equipment &&
                typeof equipment.purchaseStatus === 'function'
                ? equipment.purchaseStatus(weapon.id)
                : null;

            if (weapon.owned) {
                return '';
            }

            if (!status) {
                return 'Locked';
            }

            if (weapon.relicProgress && !weapon.relicProgress.met) {
                return (
                    weapon.relicProgress.quantity +
                    ' / ' +
                    weapon.purchaseRelics +
                    ' ' +
                    weapon.relicLabel
                );
            }

            if (!status.purchasable) {
                return 'Need ' + weapon.price + ' gold';
            }

            return 'Ready to purchase';
        }

        function weaponAction(weapon) {
            var isEquipped = equippedWeapon &&
                equippedWeapon.id === weapon.id;
            var status = equipment &&
                typeof equipment.purchaseStatus === 'function'
                ? equipment.purchaseStatus(weapon.id)
                : null;

            if (weapon.owned) {
                return (
                    '<button type="button" data-inventory-equip-weapon="' +
                    escape(weapon.id) + '"' +
                    (isEquipped ? ' disabled' : '') +
                    '>' +
                    (isEquipped ? 'Equipped' : 'Equip') +
                    '</button>'
                );
            }

            if (status && status.purchasable) {
                return (
                    '<button type="button" data-inventory-purchase-weapon="' +
                    escape(weapon.id) +
                    '">Purchase ' +
                    weapon.price +
                    ' gold</button>'
                );
            }

            return (
                '<button type="button" disabled>' +
                'Locked' +
                '</button>'
            );
        }

        function weaponRow(weapon) {
            if (!weapon) return '';

            var tierText = weapon.upgradeable
                ? 'Tier ' + weapon.tier + ' of 3'
                : 'Starter weapon';
            var effectText = weaponEffect(weapon);
            var purchaseText = weaponStatus(weapon);
            var details = [];

            if (weapon.type) {
                details.push(weapon.type);
            }

            details.push(tierText);

            if (!weapon.owned && weapon.relicLabel) {
                details.push(
                    weapon.relicProgress.quantity +
                    ' / ' +
                    weapon.purchaseRelics +
                    ' ' +
                    weapon.relicLabel
                );
            }

            return (
                '<article class="bookwyrm-inventory-row bookwyrm-weapon-row' +
                (weapon.owned ? '' : ' is-locked') +
                '">' +
                weaponIcon(weapon) +
                '<div>' +
                '<b>' + escape(weapon.name) + '</b>' +
                '<span>' + escape(effectText) + '</span>' +
                '<small>' + escape(details.join(' · ')) + '</small>' +
                (purchaseText
                    ? '<small class="bookwyrm-weapon-status">' +
                    escape(purchaseText) +
                    '</small>'
                    : '') +
                '</div>' +
                weaponAction(weapon) +
                '</article>'
            );
        }

        var ownedWeapons = weapons.filter(function (weapon) {
            return weapon && weapon.owned;
        });

        var weaponsHtml = ownedWeapons.length
            ? (
                '<div class="bookwyrm-inventory-list">' +
                ownedWeapons.map(weaponRow).join('') +
                '</div>'
            )
            : '<p class="bookwyrm-inventory-none">Weapon equipment is unavailable until the Adventure equipment system loads.</p>';

        var ownedWeaponCount = ownedWeapons.length;

        var enchantmentRows = items.length
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

        function futureCategory(title) {
            return (
                '<details class="bookwyrm-inventory-category bookwyrm-inventory-future">' +
                '<summary class="bookwyrm-inventory-category-summary">' +
                '<span><b>' + title + '</b><small>Equipment category</small></span>' +
                '<em>Coming soon</em>' +
                '</summary>' +
                '<div class="bookwyrm-inventory-category-body">' +
                '<p class="bookwyrm-inventory-none">Coming soon.</p>' +
                '</div>' +
                '</details>'
            );
        }

        var categoriesHtml =
            '<details class="bookwyrm-inventory-category">' +
            '<summary class="bookwyrm-inventory-category-summary">' +
            '<span><b>Weapons</b><small>Purchase, equip, and upgrade your combat focus.</small></span>' +
            '<em>' + ownedWeaponCount + ' owned</em>' +
            '</summary>' +
            '<div class="bookwyrm-inventory-category-body">' +
            weaponsHtml +
            '</div>' +
            '</details>' +

            '<details class="bookwyrm-inventory-category">' +
            '<summary class="bookwyrm-inventory-category-summary">' +
            '<span><b>Enchantments</b><small>Stored Bazaar enchantments for future reward claims.</small></span>' +
            '<em>' + items.length + ' stored</em>' +
            '</summary>' +
            '<div class="bookwyrm-inventory-category-body">' +
            '<div class="bookwyrm-inventory-list">' +
            enchantmentRows +
            '</div>' +
            '</div>' +
            '</details>' +

            futureCategory('Armor') +
            futureCategory('Shields') +
            futureCategory('Trinkets');

        bazaar.innerHTML =
            headerMarkup(Math.max(0, Number(api.game().gold) || 0)) +
            '<main class="bookwyrm-page-content">' +
            '<section class="bookwyrm-page-intro">' +
            '<span class="adventure-label">The Bookwyrm Bazaar</span>' +
            '<h2>Inventory</h2>' +
            '<p>Manage weapons and stored enchantments for future adventures.</p>' +
            '</section>' +
            activeHtml +
            '<section class="bookwyrm-inventory-categories">' +
            categoriesHtml +
            '</section>' +
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

        bazaar.querySelectorAll('[data-inventory-equip-weapon]').forEach(function (button) {
            button.onclick = function () {
                if (!equipment || typeof equipment.equipWeapon !== 'function') {
                    toast('Weapon equipment is not available yet.');
                    return;
                }

                var result = equipment.equipWeapon(
                    button.dataset.inventoryEquipWeapon
                );

                if (!result || !result.ok) {
                    toast(
                        (result && result.reason) ||
                        'That weapon could not be equipped.'
                    );
                    return;
                }

                toast(result.weapon.name + ' equipped.');
                inventoryModal();
            };
        });

        bazaar.querySelectorAll('[data-inventory-purchase-weapon]').forEach(function (button) {
            button.onclick = function () {
                if (!equipment || typeof equipment.purchaseWeapon !== 'function') {
                    toast('Weapon purchases are not available yet.');
                    return;
                }

                var result = equipment.purchaseWeapon(
                    button.dataset.inventoryPurchaseWeapon
                );

                if (!result || !result.ok) {
                    toast(
                        (result && result.reason) ||
                        'That weapon could not be purchased.'
                    );
                    return;
                }

                toast(result.weapon.name + ' added to your weapons.');
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
        if (currentView === VIEWS.EQUIPMENT) label = '‹ Market';
        if (currentView === VIEWS.WEAPONS) label = '‹ Equipment';
        if (currentView === VIEWS.INVENTORY) label = '‹ Bazaar';
        if (currentView === VIEWS.ITEM_DETAIL) {
            label = '‹ ' + (TAB_LABELS[currentTier] || 'Items');
        }

        back =
            '<button type="button" class="bookwyrm-page-nav bookwyrm-realm-back" ' +
            'data-bazaar-back aria-label="Return to Realm">' +
            escape(label) +
            '</button>';

        return (
            '<header class="bookwyrm-page-header">' +
            back +
            '<div class="bookwyrm-page-header-copy">' +
            '<h1>The Bookwyrm Bazaar</h1>' +
            '<p>Buy, store, and activate reading enchantments.</p>' +
            '</div>' +
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
            '<span>▣</span><div><b>Inventory</b><small>' +
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
            '<button type="button" class="bookwyrm-navigation-button" data-bazaar-nav="equipment">' +
            '<span class="bookwyrm-navigation-icon">⚔</span>' +
            '<div><b>Equipment</b><small>Weapons, armor, shields, and trinkets for your Reading Realm expeditions.</small></div>' +
            '<em>›</em>' +
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

    function equipmentDirectoryMarkup() {
        return (
            '<main class="bookwyrm-page-content">' +
            '<section class="bookwyrm-page-intro">' +
            '<span class="adventure-label">Equipment Hall</span>' +
            '<h2>What will you wield?</h2>' +
            '<p>Acquire combat equipment for your Reading Realm adventures. Weapons can be refined and upgraded at the Forge.</p>' +
            '</section>' +

            '<div class="bookwyrm-navigation-list">' +

            '<button type="button" class="bookwyrm-navigation-button" data-bazaar-nav="weapons">' +
            '<span class="bookwyrm-navigation-icon">⚔</span>' +
            '<div><b>Weapons</b><small>Six genre relic weapons. Purchase them with Gold, then upgrade them with matching Essence.</small></div>' +
            '<em>›</em>' +
            '</button>' +

            '<button type="button" class="bookwyrm-navigation-button bookwyrm-navigation-locked" disabled>' +
            '<span class="bookwyrm-navigation-icon">♜</span>' +
            '<div><b>Armor</b><small>Protective gear for future expeditions.</small></div>' +
            '<em>Coming soon</em>' +
            '</button>' +

            '<button type="button" class="bookwyrm-navigation-button bookwyrm-navigation-locked" disabled>' +
            '<span class="bookwyrm-navigation-icon">⬡</span>' +
            '<div><b>Shields</b><small>Defensive focuses and warding tools.</small></div>' +
            '<em>Coming soon</em>' +
            '</button>' +

            '<button type="button" class="bookwyrm-navigation-button bookwyrm-navigation-locked" disabled>' +
            '<span class="bookwyrm-navigation-icon">◈</span>' +
            '<div><b>Trinkets</b><small>Rare charms and passive expedition effects.</small></div>' +
            '<em>Coming soon</em>' +
            '</button>' +

            '</div>' +
            '</main>'
        );
    }

    function weaponShopName(weapon) {
        var names = {
            quillstaff: 'Quillstaff',
            dreadwood_bow: 'Dreadwood Bow',
            wilds_longbow: 'Wilds Longbow',
            ancient_blade: 'Ancient Blade',
            shadow_focus: 'Shadow Focus',
            astral_staff: 'Astral Staff'
        };

        return names[weapon.id] || weapon.name || 'Unknown Weapon';
    }

    function weaponsMarkup() {
        var equipment = window.LanternfallsEquipment;

        if (
            !equipment ||
            typeof equipment.getWeapons !== 'function' ||
            typeof equipment.purchaseStatus !== 'function'
        ) {
            return (
                '<main class="bookwyrm-page-content">' +
                '<section class="bookwyrm-page-intro">' +
                '<span class="adventure-label">Weapons</span>' +
                '<h2>Relic Weapons</h2>' +
                '<p>The weapon forge is still waking. Please reopen the Bazaar.</p>' +
                '</section>' +
                '</main>'
            );
        }

        var weapons = equipment.getWeapons().filter(function (weapon) {
            return weapon &&
                weapon.upgradeable &&
                weapon.relicGroup;
        });

        var cards = weapons.map(function (weapon) {
            var status = equipment.purchaseStatus(weapon.id);
            var owned = !!weapon.owned;
            var button;
            var statusText;

            if (owned) {
                button =
                    '<button type="button" class="bookwyrm-weapon-buy owned" disabled>' +
                    'Owned' +
                    '</button>';

                statusText =
                    'Owned · Upgrade with ' +
                    String(weapon.relicLabel || 'Genre Relics')
                        .replace('Relics', 'Essence') +
                    ' at the Forge.';
            } else if (status && status.purchasable) {
                button =
                    '<button type="button" class="bookwyrm-weapon-buy" ' +
                    'data-bazaar-purchase-weapon="' +
                    escape(weapon.id) +
                    '">' +
                    'Purchase · ' + weapon.price + ' Gold' +
                    '</button>';

                statusText = 'Ready to purchase.';
            } else {
                button =
                    '<button type="button" class="bookwyrm-weapon-buy" disabled>' +
                    'Not Ready' +
                    '</button>';

                statusText = status && status.reason
                    ? status.reason
                    : 'This weapon is not available yet.';
            }

            return (
                '<details class="bookwyrm-weapon-card">' +
                '<summary class="bookwyrm-weapon-summary">' +
                '<span class="bookwyrm-weapon-icon" aria-hidden="true">⚔</span>' +
                '<div class="bookwyrm-weapon-summary-copy">' +
                '<span class="adventure-label">' +
                escape(weapon.genre) +
                '</span>' +
                '<h3>' + escape(weaponShopName(weapon)) + '</h3>' +
                '<small>' +
                escape(weapon.role || weapon.type || 'Relic weapon') +
                '</small>' +
                '</div>' +
                '<span class="bookwyrm-weapon-chevron" aria-hidden="true">›</span>' +
                '</summary>' +

                '<div class="bookwyrm-weapon-details">' +
                '<p>' + escape(weapon.role || weapon.type || 'Relic weapon') + '</p>' +
                '<small>' + escape(weapon.type || '') + '</small>' +
                '<small class="bookwyrm-weapon-affinity">' +
                escape(weapon.affinity || '') +
                '</small>' +
                '<small class="bookwyrm-weapon-requirement">' +
                weapon.relicProgress.quantity +
                ' / ' +
                weapon.purchaseRelics +
                ' ' +
                escape(weapon.relicLabel) +
                '</small>' +
                '<small class="bookwyrm-weapon-status">' +
                escape(statusText) +
                '</small>' +

                '<div class="bookwyrm-weapon-action">' +
                '<b>◉ ' + weapon.price + '</b>' +
                button +
                '</div>' +
                '</div>' +
                '</details>'
            );
        }).join('');

        return (
            '<main class="bookwyrm-page-content">' +
            '<section class="bookwyrm-page-intro">' +
            '<span class="adventure-label">Bazaar Equipment</span>' +
            '<h2>Relic Weapons</h2>' +
            '<p>Unlock genre weapons with Gold and named relics. Once owned, refine later relics into Essence at the Forge to strengthen them.</p>' +
            '</section>' +
            '<section class="bookwyrm-weapon-shop">' +
            cards +
            '</section>' +
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

        if (currentView === VIEWS.EQUIPMENT) {
            return equipmentDirectoryMarkup();
        }

        if (currentView === VIEWS.WEAPONS) {
            return weaponsMarkup();
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

bazaar.querySelectorAll('details.bookwyrm-weapon-card').forEach(function (card) {
    card.addEventListener('toggle', function () {
        if (!card.open) {
            return;
        }

        bazaar.querySelectorAll(
            'details.bookwyrm-weapon-card[open]'
        ).forEach(function (otherCard) {
            if (otherCard !== card) {
                otherCard.removeAttribute('open');
            }
        });
    });
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
            '.bookwyrm-page-header{display:flex;align-items:center;gap:14px;flex:0 0 auto;padding:calc(20px + env(safe-area-inset-top)) 20px 20px;border-bottom:1px solid rgba(168,130,60,.24);background:var(--bg,#14181C)}' +
            '.bookwyrm-page-header-copy{min-width:0;flex:1}.bookwyrm-page-header-copy h1{margin:0;color:var(--paper-light,#F6F1E4);font:27px Georgia,serif}.bookwyrm-page-header-copy p{margin:4px 0 0;color:var(--muted,#8A8378);font-size:12px}' +
            '.bookwyrm-page-header>b{margin-left:auto;color:var(--gold,#A8823C);font:16px Georgia,serif;white-space:nowrap}' +
            '.bookwyrm-page-nav{flex:0 0 auto;min-height:34px;padding:8px 10px;border:1px solid rgba(168,130,60,.55);border-radius:4px;background:rgba(0,0,0,.18);color:var(--accent,#8B3A3A);font:inherit;font-size:11px;font-weight:bold;cursor:pointer;white-space:nowrap;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}' +
            '.bookwyrm-page-nav:active{transform:translateY(1px);background:rgba(168,130,60,.18)}' +
            '.bookwyrm-page-nav:focus-visible{outline:2px solid var(--gold,#A8823C);outline-offset:2px}' +
            '.bookwyrm-page-nav{justify-self:start;min-height:34px;padding:8px 10px;border:1px solid rgba(168,130,60,.55);border-radius:4px;background:rgba(0,0,0,.18);color:var(--gold,#A8823C);font:inherit;font-size:11px;font-weight:bold;cursor:pointer;white-space:nowrap;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}' +
            '.bookwyrm-page-nav:active{transform:translateY(1px);background:rgba(168,130,60,.18)}' +
            '.bookwyrm-page-nav:focus-visible{outline:2px solid var(--gold,#A8823C);outline-offset:2px}' +
            '.bookwyrm-page-content{flex:1;overflow:auto;padding:18px 16px calc(120px + env(safe-area-inset-bottom))}' +
            '.bookwyrm-home-intro,.bookwyrm-page-intro{padding:4px 2px 15px}.bookwyrm-home-intro h2,.bookwyrm-page-intro h2{margin:5px 0;font:23px Georgia,serif}.bookwyrm-home-intro p,.bookwyrm-page-intro p{margin:6px 0 0;color:var(--muted,#8A8378);font-size:12px;line-height:1.45}' +
            '.bookwyrm-home-active{padding:14px;border:1px solid rgba(168,130,60,.42);border-radius:5px;background:var(--bg-elevated,#1B2129)}' +
            '.bookwyrm-home-active>div{display:flex;align-items:center;gap:11px;margin-top:8px}.bookwyrm-home-active p{margin:0}.bookwyrm-home-active p b,.bookwyrm-home-active p span{display:block}.bookwyrm-home-active p b{font:17px Georgia,serif}.bookwyrm-home-active p span{margin-top:4px;color:var(--gold,#A8823C);font-size:11px}.bookwyrm-home-active small{display:block;margin-top:8px;color:var(--muted,#8A8378);font-size:10px}.bookwyrm-home-empty>b{display:block;margin-top:7px;font:17px Georgia,serif}.bookwyrm-home-empty p{margin:5px 0 0;color:var(--muted,#8A8378);font-size:12px;line-height:1.4}' +
            '.bookwyrm-home-button,.bookwyrm-navigation-button{display:flex;align-items:center;gap:12px;width:100%;margin-top:11px;padding:13px;border:1px solid rgba(168,130,60,.38);border-radius:5px;background:var(--bg-elevated,#1B2129);color:var(--paper-light,#F6F1E4);font:inherit;text-align:left;cursor:pointer}.bookwyrm-home-button>span,.bookwyrm-navigation-icon{display:grid;place-items:center;flex:0 0 auto;width:42px;height:42px;border:1px solid rgba(168,130,60,.42);border-radius:4px;background:rgba(168,130,60,.12);color:var(--gold,#A8823C);font-size:21px}.bookwyrm-home-button div,.bookwyrm-navigation-button div{min-width:0;flex:1}.bookwyrm-home-button b,.bookwyrm-home-button small,.bookwyrm-navigation-button b,.bookwyrm-navigation-button small{display:block}.bookwyrm-home-button b,.bookwyrm-navigation-button b{font:17px Georgia,serif}.bookwyrm-home-button small,.bookwyrm-navigation-button small{margin-top:4px;color:var(--muted,#8A8378);font-size:11px;line-height:1.35}.bookwyrm-home-button em,.bookwyrm-navigation-button em{color:var(--gold,#A8823C);font-size:23px;font-style:normal}.bookwyrm-enter-market{border-color:rgba(212,166,79,.65);background:linear-gradient(135deg,rgba(168,130,60,.17),rgba(0,0,0,.14))}' +
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
        '.bookwyrm-weapon-shop{display:grid;grid-template-columns:1fr;gap:14px}' +
            '.bookwyrm-weapon-card{display:flex;align-items:stretch;gap:14px;padding:16px;border:1px solid rgba(168,130,60,.42);border-radius:7px;background:var(--bg-elevated,#1B2129);box-shadow:0 3px 10px rgba(0,0,0,.12)}' +
            '.bookwyrm-weapon-card:hover{border-color:rgba(168,130,60,.66)}' +
            '.bookwyrm-weapon-icon{display:grid;place-items:center;align-self:flex-start;flex:0 0 auto;width:50px;height:50px;border:1px solid rgba(168,130,60,.54);border-radius:5px;background:rgba(168,130,60,.10);color:var(--gold,#A8823C);font-size:25px}' +
            '.bookwyrm-weapon-copy{display:flex;flex:1;min-width:0;flex-direction:column;align-items:flex-start}.bookwyrm-weapon-copy h3{margin:4px 0 6px;color:var(--paper-light,#F6F1E4);font:20px Georgia,serif;line-height:1.15}.bookwyrm-weapon-copy p{margin:0;color:var(--paper-light,#F6F1E4);font-size:12px;line-height:1.35}.bookwyrm-weapon-copy small{display:block;margin-top:4px;color:var(--muted,#8A8378);font-size:10px;line-height:1.35}.bookwyrm-weapon-copy .bookwyrm-weapon-affinity{color:var(--gold,#A8823C)}.bookwyrm-weapon-copy .bookwyrm-weapon-requirement{margin-top:8px;color:var(--gold,#A8823C)}.bookwyrm-weapon-copy .bookwyrm-weapon-status{margin-top:5px}' +
            '.bookwyrm-weapon-action{display:flex;flex:0 0 125px;flex-direction:column;align-items:stretch;justify-content:space-between;gap:10px;text-align:right}.bookwyrm-weapon-action>b{color:var(--gold,#A8823C);font:16px Georgia,serif;white-space:nowrap}.bookwyrm-weapon-buy{width:100%;padding:9px 8px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4);font:inherit;font-size:10px;font-weight:bold;line-height:1.2;cursor:pointer}.bookwyrm-weapon-buy:disabled{opacity:.48;cursor:not-allowed}.bookwyrm-weapon-buy.owned{background:transparent;color:var(--gold,#A8823C)}' +
            '@media(max-width:420px){.bookwyrm-weapon-card{flex-wrap:wrap}.bookwyrm-weapon-action{width:100%;flex:1 0 100%;flex-direction:row;align-items:center;justify-content:space-between}.bookwyrm-weapon-buy{width:auto;min-width:142px}}';

        document.head.appendChild(style);
        var inventoryStyle = document.createElement('style');

        inventoryStyle.textContent = `
.bookwyrm-inventory-categories {
    display: grid;
    gap: 12px;
    margin-top: 16px;
}

.bookwyrm-inventory-category {
    overflow: hidden;
    border: 1px solid rgba(168, 130, 60, .44);
    border-radius: 7px;
    background: var(--bg-elevated, #1B2129);
    color: var(--paper-light, #F6F1E4);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .04);
    transition: border-color .16s ease, background .16s ease, box-shadow .16s ease;
}

.bookwyrm-inventory-category[open] {
    border-color: rgba(212, 166, 79, .80);
    background: linear-gradient(
        135deg,
        rgba(168, 130, 60, .16),
        rgba(0, 0, 0, .08)
    );
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, .07),
        0 5px 18px rgba(0, 0, 0, .12);
}

.bookwyrm-inventory-category-summary {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 68px;
    padding: 12px 14px;
    cursor: pointer;
    list-style: none;
    user-select: none;
}

.bookwyrm-inventory-category-summary::-webkit-details-marker {
    display: none;
}

.bookwyrm-inventory-category-summary::before {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 25px;
    height: 25px;
    border: 1px solid rgba(168, 130, 60, .66);
    border-radius: 50%;
    color: var(--gold, #A8823C);
    content: '›';
    font: 22px/1 Georgia, serif;
    transition: transform .16s ease, background .16s ease;
}

.bookwyrm-inventory-category[open]
.bookwyrm-inventory-category-summary::before {
    transform: rotate(90deg);
    background: rgba(168, 130, 60, .18);
}

.bookwyrm-inventory-category-summary > span {
    display: block;
    min-width: 0;
    flex: 1;
}

.bookwyrm-inventory-category-summary b,
.bookwyrm-inventory-category-summary small {
    display: block;
}

.bookwyrm-inventory-category-summary b {
    color: var(--paper-light, #F6F1E4);
    font: 18px Georgia, serif;
}

.bookwyrm-inventory-category-summary small {
    margin-top: 4px;
    color: var(--muted, #8A8378);
    font-size: 11px;
    line-height: 1.35;
}

.bookwyrm-inventory-category-summary em {
    flex: 0 0 auto;
    color: var(--gold, #A8823C);
    font-size: 11px;
    font-style: normal;
    text-align: right;
    white-space: nowrap;
}

.bookwyrm-inventory-future {
    opacity: .82;
}

.bookwyrm-inventory-future[open] {
    opacity: 1;
}

.bookwyrm-inventory-future
.bookwyrm-inventory-category-summary em {
    color: var(--muted, #8A8378);
}

.bookwyrm-inventory-category-body {
    padding: 0 14px 13px;
    border-top: 1px solid rgba(168, 130, 60, .24);
}

.bookwyrm-inventory-category-body .bookwyrm-inventory-list {
    margin-top: 0;
}

.bookwyrm-inventory-category-body .bookwyrm-inventory-none {
    margin: 0;
    padding: 16px 4px 5px;
    color: var(--muted, #8A8378);
    text-align: center;
}

.bookwyrm-weapon-row {
    min-height: 65px;
}

.bookwyrm-weapon-icon {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 42px;
    height: 42px;
    border: 1px solid rgba(168, 130, 60, .56);
    border-radius: 50%;
    background: rgba(168, 130, 60, .12);
    color: var(--gold, #A8823C);
    font-size: 20px;
}

.bookwyrm-inventory-category-summary:focus-visible {
    outline: 2px solid var(--gold, #A8823C);
    outline-offset: -3px;
}

/* Light appearance mode */
body.light-mode .bookwyrm-inventory-category,
[data-theme="light"] .bookwyrm-inventory-category,
.light-theme .bookwyrm-inventory-category {
    border-color: rgba(126, 88, 26, .42);
    background: #F7F0E2;
    color: #30271D;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .74);
}

body.light-mode .bookwyrm-inventory-category[open],
[data-theme="light"] .bookwyrm-inventory-category[open],
.light-theme .bookwyrm-inventory-category[open] {
    border-color: rgba(141, 98, 27, .74);
    background: linear-gradient(135deg, #F2E4C6, #FCF8EE);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, .88),
        0 5px 18px rgba(81, 58, 22, .11);
}

body.light-mode .bookwyrm-inventory-category-summary b,
[data-theme="light"] .bookwyrm-inventory-category-summary b,
.light-theme .bookwyrm-inventory-category-summary b {
    color: #30271D;
}

body.light-mode .bookwyrm-inventory-category-summary small,
body.light-mode .bookwyrm-inventory-category-body .bookwyrm-inventory-none,
[data-theme="light"] .bookwyrm-inventory-category-summary small,
[data-theme="light"] .bookwyrm-inventory-category-body .bookwyrm-inventory-none,
.light-theme .bookwyrm-inventory-category-summary small,
.light-theme .bookwyrm-inventory-category-body .bookwyrm-inventory-none {
    color: #6E6253;
}

body.light-mode .bookwyrm-inventory-category-body,
[data-theme="light"] .bookwyrm-inventory-category-body,
.light-theme .bookwyrm-inventory-category-body {
    border-top-color: rgba(126, 88, 26, .22);
}

'.bookwyrm-bazaar-page .bookwyrm-home-active{background:var(--bg-elevated,#1B2129)}' +
'.bookwyrm-bazaar-page .bookwyrm-category-card{background:var(--bg-elevated,#1B2129)}' +
'.bookwyrm-bazaar-page .bookwyrm-tier-card{background:var(--bg-elevated,#1B2129)}' +
'.bookwyrm-bazaar-page .bookwyrm-item-card{background:var(--bg-elevated,#1B2129)}' +
'.bookwyrm-bazaar-page .bookwyrm-inventory-card{background:var(--bg-elevated,#1B2129)}' +
'.bookwyrm-bazaar-page .bookwyrm-relics-summary{background:var(--bg-elevated,#1B2129)}' +
`;

        document.head.appendChild(inventoryStyle);

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