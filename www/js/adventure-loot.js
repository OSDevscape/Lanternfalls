(function () {
  var LOOT_KEY = 'bookshelf-adventure-loot-v1';
  var RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];

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

  function tooltipButton(message, label) {
    return '<button type="button" class="adventure-loot-tooltip" data-tooltip="' +
      message +
      '" aria-label="' +
      label +
      '" aria-expanded="false">ⓘ</button>';
  }

  function hash(value) {
    var number = 0;

    String(value || '').split('').forEach(function (character) {
      number = ((number << 5) - number) + character.charCodeAt(0);
      number |= 0;
    });

    return Math.abs(number);
  }

  function rarityForRoll(roll) {
    return roll < 7000
      ? 'Common'
      : roll < 9000
        ? 'Uncommon'
        : roll < 9800
          ? 'Rare'
          : roll < 9980
            ? 'Epic'
            : roll < 9999
              ? 'Legendary'
              : 'Mythic';
  }

  function rarityFloor(lootLuck) {
    var boost = Math.max(0, Math.floor(Number(lootLuck) || 0));

    if (boost >= 3) return 'Epic';
    if (boost >= 2) return 'Rare';
    if (boost >= 1) return 'Uncommon';

    return 'Common';
  }

  function higherRarity(first, second) {
    return RARITIES.indexOf(first) >= RARITIES.indexOf(second)
      ? first
      : second;
  }

  function lootFor(book, lootLuck) {
    var roll = hash(book.id + '|bookshelf-loot-v1') % 10000;
    var naturalRarity = rarityForRoll(roll);
    var floor = rarityFloor(lootLuck);
    var rarity = higherRarity(naturalRarity, floor);

    var names = {
      Common: ['Inkstone Charm', 'Paperbound Token', 'Reader’s Candle'],
      Uncommon: ['Gilded Bookmark', 'Lantern of Focus', 'Wanderer’s Satchel'],
      Rare: ['Archivist’s Key', 'Moonlit Quill', 'Chronicle Compass'],
      Epic: ['Runeshelf Reliquary', 'Starlit Codex', 'Dragonhide Journal'],
      Legendary: ['Crown of the First Library', 'Everscript Grimoire'],
      Mythic: ['The Infinite Bookmark']
    };

    var list = names[rarity];

    return {
      rarity: rarity,
      naturalRarity: naturalRarity,
      rarityFloor: floor,
      wasEnhanced: RARITIES.indexOf(rarity) > RARITIES.indexOf(naturalRarity),
      name: list[hash(book.title + book.id) % list.length],
      theme: String(book.genre || '').trim() || 'Reader'
    };
  }

  function data() {
    var value = read(
      LOOT_KEY,
      '{"items":[],"events":[],"relics":{},"equippedItemId":""}'
    );

    value.items = Array.isArray(value.items) ? value.items : [];
    value.events = Array.isArray(value.events) ? value.events : [];

    value.relics = value.relics &&
      typeof value.relics === 'object' &&
      !Array.isArray(value.relics)
      ? value.relics
      : {};

    value.equippedItemId = String(value.equippedItemId || '');

    value.items.forEach(function (item) {
      if (!item) return;

      item.instanceId = String(
        item.instanceId ||
        item.id ||
        ('loot-' + String(item.bookId || item.name || 'unknown'))
      );
    });

    return value;
  }

  function saveEquipment(value) {
    write(LOOT_KEY, value);

    window.dispatchEvent(
      new Event('bookshelf-adventure-equipment-changed')
    );
  }

  function artifactEffect(item) {
    var name = String((item || {}).name || '');

    var effects = {
      'Inkstone Charm': {
        label: '+2 XP on every claimed reading session',
        type: 'flat-session-xp',
        value: 2
      },
      'Paperbound Token': {
        label: '+1 gold on every claimed reading session',
        type: 'flat-session-gold',
        value: 1
      },
      'Reader’s Candle': {
        label: '+1 XP and +1 gold on every claimed reading session',
        type: 'balanced-session',
        value: 1
      },
      'Gilded Bookmark': {
        label: '+5% XP on claimed reading sessions',
        type: 'percent-session-xp',
        value: 5
      },
      'Lantern of Focus': {
        label: '+5% gold on claimed reading sessions',
        type: 'percent-session-gold',
        value: 5
      },
      'Wanderer’s Satchel': {
        label: '+1 gold on claimed sessions of 30+ minutes',
        type: 'long-session-gold',
        value: 1
      },
      'Moonlit Quill': {
        label: '+10% XP on claimed reading sessions',
        type: 'percent-session-xp',
        value: 10
      },
      'Archivist’s Key': {
        label: '+10% gold on claimed reading sessions',
        type: 'percent-session-gold',
        value: 10
      },
      'Chronicle Compass': {
        label: '+5% critical-hit chance in reading encounters',
        type: 'critical-chance',
        value: 5
      },
      'Runeshelf Reliquary': {
        label: '+15% XP on claimed reading sessions and +1 gold',
        type: 'epic-xp-gold',
        value: 15
      },
      'Starlit Codex': {
        label: '+15% gold on claimed sessions',
        type: 'percent-session-gold',
        value: 15
      },
      'Dragonhide Journal': {
        label: '+10% XP and +10% gold on claimed sessions',
        type: 'percent-session-balanced',
        value: 10
      },
      'Crown of the First Library': {
        label: '+20% XP on claimed reading sessions',
        type: 'percent-session-xp',
        value: 20
      },
      'Everscript Grimoire': {
        label: '+20% gold on claimed sessions',
        type: 'percent-session-gold',
        value: 20
      },
      'The Infinite Bookmark': {
        label: '+15% XP and +15% gold on claimed sessions',
        type: 'percent-session-balanced',
        value: 15
      }
    };

    return effects[name] || {
      label: 'A permanent trophy from a completed book',
      type: 'none',
      value: 0
    };
  }

  function equippedItem(value) {
    var equippedId = String((value || {}).equippedItemId || '');

    if (!equippedId) {
      return null;
    }

    return (value.items || []).filter(function (item) {
      return String(item.instanceId || item.id) === equippedId;
    })[0] || null;
  }

  function saveEquipment(value) {
    write(LOOT_KEY, value);
    window.dispatchEvent(new Event('bookshelf-adventure-equipment-changed'));
  }

  function updateLedgerLoot(transaction, drop) {
    if (!transaction || !transaction.id) return;

    try {
      var ledger = read(
        'bookshelf-adventure-ledger-v1',
        '{"version":1,"transactions":{}}'
      );

      ledger.transactions = ledger.transactions || {};

      if (!ledger.transactions[transaction.id]) return;

      ledger.transactions[transaction.id].lootName = drop.name;
      ledger.transactions[transaction.id].lootRarity = drop.rarity;
      ledger.transactions[transaction.id].lootTheme = drop.theme;
      ledger.transactions[transaction.id].lootNaturalRarity = drop.naturalRarity;
      ledger.transactions[transaction.id].lootEnhanced = drop.wasEnhanced;

      write('bookshelf-adventure-ledger-v1', ledger);
    } catch (_) { }
  }

  function recordClaim(book, transaction) {
    if (!book || !book.id || !transaction) return;

    var value = data();
    var drop = lootFor(book, transaction.bazaarLootLuck);
    var changed = false;

    transaction.lootName = drop.name;
    transaction.lootRarity = drop.rarity;
    transaction.lootTheme = drop.theme;
    transaction.lootNaturalRarity = drop.naturalRarity;
    transaction.lootEnhanced = drop.wasEnhanced;

    updateLedgerLoot(transaction, drop);

    if (!value.items.some(function (item) {
      return item.bookId === book.id;
    })) {
      value.items.unshift({
        id: 'loot-' + book.id,
        instanceId: 'loot-' + book.id,
        bookId: book.id,
        bookTitle: book.title || 'Untitled',
        rarity: drop.rarity,
        naturalRarity: drop.naturalRarity,
        enhanced: drop.wasEnhanced,
        name: drop.name,
        theme: drop.theme,
        earnedAt: transaction.createdAt || new Date().toISOString(),
        ledgerId: transaction.id
      });

      changed = true;
    }

    if (!value.events.some(function (event) {
      return event.bookId === book.id;
    })) {
      value.events.unshift({
        bookId: book.id,
        title: book.title || 'Untitled',
        xp: Number(transaction.xp) || 0,
        gold: Number(transaction.gold) || 0,
        loot: drop.name,
        rarity: drop.rarity,
        naturalRarity: drop.naturalRarity,
        enhanced: drop.wasEnhanced,
        earnedAt: transaction.createdAt || new Date().toISOString(),
        ledgerId: transaction.id
      });

      changed = true;
    }

    if (changed) {
      value.items = value.items.slice(0, 50);
      value.events = value.events.slice(0, 20);
      write(LOOT_KEY, value);
    }
  }

  function render() {
  var page = document.getElementById('navPlaceholder');

  if (
    !page ||
    page.classList.contains('hidden') ||
    !page.classList.contains('adventure-page') ||
    page.dataset.lootRendering
  ) {
    return;
  }

  var content = page.querySelector('.adventure-content');

  if (!content) {
    return;
  }

  page.dataset.lootRendering = 'true';

  Array.prototype.forEach.call(
    content.querySelectorAll(
      '.adventure-trophies-card,' +
      '.adventure-inventory-card,' +
      '.adventure-relics-card,' +
      '.adventure-relic-inventory-card'
    ),
    function (card) {
      card.remove();
    }
  );

  page.dataset.lootRendering = '';
}

  function install() {
    var page = document.getElementById('navPlaceholder');

    if (!page || page.dataset.adventureLootReady) return;
    page.dataset.adventureLootReady = 'true';

    var style = document.createElement('style');

    style.textContent =
      '.adventure-trophies-card,.adventure-inventory-card{border-color:rgba(168,130,60,.52)}' +
      '.adventure-loot-tooltip{display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;margin-left:4px;padding:0;border:1px solid currentColor;border-radius:50%;background:transparent;color:inherit;font:700 10px/1 sans-serif;vertical-align:middle;cursor:pointer}' +
      '.adventure-loot-tooltip:focus-visible{outline:2px solid var(--gold,#A8823C);outline-offset:2px}' +
      '.adventure-trophy-list,.adventure-loot-list{margin-top:12px;border-top:1px solid rgba(168,130,60,.18)}' +
      '.adventure-trophy-item{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid rgba(168,130,60,.15)}' +
      '.adventure-trophy-item b,.adventure-trophy-item span{display:block}' +
      '.adventure-trophy-item b{font:15px Georgia,serif;color:var(--gold,#A8823C)}' +
      '.adventure-trophy-item span{margin-top:3px;color:var(--muted,#8A8378);font-size:11px}' +
      '.adventure-trophy-item em{align-self:center;color:var(--gold,#A8823C);font-size:12px;font-style:normal;white-space:nowrap}' +
      '.adventure-loot-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid rgba(168,130,60,.15)}' +
      '.adventure-loot-item-copy{min-width:0;flex:1}' +
      '.adventure-loot-item-copy small{display:block;margin-top:4px;color:var(--gold,#A8823C);font-size:10px;line-height:1.35}' +
      '.adventure-loot-equip{flex:0 0 auto;padding:7px 8px;border:1px solid rgba(168,130,60,.55);border-radius:3px;background:transparent;color:var(--gold,#A8823C);font:11px var(--font-body,-apple-system);cursor:pointer}' +
      '.adventure-loot-equip.is-equipped{border-color:var(--gold,#A8823C);background:rgba(168,130,60,.17);color:var(--paper-light,#F6F1E4)}' +
      '.adventure-loot-equip:active{transform:translateY(1px)}' +
      '.adventure-loot-equip:focus-visible{outline:2px solid var(--gold,#A8823C);outline-offset:2px}' +
      '.adventure-loot-item b,.adventure-loot-item span,.adventure-loot-item small{display:block}' +
      '.adventure-loot-item b{font:15px Georgia,serif}' +
      '.adventure-loot-item span{margin-top:3px;color:var(--muted,#8A8378);font-size:11px}' + '.adventure-loot-item{display:flex;align-items:center;justify-content:space-between;gap:10px}' +
      '.adventure-loot-item-copy{min-width:0;flex:1}' +
      '.adventure-loot-item-copy small{display:block;margin-top:4px;color:var(--gold,#A8823C);font-size:10px;line-height:1.35}' +
      '.adventure-loot-equip{flex:0 0 auto;padding:7px 8px;border:1px solid rgba(168,130,60,.55);border-radius:3px;background:transparent;color:var(--gold,#A8823C);font:11px var(--font-body,-apple-system);cursor:pointer}' +
      '.adventure-loot-equip:active{transform:translateY(1px)}' +
      '.rarity-uncommon b{color:#79bd8d}' +
      '.rarity-rare b{color:#74a8e7}' +
      '.rarity-epic b{color:#c28ad9}' +
      '.rarity-legendary b{color:var(--gold,#A8823C)}' + '.rarity-mythic b{color:#e55353}';

    document.head.appendChild(style);

    new MutationObserver(function () {
      setTimeout(render, 0);
    }).observe(page, { childList: true });

    window.addEventListener('bookshelf-adventure-completion-claimed', function (event) {
      var detail = event.detail || {};

      recordClaim(detail.book, detail.transaction);
      render();
    });

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();