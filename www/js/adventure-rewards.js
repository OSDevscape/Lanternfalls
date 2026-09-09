(function () {
  var GAME_KEY = 'bookshelf-adventure-progression-v1';
  var LEDGER_KEY = 'bookshelf-adventure-ledger-v1';
  var LOG_KEY = 'bookshelf-reading-log-v1';
  var LOOT_KEY = 'bookshelf-adventure-loot-v1';

  function relicInventory() {
    var loot = read(LOOT_KEY, '{"relics":{}}');

    if (!loot || typeof loot !== 'object') {
      loot = {};
    }

    if (!loot.relics || typeof loot.relics !== 'object' || Array.isArray(loot.relics)) {
      loot.relics = {};
    }

    return loot;
  }

  function relicGenre(genre) {
    var value = String(genre || '').toLowerCase();

    if (
      value.indexOf('fantasy') !== -1 ||
      value.indexOf('myth') !== -1 ||
      value.indexOf('fairy') !== -1 ||
      value.indexOf('magic') !== -1 ||
      value.indexOf('adventure') !== -1
    ) {
      return { id: 'fantasy', label: 'Fantasy' };
    }

    if (
      value.indexOf('science') !== -1 ||
      value.indexOf('sci-fi') !== -1 ||
      value.indexOf('science-fiction') !== -1 ||
      value.indexOf('cyberpunk') !== -1 ||
      value.indexOf('dystopian') !== -1 ||
      value.indexOf('post-apocalyptic') !== -1 ||
      value.indexOf('steampunk') !== -1 ||
      value.indexOf('technology') !== -1
    ) {
      return { id: 'science-fiction', label: 'Science Fiction' };
    }

    if (
      value.indexOf('mystery') !== -1 ||
      value.indexOf('crime') !== -1 ||
      value.indexOf('detective') !== -1 ||
      value.indexOf('noir') !== -1 ||
      value.indexOf('true crime') !== -1 ||
      value.indexOf('legal') !== -1 ||
      value.indexOf('investigation') !== -1
    ) {
      return { id: 'mystery', label: 'Mystery' };
    }

    if (
      value.indexOf('horror') !== -1 ||
      value.indexOf('gothic') !== -1 ||
      value.indexOf('paranormal') !== -1 ||
      value.indexOf('occult') !== -1 ||
      value.indexOf('supernatural') !== -1
    ) {
      return { id: 'horror', label: 'Horror' };
    }

    if (
      value.indexOf('romance') !== -1 ||
      value.indexOf('romantic') !== -1 ||
      value.indexOf('new adult') !== -1
    ) {
      return { id: 'romance', label: 'Romance' };
    }

    if (
      value.indexOf('historical') !== -1 ||
      value.indexOf('history') !== -1
    ) {
      return { id: 'historical', label: 'Historical' };
    }

    if (
      value.indexOf('biography') !== -1 ||
      value.indexOf('memoir') !== -1 ||
      value.indexOf('autobiography') !== -1
    ) {
      return { id: 'biography', label: 'Biography' };
    }

    if (
      value.indexOf('nonfiction') !== -1 ||
      value.indexOf('non-fiction') !== -1
    ) {
      return { id: 'nonfiction', label: 'Nonfiction' };
    }

    if (
      value.indexOf('thriller') !== -1 ||
      value.indexOf('suspense') !== -1
    ) {
      return { id: 'thriller', label: 'Thriller' };
    }

    return { id: 'reading-realm', label: 'Reading Realm' };
  }

  function addRelic(genre, relicName) {
    var name = String(relicName || '').trim();

    if (!name || name === 'None') {
      return;
    }

    var theme = relicGenre(genre);
    var loot = relicInventory();

    /*
      Move existing flat stacks into a Legacy group exactly once.
      Example:
        { Map: 5, Tome: 1 }
  
      becomes:
        {
          legacy: {
            label: 'Legacy Relics',
            items: {
              Map: 5,
              Tome: 1
            }
          }
        }
    */
    Object.keys(loot.relics).forEach(function (key) {
      var value = loot.relics[key];

      if (typeof value === 'number') {
        if (!loot.relics.legacy) {
          loot.relics.legacy = {
            label: 'Legacy Relics',
            items: {}
          };
        }

        loot.relics.legacy.items[key] = Math.max(
          0,
          Math.floor(Number(loot.relics.legacy.items[key]) || 0)
        ) + Math.max(0, Math.floor(Number(value) || 0));

        delete loot.relics[key];
      }
    });

    if (
      !loot.relics[theme.id] ||
      typeof loot.relics[theme.id] !== 'object' ||
      Array.isArray(loot.relics[theme.id])
    ) {
      loot.relics[theme.id] = {
        label: theme.label,
        items: {}
      };
    }

    loot.relics[theme.id].label = theme.label;
    loot.relics[theme.id].items = loot.relics[theme.id].items || {};

    loot.relics[theme.id].items[name] = Math.max(
      0,
      Math.floor(Number(loot.relics[theme.id].items[name]) || 0)
    ) + 1;

    write(LOOT_KEY, loot);
  }

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch (_) { return JSON.parse(fallback); }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function books() {
    return read('bookshelf-data', '{"books":[]}').books || [];
  }

  function equippedArtifact() {
    var loot = read(
      LOOT_KEY,
      '{"items":[],"equippedItemId":""}'
    );

    var equippedId = String((loot || {}).equippedItemId || '');
    var items = Array.isArray((loot || {}).items) ? loot.items : [];

    if (!equippedId) {
      return null;
    }

    return items.filter(function (item) {
      return item &&
        String(item.instanceId || item.id || '') === equippedId;
    })[0] || null;
  }

  function artifactCritBonus() {
    var item = equippedArtifact();

    return item && item.name === 'Chronicle Compass'
      ? 5
      : 0;
  }

  function theme(book) {
    var genre = String(book.genre || '').toLowerCase();

    // ============================================================
    // FANTASY REALM
    // High Fantasy / Dark Fantasy / Urban Fantasy / Mythology /
    // Fairy Tale / Adventure / Magic
    // ============================================================

    if (
      genre.indexOf('fantasy') !== -1 ||
      genre.indexOf('myth') !== -1 ||
      genre.indexOf('fairy') !== -1 ||
      genre.indexOf('magic') !== -1 ||
      genre.indexOf('adventure') !== -1
    ) {
      return {
        regions: [
          'The Dragonlands',
          'The Moonlit Marches',
          'The Ashen Wilds',
          'The Crystal Kingdom',
          'The Thornwood Expanse',
          'The Emerald Highlands',
          'The Forgotten Vale',
          'The Sunken Ruins',
          'The Silverwood',
          'The Obsidian Coast',
          'The Realm of Fallen Kings',
          'The Whispering Mountains',
          'The Golden Frontier',
          'The Enchanted Isles',
          'The Ancient Wilds'
        ],

        titles: [
          'The Runebound',
          'The Ember King',
          'The Thorn Queen',
          'The Moonforged',
          'The Oathbreaker',
          'The Starwarden',
          'The Dragon Seeker',
          'The Last Spellblade',
          'The Crownless King',
          'The Keeper of Secrets',
          'The Ruinwalker',
          'The Shadow Prince',
          'The Last Enchanter',
          'The Wyrmcaller',
          'The Forgotten Hero',
          'The Relic Hunter',
          'The Witch of Winter',
          'The Guardian of Ages',
          'The King Beneath the Mountain',
          'The Child of Prophecy',
          'The Stormcaller',
          'The Flamekeeper',
          'The Night Wanderer',
          'The Silver Knight',
          'The Bone King',
          'The Mage of Thorns',
          'The Hollow Prince',
          'The Forest Guardian',
          'The Last Paladin',
          'The Witch Queen',
          'The Blood Prince',
          'The Keeper of the Flame',
          'The Lord of Shadows',
          'The Seeker of Stars',
          'The Golden Knight',
          'The Beastmaster',
          'The Fallen King',
          'The Crystal Seer',
          'The Dragonlord',
          'The Wandering Wizard',
          'The Black Sorcerer',
          'The Emerald Queen',
          'The Iron Druid',
          'The Last Warden',
          'The Cursed Heir',
          'The Moon Queen',
          'The Ashen Lord',
          'The Rune Keeper',
          'The Sword Saint',
          'The Phoenix Knight',
          'The Tower Mage',
          'The Goblin King',
          'The Ancient One',
          'The Storm King',
          'The Thorned Prince',
          'The Keeper of Dragons',
          'The Lost Sorceress',
          'The Shadow Warden',
          'The Eternal King',
          'The Last Dragon'
        ],

        adjectives: [
          'Emberbound',
          'Runebound',
          'Thorncrowned',
          'Moonforged',
          'Ashen',
          'Stormwrought',
          'Gilded',
          'Elder',
          'Frostveiled',
          'Dragonforged',
          'Shadowborn',
          'Starfallen',
          'Bloodmarked',
          'Spellbound',
          'Ironcrowned',
          'Dreadborn',
          'Sunforged',
          'Wildborn',
          'Gravebound',
          'Everlasting',
          'Flameborn',
          'Frostborn',
          'Moonbound',
          'Stormborn',
          'Starforged',
          'Dawnforged',
          'Nightcrowned',
          'Rune-marked',
          'Dragonblooded',
          'Shadowforged',
          'Soulbound',
          'Spellforged',
          'Cursed',
          'Blessed',
          'Ancient',
          'Forgotten',
          'Enchanted',
          'Mythic',
          'Arcane',
          'Ethereal',
          'Celestial',
          'Infernal',
          'Emerald',
          'Obsidian',
          'Crimson',
          'Sapphire',
          'Ivory',
          'Golden',
          'Silver',
          'Violet',
          'Bloodbound',
          'Doomed',
          'Fatebound',
          'Oathbound',
          'Kingsworn',
          'Witchmarked',
          'Feytouched',
          'Titanforged',
          'Voidtouched',
          'Phoenixborn'
        ],

        forms: [
          'Wyrm',
          'Warden',
          'Revenant',
          'Chimera',
          'Gryphon',
          'Warlock',
          'Colossus',
          'Knight',
          'Beast',
          'Dragon',
          'Sorcerer',
          'Paladin',
          'Druid',
          'Witch',
          'Giant',
          'Titan',
          'Demon',
          'Fey',
          'Guardian',
          'Berserker',
          'Necromancer',
          'Barbarian',
          'Ranger',
          'Wizard',
          'Assassin',
          'Valkyrie',
          'Templar',
          'Monk',
          'Shaman',
          'Oracle',
          'Djinn',
          'Elemental',
          'Golem',
          'Hydra',
          'Basilisk',
          'Manticore',
          'Minotaur',
          'Centaur',
          'Harpy',
          'Kraken',
          'Leviathan',
          'Griffin',
          'Dryad',
          'Nymph',
          'Doppelganger',
          'Specter',
          'Wraith',
          'Lich',
          'Goblin',
          'Orc',
          'Troll',
          'Ogre',
          'Dwarf',
          'Elf',
          'Dreadknight',
          'Spellblade',
          'Runemaster',
          'Dragonrider',
          'Beastlord',
          'Stormcaller'
        ],

        relics: [
          'Crown',
          'Blade',
          'Scepter',
          'Grimoire',
          'Lantern',
          'Gate',
          'Throne',
          'Orb',
          'Amulet',
          'Rune',
          'Relic',
          'Talisman',
          'Chalice',
          'Horn',
          'Crystal',
          'Idol',
          'Compass',
          'Map',
          'Key',
          'Stone',
          'Ring',
          'Medallion',
          'Staff',
          'Shield',
          'Helm',
          'Gauntlet',
          'Cloak',
          'Dagger',
          'Sword',
          'Axe',
          'Hammer',
          'Spear',
          'Tome',
          'Scroll',
          'Casket',
          'Crownstone',
          'Dragonbone',
          'Phoenix Feather',
          'Witchstone',
          'Soul Gem',
          'Bloodstone',
          'Moonstone',
          'Sunstone',
          'Starshard',
          'Runestone',
          'Frost Crystal',
          'Ember Crystal',
          'Dragon Egg',
          'Ancient Coin',
          'Royal Seal',
          'Magic Mirror',
          'Enchanted Rose',
          'Golden Apple',
          'Sacred Bell',
          'Prophecy',
          'Oath',
          'Holy Grail',
          'Black Book',
          'Fate Stone',
          'Worldstone'
        ]
      };
    }

    // ============================================================
    // SCIENCE FICTION REALM
    // Space Opera / Cyberpunk / Dystopian / Post-Apocalyptic /
    // Hard Sci-Fi / Steampunk / Technology
    // ============================================================

    if (
      genre.indexOf('science fiction') !== -1 ||
      genre.indexOf('sci-fi') !== -1 ||
      genre.indexOf('science-fiction') !== -1 ||
      genre.indexOf('cyberpunk') !== -1 ||
      genre.indexOf('dystopian') !== -1 ||
      genre.indexOf('post-apocalyptic') !== -1 ||
      genre.indexOf('steampunk') !== -1 ||
      genre.indexOf('technology') !== -1
    ) {
      return {
        regions: [
          'The Astral Frontier',
          'The Nebula Reach',
          'The Silent Orbit',
          'The Crimson Expanse',
          'The Quantum Verge',
          'The Neon Districts',
          'The Machine Wastes',
          'The Outer Colonies',
          'The Dead Worlds',
          'The Synthetic Frontier',
          'The Iron Megacity',
          'The Forgotten Stations',
          'The Solar Dominion',
          'The Void Territories',
          'The Last Colony'
        ],

        titles: [
          'The Void Marshal',
          'The Starbreaker',
          'The Last Navigator',
          'The Signal Warden',
          'The Iron Horizon',
          'The Last Human',
          'The Neon Prophet',
          'The Machine King',
          'The Colony of Ash',
          'The Quantum Heir',
          'The Final Protocol',
          'The Starship Warden',
          'The Artificial Mind',
          'The Last Transmission',
          'The Voidborn',
          'The Chrome Rebellion',
          'The Terraformer',
          'The Exiled Android',
          'The Last Astronaut',
          'The Architect of Worlds',
          'The Galactic Nomad',
          'The Silent Planet',
          'The Cybernetic Prince',
          'The Neon Hunter',
          'The Quantum Soldier',
          'The Last Replicant',
          'The Starborn',
          'The Machine Prophet',
          'The Lunar Colony',
          'The Cosmic Wanderer',
          'The Digital Ghost',
          'The Planetbreaker',
          'The Void Walker',
          'The Synthetic Mind',
          'The Last Engineer',
          'The Solar Captain',
          'The Black Star',
          'The Orbital Knight',
          'The Deep Space Hunter',
          'The Time Traveler',
          'The Gravity Thief',
          'The Alien Prince',
          'The Singularity',
          'The Last Civilization',
          'The Mars Warden',
          'The Galactic Emperor',
          'The Space Pirate',
          'The Cybernetic Ghost',
          'The Star Architect'
        ],

        adjectives: [
          'Starforged',
          'Voidglass',
          'Astral',
          'Quantum',
          'Neon',
          'Solar',
          'Chrome',
          'Darkmatter',
          'Synthetic',
          'Cybernetic',
          'Titanium',
          'Stellar',
          'Zero-G',
          'Plasma',
          'Atomic',
          'Machineborn',
          'Orbital',
          'Digital',
          'Exoplanetary',
          'Posthuman',
          'Hyperion',
          'Galactic',
          'Cosmic',
          'Lunar',
          'Martian',
          'Interstellar',
          'Subatomic',
          'Nanotech',
          'Holographic',
          'Artificial',
          'Quantumforged',
          'Voidborn',
          'Starborn',
          'Cyberforged',
          'Neural',
          'Bioengineered',
          'Terraforming',
          'Solarbound',
          'Stellarborn',
          'Hypercharged',
          'Gravitational',
          'Temporal',
          'Dimensional',
          'Antimatter',
          'Darkstar',
          'Neonforged',
          'Chromeclad',
          'Singular',
          'Mechanical',
          'Radiant',
          'Frozen',
          'Zeroed',
          'Encrypted',
          'Encoded',
          'Transhuman',
          'Extragalactic',
          'Starbound',
          'Voidforged'
        ],

        forms: [
          'Sentinel',
          'Navigator',
          'Colossus',
          'Drone',
          'Oracle',
          'Leviathan',
          'Android',
          'Harbinger',
          'Cyborg',
          'Replicant',
          'Pilot',
          'Commander',
          'Engineer',
          'AI',
          'Construct',
          'Automaton',
          'Mutant',
          'Overseer',
          'Explorer',
          'Terraformer',
          'Astronaut',
          'Scientist',
          'Technician',
          'Mercenary',
          'Bounty Hunter',
          'Space Pirate',
          'Admiral',
          'Captain',
          'Soldier',
          'Assassin',
          'Operative',
          'Synthetic',
          'Nanobot',
          'Mech',
          'War Machine',
          'Starship',
          'Alien',
          'Hive Mind',
          'Clone',
          'Quantum Entity',
          'Void Entity',
          'Timewalker',
          'Dimensional',
          'Planet Eater',
          'Starborn',
          'Cybernetic',
          'AI Overlord',
          'Battle Drone',
          'Sentient Machine'
        ],

        relics: [
          'Beacon',
          'Engine',
          'Protocol',
          'Core',
          'Relay',
          'Archive',
          'Gate',
          'Signal',
          'Module',
          'Chip',
          'Drive',
          'Satellite',
          'Circuit',
          'Data',
          'Artifact',
          'Capsule',
          'Scanner',
          'Transmitter',
          'Generator',
          'Blueprint',
          'Reactor',
          'Power Cell',
          'Neural Chip',
          'Quantum Core',
          'Star Map',
          'Navigation Core',
          'Warp Drive',
          'Cryopod',
          'Hologram',
          'AI Core',
          'Memory Bank',
          'Access Key',
          'Control Panel',
          'Energy Cell',
          'Plasma Coil',
          'Gravity Engine',
          'Timepiece',
          'Alien Artifact',
          'Black Box',
          'Data Crystal',
          'Signal Tower',
          'Orbital Key',
          'Terraformer',
          'Life Support',
          'Fusion Core',
          'Antimatter Cell',
          'Portal',
          'Stasis Pod',
          'Star Chart',
          'Cyberdeck'
        ]
      };
    }

    // ============================================================
    // MYSTERY REALM
    // Crime / Detective / Noir / True Crime / Historical Mystery /
    // Legal / Investigation
    // ============================================================

    if (
      genre.indexOf('mystery') !== -1 ||
      genre.indexOf('crime') !== -1 ||
      genre.indexOf('detective') !== -1 ||
      genre.indexOf('noir') !== -1 ||
      genre.indexOf('true crime') !== -1 ||
      genre.indexOf('legal') !== -1 ||
      genre.indexOf('investigation') !== -1
    ) {
      return {
        regions: [
          'The Shadow District',
          'The Gaslamp Quarter',
          'The Rainy Borough',
          'The Midnight Precinct',
          'The Blackwater Docks',
          'The Forgotten Alley',
          'The Crimson District',
          'The Old Quarter',
          'The Fogbound City',
          'The Silent Borough',
          'The Crooked Streets',
          'The Golden Mile',
          'The Underworld',
          'The Locked District',
          'The Midnight Court'
        ],

        titles: [
          'The Last Witness',
          'The Silent Detective',
          'The Midnight Informant',
          'The Unseen Suspect',
          'The Final Alibi',
          'The Missing Hour',
          'The Locked Room',
          'The Vanishing Man',
          'The Shadow Witness',
          'The Forgotten Case',
          'The Last Confession',
          'The Red Ledger',
          'The Midnight Murder',
          'The Nameless Victim',
          'The Hidden Truth',
          'The Crooked Detective',
          'The Final Evidence',
          'The Secret in Room Seven',
          'The Phantom Suspect',
          'The Case Without a Name',
          'The Disappearing Witness',
          'The House of Secrets',
          'The Murder at Midnight',
          'The Silent Alibi',
          'The Unopened Letter',
          'The Missing Heir',
          'The Stranger in the Fog',
          'The Last Phone Call',
          'The Secret Witness',
          'The Empty Grave',
          'The Vanished Fortune',
          'The Forgotten Murder',
          'The Detective’s Secret',
          'The Final Clue',
          'The House on Black Street',
          'The Unsolved Case',
          'The Man in Room Nine',
          'The Woman at the Window',
          'The Crimson Evidence',
          'The Death of a Stranger',
          'The Locked Door',
          'The Secret Society',
          'The Midnight Caller',
          'The Last Suspect',
          'The Hidden Room',
          'The Blackmail File',
          'The Missing Photograph',
          'The Unseen Killer',
          'The Final Statement'
        ],

        adjectives: [
          'Candleveil',
          'Whispering',
          'Masked',
          'Smokebound',
          'Shadowed',
          'Blackglass',
          'Hidden',
          'Crooked',
          'Fogbound',
          'Bloodmarked',
          'Silent',
          'Unseen',
          'Secret',
          'Midnight',
          'Forbidden',
          'Obscured',
          'Forgotten',
          'Veiled',
          'Suspicious',
          'Sinister',
          'Mysterious',
          'Concealed',
          'Unsolved',
          'Encrypted',
          'Cryptic',
          'Shadowy',
          'Deceptive',
          'Secretive',
          'Unknown',
          'Untraceable',
          'Unspoken',
          'Invisible',
          'Elusive',
          'Dubious',
          'Questionable',
          'Complicated',
          'Twisted',
          'Devious',
          'Covert',
          'Clandestine',
          'Obscure',
          'Unidentified',
          'Missing',
          'Vanished',
          'Unexplained',
          'Uncertain'
        ],

        forms: [
          'Pursuer',
          'Witness',
          'Sleuth',
          'Informer',
          'Phantom',
          'Rook',
          'Inspector',
          'Cipher',
          'Detective',
          'Suspect',
          'Forensicist',
          'Informant',
          'Conspirator',
          'Assassin',
          'Thief',
          'Judge',
          'Lawyer',
          'Criminal',
          'Mastermind',
          'Investigator',
          'Murderer',
          'Blackmailer',
          'Smuggler',
          'Spy',
          'Con Artist',
          'Burglar',
          'Forger',
          'Hacker',
          'Interrogator',
          'Profiler',
          'Agent',
          'Coroner',
          'Reporter',
          'Journalist',
          'Fixer',
          'Undercover Agent'
        ],

        relics: [
          'Clue',
          'Alibi',
          'Casefile',
          'Key',
          'Ledger',
          'Mirror',
          'Door',
          'Lock',
          'Fingerprint',
          'Photograph',
          'Letter',
          'Evidence',
          'Dossier',
          'Cipher',
          'Journal',
          'Badge',
          'Witness',
          'Statement',
          'Confession',
          'Red String',
          'Bloodstain',
          'Newspaper',
          'Diary',
          'Blackmail',
          'Contract',
          'Passport',
          'Phone',
          'Recording',
          'Camera',
          'Watch',
          'Ring',
          'Receipt',
          'Map',
          'Safe',
          'Combination',
          'Will',
          'Deed',
          'Manuscript',
          'Envelope',
          'Security Tape',
          'Case Number',
          'Evidence Bag',
          'Photocopy',
          'Newspaper Clipping'
        ]
      };
    }

    // ============================================================
    // HORROR REALM
    // Supernatural / Gothic / Paranormal / Psychological Horror /
    // Occult / Dark Fantasy
    // ============================================================

    if (
      genre.indexOf('horror') !== -1 ||
      genre.indexOf('gothic') !== -1 ||
      genre.indexOf('paranormal') !== -1 ||
      genre.indexOf('occult') !== -1 ||
      genre.indexOf('supernatural') !== -1
    ) {
      return {
        regions: [
          'The Dreadwood',
          'The Hollow Deep',
          'The Witching Moor',
          'The Bone Orchard',
          'The Black Chapel',
          'The Forsaken Village',
          'The House of Whispers',
          'The Gravefields',
          'The Blood Marsh',
          'The Forgotten Asylum',
          'The Deadlands',
          'The Black Forest',
          'The Hollow City',
          'The Cursed Coast',
          'The Realm Below'
        ],

        titles: [
          'The Pale Guest',
          'The Last Thing Below',
          'The Unquiet One',
          'The Hollow King',
          'The Nameless Hunger',
          'The House at Midnight',
          'The Thing in the Woods',
          'The Last Door',
          'The Woman in Black',
          'The Whisper Beneath',
          'The Hollow Child',
          'The Dead Visitor',
          'The Man Who Was Not There',
          'The Forgotten God',
          'The House That Watches',
          'The Last Exorcist',
          'The Devouring Dark',
          'The Empty Room',
          'The Face in the Mirror',
          'The Thing Without a Name',
          'The House of Bones',
          'The Blackened Chapel',
          'The Children of the Grave',
          'The Last Nightmare',
          'The Whispering House',
          'The Shadow in the Attic',
          'The Thing at the Window',
          'The Dead Below',
          'The Forgotten Cemetery',
          'The Black Door',
          'The Woman Beneath',
          'The House of Screams',
          'The Hollow Man',
          'The Last Ritual',
          'The Devil in the Woods',
          'The Bone Collector',
          'The Crawling Dark',
          'The Blood Moon',
          'The Empty Coffin',
          'The Unholy Child',
          'The House of Shadows',
          'The Thing in the Basement',
          'The Last Prayer',
          'The Dead Room',
          'The Whispering Grave',
          'The Pale Man',
          'The Curse of Black Hollow',
          'The Last Bell',
          'The Face Beyond the Glass'
        ],

        adjectives: [
          'Pale',
          'Whispering',
          'Gravebound',
          'Bonewhite',
          'Rotting',
          'Bloodless',
          'Hollow',
          'Dread',
          'Forsaken',
          'Unquiet',
          'Haunted',
          'Cursed',
          'Nameless',
          'Dead',
          'Sunless',
          'Bleeding',
          'Spectral',
          'Wretched',
          'Forgotten',
          'Unholy',
          'Macabre',
          'Sinister',
          'Grisly',
          'Morbid',
          'Nightmarish',
          'Demonic',
          'Possessed',
          'Twisted',
          'Decrepit',
          'Putrid',
          'Faceless',
          'Lifeless',
          'Ghastly',
          'Coffinbound',
          'Soulbound',
          'Bloodmarked',
          'Skinless',
          'Eyeless',
          'Tongueless',
          'Maddened',
          'Feral',
          'Ancient',
          'Buried',
          'Unburied',
          'Crawling',
          'Screaming',
          'Bleak',
          'Desolate',
          'Unnatural'
        ],

        forms: [
          'Stalker',
          'Hollow',
          'Nightmare',
          'Wraith',
          'Devourer',
          'Bride',
          'Specter',
          'Thing',
          'Demon',
          'Ghoul',
          'Revenant',
          'Vampire',
          'Werewolf',
          'Cultist',
          'Witch',
          'Poltergeist',
          'Abomination',
          'Parasite',
          'Watcher',
          'Butcher',
          'Skinwalker',
          'Banshee',
          'Possessed',
          'Executioner',
          'Mimic',
          'Crawler',
          'Shadow',
          'Wendigo',
          'Mummy',
          'Lich',
          'Deadwalker',
          'Flesh Eater',
          'Bone Walker',
          'Gravedigger',
          'Pale Man',
          'Faceless One',
          'Dream Eater',
          'Soul Eater',
          'Night Terror',
          'Blood Witch',
          'Dread Beast',
          'Crypt Keeper',
          'Carrion King',
          'Hollow Child',
          'Graveborn',
          'The Watcher',
          'The Unseen'
        ],

        relics: [
          'Coffin',
          'Bell',
          'Mirror',
          'Door',
          'Mask',
          'Knife',
          'Cradle',
          'Portrait',
          'Skull',
          'Lantern',
          'Grimoire',
          'Idol',
          'Bone',
          'Key',
          'Noose',
          'Doll',
          'Candle',
          'Tombstone',
          'Ritual',
          'Eye',
          'Blood Vial',
          'Black Book',
          'Ouija Board',
          'Funeral Bell',
          'Grave Key',
          'Dead Man’s Ring',
          'Cursed Coin',
          'Bone Charm',
          'Black Candle',
          'Burial Mask',
          'Witch Bottle',
          'Skinned Hide',
          'Haunted Photograph',
          'Death Certificate',
          'Grave Dirt',
          'Human Tooth',
          'Ritual Knife',
          'Cursed Doll',
          'Bloodied Ribbon',
          'Forbidden Tome'
        ]
      };
    }

    // ============================================================
    // ROMANCE REALM
    // Contemporary / Historical Romance / Romantic Comedy /
    // Paranormal Romance / New Adult / Young Adult
    // ============================================================

    if (
      genre.indexOf('romance') !== -1 ||
      genre.indexOf('romantic') !== -1 ||
      genre.indexOf('new adult') !== -1 ||
      genre.indexOf('contemporary romance') !== -1
    ) {
      return {
        regions: [
          'The Heartlands',
          'The Rose Court',
          'The Golden Promenade',
          'The Moonlit Ballroom',
          'The Sapphire Coast',
          'The Velvet Quarter',
          'The Summer Isles',
          'The Crimson Garden',
          'The Starlight District',
          'The Lavender Hills',
          'The Silver Lake',
          'The Wedding Coast',
          'The Whispering Gardens',
          'The Lovers Road',
          'The Eternal Spring'
        ],

        titles: [
          'The Velvet Rival',
          'The Rosebound Heart',
          'The Midnight Suitor',
          'The Last Promise',
          'The Golden Stranger',
          'The Accidental Love',
          'The Forbidden Heart',
          'The Summer Promise',
          'The Reluctant Lover',
          'The Duke of Midnight',
          'The Last First Kiss',
          'The Unlikely Pair',
          'The Love Letter',
          'The Secret Admirer',
          'The Heartbreaker',
          'The Second Chance',
          'The Accidental Duchess',
          'The Rival Hearts',
          'The One Who Stayed',
          'The Forever Promise',
          'The Winter Kiss',
          'The Summer Bride',
          'The Charming Stranger',
          'The Reluctant Prince',
          'The Stolen Heart',
          'The Secret Valentine',
          'The Midnight Kiss',
          'The Unexpected Suitor',
          'The Billionaire’s Secret',
          'The Wedding Pact',
          'The Fake Relationship',
          'The Childhood Sweetheart',
          'The Forbidden Prince',
          'The Last Dance',
          'The Perfect Match',
          'The Accidental Fiancé',
          'The Rival Prince',
          'The Heart of Winter',
          'The Love of My Life',
          'The Second Proposal',
          'The Wedding Guest',
          'The Secret Engagement',
          'The Summer Lover',
          'The Broken Vow',
          'The Last Valentine',
          'The Prince Next Door',
          'The Stranger at the Ball',
          'The Heart’s Desire',
          'The Eternal Lovers'
        ],

        adjectives: [
          'Roseglass',
          'Velvet',
          'Gilded',
          'Sapphire',
          'Silken',
          'Moonlit',
          'Crimson',
          'Lovelorn',
          'Starcrossed',
          'Tender',
          'Golden',
          'Forbidden',
          'Passionate',
          'Endless',
          'Secret',
          'Blushing',
          'Whispered',
          'Devoted',
          'Fateful',
          'Eternal',
          'Romantic',
          'Enchanted',
          'Dreaming',
          'Beloved',
          'Sweet',
          'Desirable',
          'Charming',
          'Elegant',
          'Radiant',
          'Faithful',
          'Yearning',
          'Longing',
          'Timeless',
          'Heartbound',
          'Lovebound',
          'Soulbound',
          'Starbound',
          'Fated',
          'Destined',
          'Tenderhearted',
          'Adoring',
          'Smitten',
          'Enamored',
          'Cherished',
          'Precious',
          'Irresistible',
          'Unforgettable'
        ],

        forms: [
          'Guardian',
          'Duelist',
          'Envoy',
          'Prince',
          'Duchess',
          'Rival',
          'Knight',
          'Phantom',
          'Suitor',
          'Lover',
          'Heartbreaker',
          'Countess',
          'Duke',
          'Heiress',
          'Outlaw',
          'Champion',
          'Matchmaker',
          'Admirer',
          'Royal',
          'Dreamer',
          'Fiancé',
          'Fiancée',
          'Prince Charming',
          'Princess',
          'Count',
          'Baron',
          'Baroness',
          'King',
          'Queen',
          'Noble',
          'Bodyguard',
          'Stranger',
          'Sweetheart',
          'Soulmate',
          'Dancer',
          'Musician',
          'Artist',
          'Poet',
          'Hero',
          'Heroine',
          'Heartthrob',
          'Socialite',
          'Adventurer',
          'Wanderer'
        ],

        relics: [
          'Rose',
          'Letter',
          'Promise',
          'Locket',
          'Crown',
          'Dance',
          'Kiss',
          'Ring',
          'Ribbon',
          'Portrait',
          'Love Letter',
          'Key',
          'Bouquet',
          'Pendant',
          'Vow',
          'Invitation',
          'Perfume',
          'Keepsake',
          'Heart',
          'Photograph',
          'Valentine',
          'Love Note',
          'Wedding Ring',
          'Engagement Ring',
          'Wedding Dress',
          'Tiara',
          'Music Box',
          'Love Token',
          'Handkerchief',
          'Champagne',
          'Diary',
          'Memory',
          'Promise Ring',
          'Family Heirloom',
          'Love Charm',
          'Rose Petal',
          'Perfume Bottle',
          'Dance Card',
          'Wedding Vow',
          'Cupid’s Arrow',
          'Heart Locket',
          'Golden Rose',
          'Love Potion'
        ]
      };
    }

    // ============================================================
    // THRILLER REALM
    // Psychological / Espionage / Military / Political /
    // Survival / Action / Adventure
    // ============================================================

    if (
      genre.indexOf('thriller') !== -1 ||
      genre.indexOf('psychological thriller') !== -1 ||
      genre.indexOf('espionage') !== -1 ||
      genre.indexOf('spy') !== -1 ||
      genre.indexOf('military') !== -1 ||
      genre.indexOf('political') !== -1 ||
      genre.indexOf('survival') !== -1 ||
      genre.indexOf('action') !== -1
    ) {
      return {
        regions: [
          'The Dead City',
          'The Midnight Run',
          'The Redline Corridor',
          'The Empty Terminal',
          'The Iron Border',
          'The Black Site',
          'The Warfront',
          'The Frozen Frontier',
          'The Burning Capital',
          'The Underground',
          'The Exclusion Zone',
          'The Last Checkpoint',
          'The Storm Coast',
          'The Shadow Government',
          'The Final Stronghold'
        ],

        titles: [
          'The Last Operative',
          'The Running Man',
          'The Silent Target',
          'The Final Pursuit',
          'The Black Directive',
          'The Last Agent',
          'The Enemy Within',
          'The Hidden Threat',
          'The Final Mission',
          'The Manhunt',
          'The Last Extraction',
          'The Sleeper Agent',
          'The Burning Code',
          'The Impossible Escape',
          'The Last Survivor',
          'The Enemy at Dawn',
          'The Final Countdown',
          'The Shadow Network',
          'The Vanishing Target',
          'The Last Defense',
          'The Silent Assassin',
          'The Final Operation',
          'The Deadly Secret',
          'The Last Hostage',
          'The Enemy Behind the Door',
          'The Midnight Agent',
          'The Last Safe House',
          'The Hidden Enemy',
          'The Final Warning',
          'The Extraction',
          'The Rogue Agent',
          'The Last Stand',
          'The Hostage',
          'The Chase',
          'The Shadow Operative',
          'The Final Target',
          'The Broken Mission',
          'The Last Bullet',
          'The Secret Weapon',
          'The Man on the Run',
          'The Impossible Mission',
          'The Final Hour',
          'The Silent War',
          'The Last Informant',
          'The Dead Drop',
          'The Final Escape',
          'The Last Resistance'
        ],

        adjectives: [
          'Nightwire',
          'Steelshadow',
          'Ashen',
          'Redline',
          'Coldsteel',
          'Blackout',
          'Razor',
          'Silent',
          'Deadly',
          'Classified',
          'Covert',
          'Burning',
          'Hostile',
          'Relentless',
          'Broken',
          'Exposed',
          'Targeted',
          'Desperate',
          'Invisible',
          'Untraceable',
          'Dangerous',
          'Ruthless',
          'Vicious',
          'Armed',
          'Wanted',
          'Hunted',
          'Cornered',
          'Escaped',
          'Compromised',
          'Encrypted',
          'Hidden',
          'Secret',
          'Deadlock',
          'Blacklisted',
          'Redacted',
          'Unauthorized',
          'Explosive',
          'Tactical',
          'Strategic',
          'Combat-ready',
          'Unstoppable',
          'Destructive',
          'Fatal',
          'Final',
          'Critical',
          'Immediate'
        ],

        forms: [
          'Hunter',
          'Operative',
          'Phantom',
          'Tracker',
          'Sniper',
          'Courier',
          'Saboteur',
          'Fugitive',
          'Agent',
          'Assassin',
          'Mercenary',
          'Commander',
          'Spy',
          'Survivor',
          'Enforcer',
          'Interrogator',
          'Infiltrator',
          'Soldier',
          'Conspirator',
          'Warlord',
          'Bodyguard',
          'Hitman',
          'Pilot',
          'Commando',
          'Specialist',
          'Detective',
          'Rebel',
          'Hostage',
          'Traitor',
          'Double Agent',
          'Fixer',
          'Handler',
          'Bounty Hunter',
          'Smuggler',
          'Field Agent',
          'Special Agent',
          'General',
          'Warrior',
          'Escapee',
          'Target'
        ],

        relics: [
          'Directive',
          'Target',
          'Signal',
          'Cipher',
          'Trigger',
          'File',
          'Weapon',
          'Escape',
          'Passport',
          'Dossier',
          'Badge',
          'Bullet',
          'Radio',
          'Code',
          'Briefcase',
          'Map',
          'Keycard',
          'Manifest',
          'Evidence',
          'Dead Drop',
          'Phone',
          'Tracker',
          'Transmitter',
          'Microfilm',
          'Safe',
          'Access Card',
          'Blueprint',
          'Mission File',
          'Black Box',
          'Hard Drive',
          'Flash Drive',
          'Satellite Phone',
          'Encrypted File',
          'Secret Code',
          'Weapon Case',
          'Escape Route',
          'Safehouse Key',
          'Target File',
          'Intel',
          'Photograph',
          'Recording',
          'Wiretap',
          'Listening Device',
          'Emergency Beacon',
          'Extraction Point',
          'Classified File',
          'Evidence Bag',
          'Burner Phone'
        ]
      };
    }

    // ============================================================
    // DEFAULT / UNCLASSIFIED
    // ============================================================

    return {
      regions: [
        'The Reading Realm',
        'The Grand Library',
        'The Lantern Stacks',
        'The Endless Archive',
        'The Quiet Halls',
        'The Forgotten Shelves',
        'The Golden Athenaeum',
        'The Whispering Library',
        'The Bookbound Isles',
        'The Infinite Archive'
      ],

      titles: [
        'The Last Librarian',
        'The Inkbound Stranger',
        'The Keeper of Pages',
        'The Silent Reader',
        'The Lost Bookmark',
        'The Forgotten Book',
        'The Keeper of Stories',
        'The Wandering Scholar',
        'The Last Storyteller',
        'The Guardian of Words'
      ],

      adjectives: [
        'Gilded',
        'Inkbound',
        'Moonlit',
        'Dustbound',
        'Cinder',
        'Ivory',
        'Starlit',
        'Whispering',
        'Forgotten',
        'Ancient',
        'Golden',
        'Silent',
        'Endless',
        'Lost',
        'Eternal'
      ],

      forms: [
        'Guardian',
        'Warden',
        'Mimic',
        'Scribe',
        'Collector',
        'Archivist',
        'Raven',
        'Golem',
        'Scholar',
        'Keeper',
        'Librarian',
        'Watcher',
        'Seeker',
        'Chronicler',
        'Storyteller'
      ],

      relics: [
        'Tome',
        'Key',
        'Lantern',
        'Bookmark',
        'Archive',
        'Quill',
        'Mirror',
        'Vault',
        'Scroll',
        'Map',
        'Chronicle',
        'Ink',
        'Seal',
        'Codex',
        'Manuscript'
      ]
    };
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
    if (!Array.isArray(list) || !list.length) return '';
    return list[(hash(seed) + (offset || 0)) % list.length];
  }

  function bookForSession(session) {
    var bookId = String((session || {}).bookId || '');
    return books().filter(function (book) {
      return String(book.id || '') === bookId;
    })[0] || {
      id: bookId,
      title: (session || {}).bookTitle || 'Reading session',
      genre: ''
    };
  }

  var CLASS_ATTACK_TEMPLATES = {
    Scholar: [
      'You analyzed {enemy}’s pattern and dealt {damage} damage.',
      'You decoded a hidden weakness in {enemy} for {damage} damage.',
      'You annotated a flaw in {enemy}’s ward for {damage} damage.',
      'You deciphered an old passage that struck {enemy} for {damage} damage.',
      'You disproved {enemy}’s argument, dealing {damage} damage.',
      'You interpreted a forgotten clue and wounded {enemy} for {damage} damage.',
      'You cross-referenced the archives and exposed {enemy} for {damage} damage.',
      'You revised the battlefield’s logic, dealing {damage} damage to {enemy}.',
      'You exposed a contradiction in {enemy} for {damage} damage.',
      'You reasoned through the danger and struck {enemy} for {damage} damage.',
      'You translated a lost warning into {damage} damage against {enemy}.',
      'You examined the margins and found {enemy}’s weak point for {damage} damage.',
      'You catalogued {enemy}’s tells and dealt {damage} damage.',
      'You quoted a binding passage, striking {enemy} for {damage} damage.',
      'You unraveled {enemy}’s defense for {damage} damage.'
    ],

    Warrior: [
      'You struck {enemy} with a decisive blow for {damage} damage.',
      'You braced against the pressure and hit {enemy} for {damage} damage.',
      'You charged through {enemy}’s guard for {damage} damage.',
      'You shattered {enemy}’s defense for {damage} damage.',
      'You drove {enemy} back with {damage} damage.',
      'You guarded your ground, then countered {enemy} for {damage} damage.',
      'You pressed the attack and dealt {damage} damage to {enemy}.',
      'You cleaved through the opening for {damage} damage.',
      'You endured the blow and answered with {damage} damage.',
      'You hammered {enemy}’s ward for {damage} damage.',
      'You rallied and struck {enemy} for {damage} damage.',
      'You blocked the assault and punished {enemy} for {damage} damage.',
      'You pushed {enemy} off balance for {damage} damage.',
      'You confronted {enemy} head-on for {damage} damage.',
      'You overpowered {enemy} with a {damage}-damage strike.'
    ],

    Mage: [
      'You invoked a rune that hit {enemy} for {damage} damage.',
      'You conjured a burst of force against {enemy} for {damage} damage.',
      'You channeled arcane energy into {enemy} for {damage} damage.',
      'You raised a ward, then reflected {damage} damage onto {enemy}.',
      'You transmuted a loose page into {damage} damage against {enemy}.',
      'You summoned a spectral force that struck {enemy} for {damage} damage.',
      'You illuminated {enemy}’s weakness for {damage} damage.',
      'You bound {enemy} in a sigil that dealt {damage} damage.',
      'You fractured {enemy}’s spellwork for {damage} damage.',
      'You cast a precise spell for {damage} damage against {enemy}.',
      'You etched a glowing mark that burned {enemy} for {damage} damage.',
      'You wove a counterspell that struck {enemy} for {damage} damage.',
      'You unleashed a surge of inkfire for {damage} damage.',
      'You banished a shadow from {enemy}, dealing {damage} damage.',
      'You awakened an old charm that struck {enemy} for {damage} damage.'
    ],

    Rogue: [
      'You slipped through {enemy}’s guard for {damage} damage.',
      'You feinted, then struck {enemy} for {damage} damage.',
      'You sabotaged {enemy}’s defense for {damage} damage.',
      'You vanished into the shadows and hit {enemy} for {damage} damage.',
      'You darted through an opening for {damage} damage.',
      'You ambushed {enemy} for {damage} damage.',
      'You disarmed {enemy}’s trap and dealt {damage} damage.',
      'You evaded the attack and answered with {damage} damage.',
      'You shadowed {enemy}’s movement, then struck for {damage} damage.',
      'You flanked {enemy} for {damage} damage.',
      'You intercepted the opening and dealt {damage} damage.',
      'You picked apart {enemy}’s defenses for {damage} damage.',
      'You outpaced {enemy} and struck for {damage} damage.',
      'You misdirected {enemy}, landing {damage} damage.',
      'You infiltrated its guard for {damage} damage.'
    ],

    Ranger: [
      'You tracked {enemy} through {region} and dealt {damage} damage.',
      'You marked {enemy}’s weak point for {damage} damage.',
      'You followed the trail and struck {enemy} for {damage} damage.',
      'You guided your attack into {enemy} for {damage} damage.',
      'You aimed carefully and dealt {damage} damage.',
      'You stalked {enemy} through the terrain for {damage} damage.',
      'You mapped the battlefield and hit {enemy} for {damage} damage.',
      'You snared {enemy}’s movement for {damage} damage.',
      'You scouted an opening and dealt {damage} damage.',
      'You struck from range for {damage} damage against {enemy}.',
      'You surveyed {region} and found {enemy}’s weakness for {damage} damage.',
      'You navigated the hazards and struck for {damage} damage.',
      'You outmaneuvered {enemy} for {damage} damage.',
      'You pursued {enemy} and landed {damage} damage.',
      'You pinpointed the opening for {damage} damage.'
    ],

    Bard: [
      'You composed a sharp refrain that struck {enemy} for {damage} damage.',
      'Your words resonated through {region}, dealing {damage} damage.',
      'You harmonized with the realm and hit {enemy} for {damage} damage.',
      'You echoed {enemy}’s threat back for {damage} damage.',
      'You rallied your courage and struck for {damage} damage.',
      'You reframed the moment, dealing {damage} damage to {enemy}.',
      'You inspired a bold counterattack for {damage} damage.',
      'You answered {enemy} with a cutting verse for {damage} damage.',
      'You sang a defiant note that dealt {damage} damage.',
      'You recited a legend that struck {enemy} for {damage} damage.',
      'You conducted the echoes of {region} into {damage} damage.',
      'You improvised a verse that wounded {enemy} for {damage} damage.',
      'You attuned to the room’s rhythm for {damage} damage.',
      'You uplifted your resolve and dealt {damage} damage.',
      'Your final crescendo struck {enemy} for {damage} damage.'
    ]
  };

  var DEFAULT_ATTACK_TEMPLATES = [
    'You struck {enemy} for {damage} damage.',
    'You found an opening and dealt {damage} damage to {enemy}.',
    'You pressed forward and hit {enemy} for {damage} damage.',
    'You turned the encounter’s momentum and dealt {damage} damage.'
  ];

  var CRITICAL_TEMPLATES = {
    Scholar: [
      'Critical! You uncovered the decisive contradiction and dealt {damage} damage.',
      'Critical! A forbidden citation shattered {enemy}’s defense for {damage} damage.',
      'Critical! You exposed the final flaw in {enemy} for {damage} damage.'
    ],

    Warrior: [
      'Critical! You broke through {enemy}’s guard for {damage} damage.',
      'Critical! A powerful strike drove {enemy} back for {damage} damage.',
      'Critical! You shattered {enemy}’s defense with {damage} damage.'
    ],

    Mage: [
      'Critical! A surge of inkfire struck {enemy} for {damage} damage.',
      'Critical! Your counterspell fractured {enemy} for {damage} damage.',
      'Critical! A blazing rune dealt {damage} damage to {enemy}.'
    ],

    Rogue: [
      'Critical! You found the hidden seam in {enemy}’s defense and dealt {damage} damage.',
      'Critical! A flawless feint left {enemy} exposed for {damage} damage.',
      'Critical! You struck from the blind side for {damage} damage.'
    ],

    Ranger: [
      'Critical! You pinpointed {enemy}’s weak point for {damage} damage.',
      'Critical! Your careful aim struck {enemy} for {damage} damage.',
      'Critical! You turned the terrain against {enemy} for {damage} damage.'
    ],

    Bard: [
      'Critical! Your crescendo shattered {enemy}’s rhythm for {damage} damage.',
      'Critical! A legendary refrain struck {enemy} for {damage} damage.',
      'Critical! Your verse echoed through {region} for {damage} damage.'
    ]
  };

  var DEFAULT_CRITICAL_TEMPLATES = [
    'Critical! You found a decisive opening and dealt {damage} damage to {enemy}.',
    'Critical! Your strike hit {enemy} for {damage} damage.',
    'Critical! You turned the encounter in your favor for {damage} damage.'
  ];

  var COUNTERATTACKS = [
    '{enemy} hurled a storm of loose pages, but you kept your focus.',
    '{enemy} answered with a cutting footnote that nearly broke your concentration.',
    '{enemy} shifted through the shadows of {region}, searching for an opening.',
    '{enemy} unleashed a burst of ink, but your resolve held.',
    '{enemy} pressed forward with a forgotten argument.',
    '{enemy} rattled the shelves and forced you to regroup.',
    '{enemy} tried to bury you in unfinished chapters.',
    '{enemy} whispered a distraction, but you returned to the page.',
    '{enemy} twisted the path through {region}, slowing your advance.',
    '{enemy} answered with a furious counterspell.'
  ];

  function fillEncounterTemplate(template, values) {
    return String(template || '').replace(/\{(enemy|damage|region)\}/g, function (_, key) {
      return String(values[key] == null ? '' : values[key]);
    });
  }

  function classForBattleLog() {
    return String(read('bookshelf-adventure-v1', '{}').className || '');
  }

  function equippedWeaponForBattle() {
    var api = window.LanternfallsEquipment;

    if (!api || typeof api.getEquippedWeapon !== 'function') {
      return {
        id: 'readers-orb',
        name: 'Reader’s Orb',
        tier: 0,
        genre: 'Universal',
        role: 'Steady Focus',
        powerBonus: 0,
        staggerChance: 0,
        slowPercent: 0,
        weakenPercent: 0,
        markCritBonus: 0,
        returnStrikePercent: 0,
        stunChance: 0,
        confuseChance: 0,
        pacifyChance: 0,
        exposePercent: 0,
        disruptPercent: 0
      };
    }

    var weapon = api.getEquippedWeapon() || {};

    return {
      id: String(weapon.id || 'readers-orb'),
      name: String(weapon.name || 'Reader’s Orb'),
      tier: Math.max(0, Math.floor(Number(weapon.tier) || 0)),
      genre: String(weapon.genre || 'Universal'),
      role: String(weapon.role || 'Steady Focus'),
      powerBonus: Math.max(0, Number(weapon.powerBonus) || 0),
      staggerChance: Math.max(0, Number(weapon.staggerChance) || 0),
      slowPercent: Math.max(0, Number(weapon.slowPercent) || 0),
      weakenPercent: Math.max(0, Number(weapon.weakenPercent) || 0),
      markCritBonus: Math.max(0, Number(weapon.markCritBonus) || 0),
      returnStrikePercent: Math.max(
        0,
        Number(weapon.returnStrikePercent) || 0
      ),
      stunChance: Math.max(0, Number(weapon.stunChance) || 0),
      confuseChance: Math.max(0, Number(weapon.confuseChance) || 0),
      pacifyChance: Math.max(0, Number(weapon.pacifyChance) || 0),
      exposePercent: Math.max(0, Number(weapon.exposePercent) || 0),
      disruptPercent: Math.max(0, Number(weapon.disruptPercent) || 0)
    };
  }

  function battleStrength() {
    return Math.max(
      10,
      Number((read(GAME_KEY, '{}').stats || {}).str) || 10
    );
  }

  function battleLuck() {
    return Math.max(
      10,
      Number((read(GAME_KEY, '{}').stats || {}).lck) || 10
    );
  }

  function battleCritChance(luck) {
    return Math.min(25, 5 + luck / 20);
  }

  function attackDamage(strength, seed, critical, weapon) {
    var variation = hash(seed + '|damage') % 6;
    var baseDamage = 4 + Math.floor(strength / 5) + variation;
    var powerBonus = Math.max(
      0,
      Number((weapon || {}).powerBonus) || 0
    );
    var damage = baseDamage + powerBonus;

    return critical ? Math.floor(damage * 1.5) : damage;
  }

  function battleOutcome(seed) {
    var value = hash(seed + '|outcome') % 100;

    if (value < 20) return 'defeated';
    if (value < 75) return 'retreated';
    return 'survives';
  }

  function relicThemeForGenre(genre) {
    var value = String(genre || '').toLowerCase();

    if (
      value.indexOf('fantasy') !== -1 ||
      value.indexOf('myth') !== -1 ||
      value.indexOf('fairy') !== -1 ||
      value.indexOf('magic') !== -1 ||
      value.indexOf('adventure') !== -1
    ) {
      return {
        id: 'fantasy',
        label: 'Fantasy'
      };
    }

    if (
      value.indexOf('science') !== -1 ||
      value.indexOf('sci-fi') !== -1 ||
      value.indexOf('science-fiction') !== -1 ||
      value.indexOf('cyberpunk') !== -1 ||
      value.indexOf('dystopian') !== -1 ||
      value.indexOf('post-apocalyptic') !== -1 ||
      value.indexOf('steampunk') !== -1 ||
      value.indexOf('technology') !== -1
    ) {
      return {
        id: 'science-fiction',
        label: 'Science Fiction'
      };
    }

    if (
      value.indexOf('mystery') !== -1 ||
      value.indexOf('crime') !== -1 ||
      value.indexOf('detective') !== -1 ||
      value.indexOf('noir') !== -1 ||
      value.indexOf('true crime') !== -1 ||
      value.indexOf('legal') !== -1 ||
      value.indexOf('investigation') !== -1
    ) {
      return {
        id: 'mystery',
        label: 'Mystery'
      };
    }

    if (
      value.indexOf('horror') !== -1 ||
      value.indexOf('gothic') !== -1 ||
      value.indexOf('paranormal') !== -1 ||
      value.indexOf('occult') !== -1 ||
      value.indexOf('supernatural') !== -1
    ) {
      return {
        id: 'horror',
        label: 'Horror'
      };
    }

    if (
      value.indexOf('romance') !== -1 ||
      value.indexOf('romantic') !== -1 ||
      value.indexOf('new adult') !== -1 ||
      value.indexOf('contemporary romance') !== -1
    ) {
      return {
        id: 'romance',
        label: 'Romance'
      };
    }

    if (
      value.indexOf('history') !== -1 ||
      value.indexOf('historical') !== -1
    ) {
      return {
        id: 'historical',
        label: 'Historical'
      };
    }

    if (
      value.indexOf('biography') !== -1 ||
      value.indexOf('memoir') !== -1 ||
      value.indexOf('autobiography') !== -1
    ) {
      return {
        id: 'biography',
        label: 'Biography'
      };
    }

    if (
      value.indexOf('nonfiction') !== -1 ||
      value.indexOf('non-fiction') !== -1
    ) {
      return {
        id: 'nonfiction',
        label: 'Nonfiction'
      };
    }

    if (
      value.indexOf('thriller') !== -1 ||
      value.indexOf('suspense') !== -1
    ) {
      return {
        id: 'thriller',
        label: 'Thriller'
      };
    }

    return {
      id: 'reading-realm',
      label: 'Reading Realm'
    };
  }

  function createBattleLog(session, reward) {
    var book = bookForSession(session);
    var sessionId = String(
      (session || {}).id ||
      book.id ||
      book.title ||
      'reading-session'
    );

    var minutes = Math.max(
      1,
      Math.floor(Number((reward || {}).minutes) || 0)
    );

    var set = theme(book);
    var relicTheme = relicThemeForGenre(book.genre);
    var durations = encounterDurations(minutes, sessionId);
    var className = classForBattleLog();
    var weapon = equippedWeaponForBattle();
    var strength = battleStrength();
    var luck = battleLuck();

    var baseCritChance = Math.min(25, battleCritChance(luck));
    var artifactCritBonus = 0;
    var artifactItemName = '';
    var artifactItemRarity = '';

    if (
      window.BookShelfArtifacts &&
      typeof window.BookShelfArtifacts.equipped === 'function' &&
      typeof window.BookShelfArtifacts.effectFor === 'function'
    ) {
      var equippedArtifact = window.BookShelfArtifacts.equipped();
      var artifactEffect = window.BookShelfArtifacts.effectFor(equippedArtifact);

      if (
        equippedArtifact &&
        artifactEffect &&
        artifactEffect.type === 'critical-chance'
      ) {
        artifactCritBonus = Math.max(
          0,
          Number(artifactEffect.value) || 0
        );

        artifactItemName = String(equippedArtifact.name || '');
        artifactItemRarity = String(equippedArtifact.rarity || 'Common');
      }
    }

    var critChance = Math.min(
      100,
      baseCritChance + artifactCritBonus
    );

    if (
      window.BookShelfArtifacts &&
      typeof window.BookShelfArtifacts.equipped === 'function' &&
      typeof window.BookShelfArtifacts.effectFor === 'function'
    ) {
      var equippedArtifact = window.BookShelfArtifacts.equipped();
      var artifactEffect = window.BookShelfArtifacts.effectFor(equippedArtifact);

      if (
        equippedArtifact &&
        artifactEffect &&
        artifactEffect.type === 'critical-chance'
      ) {
        artifactCritBonus = Math.max(
          0,
          Number(artifactEffect.value) || 0
        );

        artifactItemName = String(equippedArtifact.name || '');
        artifactItemRarity = String(equippedArtifact.rarity || 'Common');
      }
    }

    var critChance = Math.min(
      100,
      baseCritChance + artifactCritBonus
    );

    var encounters = [];

    for (var index = 0; index < durations.length; index += 1) {
      var seed = sessionId + '|encounter|' + index;
      var duration = durations[index];

      var adjective = pick(set.adjectives, seed, 1);
      var form = pick(set.forms, seed, 2);
      var region = pick(set.regions, seed, 3);
      var enemyTitle = pick(set.titles, seed, 4);
      var relic = pick(set.relics, seed, 5);
      var enemyName = adjective + ' ' + form;

      var rounds = duration <= 4
        ? 2
        : duration <= 7
          ? 3
          : duration <= 10
            ? 4
            : 5;

      var attacks = [];
      var totalDamage = 0;
      var encounterCritical = false;

      for (var round = 0; round < rounds; round += 1) {
        var attackSeed = seed + '|round|' + round;
        var critical = (hash(attackSeed + '|critical') % 10000) <
          Math.round(critChance * 100);

        var damage = attackDamage(
          strength,
          attackSeed,
          critical,
          weapon
        );
        var templates = critical
          ? (CRITICAL_TEMPLATES[className] || DEFAULT_CRITICAL_TEMPLATES)
          : (CLASS_ATTACK_TEMPLATES[className] || DEFAULT_ATTACK_TEMPLATES);

        var template = pick(templates, attackSeed, critical ? 7 : 6);
        var playerMessage = fillEncounterTemplate(template, {
          enemy: enemyName,
          damage: damage,
          region: region
        });

        attacks.push({
          actor: 'player',
          round: round + 1,
          className: className || 'Reader',
          weaponId: weapon.id,
          weaponName: weapon.name,
          weaponTier: weapon.tier,
          weaponPowerBonus: weapon.powerBonus,
          damage: damage,
          critical: critical,
          message: playerMessage
        });

        totalDamage += damage;
        encounterCritical = encounterCritical || critical;

        if (round < rounds - 1) {
          var counterTemplate = pick(COUNTERATTACKS, attackSeed, 8);

          attacks.push({
            actor: 'enemy',
            round: round + 1,
            damage: 0,
            critical: false,
            message: fillEncounterTemplate(counterTemplate, {
              enemy: enemyName,
              damage: '',
              region: region
            })
          });
        }
      }

      var outcome = battleOutcome(seed);
      var outcomeMessage = outcome === 'defeated'
        ? enemyName + ' was defeated and left ' + relic + ' behind.'
        : outcome === 'retreated'
          ? enemyName + ' retreated into ' + region + '.'
          : enemyName + ' survived the exchange and vanished deeper into ' + region + '.';

      attacks.push({
        actor: 'outcome',
        round: rounds,
        damage: 0,
        critical: false,
        message: outcomeMessage
      });

      encounters.push({
        index: index + 1,
        duration: duration,
        region: region,
        enemyTitle: enemyTitle,
        enemyName: enemyName,
        className: className || 'Reader',
        weapon: weapon,
        relic: relic,
        relicTheme: relicTheme.id,
        relicThemeLabel: relicTheme.label,
        damage: totalDamage,
        critical: encounterCritical,
        outcome: outcome,
        attacks: attacks,

        message: attacks
          .filter(function (attack) { return attack.actor === 'player'; })
          .map(function (attack) { return attack.message; })
          .join(' ')
      });
    }

    return {
      version: 3,
      sessionId: sessionId,
      bookId: book.id || '',
      bookTitle: book.title || session.bookTitle || 'Reading session',
      genre: book.genre || '',
      minutes: minutes,
      encounterCount: encounters.length,

      baseCritChance: baseCritChance,
      artifactCritBonus: artifactCritBonus,
      criticalChanceUsed: critChance,
      weapon: weapon,
      artifactItemName: artifactItemName,
      artifactItemRarity: artifactItemRarity,

      encounters: encounters
    };
  }


  function encounterDurations(totalMinutes, seed) {
    var blocks = [3, 4, 5, 6, 7, 8, 10, 12, 15];
    var remaining = Math.max(1, Math.floor(Number(totalMinutes) || 0));
    var durations = [];
    var step = 0;

    while (remaining > 0) {
      var available = blocks.filter(function (minutes) {
        return minutes <= remaining;
      });

      if (!available.length) {
        if (durations.length) {
          durations[durations.length - 1] += remaining;
        } else {
          durations.push(remaining);
        }
        break;
      }

      var block = Number(pick(available, seed, step + 100));
      durations.push(block);
      remaining -= block;
      step += 1;
    }

    return durations;
  }

  function game() {
    var value = read(GAME_KEY, '{}');
    value.xp = Math.max(0, Number(value.xp) || 0);
    value.gold = Math.max(0, Number(value.gold) || 0);
    value.processedSessions = value.processedSessions || {};
    value.stats = value.stats || {};
    return value;
  }

  function ledger() {
    var value = read(LEDGER_KEY, '{"version":1,"transactions":{}}');
    value.version = 1;
    value.transactions = value.transactions || {};
    return value;
  }

  function minutesForBook(bookId) {
    return read(LOG_KEY, '[]').reduce(function (total, item) {
      if (!item || item.bookId !== bookId) return total;
      return total + Math.max(0, Math.floor(Number(item.minutes) || 0));
    }, 0);
  }

  function emptyClassResult() {
    return {
      className: '', perkState: 'none', xpBonus: 0, goldBonus: 0,
      reason: '', classBonusPercent: 0, affinityStats: [], requirement: ''
    };
  }

  function classSessionBonus(session, baseXP) {
    var rules = window.BookShelfClassRules;
    return rules && rules.session ? rules.session(session, baseXP) : emptyClassResult();
  }

  function classCompletionBonus(book, baseGold) {
    var rules = window.BookShelfClassRules;
    return rules && rules.completion ? rules.completion(book, baseGold) : emptyClassResult();
  }

  function classMetadata(bonus) {
    return {
      className: bonus.className || '',
      perkState: bonus.perkState || 'none',
      classBonusPercent: Math.max(0, Number(bonus.classBonusPercent) || 0),
      affinityStats: Array.isArray(bonus.affinityStats) ? bonus.affinityStats : [],
      classPerkRequirement: bonus.requirement || '',
      classBonusReason: bonus.reason || '',
      bonus: bonus.reason || ''
    };
  }

  function calculateSession(session) {
    var minutes = Math.max(0, Math.floor(Number((session || {}).minutes) || 0));
    var baseXP = minutes * 10;
    var baseGold = Math.max(1, Math.floor(minutes / 2));
    var bonus = classSessionBonus(session || {}, baseXP);
    var xpBonus = Math.max(0, Number(bonus.xpBonus) || 0);
    var goldBonus = Math.max(0, Number(bonus.goldBonus) || 0);

    return Object.assign({
      minutes: minutes, baseXP: baseXP, baseGold: baseGold,
      xpBonus: xpBonus, goldBonus: goldBonus,
      xp: baseXP + xpBonus, gold: baseGold + goldBonus,
      bookId: session.bookId || '', bookTitle: session.bookTitle || 'Reading session'
    }, classMetadata(bonus));
  }

  function calculateCompletion(book) {
    var minutes = minutesForBook(book.id);
    var baseXP = 100 + minutes * 5;
    var baseGold = 100 + Math.floor(minutes / 2);
    var bonus = classCompletionBonus(book, baseGold);
    var xpBonus = Math.max(0, Number(bonus.xpBonus) || 0);
    var goldBonus = Math.max(0, Number(bonus.goldBonus) || 0);

    return Object.assign({
      minutes: minutes, baseXP: baseXP, baseGold: baseGold,
      xpBonus: xpBonus, goldBonus: goldBonus,
      xp: baseXP + xpBonus, gold: baseGold + goldBonus,
      bookId: book.id, bookTitle: book.title || 'Untitled'
    }, classMetadata(bonus));
  }

  function migrate() {
    var state = game();
    var data = ledger();
    var changed = false;

    Object.keys(state.processedSessions).forEach(function (id) {
      var key = 'session:' + id;
      if (data.transactions[key]) return;
      data.transactions[key] = {
        id: key, type: 'session', sourceId: id, status: 'claimed',
        migrated: true, xp: null, gold: null, createdAt: new Date().toISOString()
      };
      changed = true;
    });

    var legacyLoot = read(LOOT_KEY, '{"events":[]}');
    (legacyLoot.events || []).forEach(function (event) {
      if (!event || !event.bookId) return;
      var key = 'bookCompletion:' + event.bookId;
      if (data.transactions[key]) return;
      data.transactions[key] = {
        id: key, type: 'bookCompletion', sourceId: event.bookId,
        status: 'claimed', migrated: true,
        xp: event.xp == null ? null : Number(event.xp),
        gold: event.gold == null ? null : Number(event.gold),
        createdAt: event.earnedAt || new Date().toISOString(),
        note: 'Historical completion reward preserved during unified-ledger migration.'
      };
      changed = true;
    });

    Object.keys(state.claimedBosses || {}).forEach(function (key) {
      if (key.indexOf('bookCompletion:') !== 0 || data.transactions[key]) return;
      data.transactions[key] = {
        id: key, type: 'bookCompletion', sourceId: key.slice(15),
        status: 'claimed', migrated: true, xp: null, gold: null,
        createdAt: new Date().toISOString(),
        note: 'Historical completion reward preserved during unified-ledger migration.'
      };
      changed = true;
    });

    if (changed) write(LEDGER_KEY, data);
  }

  function has(key) {
    migrate();
    return !!ledger().transactions[key];
  }

  function claimSession(session) {
    var key = 'session:' + (session || {}).id;
    if (!session || !session.id || has(key)) return { ok: false };

    var reward = calculateSession(session);

    if (!reward.minutes) {
      return { ok: false };
    }

    var artifactResult = window.BookShelfArtifacts &&
      typeof window.BookShelfArtifacts.applyToSessionReward === 'function'
      ? window.BookShelfArtifacts.applyToSessionReward(reward)
      : {
        artifact: null,
        effect: { label: '' },
        xpBonus: 0,
        goldBonus: 0,
        critBonus: 0
      };

    reward.artifactItemId = artifactResult.artifact
      ? String(
        artifactResult.artifact.instanceId ||
        artifactResult.artifact.id ||
        ''
      )
      : '';

    reward.artifactItemName = artifactResult.artifact
      ? String(artifactResult.artifact.name || '')
      : '';

    reward.artifactItemRarity = artifactResult.artifact
      ? String(artifactResult.artifact.rarity || 'Common')
      : '';

    reward.artifactBonusReason = artifactResult.effect
      ? String(artifactResult.effect.label || '')
      : '';

    reward.artifactXPBonus = Math.max(
      0,
      Number(artifactResult.xpBonus) || 0
    );

    reward.artifactGoldBonus = Math.max(
      0,
      Number(artifactResult.goldBonus) || 0
    );

    reward.artifactCritBonus = Math.max(
      0,
      Number(artifactResult.critBonus) || 0
    );

    reward.xp = Math.max(0, Number(reward.xp) || 0) +
      reward.artifactXPBonus;

    reward.gold = Math.max(0, Number(reward.gold) || 0) +
      reward.artifactGoldBonus;

    var enchantment = window.BookShelfEconomy &&
      typeof window.BookShelfEconomy.applyToReward === 'function'
      ? window.BookShelfEconomy.applyToReward('session', reward)
      : {
        applied: false,
        item: null,
        xpBonus: 0,
        goldBonus: 0,
        lootLuck: 0,
        reason: ''
      };

    reward.bazaarApplied = !!enchantment.applied;
    reward.bazaarItemId = enchantment.item ? enchantment.item.id : '';
    reward.bazaarItemName = enchantment.item ? enchantment.item.name : '';
    reward.bazaarXPBonus = Math.max(0, Number(enchantment.xpBonus) || 0);
    reward.bazaarGoldBonus = Math.max(0, Number(enchantment.goldBonus) || 0);
    reward.bazaarLootLuck = Math.max(0, Number(enchantment.lootLuck) || 0);
    reward.bazaarBonusReason = enchantment.reason || '';

    reward.xp += reward.bazaarXPBonus;
    reward.gold += reward.bazaarGoldBonus;

    var state = game();
    var data = ledger();
    var battleLog = createBattleLog(session, reward);

    state.xp += reward.xp;
    state.gold += reward.gold;
    state.processedSessions[session.id] = true;

    (battleLog.encounters || []).forEach(function (encounter) {
      addRelic(battleLog.genre, encounter.relic);
    });

    data.transactions[key] = Object.assign({
      id: key,
      type: 'session',
      sourceId: session.id,
      status: 'claimed',
      createdAt: new Date().toISOString(),
      battleLog: battleLog
    }, reward);

    write(GAME_KEY, state);
    write(LEDGER_KEY, data);
    return { ok: true, transaction: data.transactions[key] };
  }

  function pendingCompletions() {
    var data = ledger();
    return books().filter(function (book) {
      return book.status === 'finished' && !data.transactions['bookCompletion:' + book.id];
    });
  }

  function claimCompletion(book) {
    var key = 'bookCompletion:' + (book || {}).id;

    if (!book || !book.id || has(key)) {
      return { ok: false };
    }

    var reward = calculateCompletion(book);

    var enchantment = window.BookShelfEconomy &&
      typeof window.BookShelfEconomy.applyToReward === 'function'
      ? window.BookShelfEconomy.applyToReward('completion', reward)
      : {
        applied: false,
        item: null,
        xpBonus: 0,
        goldBonus: 0,
        lootLuck: 0,
        reason: ''
      };

    reward.bazaarApplied = !!enchantment.applied;
    reward.bazaarItemId = enchantment.item ? enchantment.item.id : '';
    reward.bazaarItemName = enchantment.item ? enchantment.item.name : '';
    reward.bazaarXPBonus = Math.max(0, Number(enchantment.xpBonus) || 0);
    reward.bazaarGoldBonus = Math.max(0, Number(enchantment.goldBonus) || 0);
    reward.bazaarLootLuck = Math.max(0, Number(enchantment.lootLuck) || 0);
    reward.bazaarBonusReason = enchantment.reason || '';

    reward.xp += reward.bazaarXPBonus;
    reward.gold += reward.bazaarGoldBonus;

    var state = game();
    var data = ledger();

    state.xp += reward.xp;
    state.gold += reward.gold;

    data.transactions[key] = Object.assign({
      id: key,
      type: 'bookCompletion',
      sourceId: book.id,
      status: 'claimed',
      createdAt: new Date().toISOString()
    }, reward);

    write(GAME_KEY, state);
    write(LEDGER_KEY, data);

    window.dispatchEvent(new CustomEvent('bookshelf-adventure-completion-claimed', {
      detail: {
        book: book,
        transaction: data.transactions[key]
      }
    }));

    return {
      ok: true,
      transaction: data.transactions[key]
    };
  }

  function detachSession(id) {
    var data = ledger();
    var item = data.transactions['session:' + id];
    if (!item) return;
    item.readingEntryRemovedAt = new Date().toISOString();
    item.note = 'Reading entry removed; reward retained.';
    write(LEDGER_KEY, data);
  }

  function reverseSession(id) {
    var key = 'session:' + id;
    var data = ledger();
    var item = data.transactions[key];
    if (!item || item.status === 'reversed' || item.migrated || item.xp === null) {
      return { ok: false, reason: item && item.migrated ? 'historical' : 'not-claimed' };
    }

    var state = game();
    state.xp = Math.max(0, state.xp - item.xp);
    state.gold = Math.max(0, state.gold - item.gold);
    delete state.processedSessions[id];
    item.status = 'reversed';
    item.reversedAt = new Date().toISOString();
    data.transactions['reversal:' + key] = {
      id: 'reversal:' + key, type: 'reversal', sourceId: id,
      status: 'reversed', xp: -item.xp, gold: -item.gold,
      createdAt: item.reversedAt
    };

    write(GAME_KEY, state);
    write(LEDGER_KEY, data);
    return { ok: true };
  }

  window.BookShelfRewards = {
    migrate: migrate,
    has: has,
    ledger: ledger,
    theme: theme,
    createBattleLog: createBattleLog,
    calculateSession: calculateSession,
    calculateCompletion: calculateCompletion,
    claimSession: claimSession,
    claimCompletion: claimCompletion,
    pendingCompletions: pendingCompletions,
    detachSession: detachSession,
    reverseSession: reverseSession
  };

  migrate();
})();