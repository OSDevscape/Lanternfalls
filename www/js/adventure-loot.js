(function () {
  var LOOT_KEY = 'bookshelf-adventure-loot-v1';

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch (_) { return JSON.parse(fallback); }
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

  function lootFor(book) {
    var roll = hash(book.id + '|bookshelf-loot-v1') % 10000;
    var rarity = roll < 7000 ? 'Common' : roll < 9000 ? 'Uncommon' : roll < 9800 ? 'Rare' : roll < 9980 ? 'Epic' : roll < 9999 ? 'Legendary' : 'Mythic';
    var names = {
      Common:['Inkstone Charm','Paperbound Token','Reader’s Candle'],
      Uncommon:['Gilded Bookmark','Lantern of Focus','Wanderer’s Satchel'],
      Rare:['Archivist’s Key','Moonlit Quill','Chronicle Compass'],
      Epic:['Runeshelf Reliquary','Starlit Codex','Dragonhide Journal'],
      Legendary:['Crown of the First Library','Everscript Grimoire'],
      Mythic:['The Infinite Bookmark']
    };
    var list = names[rarity];
    return {
      rarity: rarity,
      name: list[hash(book.title + book.id) % list.length],
      theme: String(book.genre || '').trim() || 'Reader'
    };
  }

  function data() {
    var value = read(LOOT_KEY, '{"items":[],"events":[]}');
    value.items = value.items || [];
    value.events = value.events || [];
    return value;
  }

  function recordClaim(book, transaction) {
    if (!book || !book.id || !transaction) return;

    var value = data();
    var drop = lootFor(book);
    var changed = false;

    if (!value.items.some(function (item) { return item.bookId === book.id; })) {
      value.items.unshift({
        id: 'loot-' + book.id,
        bookId: book.id,
        bookTitle: book.title || 'Untitled',
        rarity: drop.rarity,
        name: drop.name,
        theme: drop.theme,
        earnedAt: transaction.createdAt || new Date().toISOString(),
        ledgerId: transaction.id
      });
      changed = true;
    }

    if (!value.events.some(function (event) { return event.bookId === book.id; })) {
      value.events.unshift({
        bookId: book.id,
        title: book.title || 'Untitled',
        xp: Number(transaction.xp) || 0,
        gold: Number(transaction.gold) || 0,
        loot: drop.name,
        rarity: drop.rarity,
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

  function getBooks() {
    try { return window.BookStorage.loadBooks(); }
    catch (_) { return Promise.resolve([]); }
  }

  function render() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.classList.contains('hidden') || !page.classList.contains('adventure-page') || page.dataset.lootRendering) return;
    var content = page.querySelector('.adventure-content');
    if (!content) return;

    page.dataset.lootRendering = 'true';
    Array.prototype.forEach.call(content.querySelectorAll('.adventure-trophies-card,.adventure-inventory-card'), function (card) { card.remove(); });

    var value = data();
    var trophies = document.createElement('section');
    trophies.className = 'adventure-card adventure-trophies-card';
    trophies.innerHTML = '<span class="adventure-label">Boss Trophies</span><h2>Defeated Bosses</h2>';

    if (!value.events.length) {
      trophies.innerHTML += '<p class="adventure-muted">Claim a completed book’s reward to earn your first boss trophy.</p>';
    } else {
      var trophyList = document.createElement('div');
      trophyList.className = 'adventure-trophy-list';
      value.events.slice(0, 5).forEach(function (event) {
        var row = document.createElement('div');
        row.className = 'adventure-trophy-item';
        row.innerHTML = '<div><b>★ ' + event.title + '</b><span>Boss defeated · +' + event.xp + ' XP</span></div><em>+' + event.gold + ' gold</em>';
        trophyList.appendChild(row);
      });
      trophies.appendChild(trophyList);
    }

    var inventory = document.createElement('section');
    inventory.className = 'adventure-card adventure-inventory-card';
    inventory.innerHTML = '<span class="adventure-label">Loot Inventory</span><h2>Collected Items</h2>';

    if (!value.items.length) {
      inventory.innerHTML += '<p class="adventure-muted">Claim completed-book rewards to earn cosmetic trophies and collectible items.</p>';
    } else {
      var itemList = document.createElement('div');
      itemList.className = 'adventure-loot-list';
      value.items.slice(0, 8).forEach(function (item) {
        var row = document.createElement('div');
        row.className = 'adventure-loot-item rarity-' + item.rarity.toLowerCase();
        row.innerHTML = '<b>' + item.name + '</b><span>' + item.rarity + ' · Earned from ' + item.bookTitle + '</span>';
        itemList.appendChild(row);
      });
      inventory.appendChild(itemList);
    }

    content.append(trophies, inventory);
    page.dataset.lootRendering = '';
  }

  function install() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.dataset.adventureLootReady) return;
    page.dataset.adventureLootReady = 'true';

    var style = document.createElement('style');
    style.textContent = '.adventure-trophies-card,.adventure-inventory-card{border-color:rgba(168,130,60,.52)}.adventure-trophy-list,.adventure-loot-list{margin-top:12px;border-top:1px solid rgba(168,130,60,.18)}.adventure-trophy-item{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid rgba(168,130,60,.15)}.adventure-trophy-item b,.adventure-trophy-item span{display:block}.adventure-trophy-item b{font:15px Georgia,serif;color:var(--gold,#A8823C)}.adventure-trophy-item span{margin-top:3px;color:var(--muted,#8A8378);font-size:11px}.adventure-trophy-item em{align-self:center;color:var(--gold,#A8823C);font-size:12px;font-style:normal;white-space:nowrap}.adventure-loot-item{padding:10px 0;border-bottom:1px solid rgba(168,130,60,.15)}.adventure-loot-item b,.adventure-loot-item span{display:block}.adventure-loot-item b{font:15px Georgia,serif}.adventure-loot-item span{margin-top:3px;color:var(--muted,#8A8378);font-size:11px}.rarity-uncommon b{color:#79bd8d}.rarity-rare b{color:#74a8e7}.rarity-epic b{color:#c28ad9}.rarity-legendary b,.rarity-mythic b{color:var(--gold,#A8823C)}';
    document.head.appendChild(style);

    new MutationObserver(function () { setTimeout(render, 0); }).observe(page, { childList:true });
    window.addEventListener('bookshelf-adventure-completion-claimed', function (event) {
      var detail = event.detail || {};
      recordClaim(detail.book, detail.transaction);
      render();
    });
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();