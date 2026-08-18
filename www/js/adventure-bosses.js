(function () {
  var BOSS_KEY = 'bookshelf-book-bosses-v1';
  var EVENT_KEY = 'bookshelf-boss-events-v1';
  var BOSS_VERSION = 2;

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch (_) { return JSON.parse(fallback); }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function hash(value) {
    var number = 2166136261;

    String(value || '').split('').forEach(function (character) {
      number ^= character.charCodeAt(0);
      number += (number << 1) + (number << 4) + (number << 7) +
        (number << 8) + (number << 24);
    });

    return Math.abs(number >>> 0);
  }

  function pick(list, seed, offset) {
    return list[(seed + offset) % list.length];
  }

  function titleWords(title) {
    var ignored = {
      the: true, a: true, an: true, and: true, of: true, in: true,
      to: true, for: true, on: true, with: true, at: true, from: true,
      by: true, book: true, volume: true
    };

    var words = String(title || '')
      .replace(/[^a-z0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter(function (word) {
        return word && !ignored[word.toLowerCase()];
      });

    return words.length ? words : ['Ink', 'Chronicle'];
  }

  function titleWord(title, seed, offset) {
    var words = titleWords(title);
    return words[(seed + offset) % words.length];
  }

  function titlePair(title, seed) {
    var first = titleWord(title, seed, 7);
    var second = titleWord(title, seed, 13);

    return first.toLowerCase() === second.toLowerCase()
      ? first
      : first + ' ' + second;
  }

  function theme(book) {
    var genre = String(book.genre || '').toLowerCase();

    if (
      genre.indexOf('fantasy') !== -1 ||
      genre.indexOf('myth') !== -1 ||
      genre.indexOf('fairy') !== -1 ||
      genre.indexOf('magic') !== -1 ||
      genre.indexOf('adventure') !== -1
    ) {
      return {
        regions: ['The Dragonlands', 'The Moonlit Marches', 'The Ashen Wilds', 'The Crystal Kingdom', 'The Thornwood Expanse', 'The Emerald Highlands', 'The Forgotten Vale', 'The Sunken Ruins', 'The Silverwood', 'The Obsidian Coast', 'The Realm of Fallen Kings', 'The Whispering Mountains', 'The Golden Frontier', 'The Enchanted Isles', 'The Ancient Wilds'],
        titles: ['The Runebound', 'The Ember King', 'The Thorn Queen', 'The Moonforged', 'The Oathbreaker', 'The Starwarden', 'The Dragon Seeker', 'The Last Spellblade', 'The Crownless King', 'The Keeper of Secrets', 'The Ruinwalker', 'The Shadow Prince', 'The Last Enchanter', 'The Wyrmcaller', 'The Forgotten Hero', 'The Relic Hunter', 'The Witch of Winter', 'The Guardian of Ages', 'The King Beneath the Mountain', 'The Child of Prophecy', 'The Stormcaller', 'The Flamekeeper', 'The Night Wanderer', 'The Silver Knight', 'The Bone King', 'The Mage of Thorns', 'The Hollow Prince', 'The Forest Guardian', 'The Last Paladin', 'The Witch Queen', 'The Blood Prince', 'The Keeper of the Flame', 'The Lord of Shadows', 'The Seeker of Stars', 'The Golden Knight', 'The Beastmaster', 'The Fallen King', 'The Crystal Seer', 'The Dragonlord', 'The Wandering Wizard', 'The Black Sorcerer', 'The Emerald Queen', 'The Iron Druid', 'The Last Warden', 'The Cursed Heir', 'The Moon Queen', 'The Ashen Lord', 'The Rune Keeper', 'The Sword Saint', 'The Phoenix Knight', 'The Tower Mage', 'The Goblin King', 'The Ancient One', 'The Storm King', 'The Thorned Prince', 'The Keeper of Dragons', 'The Lost Sorceress', 'The Shadow Warden', 'The Eternal King', 'The Last Dragon'],
        adjectives: ['Emberbound', 'Runebound', 'Thorncrowned', 'Moonforged', 'Ashen', 'Stormwrought', 'Gilded', 'Elder', 'Frostveiled', 'Dragonforged', 'Shadowborn', 'Starfallen', 'Bloodmarked', 'Spellbound', 'Ironcrowned', 'Dreadborn', 'Sunforged', 'Wildborn', 'Gravebound', 'Everlasting', 'Flameborn', 'Frostborn', 'Moonbound', 'Stormborn', 'Starforged', 'Dawnforged', 'Nightcrowned', 'Runemarked', 'Dragonblooded', 'Shadowforged', 'Soulbound', 'Spellforged', 'Cursed', 'Blessed', 'Ancient', 'Forgotten', 'Enchanted', 'Mythic', 'Arcane', 'Ethereal', 'Celestial', 'Infernal', 'Emerald', 'Obsidian', 'Crimson', 'Sapphire', 'Ivory', 'Golden', 'Silver', 'Violet', 'Bloodbound', 'Doomed', 'Fatebound', 'Oathbound', 'Kingsworn', 'Witchmarked', 'Feytouched', 'Titanforged', 'Voidtouched', 'Phoenixborn'],
        forms: ['Wyrm', 'Warden', 'Revenant', 'Chimera', 'Gryphon', 'Warlock', 'Colossus', 'Knight', 'Beast', 'Dragon', 'Sorcerer', 'Paladin', 'Druid', 'Witch', 'Giant', 'Titan', 'Demon', 'Fey', 'Guardian', 'Berserker', 'Necromancer', 'Barbarian', 'Ranger', 'Wizard', 'Assassin', 'Valkyrie', 'Templar', 'Monk', 'Shaman', 'Oracle', 'Djinn', 'Elemental', 'Golem', 'Hydra', 'Basilisk', 'Manticore', 'Minotaur', 'Centaur', 'Harpy', 'Kraken', 'Leviathan', 'Griffin', 'Dryad', 'Nymph', 'Doppelganger', 'Specter', 'Wraith', 'Lich', 'Goblin', 'Orc', 'Troll', 'Ogre', 'Dwarf', 'Elf', 'Dreadknight', 'Spellblade', 'Runemaster', 'Dragonrider', 'Beastlord', 'Stormcaller'],
        relics: ['Crown', 'Blade', 'Scepter', 'Grimoire', 'Lantern', 'Gate', 'Throne', 'Orb', 'Amulet', 'Rune', 'Relic', 'Talisman', 'Chalice', 'Horn', 'Crystal', 'Idol', 'Compass', 'Map', 'Key', 'Stone', 'Ring', 'Medallion', 'Staff', 'Shield', 'Helm', 'Gauntlet', 'Cloak', 'Dagger', 'Sword', 'Axe', 'Hammer', 'Spear', 'Tome', 'Scroll', 'Casket', 'Crownstone', 'Dragonbone', 'Phoenix Feather', 'Witchstone', 'Soul Gem', 'Bloodstone', 'Moonstone', 'Sunstone', 'Starshard', 'Runestone', 'Frost Crystal', 'Ember Crystal', 'Dragon Egg', 'Ancient Coin', 'Royal Seal', 'Magic Mirror', 'Enchanted Rose', 'Golden Apple', 'Sacred Bell', 'Prophecy', 'Oath', 'Holy Grail', 'Black Book', 'Fate Stone', 'Worldstone']
      };
    }

    if (
      genre.indexOf('science') !== -1 ||
      genre.indexOf('sci-fi') !== -1 ||
      genre.indexOf('cyberpunk') !== -1 ||
      genre.indexOf('dystopian') !== -1 ||
      genre.indexOf('post-apocalyptic') !== -1 ||
      genre.indexOf('steampunk') !== -1 ||
      genre.indexOf('technology') !== -1
    ) {
      return {
        regions: ['The Astral Frontier', 'The Nebula Reach', 'The Silent Orbit', 'The Crimson Expanse', 'The Quantum Verge', 'The Neon Districts', 'The Machine Wastes', 'The Outer Colonies', 'The Dead Worlds', 'The Synthetic Frontier', 'The Iron Megacity', 'The Forgotten Stations', 'The Solar Dominion', 'The Void Territories', 'The Last Colony'],
        titles: ['The Void Marshal', 'The Starbreaker', 'The Last Navigator', 'The Signal Warden', 'The Iron Horizon', 'The Last Human', 'The Neon Prophet', 'The Machine King', 'The Colony of Ash', 'The Quantum Heir', 'The Final Protocol', 'The Starship Warden', 'The Artificial Mind', 'The Last Transmission', 'The Voidborn', 'The Chrome Rebellion', 'The Terraformer', 'The Exiled Android', 'The Last Astronaut', 'The Architect of Worlds', 'The Galactic Nomad', 'The Silent Planet', 'The Cybernetic Prince', 'The Neon Hunter', 'The Quantum Soldier', 'The Last Replicant', 'The Starborn', 'The Machine Prophet', 'The Lunar Colony', 'The Cosmic Wanderer', 'The Digital Ghost', 'The Planetbreaker', 'The Void Walker', 'The Synthetic Mind', 'The Last Engineer', 'The Solar Captain', 'The Black Star', 'The Orbital Knight', 'The Deep Space Hunter', 'The Time Traveler', 'The Gravity Thief', 'The Alien Prince', 'The Singularity', 'The Last Civilization', 'The Mars Warden', 'The Galactic Emperor', 'The Space Pirate', 'The Cybernetic Ghost', 'The Star Architect'],
        adjectives: ['Starforged', 'Voidglass', 'Astral', 'Quantum', 'Neon', 'Solar', 'Chrome', 'Darkmatter', 'Synthetic', 'Cybernetic', 'Titanium', 'Stellar', 'Zero-G', 'Plasma', 'Atomic', 'Machineborn', 'Orbital', 'Digital', 'Exoplanetary', 'Posthuman', 'Hyperion', 'Galactic', 'Cosmic', 'Lunar', 'Martian', 'Interstellar', 'Subatomic', 'Nanotech', 'Holographic', 'Artificial', 'Quantumforged', 'Voidborn', 'Starborn', 'Cyberforged', 'Neural', 'Bioengineered', 'Terraforming', 'Solarbound', 'Stellarborn', 'Hypercharged', 'Gravitational', 'Temporal', 'Dimensional', 'Antimatter', 'Darkstar', 'Neonforged', 'Chromeclad', 'Singular', 'Mechanical', 'Radiant', 'Frozen', 'Zeroed', 'Encrypted', 'Encoded', 'Transhuman', 'Extragalactic', 'Starbound', 'Voidforged'],
        forms: ['Sentinel', 'Navigator', 'Colossus', 'Drone', 'Oracle', 'Leviathan', 'Android', 'Harbinger', 'Cyborg', 'Replicant', 'Pilot', 'Commander', 'Engineer', 'AI', 'Construct', 'Automaton', 'Mutant', 'Overseer', 'Explorer', 'Terraformer', 'Astronaut', 'Scientist', 'Technician', 'Mercenary', 'Bounty Hunter', 'Space Pirate', 'Admiral', 'Captain', 'Soldier', 'Assassin', 'Operative', 'Synthetic', 'Nanobot', 'Mech', 'War Machine', 'Starship', 'Alien', 'Hive Mind', 'Clone', 'Quantum Entity', 'Void Entity', 'Timewalker', 'Dimensional Traveler', 'Planet Eater', 'Starborn', 'Cybernetic Ghost', 'AI Overlord', 'Battle Drone', 'Sentient Machine'],
        relics: ['Beacon', 'Engine', 'Protocol', 'Core', 'Relay', 'Archive', 'Gate', 'Signal', 'Module', 'Chip', 'Drive', 'Satellite', 'Circuit', 'Data Crystal', 'Artifact', 'Capsule', 'Scanner', 'Transmitter', 'Generator', 'Blueprint', 'Reactor', 'Power Cell', 'Neural Chip', 'Quantum Core', 'Star Map', 'Navigation Core', 'Warp Drive', 'Cryopod', 'Hologram', 'AI Core', 'Memory Bank', 'Access Key', 'Control Panel', 'Energy Cell', 'Plasma Coil', 'Gravity Engine', 'Timepiece', 'Alien Artifact', 'Black Box', 'Signal Tower', 'Orbital Key', 'Terraformer', 'Life Support', 'Fusion Core', 'Antimatter Cell', 'Portal', 'Stasis Pod', 'Star Chart', 'Cyberdeck']
      };
    }

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
        regions: ['The Shadow District', 'The Gaslamp Quarter', 'The Rainy Borough', 'The Midnight Precinct', 'The Blackwater Docks', 'The Forgotten Alley', 'The Crimson District', 'The Old Quarter', 'The Fogbound City', 'The Silent Borough', 'The Crooked Streets', 'The Golden Mile', 'The Underworld', 'The Locked District', 'The Midnight Court'],
        titles: ['The Last Witness', 'The Silent Detective', 'The Midnight Informant', 'The Unseen Suspect', 'The Final Alibi', 'The Missing Hour', 'The Locked Room', 'The Vanishing Man', 'The Shadow Witness', 'The Forgotten Case', 'The Last Confession', 'The Red Ledger', 'The Midnight Murder', 'The Nameless Victim', 'The Hidden Truth', 'The Crooked Detective', 'The Final Evidence', 'The Secret in Room Seven', 'The Phantom Suspect', 'The Case Without a Name', 'The Disappearing Witness', 'The House of Secrets', 'The Murder at Midnight', 'The Silent Alibi', 'The Unopened Letter', 'The Missing Heir', 'The Stranger in the Fog', 'The Last Phone Call', 'The Secret Witness', 'The Empty Grave', 'The Vanished Fortune', 'The Forgotten Murder', 'The Detective’s Secret', 'The Final Clue', 'The House on Black Street', 'The Unsolved Case', 'The Man in Room Nine', 'The Woman at the Window', 'The Crimson Evidence', 'The Death of a Stranger', 'The Locked Door', 'The Secret Society', 'The Midnight Caller', 'The Last Suspect', 'The Hidden Room', 'The Blackmail File', 'The Missing Photograph', 'The Unseen Killer', 'The Final Statement'],
        adjectives: ['Candleveil', 'Whispering', 'Masked', 'Smokebound', 'Shadowed', 'Blackglass', 'Hidden', 'Crooked', 'Fogbound', 'Bloodmarked', 'Silent', 'Unseen', 'Secret', 'Midnight', 'Forbidden', 'Obscured', 'Forgotten', 'Veiled', 'Suspicious', 'Sinister', 'Mysterious', 'Concealed', 'Unsolved', 'Encrypted', 'Cryptic', 'Shadowy', 'Deceptive', 'Secretive', 'Unknown', 'Untraceable', 'Unspoken', 'Invisible', 'Elusive', 'Dubious', 'Twisted', 'Devious', 'Covert', 'Clandestine', 'Obscure', 'Unidentified', 'Missing', 'Vanished', 'Unexplained', 'Uncertain'],
        forms: ['Pursuer', 'Witness', 'Sleuth', 'Informer', 'Phantom', 'Rook', 'Inspector', 'Cipher', 'Detective', 'Suspect', 'Forensicist', 'Informant', 'Conspirator', 'Assassin', 'Thief', 'Judge', 'Lawyer', 'Criminal', 'Mastermind', 'Investigator', 'Murderer', 'Blackmailer', 'Smuggler', 'Spy', 'Con Artist', 'Burglar', 'Forger', 'Hacker', 'Interrogator', 'Profiler', 'Agent', 'Coroner', 'Reporter', 'Journalist', 'Fixer', 'Undercover Agent'],
        relics: ['Clue', 'Alibi', 'Casefile', 'Key', 'Ledger', 'Mirror', 'Door', 'Lock', 'Fingerprint', 'Photograph', 'Letter', 'Evidence', 'Dossier', 'Cipher', 'Journal', 'Badge', 'Witness Statement', 'Confession', 'Red String', 'Bloodstain', 'Newspaper', 'Diary', 'Blackmail File', 'Contract', 'Passport', 'Phone', 'Recording', 'Camera', 'Watch', 'Ring', 'Receipt', 'Map', 'Safe', 'Combination', 'Will', 'Deed', 'Manuscript', 'Envelope', 'Security Tape', 'Case Number', 'Evidence Bag', 'Photocopy', 'Newspaper Clipping']
      };
    }

    if (
      genre.indexOf('horror') !== -1 ||
      genre.indexOf('gothic') !== -1 ||
      genre.indexOf('paranormal') !== -1 ||
      genre.indexOf('occult') !== -1 ||
      genre.indexOf('supernatural') !== -1
    ) {
      return {
        regions: ['The Dreadwood', 'The Hollow Deep', 'The Witching Moor', 'The Bone Orchard', 'The Black Chapel', 'The Forsaken Village', 'The House of Whispers', 'The Gravefields', 'The Blood Marsh', 'The Forgotten Asylum', 'The Deadlands', 'The Black Forest', 'The Hollow City', 'The Cursed Coast', 'The Realm Below'],
        titles: ['The Pale Guest', 'The Last Thing Below', 'The Unquiet One', 'The Hollow King', 'The Nameless Hunger', 'The House at Midnight', 'The Thing in the Woods', 'The Last Door', 'The Woman in Black', 'The Whisper Beneath', 'The Hollow Child', 'The Dead Visitor', 'The Man Who Was Not There', 'The Forgotten God', 'The House That Watches', 'The Last Exorcist', 'The Devouring Dark', 'The Empty Room', 'The Face in the Mirror', 'The Thing Without a Name', 'The House of Bones', 'The Blackened Chapel', 'The Children of the Grave', 'The Last Nightmare', 'The Whispering House', 'The Shadow in the Attic', 'The Thing at the Window', 'The Dead Below', 'The Forgotten Cemetery', 'The Black Door', 'The Woman Beneath', 'The House of Screams', 'The Hollow Man', 'The Last Ritual', 'The Devil in the Woods', 'The Bone Collector', 'The Crawling Dark', 'The Blood Moon', 'The Empty Coffin', 'The Unholy Child', 'The House of Shadows', 'The Thing in the Basement', 'The Last Prayer', 'The Dead Room', 'The Whispering Grave', 'The Pale Man', 'The Curse of Black Hollow', 'The Last Bell', 'The Face Beyond the Glass'],
        adjectives: ['Pale', 'Whispering', 'Gravebound', 'Bonewhite', 'Rotting', 'Bloodless', 'Hollow', 'Dread', 'Forsaken', 'Unquiet', 'Haunted', 'Cursed', 'Nameless', 'Dead', 'Sunless', 'Bleeding', 'Spectral', 'Wretched', 'Forgotten', 'Unholy', 'Macabre', 'Sinister', 'Grisly', 'Morbid', 'Nightmarish', 'Demonic', 'Possessed', 'Twisted', 'Decrepit', 'Putrid', 'Faceless', 'Lifeless', 'Ghastly', 'Coffinbound', 'Soulbound', 'Bloodmarked', 'Skinless', 'Eyeless', 'Tongueless', 'Maddened', 'Feral', 'Ancient', 'Buried', 'Unburied', 'Crawling', 'Screaming', 'Bleak', 'Desolate', 'Unnatural'],
        forms: ['Stalker', 'Hollow', 'Nightmare', 'Wraith', 'Devourer', 'Bride', 'Specter', 'Thing', 'Demon', 'Ghoul', 'Revenant', 'Vampire', 'Werewolf', 'Cultist', 'Witch', 'Poltergeist', 'Abomination', 'Parasite', 'Watcher', 'Butcher', 'Skinwalker', 'Banshee', 'Possessed', 'Executioner', 'Mimic', 'Crawler', 'Shadow', 'Wendigo', 'Mummy', 'Lich', 'Deadwalker', 'Flesh Eater', 'Bone Walker', 'Gravedigger', 'Pale Man', 'Faceless One', 'Dream Eater', 'Soul Eater', 'Night Terror', 'Blood Witch', 'Dread Beast', 'Crypt Keeper', 'Carrion King', 'Hollow Child', 'Graveborn', 'Watcher in the Dark', 'The Unseen'],
        relics: ['Coffin', 'Bell', 'Mirror', 'Door', 'Mask', 'Knife', 'Cradle', 'Portrait', 'Skull', 'Lantern', 'Grimoire', 'Idol', 'Bone', 'Key', 'Noose', 'Doll', 'Candle', 'Tombstone', 'Ritual', 'Eye', 'Blood Vial', 'Black Book', 'Ouija Board', 'Funeral Bell', 'Grave Key', 'Dead Man’s Ring', 'Cursed Coin', 'Bone Charm', 'Black Candle', 'Burial Mask', 'Witch Bottle', 'Skinned Hide', 'Haunted Photograph', 'Death Certificate', 'Grave Dirt', 'Human Tooth', 'Ritual Knife', 'Cursed Doll', 'Bloodied Ribbon', 'Forbidden Tome']
      };
    }

    if (
      genre.indexOf('romance') !== -1 ||
      genre.indexOf('romantic') !== -1 ||
      genre.indexOf('new adult') !== -1 ||
      genre.indexOf('contemporary romance') !== -1
    ) {
      return {
        regions: ['The Heartlands', 'The Rose Court', 'The Golden Promenade', 'The Moonlit Ballroom', 'The Sapphire Coast', 'The Velvet Quarter', 'The Summer Isles', 'The Crimson Garden', 'The Starlight District', 'The Lavender Hills', 'The Silver Lake', 'The Wedding Coast', 'The Whispering Gardens', 'The Lovers Road', 'The Eternal Spring'],
        titles: ['The Velvet Rival', 'The Rosebound Heart', 'The Midnight Suitor', 'The Last Promise', 'The Golden Stranger', 'The Accidental Love', 'The Forbidden Heart', 'The Summer Promise', 'The Reluctant Lover', 'The Duke of Midnight', 'The Last First Kiss', 'The Unlikely Pair', 'The Love Letter', 'The Secret Admirer', 'The Heartbreaker', 'The Second Chance', 'The Accidental Duchess', 'The Rival Hearts', 'The One Who Stayed', 'The Forever Promise', 'The Winter Kiss', 'The Summer Bride', 'The Charming Stranger', 'The Reluctant Prince', 'The Stolen Heart', 'The Secret Valentine', 'The Midnight Kiss', 'The Unexpected Suitor', 'The Billionaire’s Secret', 'The Wedding Pact', 'The Fake Relationship', 'The Childhood Sweetheart', 'The Forbidden Prince', 'The Last Dance', 'The Perfect Match', 'The Accidental Fiancé', 'The Rival Prince', 'The Heart of Winter', 'The Love of My Life', 'The Second Proposal', 'The Wedding Guest', 'The Secret Engagement', 'The Summer Lover', 'The Broken Vow', 'The Last Valentine', 'The Prince Next Door', 'The Stranger at the Ball', 'The Heart’s Desire', 'The Eternal Lovers'],
        adjectives: ['Roseglass', 'Velvet', 'Gilded', 'Sapphire', 'Silken', 'Moonlit', 'Crimson', 'Lovelorn', 'Starcrossed', 'Tender', 'Golden', 'Forbidden', 'Passionate', 'Endless', 'Secret', 'Blushing', 'Whispered', 'Devoted', 'Fateful', 'Eternal', 'Romantic', 'Enchanted', 'Dreaming', 'Beloved', 'Sweet', 'Desirable', 'Charming', 'Elegant', 'Radiant', 'Faithful', 'Yearning', 'Longing', 'Timeless', 'Heartbound', 'Lovebound', 'Soulbound', 'Starbound', 'Fated', 'Destined', 'Tenderhearted', 'Adoring', 'Smitten', 'Enamored', 'Cherished', 'Precious', 'Irresistible', 'Unforgettable'],
        forms: ['Guardian', 'Duelist', 'Envoy', 'Prince', 'Duchess', 'Rival', 'Knight', 'Phantom', 'Suitor', 'Lover', 'Heartbreaker', 'Countess', 'Duke', 'Heiress', 'Outlaw', 'Champion', 'Matchmaker', 'Admirer', 'Royal', 'Dreamer', 'Fiancé', 'Fiancée', 'Prince Charming', 'Princess', 'Count', 'Baron', 'Baroness', 'King', 'Queen', 'Noble', 'Bodyguard', 'Stranger', 'Sweetheart', 'Soulmate', 'Dancer', 'Musician', 'Artist', 'Poet', 'Hero', 'Heroine', 'Heartthrob', 'Socialite', 'Adventurer', 'Wanderer'],
        relics: ['Rose', 'Letter', 'Promise', 'Locket', 'Crown', 'Dance', 'Kiss', 'Ring', 'Ribbon', 'Portrait', 'Love Letter', 'Key', 'Bouquet', 'Pendant', 'Vow', 'Invitation', 'Perfume', 'Keepsake', 'Heart', 'Photograph', 'Valentine', 'Love Note', 'Wedding Ring', 'Engagement Ring', 'Wedding Dress', 'Tiara', 'Music Box', 'Love Token', 'Handkerchief', 'Champagne', 'Diary', 'Memory', 'Promise Ring', 'Family Heirloom', 'Love Charm', 'Rose Petal', 'Perfume Bottle', 'Dance Card', 'Wedding Vow', 'Cupid’s Arrow', 'Heart Locket', 'Golden Rose', 'Love Potion']
      };
    }

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
        regions: ['The Dead City', 'The Midnight Run', 'The Redline Corridor', 'The Empty Terminal', 'The Iron Border', 'The Black Site', 'The Warfront', 'The Frozen Frontier', 'The Burning Capital', 'The Underground', 'The Exclusion Zone', 'The Last Checkpoint', 'The Storm Coast', 'The Shadow Government', 'The Final Stronghold'],
        titles: ['The Last Operative', 'The Running Man', 'The Silent Target', 'The Final Pursuit', 'The Black Directive', 'The Last Agent', 'The Enemy Within', 'The Hidden Threat', 'The Final Mission', 'The Manhunt', 'The Last Extraction', 'The Sleeper Agent', 'The Burning Code', 'The Impossible Escape', 'The Last Survivor', 'The Enemy at Dawn', 'The Final Countdown', 'The Shadow Network', 'The Vanishing Target', 'The Last Defense', 'The Silent Assassin', 'The Final Operation', 'The Deadly Secret', 'The Last Hostage', 'The Enemy Behind the Door', 'The Midnight Agent', 'The Last Safe House', 'The Hidden Enemy', 'The Final Warning', 'The Extraction', 'The Rogue Agent', 'The Last Stand', 'The Hostage', 'The Chase', 'The Shadow Operative', 'The Final Target', 'The Broken Mission', 'The Last Bullet', 'The Secret Weapon', 'The Man on the Run', 'The Impossible Mission', 'The Final Hour', 'The Silent War', 'The Last Informant', 'The Dead Drop', 'The Final Escape', 'The Last Resistance'],
        adjectives: ['Nightwire', 'Steelshadow', 'Ashen', 'Redline', 'Coldsteel', 'Blackout', 'Razor', 'Silent', 'Deadly', 'Classified', 'Covert', 'Burning', 'Hostile', 'Relentless', 'Broken', 'Exposed', 'Targeted', 'Desperate', 'Invisible', 'Untraceable', 'Dangerous', 'Ruthless', 'Vicious', 'Armed', 'Wanted', 'Hunted', 'Cornered', 'Escaped', 'Compromised', 'Encrypted', 'Hidden', 'Secret', 'Deadlock', 'Blacklisted', 'Redacted', 'Unauthorized', 'Explosive', 'Tactical', 'Strategic', 'Combat-ready', 'Unstoppable', 'Destructive', 'Fatal', 'Final', 'Critical', 'Immediate'],
        forms: ['Hunter', 'Operative', 'Phantom', 'Tracker', 'Sniper', 'Courier', 'Saboteur', 'Fugitive', 'Agent', 'Assassin', 'Mercenary', 'Commander', 'Spy', 'Survivor', 'Enforcer', 'Interrogator', 'Infiltrator', 'Soldier', 'Conspirator', 'Warlord', 'Bodyguard', 'Hitman', 'Pilot', 'Commando', 'Specialist', 'Detective', 'Rebel', 'Hostage', 'Traitor', 'Double Agent', 'Fixer', 'Handler', 'Bounty Hunter', 'Smuggler', 'Field Agent', 'Special Agent', 'General', 'Warrior', 'Escapee', 'Target'],
        relics: ['Directive', 'Target', 'Signal', 'Cipher', 'Trigger', 'File', 'Weapon', 'Escape Route', 'Passport', 'Dossier', 'Badge', 'Bullet', 'Radio', 'Code', 'Briefcase', 'Map', 'Keycard', 'Manifest', 'Evidence', 'Dead Drop', 'Phone', 'Tracker', 'Transmitter', 'Microfilm', 'Safe', 'Access Card', 'Blueprint', 'Mission File', 'Black Box', 'Hard Drive', 'Flash Drive', 'Satellite Phone', 'Encrypted File', 'Secret Code', 'Weapon Case', 'Safehouse Key', 'Target File', 'Intel', 'Photograph', 'Recording', 'Wiretap', 'Listening Device', 'Emergency Beacon', 'Extraction Point', 'Classified File', 'Evidence Bag', 'Burner Phone']
      };
    }

    if (genre.indexOf('history') !== -1 || genre.indexOf('histor') !== -1) {
      return {
        regions: ['The Ancient Kingdoms', 'The Lost Archive', 'The Bronze Empire', 'The Forgotten Court', 'The Marble Citadel', 'The Laurel Provinces', 'The Old World Road'],
        titles: ['The Crownless Monarch', 'The Last Standard', 'The Oath of Ages', 'The Broken Empire', 'The Exiled Sovereign', 'The Bronze Chronicler', 'The Forgotten General', 'The Marble Emperor'],
        adjectives: ['Crownless', 'Bronze', 'Oathbound', 'Marble', 'Imperial', 'Forgotten', 'Laurel', 'Ancient', 'Iron', 'Royal', 'Weathered', 'Victorious'],
        forms: ['Archivist', 'Monarch', 'Standard-Bearer', 'Legionnaire', 'Emperor', 'Oracle', 'Chronicler', 'General', 'Diplomat', 'Centurion', 'Historian', 'Commander'],
        relics: ['Crown', 'Standard', 'Empire', 'Treaty', 'Throne', 'Seal', 'Tablet', 'Laurel', 'Decree', 'Map', 'Medal', 'Chronicle']
      };
    }

    if (
      genre.indexOf('biograph') !== -1 ||
      genre.indexOf('nonfiction') !== -1 ||
      genre.indexOf('non-fiction') !== -1 ||
      genre.indexOf('memoir') !== -1
    ) {
      return {
        regions: ['The Scholar’s Archives', 'The Hall of Legends', 'The Great Athenaeum', 'The Chronicle Vault', 'The Gallery of Lives', 'The Memory Halls', 'The Archive of Truth'],
        titles: ['The Living Chronicle', 'The Keeper of Truth', 'The Unwritten Record', 'The Last Archivist', 'The Witness of Ages', 'The Voice of History', 'The Remembered One', 'The Scribe of Lives'],
        adjectives: ['Chronicle', 'Inkbound', 'Sage', 'Truthforged', 'Elder', 'Scholar', 'Golden', 'Remembered', 'Illuminated', 'Witnessed', 'Recorded', 'Enduring'],
        forms: ['Keeper', 'Colossus', 'Curator', 'Historian', 'Witness', 'Archivist', 'Scribe', 'Oracle', 'Biographer', 'Scholar', 'Narrator', 'Documentarian'],
        relics: ['Archive', 'Chronicle', 'Record', 'Seal', 'Tome', 'Lens', 'Map', 'Quill', 'Journal', 'Portrait', 'Testimony', 'Manuscript']
      };
    }

    return {
      regions: ['The Reading Realm', 'The Grand Library', 'The Lantern Stacks', 'The Endless Archive', 'The Quiet Halls', 'The Forgotten Shelves', 'The Golden Athenaeum', 'The Whispering Library', 'The Bookbound Isles', 'The Infinite Archive'],
      titles: ['The Last Librarian', 'The Inkbound Stranger', 'The Keeper of Pages', 'The Silent Reader', 'The Lost Bookmark', 'The Forgotten Book', 'The Keeper of Stories', 'The Wandering Scholar', 'The Last Storyteller', 'The Guardian of Words'],
      adjectives: ['Gilded', 'Inkbound', 'Moonlit', 'Dustbound', 'Cinder', 'Ivory', 'Starlit', 'Whispering', 'Forgotten', 'Ancient', 'Golden', 'Silent', 'Endless', 'Lost', 'Eternal'],
      forms: ['Guardian', 'Warden', 'Mimic', 'Scribe', 'Collector', 'Archivist', 'Raven', 'Golem', 'Scholar', 'Keeper', 'Librarian', 'Watcher', 'Seeker', 'Chronicler', 'Storyteller'],
      relics: ['Tome', 'Key', 'Lantern', 'Bookmark', 'Archive', 'Quill', 'Mirror', 'Vault', 'Scroll', 'Map', 'Chronicle', 'Ink', 'Seal', 'Codex', 'Manuscript']
    };
  }

  function create(book) {
    var seed = hash(
      String(book.id || '') + '|' +
      String(book.title || '') + '|' +
      String(book.author || '') + '|' +
      String(book.genre || '')
    );

    var set = theme(book);
    var word = titleWord(book.title, seed, 1);
    var pair = titlePair(book.title, seed);
    var adjective = pick(set.adjectives, seed, 2);
    var form = pick(set.forms, seed, 3);
    var relic = pick(set.relics, seed, 4);
    var title = pick(set.titles, seed, 5);
    var style = seed % 12;
    var name;

    if (style === 0) name = 'The ' + adjective + ' ' + word + ' ' + form;
    else if (style === 1) name = 'The ' + form + ' of ' + pair;
    else if (style === 2) name = title + ' of the ' + relic;
    else if (style === 3) name = 'The ' + adjective + ' ' + relic + 'keeper';
    else if (style === 4) name = 'The ' + word + 'bound ' + form;
    else if (style === 5) name = title + ': The ' + adjective + ' ' + form;
    else if (style === 6) name = 'The ' + relic + ' of ' + word;
    else if (style === 7) name = 'The ' + adjective + ' ' + form + ' of ' + pair;
    else if (style === 8) name = title;
    else if (style === 9) name = 'The ' + form + ' Beneath the ' + relic;
    else if (style === 10) name = 'The ' + word + ' of the ' + adjective + ' Court';
    else name = 'The ' + adjective + ' ' + relic + ' of ' + pair;

    return {
      bookId: book.id,
      titleFingerprint:
        String(book.title || '') + '|' +
        String(book.author || '') + '|' +
        String(book.genre || ''),
      name: name,
      region: pick(set.regions, seed, 6),
      createdAt: new Date().toISOString(),
      version: BOSS_VERSION
    };
  }

  function get(book) {
    if (!book || !book.id) {
      return { name: 'The Inkbound Guardian', region: 'The Reading Realm' };
    }

    var all = read(BOSS_KEY, '{}');
    var fingerprint =
      String(book.title || '') + '|' +
      String(book.author || '') + '|' +
      String(book.genre || '');

    if (
      !all[book.id] ||
      all[book.id].titleFingerprint !== fingerprint ||
      all[book.id].version !== BOSS_VERSION
    ) {
      all[book.id] = create(book);
      write(BOSS_KEY, all);
    }

    return all[book.id];
  }

  function victoryFireworkBurst(overlay, number) {
    var colors = ['#ffd369', '#ff7a18', '#ff4d6d', '#9c6bff', '#25c8ff', '#a9e34b'];
    var centerX = 28 + (number * 19) % 45;
    var centerY = number % 2 ? 31 : 43;

    for (var i = 0; i < 26; i += 1) {
      var angle = Math.PI * 2 * i / 26;
      var distance = 36 + Math.random() * 82;
      var pixel = document.createElement('i');

      pixel.className = 'boss-victory-firework';
      pixel.style.left = centerX + '%';
      pixel.style.top = centerY + '%';
      pixel.style.setProperty('--dx', Math.cos(angle) * distance + 'px');
      pixel.style.setProperty('--dy', Math.sin(angle) * distance + 'px');
      pixel.style.setProperty('--firework-color', colors[(i + number) % colors.length]);
      overlay.appendChild(pixel);

      setTimeout(function (item) {
        return function () { item.remove(); };
      }(pixel), 950);
    }
  }

  function victoryFireworks(overlay) {
    for (var burst = 0; burst < 5; burst += 1) {
      setTimeout(function (number) {
        return function () {
          if (overlay.isConnected) victoryFireworkBurst(overlay, number);
        };
      }(burst), burst * 220);
    }
  }

  function showVictory(book) {
    var boss = get(book);
    var old = document.getElementById('bossVictoryOverlay');
    if (old) old.remove();

    var overlay = document.createElement('section');
    overlay.id = 'bossVictoryOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = '<div class="boss-victory-card"><span class="boss-victory-kicker">Boss Defeated</span><h2></h2><p class="boss-victory-book"></p><div class="boss-victory-rewards"><b>★ Rewards Ready</b><span>Completion gold, a trophy, and a loot drop are ready to claim in Adventure.</span></div><button type="button">View Adventure Rewards</button></div>';
    overlay.querySelector('h2').textContent = boss.name;
    overlay.querySelector('.boss-victory-book').textContent = book.title || 'Your completed book';
    overlay.querySelector('button').onclick = function () {
      overlay.remove();
      var adventure = document.querySelector('#bottomNavigation [data-page="achievements"]');
      if (adventure) adventure.click();
    };

    document.body.appendChild(overlay);
    victoryFireworks(overlay);
  }

  function recordDefeat(book) {
    if (!book || !book.id) return;

    var events = read(EVENT_KEY, '{}');
    var key = 'bossDefeat:' + book.id;
    if (events[key]) return;

    var boss = get(book);
    events[key] = {
      id: key,
      bookId: book.id,
      bookTitle: book.title || 'Untitled',
      bossName: boss.name,
      defeatedAt: new Date().toISOString(),
      status: 'pending-claim'
    };

    write(EVENT_KEY, events);
    showVictory(book);
  }

  function patchCombatCard() {
    var card = document.querySelector('.adventure-combat-card');
    if (!card || card.dataset.bossNamePatched) return;

    var library;
    try {
      library = JSON.parse(localStorage.getItem('bookshelf-data') || '{"books":[]}').books || [];
    } catch (_) {
      library = [];
    }

    var active = library.filter(function (book) {
      return book.status === 'reading';
    })[0];

    var title = card.querySelector('.adventure-boss-top h2');
    if (!active || !title) return;

    var boss = get(active);
    title.textContent = boss.name;

    var meta = card.querySelector('.adventure-boss-meta span');
    if (meta) meta.textContent = boss.region;

    card.dataset.bossNamePatched = 'true';
  }

  function installSaveHook() {
    if (!window.BookStorage || window.BookStorage.__bossHookInstalled) return;

    var originalSave = window.BookStorage.saveBooks;
    window.BookStorage.saveBooks = async function (nextBooks) {
      var previous = await window.BookStorage.loadBooks();
      var result = await originalSave.call(window.BookStorage, nextBooks);

      (nextBooks || []).forEach(function (book) {
        var old = previous.filter(function (item) {
          return item.id === book.id;
        })[0];

        if (old && old.status === 'reading' && book.status === 'finished') {
          recordDefeat(book);
        }
      });

      return result;
    };

    window.BookStorage.__bossHookInstalled = true;
  }

  function install() {
    installSaveHook();

    var style = document.createElement('style');
    style.textContent = '#bossVictoryOverlay{position:fixed;z-index:1200;inset:0;display:grid;place-items:center;padding:24px;background:rgba(3,5,8,.82);backdrop-filter:blur(5px);overflow:hidden}.boss-victory-card{position:relative;z-index:2;width:min(390px,100%);padding:28px 22px;text-align:center;border:1px solid #d4a64f;border-radius:8px;background:radial-gradient(circle at 50% 0,rgba(212,166,79,.24),transparent 43%),#151a21;color:#f6f1e4;box-shadow:0 18px 60px rgba(0,0,0,.55)}.boss-victory-kicker{color:#d4a64f;font-size:11px;font-weight:bold;letter-spacing:.15em;text-transform:uppercase}.boss-victory-card h2{margin:10px 0 5px;font:27px Georgia,serif;color:#f5d58f}.boss-victory-book{margin:0;color:#b8b0a3;font-size:14px}.boss-victory-rewards{margin:22px 0;padding:14px;border-top:1px solid rgba(212,166,79,.25);border-bottom:1px solid rgba(212,166,79,.25)}.boss-victory-rewards b,.boss-victory-rewards span{display:block}.boss-victory-rewards b{color:#d4a64f;font:17px Georgia,serif}.boss-victory-rewards span{margin-top:5px;color:#b8b0a3;font-size:12px;line-height:1.4}.boss-victory-card button{width:100%;padding:11px;border:1px solid #d4a64f;border-radius:3px;background:#7c3134;color:#f6f1e4;font:inherit;font-weight:bold}.boss-victory-firework{position:absolute;z-index:3;width:7px;height:7px;background:var(--firework-color);box-shadow:0 0 12px var(--firework-color);pointer-events:none;animation:boss-victory-firework-pop .9s steps(8,end) forwards}@keyframes boss-victory-firework-pop{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}70%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(0)}}';
    document.head.appendChild(style);

    var page = document.getElementById('navPlaceholder');
    if (page) {
      new MutationObserver(function () {
        setTimeout(patchCombatCard, 0);
      }).observe(page, { childList: true, subtree: true });
    }

    window.addEventListener('bookshelf-reading-log-changed', function () {
      setTimeout(patchCombatCard, 0);
    });
  }

  window.BookShelfBosses = { get: get, recordDefeat: recordDefeat };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();
