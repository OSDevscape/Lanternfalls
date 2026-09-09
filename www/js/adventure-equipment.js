(function () {
    var EQUIPMENT_KEY = 'bookshelf-adventure-equipment-v1';
    var LOOT_KEY = 'bookshelf-adventure-loot-v1';
    var GAME_KEY = 'bookshelf-adventure-progression-v1';
    var UPGRADE_COSTS = [10, 25, 50];
    var MAX_TIER = 3;
    var ESSENCE_GROUPS = [
        'fantasy',
        'horror',
        'adventure',
        'historical',
        'mystery',
        'science-fiction'
    ];

    var READERS_ORB = {
        id: 'readers-orb',
        name: "Reader's Orb",
        image: '',
        affinity: 'The Reading Realm',
        genre: 'Universal',
        relicGroup: '',
        relicLabel: '',
        role: 'Steady Focus',
        type: 'Universal',
        price: 0,
        purchaseRelics: 0,
        powerBonus: [0],
        staggerChance: [0],
        effect: {
            id: 'steady-focus',
            label: 'Steady Focus',
            description: 'A dependable universal focus with no special status effect.'
        },
        upgradeable: false,
        starter: true
    };

    var WEAPONS = {
        quillstaff: {
            id: 'quillstaff',
            name: 'Quillstaff',
            image: '',
            affinity: 'Mythic Wilds',
            genre: 'Fantasy',
            relicGroup: 'fantasy',
            relicLabel: 'Fantasy Relics',
            role: 'Control + Knockback',
            type: 'Magic / Melee',
            price: 2000,
            purchaseRelics: 25,
            powerBonus: [0, 10, 25, 50],
            staggerChance: [0, 10, 20, 35],
            collisionTier: 2,
            shockwaveTier: 3,
            effect: {
                id: 'quillstaff',
                label: 'Quillstaff Control',
                description: 'Fantasy power, stagger, collision, and shockwave.'
            }
        },

        inkblaster: {
            id: 'inkblaster',
            name: 'Inkblaster',
            image: '',
            affinity: 'The Dreadwood',
            genre: 'Horror',
            relicGroup: 'horror',
            relicLabel: 'Horror Relics',
            role: 'Ranged Control',
            type: 'Ranged',
            price: 2500,
            purchaseRelics: 30,
            powerBonus: [0, 6, 12, 20],
            staggerChance: [0, 4, 8, 12],
            slowPercent: [10, 18, 28, 40],
            weakenPercent: [8, 14, 22, 32],
            effect: {
                id: 'inkblaster',
                label: 'Inkbound Slow',
                description: 'Slows enemies and weakens their counterattacks.'
            }
        },

        'bookmark-boomerang': {
            id: 'bookmark-boomerang',
            name: 'Bookmark Boomerang',
            image: '',
            affinity: 'The Wilds',
            genre: 'Adventure',
            relicGroup: 'adventure',
            relicLabel: 'Adventure Relics',
            role: 'Ranged Precision',
            type: 'Ranged',
            price: 3000,
            purchaseRelics: 35,
            powerBonus: [0, 5, 10, 16],
            staggerChance: [0, 3, 6, 10],
            markCritBonus: [5, 10, 16, 24],
            returnStrikePercent: [8, 15, 24, 35],
            effect: {
                id: 'bookmark-boomerang',
                label: 'Returning Mark',
                description: 'Marks a target, improves critical chance, and returns for a follow-up strike.'
            }
        },

        'letterpress-hammer': {
            id: 'letterpress-hammer',
            name: 'Letterpress Hammer',
            image: '',
            affinity: 'The Ancient Kingdoms',
            genre: 'Historical',
            relicGroup: 'historical',
            relicLabel: 'Historical Relics',
            role: 'Melee Control',
            type: 'Melee',
            price: 3500,
            purchaseRelics: 40,
            powerBonus: [0, 8, 17, 30],
            staggerChance: [12, 25, 42, 65],
            stunChance: [8, 16, 28, 45],
            effect: {
                id: 'letterpress-hammer',
                label: 'Runic Impact',
                description: 'Heavy strikes create symbols that stagger and can stun foes.'
            }
        },

        'librarians-bell': {
            id: 'librarians-bell',
            name: "Librarian's Bell",
            image: '',
            affinity: 'The Shadow District',
            genre: 'Mystery',
            relicGroup: 'mystery',
            relicLabel: 'Mystery Relics',
            role: 'Support / Area Control',
            type: 'Support / AoE',
            price: 4000,
            purchaseRelics: 45,
            powerBonus: [0, 3, 7, 12],
            staggerChance: [0, 5, 10, 16],
            confuseChance: [12, 22, 34, 48],
            pacifyChance: [0, 8, 16, 28],
            effect: {
                id: 'librarians-bell',
                label: 'Resonant Command',
                description: 'A resonant chime can confuse, stun, or pacify encounters across a session.'
            }
        },

        'reading-glass': {
            id: 'reading-glass',
            name: 'Reading Glass',
            image: '',
            affinity: 'The Astral Frontier',
            genre: 'Science Fiction',
            relicGroup: 'science-fiction',
            relicLabel: 'Science Fiction Relics',
            role: 'Magic Precision',
            type: 'Magic / Ranged',
            price: 4500,
            purchaseRelics: 50,
            powerBonus: [0, 8, 18, 32],
            staggerChance: [0, 4, 8, 14],
            exposePercent: [10, 20, 32, 48],
            disruptPercent: [8, 16, 28, 42],
            effect: {
                id: 'reading-glass',
                label: 'Exposed Weakness',
                description: 'Focuses light to expose weaknesses and disrupt enemy attacks.'
            }
        }
    };

    var WEAPON_ORDER = [
        'readers-orb',
        'quillstaff',
        'inkblaster',
        'bookmark-boomerang',
        'letterpress-hammer',
        'librarians-bell',
        'reading-glass'
    ];

    var NAME_POOLS = {
        quillstaff: {
            adjectives: [
                'Runebound', 'Emberbound', 'Moonforged', 'Stormwrought',
                'Dragonforged', 'Frostveiled', 'Starfallen', 'Spellbound',
                'Wildborn', 'Ancient', 'Mythic', 'Arcane', 'Ethereal',
                'Celestial', 'Emerald', 'Obsidian', 'Crimson', 'Sapphire',
                'Golden', 'Silver', 'Feytouched', 'Titanforged', 'Phoenixborn'
            ],
            relics: [
                'Rune', 'Moonstone', 'Starshard', 'Dragonbone', 'Witchstone',
                'Soul Gem', 'Bloodstone', 'Sunstone', 'Ember Crystal',
                'Frost Crystal', 'Worldstone', 'Phoenix Feather',
                'Crownstone', 'Fate Stone', 'Runestone'
            ],
            regions: [
                'the Mythic Wilds', 'the Dragonlands', 'the Moonlit Marches',
                'the Ashen Wilds', 'the Crystal Kingdom', 'the Thornwood Expanse',
                'the Emerald Highlands', 'the Forgotten Vale',
                'the Enchanted Isles', 'the Ancient Wilds'
            ]
        },

        inkblaster: {
            adjectives: [
                'Black-Ichor', 'Gravebound', 'Nightspilled', 'Hollow',
                'Wraithmarked', 'Gloamstained', 'Coffinborn', 'Bloodletter',
                'Dreadscript', 'Veilblack', 'Cursed', 'Whispering'
            ],
            relics: [
                'Bone Ink', 'Grave Dirt', 'Witch Bottle', 'Blood Vial',
                'Funeral Bell', 'Skull', 'Black Candle', 'Cursed Coin'
            ],
            regions: [
                'the Dreadwood', 'the Whispering Hollow', 'the Hollow Graves',
                'the Blackened Library', 'the Waking Crypt', 'the Veiled House'
            ]
        },

        'bookmark-boomerang': {
            adjectives: [
                'Returning', 'Trailbound', 'Windworn', 'Wayfinder',
                'Stormmarked', 'Sunseeking', 'Wildbound', 'Farstrider',
                'Compassforged', 'Questing', 'Ranger’s', 'Rover’s'
            ],
            relics: [
                'Compass', 'Map', 'Trail Token', 'Stormstone',
                'Explorer’s Seal', 'Wild Key', 'Sun Charm', 'Pathfinder Mark'
            ],
            regions: [
                'the Wilds', 'the Stormtrail', 'the Lost Frontier',
                'the Verdant Expanse', 'the Far Reaches', 'the Windward Isles'
            ]
        },

        'letterpress-hammer': {
            adjectives: [
                'Gilded', 'Ironbound', 'King’s', 'Chronicle', 'Inkforged',
                'Royal', 'Foundry', 'Heraldic', 'Sovereign', 'Archive',
                'Brass', 'Oathbound'
            ],
            relics: [
                'Royal Seal', 'Laurel', 'Decree', 'Tablet',
                'Crown', 'Standard', 'Chronicle', 'Empire Coin'
            ],
            regions: [
                'the Ancient Kingdoms', 'the Crownlands', 'the Old Empire',
                'the Scribe’s Foundry', 'the Imperial Archive',
                'the Forgotten Dynasty'
            ]
        },

        'librarians-bell': {
            adjectives: [
                'Resonant', 'Silent', 'Veiled', 'Ciphered', 'Echoing',
                'Midnight', 'Cluebound', 'Hushed', 'Riddlemarked',
                'Lanternlit', 'Secret', 'Unseen'
            ],
            relics: [
                'Cipher', 'Casefile', 'Fingerprint', 'Mirror',
                'Witness Token', 'Evidence Seal', 'Red String', 'Locked Key'
            ],
            regions: [
                'the Shadow District', 'the Silent Stacks',
                'the Unsolved Archive', 'the Lantern Veil',
                'the Midnight Annex', 'the Hidden Reading Room'
            ]
        },

        'reading-glass': {
            adjectives: [
                'Starlit', 'Quantum', 'Solar', 'Prismatic', 'Voidglass',
                'Luminous', 'Nebular', 'Signalbound', 'Orbiting',
                'Chromatic', 'Photon', 'Astral'
            ],
            relics: [
                'Data Crystal', 'Plasma Coil', 'Quantum Core', 'Star Map',
                'Signal Module', 'Gravity Engine', 'Neural Chip', 'AI Core'
            ],
            regions: [
                'the Astral Frontier', 'the Glass Nebula', 'the Signal Expanse',
                'the Orbiting Archive', 'the Quantum Reach', 'the Distant Relay'
            ]
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

    function hash(value) {
        var number = 0;

        String(value || '').split('').forEach(function (character) {
            number = ((number << 5) - number) + character.charCodeAt(0);
            number |= 0;
        });

        return Math.abs(number);
    }

    function pick(list, seed, offset) {
        if (!Array.isArray(list) || !list.length) {
            return '';
        }

        return list[
            Math.abs(hash(String(seed) + '|' + offset)) % list.length
        ];
    }

    function validTier(value) {
        return Math.max(
            0,
            Math.min(MAX_TIER, Math.floor(Number(value) || 0))
        );
    }

    function weaponNameSeed() {
        var state = equipmentState();

        return String(
            state.weaponNameSeed ||
            localStorage.getItem('bookshelf-adventure-weapon-seed') ||
            'lanternfalls-reader'
        );
    }

    function generatedName(id, tier) {
        var weapon = WEAPONS[id];
        var pools = NAME_POOLS[id];
        var seed = weaponNameSeed() + '|' + id + '|' + tier;

        if (!weapon) {
            return 'Unknown Weapon';
        }

        if (tier <= 0 || !pools) {
            return weapon.name;
        }

        if (id === 'quillstaff') {
            if (tier === 1) {
                return pick(pools.adjectives, seed, 1) + ' Quillstaff';
            }

            if (tier === 2) {
                return (
                    pick(pools.adjectives, seed, 2) + ' ' +
                    pick(pools.relics, seed, 3) +
                    ' Quillstaff'
                );
            }

            return (
                'The ' + pick(pools.adjectives, seed, 4) +
                ' Quillstaff of ' + pick(pools.regions, seed, 5)
            );
        }

        if (id === 'inkblaster') {
            if (tier === 1) {
                return pick(pools.adjectives, seed, 1) + ' Inkblaster';
            }

            if (tier === 2) {
                return (
                    pick(pools.adjectives, seed, 2) + ' ' +
                    pick(pools.relics, seed, 3) +
                    ' Inkblaster'
                );
            }

            return (
                'The ' + pick(pools.adjectives, seed, 4) +
                ' Inkblaster of ' + pick(pools.regions, seed, 5)
            );
        }

        if (id === 'bookmark-boomerang') {
            if (tier === 1) {
                return pick(pools.adjectives, seed, 1) + ' Bookmark';
            }

            if (tier === 2) {
                return (
                    'The ' + pick(pools.adjectives, seed, 2) +
                    ' Boomerang of the ' + pick(pools.relics, seed, 3)
                );
            }

            return (
                'The ' + pick(pools.adjectives, seed, 4) +
                ' Bookmark of ' + pick(pools.regions, seed, 5)
            );
        }

        if (id === 'letterpress-hammer') {
            if (tier === 1) {
                return pick(pools.adjectives, seed, 1) + ' Hammer';
            }

            if (tier === 2) {
                return (
                    'The ' + pick(pools.relics, seed, 2) +
                    ' Letterpress Hammer'
                );
            }

            return (
                'The ' + pick(pools.adjectives, seed, 4) +
                ' Hammer of ' + pick(pools.regions, seed, 5)
            );
        }

        if (id === 'librarians-bell') {
            if (tier === 1) {
                return pick(pools.adjectives, seed, 1) + " Librarian's Bell";
            }

            if (tier === 2) {
                return (
                    'The ' + pick(pools.relics, seed, 2) +
                    ' Bell of Echoes'
                );
            }

            return (
                'The ' + pick(pools.adjectives, seed, 4) +
                ' Bell of ' + pick(pools.regions, seed, 5)
            );
        }

        if (id === 'reading-glass') {
            if (tier === 1) {
                return pick(pools.adjectives, seed, 1) + ' Reading Glass';
            }

            if (tier === 2) {
                return (
                    'The ' + pick(pools.relics, seed, 2) +
                    ' Reading Glass'
                );
            }

            return (
                'The ' + pick(pools.adjectives, seed, 4) +
                ' Glass of ' + pick(pools.regions, seed, 5)
            );
        }

        return weapon.name;
    }

    function defaults() {
        var weapons = {};

        WEAPON_ORDER.forEach(function (id) {
            weapons[id] = {
                tier: 0,
                owned: id === READERS_ORB.id
            };
        });

        return {
            version: 4,
            weaponNameSeed: '',
            equippedWeapon: READERS_ORB.id,
            weapons: weapons,
            essence: {
                fantasy: 0,
                horror: 0,
                adventure: 0,
                historical: 0,
                mystery: 0,
                'science-fiction': 0
            }
        };
    }

    function equipmentState() {
        var stored = read(EQUIPMENT_KEY, '{}');
        var state = defaults();
        var storedWeapons = stored &&
            stored.weapons &&
            typeof stored.weapons === 'object'
            ? stored.weapons
            : {};

        if (stored && typeof stored === 'object') {
            state.weaponNameSeed = String(stored.weaponNameSeed || '');
            ESSENCE_GROUPS.forEach(function (groupId) {
                state.essence[groupId] = Math.max(
                    0,
                    Math.floor(
                        Number(
                            stored.essence &&
                            stored.essence[groupId]
                        ) || 0
                    )
                );
            });

            WEAPON_ORDER.forEach(function (id) {
                var saved = storedWeapons[id];

                if (!saved || typeof saved !== 'object') {
                    return;
                }

                state.weapons[id].tier = validTier(saved.tier);
                state.weapons[id].owned = id === READERS_ORB.id
                    ? true
                    : !!(saved.owned || saved.unlocked);
            });

            /*
             Existing version-2 saves marked Quillstaff as unlocked by default.
             Preserve that ownership during migration rather than removing a
             weapon from existing players.
            */
            if (
                storedWeapons.quillstaff &&
                (
                    storedWeapons.quillstaff.unlocked ||
                    storedWeapons.quillstaff.owned ||
                    Number(storedWeapons.quillstaff.tier) > 0
                )
            ) {
                state.weapons.quillstaff.owned = true;
            }

            if (
                stored.equippedWeapon &&
                state.weapons[stored.equippedWeapon] &&
                state.weapons[stored.equippedWeapon].owned
            ) {
                state.equippedWeapon = stored.equippedWeapon;
            }
        }

        if (!state.weaponNameSeed) {
            state.weaponNameSeed =
                String((stored || {}).weaponNameSeed || '') ||
                'reader-' +
                hash(
                    localStorage.getItem('bookshelf-data') ||
                    Date.now()
                ).toString(36);
        }

        write(EQUIPMENT_KEY, state);
        return state;
    }

    function saveEquipment(state) {
        write(EQUIPMENT_KEY, state);

        window.dispatchEvent(
            new Event('bookshelf-adventure-equipment-changed')
        );
    }

    function lootState() {
        var loot = read(
            LOOT_KEY,
            '{"items":[],"events":[],"relics":{},"equippedItemId":""}'
        );

        loot.relics = loot.relics &&
            typeof loot.relics === 'object' &&
            !Array.isArray(loot.relics)
            ? loot.relics
            : {};

        return loot;
    }

    function relicQuantity(items) {
        return Object.keys(items || {}).reduce(function (total, relicName) {
            return total + Math.max(
                0,
                Math.floor(Number(items[relicName]) || 0)
            );
        }, 0);
    }

    function groupFor(id) {
        var weapon = WEAPONS[id];

        if (!weapon || !weapon.relicGroup) {
            return {
                id: '',
                label: '',
                items: {}
            };
        }

        var loot = lootState();
        var group = loot.relics[weapon.relicGroup];

        return {
            id: weapon.relicGroup,
            label: String(
                (group && group.label) ||
                weapon.relicLabel ||
                weapon.genre + ' Relics'
            ),
            items: group &&
                group.items &&
                typeof group.items === 'object' &&
                !Array.isArray(group.items)
                ? group.items
                : {}
        };
    }

    function relicProgress(id) {
        var weapon = WEAPONS[id];
        var group = groupFor(id);
        var quantity = relicQuantity(group.items);

        return {
            id: group.id,
            label: group.label,
            items: group.items,
            quantity: quantity,
            required: weapon ? weapon.purchaseRelics : 0,
            met: weapon
                ? quantity >= weapon.purchaseRelics
                : false
        };
    }

    function gameState() {
        return read(GAME_KEY, '{"gold":0}');
    }

    function gold() {
        return Math.max(0, Math.floor(Number(gameState().gold) || 0));
    }

    function writeGold(amount) {
        var game = gameState();

        game.gold = Math.max(0, Math.floor(Number(amount) || 0));
        write(GAME_KEY, game);

        window.dispatchEvent(
            new Event('bookshelf-adventure-economy-changed')
        );
    }

    function getWeapon(id) {
        if (id === READERS_ORB.id) {
            return readersOrb();
        }

        var weapon = WEAPONS[id];
        var state = equipmentState();
        var saved = state.weapons[id];

        if (!weapon || !saved) {
            return null;
        }

        var tier = validTier(saved.tier);
        var progress = relicProgress(id);

        return {
            id: weapon.id,
            tier: tier,
            name: generatedName(id, tier),
            baseName: weapon.name,
            image: weapon.image,
            affinity: weapon.affinity,
            genre: weapon.genre,
            relicGroup: weapon.relicGroup,
            relicLabel: weapon.relicLabel,
            role: weapon.role,
            type: weapon.type,
            price: weapon.price,
            purchaseRelics: weapon.purchaseRelics,
            owned: !!saved.owned,
            upgradeable: true,
            powerBonus: weapon.powerBonus[tier],
            staggerChance: weapon.staggerChance[tier],
            collision: weapon.id === 'quillstaff' &&
                tier >= weapon.collisionTier,
            shockwave: weapon.id === 'quillstaff' &&
                tier >= weapon.shockwaveTier,
            slowPercent: weapon.slowPercent
                ? weapon.slowPercent[tier]
                : 0,
            weakenPercent: weapon.weakenPercent
                ? weapon.weakenPercent[tier]
                : 0,
            markCritBonus: weapon.markCritBonus
                ? weapon.markCritBonus[tier]
                : 0,
            returnStrikePercent: weapon.returnStrikePercent
                ? weapon.returnStrikePercent[tier]
                : 0,
            stunChance: weapon.stunChance
                ? weapon.stunChance[tier]
                : 0,
            confuseChance: weapon.confuseChance
                ? weapon.confuseChance[tier]
                : 0,
            pacifyChance: weapon.pacifyChance
                ? weapon.pacifyChance[tier]
                : 0,
            exposePercent: weapon.exposePercent
                ? weapon.exposePercent[tier]
                : 0,
            disruptPercent: weapon.disruptPercent
                ? weapon.disruptPercent[tier]
                : 0,
            effect: weapon.effect,
            relicProgress: progress
        };
    }

    function readersOrb() {
        return {
            id: READERS_ORB.id,
            tier: 0,
            name: READERS_ORB.name,
            baseName: READERS_ORB.name,
            image: READERS_ORB.image,
            affinity: READERS_ORB.affinity,
            genre: READERS_ORB.genre,
            relicGroup: '',
            relicLabel: '',
            role: READERS_ORB.role,
            type: READERS_ORB.type,
            price: 0,
            purchaseRelics: 0,
            owned: true,
            upgradeable: false,
            powerBonus: 0,
            staggerChance: 0,
            collision: false,
            shockwave: false,
            slowPercent: 0,
            weakenPercent: 0,
            markCritBonus: 0,
            returnStrikePercent: 0,
            stunChance: 0,
            confuseChance: 0,
            pacifyChance: 0,
            exposePercent: 0,
            disruptPercent: 0,
            effect: READERS_ORB.effect,
            relicProgress: {
                id: '',
                label: '',
                items: {},
                quantity: 0,
                required: 0,
                met: true
            }
        };
    }

    function getWeapons() {
        return WEAPON_ORDER.map(function (id) {
            return getWeapon(id);
        }).filter(function (weapon) {
            return !!weapon;
        });
    }

    function quillstaff() {
        return getWeapon('quillstaff');
    }

    function isOwned(id) {
        var weapon = getWeapon(id);
        return !!(weapon && weapon.owned);
    }

    function equippedWeapon() {
        var state = equipmentState();

        return getWeapon(state.equippedWeapon) || readersOrb();
    }

    function purchaseStatus(id) {
        var weapon = getWeapon(id);

        if (!weapon) {
            return {
                ok: false,
                purchasable: false,
                reason: 'That weapon is not available.'
            };
        }

        if (weapon.id === READERS_ORB.id) {
            return {
                ok: true,
                purchasable: false,
                owned: true,
                reason: 'Reader’s Orb is your starter weapon.'
            };
        }

        if (weapon.owned) {
            return {
                ok: true,
                purchasable: false,
                owned: true,
                reason: 'Already owned.'
            };
        }

        if (!weapon.relicProgress.met) {
            return {
                ok: false,
                purchasable: false,
                owned: false,
                reason:
                    'Requires ' +
                    weapon.purchaseRelics +
                    ' ' +
                    weapon.relicLabel +
                    '. You have ' +
                    weapon.relicProgress.quantity +
                    '.'
            };
        }

        if (gold() < weapon.price) {
            return {
                ok: false,
                purchasable: false,
                owned: false,
                reason:
                    'Requires ' +
                    weapon.price +
                    ' gold. You have ' +
                    gold() +
                    '.'
            };
        }

        return {
            ok: true,
            purchasable: true,
            owned: false,
            reason: 'Ready to purchase.'
        };
    }

    function purchaseWeapon(id) {
        var status = purchaseStatus(id);
        var weapon = getWeapon(id);

        if (!status.purchasable || !weapon) {
            return {
                ok: false,
                reason: status.reason || 'That weapon cannot be purchased.'
            };
        }

        var state = equipmentState();

        state.weapons[id].owned = true;
        state.weapons[id].tier = 0;

        writeGold(gold() - weapon.price);
        saveEquipment(state);

        return {
            ok: true,
            weapon: getWeapon(id),
            gold: gold()
        };
    }

    function equipWeapon(id) {
        var state = equipmentState();
        var weapon = getWeapon(id);

        if (!weapon) {
            return {
                ok: false,
                reason: 'That weapon is not available.'
            };
        }

        if (!weapon.owned) {
            return {
                ok: false,
                reason: 'Purchase this weapon before equipping it.'
            };
        }

        state.equippedWeapon = id;
        saveEquipment(state);

        return {
            ok: true,
            weapon: equippedWeapon()
        };
    }

    function nextUpgrade(id) {
        var weapon = getWeapon(id);

        if (!weapon || !weapon.upgradeable || !weapon.owned) {
            return null;
        }

        if (weapon.tier >= MAX_TIER) {
            return null;
        }

        return {
            id: weapon.id,
            cost: UPGRADE_COSTS[weapon.tier],
            nextTier: weapon.tier + 1,
            name: generatedName(weapon.id, weapon.tier + 1),
            relicGroup: weapon.relicGroup,
            relicLabel: weapon.relicLabel
        };
    }

    function essenceName(groupId) {
        var labels = {
            fantasy: 'Fantasy Essence',
            horror: 'Horror Essence',
            adventure: 'Adventure Essence',
            historical: 'Historical Essence',
            mystery: 'Mystery Essence',
            'science-fiction': 'Science Fiction Essence'
        };

        return labels[groupId] || 'Genre Essence';
    }

    function getEssence(groupId) {
        var state = equipmentState();

        if (ESSENCE_GROUPS.indexOf(groupId) === -1) {
            return 0;
        }

        return Math.max(
            0,
            Math.floor(Number(state.essence[groupId]) || 0)
        );
    }

    function getAllEssence() {
        var state = equipmentState();
        var result = {};

        ESSENCE_GROUPS.forEach(function (groupId) {
            result[groupId] = Math.max(
                0,
                Math.floor(Number(state.essence[groupId]) || 0)
            );
        });

        return result;
    }

    function refineRelics(groupId, amount) {
        var requested = Math.max(
            0,
            Math.floor(Number(amount) || 0)
        );
        var loot = lootState();
        var group = loot.relics[groupId];
        var items = group && group.items;
        var available = relicQuantity(items);

        if (ESSENCE_GROUPS.indexOf(groupId) === -1) {
            return {
                ok: false,
                reason: 'That relic group cannot be refined.'
            };
        }

        if (!requested) {
            return {
                ok: false,
                reason: 'Choose at least one relic to refine.'
            };
        }

        if (
            !items ||
            typeof items !== 'object' ||
            Array.isArray(items) ||
            available < requested
        ) {
            return {
                ok: false,
                reason:
                    'You have only ' +
                    available +
                    ' ' +
                    essenceName(groupId).replace(' Essence', '') +
                    ' relics available.'
            };
        }

        var remaining = requested;

        Object.keys(items)
            .sort(function (first, second) {
                return first.localeCompare(second);
            })
            .forEach(function (relicName) {
                if (remaining <= 0) {
                    return;
                }

                var quantity = Math.max(
                    0,
                    Math.floor(Number(items[relicName]) || 0)
                );
                var consumed = Math.min(quantity, remaining);

                if (!quantity) {
                    delete items[relicName];
                    return;
                }

                remaining -= consumed;

                if (quantity > consumed) {
                    items[relicName] = quantity - consumed;
                } else {
                    delete items[relicName];
                }
            });

        if (remaining > 0) {
            return {
                ok: false,
                reason: 'Those relics could not be refined.'
            };
        }

        if (!Object.keys(items).length) {
            delete loot.relics[groupId];
        }

        write(LOOT_KEY, loot);

        var state = equipmentState();

        state.essence[groupId] = getEssence(groupId) + requested;
        saveEquipment(state);

        window.dispatchEvent(
            new Event('bookshelf-adventure-relics-changed')
        );

        return {
            ok: true,
            groupId: groupId,
            essenceName: essenceName(groupId),
            refined: requested,
            essence: getEssence(groupId)
        };
    }

    function consumeEssence(groupId, amount) {
        var needed = Math.max(0, Math.floor(Number(amount) || 0));
        var state = equipmentState();
        var available = getEssence(groupId);

        if (ESSENCE_GROUPS.indexOf(groupId) === -1) {
            return false;
        }

        if (needed <= 0) {
            return true;
        }

        if (available < needed) {
            return false;
        }

        state.essence[groupId] = available - needed;
        saveEquipment(state);

        return true;
    }

    function consumeGenreRelics(groupId, cost) {
        var needed = Math.max(0, Math.floor(Number(cost) || 0));
        var loot = lootState();
        var group = loot.relics[groupId];
        var items = group && group.items;

        if (!needed) {
            return true;
        }

        if (
            !items ||
            typeof items !== 'object' ||
            Array.isArray(items) ||
            relicQuantity(items) < needed
        ) {
            return false;
        }

        Object.keys(items)
            .sort(function (first, second) {
                return first.localeCompare(second);
            })
            .forEach(function (relicName) {
                if (needed <= 0) {
                    return;
                }

                var quantity = Math.max(
                    0,
                    Math.floor(Number(items[relicName]) || 0)
                );

                if (!quantity) {
                    delete items[relicName];
                    return;
                }

                var consumed = Math.min(quantity, needed);
                var remaining = quantity - consumed;

                needed -= consumed;

                if (remaining > 0) {
                    items[relicName] = remaining;
                } else {
                    delete items[relicName];
                }
            });

        if (needed > 0) {
            return false;
        }

        if (!Object.keys(items).length) {
            delete loot.relics[groupId];
        }

        write(LOOT_KEY, loot);

        window.dispatchEvent(
            new Event('bookshelf-adventure-relics-changed')
        );

        return true;
    }

    function upgradeWeapon(id) {
        var weapon = getWeapon(id);
        var next = nextUpgrade(id);

        if (!weapon || !weapon.owned) {
            return {
                ok: false,
                reason: 'Purchase this weapon before upgrading it.'
            };
        }

        if (!next) {
            return {
                ok: false,
                reason: weapon.name + ' has reached its final form.'
            };
        }

        var available = getEssence(next.relicGroup);

        if (available < next.cost) {
            return {
                ok: false,
                reason:
                    'You need ' +
                    next.cost +
                    ' ' +
                    essenceName(next.relicGroup) +
                    ', but have only ' +
                    available +
                    '.'
            };
        }

        if (!consumeEssence(next.relicGroup, next.cost)) {
            return {
                ok: false,
                reason: 'That Essence could not be forged.'
            };
        }

        var state = equipmentState();

        state.weapons[id].tier = weapon.tier + 1;
        saveEquipment(state);

        return {
            ok: true,
            weapon: getWeapon(id),
            consumed: next.cost,
            essenceName: essenceName(next.relicGroup),
            remainingEssence: getEssence(next.relicGroup)
        };
    }

    function upgradeQuillstaff() {
        return upgradeWeapon('quillstaff');
    }

    function isFantasyGenre(genre) {
        var value = String(genre || '').toLowerCase();

        return (
            value.indexOf('fantasy') !== -1 ||
            value.indexOf('myth') !== -1 ||
            value.indexOf('fairy') !== -1 ||
            value.indexOf('magic') !== -1 ||
            value.indexOf('adventure') !== -1
        );
    }

    function matchesWeaponGenre(weapon, genre) {
        var value = String(genre || '').toLowerCase();

        if (!weapon || weapon.id === READERS_ORB.id) {
            return true;
        }

        if (weapon.id === 'quillstaff') {
            return isFantasyGenre(value);
        }

        if (weapon.id === 'inkblaster') {
            return value.indexOf('horror') !== -1;
        }

        if (weapon.id === 'bookmark-boomerang') {
            return value.indexOf('adventure') !== -1;
        }

        if (weapon.id === 'letterpress-hammer') {
            return value.indexOf('historical') !== -1 ||
                value.indexOf('history') !== -1;
        }

        if (weapon.id === 'librarians-bell') {
            return value.indexOf('mystery') !== -1 ||
                value.indexOf('detective') !== -1 ||
                value.indexOf('crime') !== -1 ||
                value.indexOf('noir') !== -1;
        }

        if (weapon.id === 'reading-glass') {
            return value.indexOf('science fiction') !== -1 ||
                value.indexOf('science-fiction') !== -1 ||
                value.indexOf('sci-fi') !== -1;
        }

        return false;
    }

    function getCombatModifiers(book) {
        var weapon = equippedWeapon();
        var applies = matchesWeaponGenre(
            weapon,
            book && book.genre
        );

        return {
            weapon: weapon,
            applies: applies,
            powerMultiplier: applies
                ? 1 + weapon.powerBonus / 100
                : 1,
            staggerChance: applies
                ? weapon.staggerChance
                : 0,
            collision: applies && weapon.collision,
            shockwave: applies && weapon.shockwave,
            slowPercent: applies ? weapon.slowPercent : 0,
            weakenPercent: applies ? weapon.weakenPercent : 0,
            markCritBonus: applies ? weapon.markCritBonus : 0,
            returnStrikePercent: applies
                ? weapon.returnStrikePercent
                : 0,
            stunChance: applies ? weapon.stunChance : 0,
            confuseChance: applies ? weapon.confuseChance : 0,
            pacifyChance: applies ? weapon.pacifyChance : 0,
            exposePercent: applies ? weapon.exposePercent : 0,
            disruptPercent: applies ? weapon.disruptPercent : 0
        };
    }

    window.LanternfallsEquipment = {
        getState: equipmentState,
        getWeapon: getWeapon,
        getWeapons: getWeapons,
        getReadersOrb: readersOrb,
        getQuillstaff: quillstaff,
        getEquippedWeapon: equippedWeapon,
        isOwned: isOwned,
        relicProgress: relicProgress,
        purchaseStatus: purchaseStatus,
        purchaseWeapon: purchaseWeapon,
        equipWeapon: equipWeapon,
        nextUpgrade: nextUpgrade,
        upgradeWeapon: upgradeWeapon,
        upgradeQuillstaff: upgradeQuillstaff,
        getEssence: getEssence,
        getAllEssence: getAllEssence,
        essenceName: essenceName,
        refineRelics: refineRelics,
        getCombatModifiers: getCombatModifiers,
        isFantasyGenre: isFantasyGenre,
        weaponOrder: WEAPON_ORDER.slice()
    };
})();