(function () {
  var LOOT_KEY = 'bookshelf-adventure-loot-v1';
  var GAME_KEY = 'bookshelf-adventure-progression-v1';
  var LOG_KEY = 'bookshelf-reading-log-v1';

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch (_) { return JSON.parse(fallback); }
  }

  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

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
    var genre = String(book.genre || '').trim() || 'Reader';
    var names = {
      Common: ['Inkstone Charm', 'Paperbound Token', 'Reader’s Candle'],
      Uncommon: ['Gilded Bookmark', 'Lantern of Focus', 'Wanderer’s Satchel'],
      Rare: ['Archivist’s Key', 'Moonlit Quill', 'Chronicle Compass'],
      Epic: ['Runeshelf Reliquary', 'Starlit Codex', 'Dragonhide Journal'],
      Legendary: ['Crown of the First Library', 'Everscript Grimoire'],
      Mythic: ['The Infinite Bookmark']
    };
    var list = names[rarity];
    return { rarity: rarity, name: list[hash(book.title + book.id) % list.length], theme: genre };
  }

  function bookMinutes(bookId) {
    return read(LOG_KEY, '[]').reduce(function (total, session) {
      return total + (session && session.bookId === bookId ? Math.max(0, Number(session.minutes) || 0) : 0);
    }, 0);
  }

  function getBooks() {
    try { return window.BookStorage.loadBooks(); }
    catch (_) { return Promise.resolve([]); }
  }

  async function render() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.classList.contains('hidden') || !page.classList.contains('adventure-page')) return;
    var content = page.querySelector('.adventure-content');
    if (!content) return;

    Array.prototype.forEach.call(content.querySelectorAll('.adventure-trophies-card, .adventure-inventory-card'), function (card) {
      card.remove();
    });

    var books = await getBooks();
    if (!page.classList.contains('adventure-page')) return;

    var data = read(LOOT_KEY, '{"known":{},"items":[],"events":[]}');
    data.known = data.known || {};
    data.items = data.items || [];
    data.events = data.events || [];
    var firstRun = !data.initialized;
    var changed = false;

    books.forEach(function (book) {
      var prior = data.known[book.id];
      var current = book.status || 'to-read';
      data.known[book.id] = current;

      if (!firstRun && prior !== 'finished' && current === 'finished') {
        var reward = lootFor(book);
        var minutes = bookMinutes(book.id);
        var completionGold = 100 + Math.floor(minutes / 2);
        var game = read(GAME_KEY, '{}');
        game.gold = (Number(game.gold) || 0) + completionGold;
        write(GAME_KEY, game);

        data.items.unshift({ id: 'loot-' + book.id, bookId: book.id, bookTitle: book.title || 'Untitled', rarity: reward.rarity, name: reward.name, theme: reward.theme, earnedAt: new Date().toISOString() });
        data.events.unshift({ bookId: book.id, title: book.title || 'Untitled', gold: completionGold, loot: reward.name, rarity: reward.rarity, earnedAt: new Date().toISOString() });
        changed = true;
      }
    });

    data.initialized = true;
    data.items = data.items.slice(0, 50);
    data.events = data.events.slice(0, 20);
    if (firstRun || changed) write(LOOT_KEY, data);

    var trophies = document.createElement('section');
    trophies.className = 'adventure-card adventure-trophies-card';
    trophies.innerHTML = '<span class="adventure-label">Boss Trophies</span><h2>Defeated Bosses</h2>';

    if (!data.events.length) {
      trophies.innerHTML += '<p class="adventure-muted">Finish a Reading book after this feature is installed to earn your first boss trophy.</p>';
    } else {
      var trophyList = document.createElement('div');
      trophyList.className = 'adventure-trophy-list';
      data.events.slice(0, 5).forEach(function (event) {
        var row = document.createElement('div');
        row.className = 'adventure-trophy-item';
        row.innerHTML = '<div><b>★ ' + event.title + '</b><span>Boss defeated</span></div><em>+' + event.gold + ' gold</em>';
        trophyList.appendChild(row);
      });
      trophies.appendChild(trophyList);
    }

    var inventory = document.createElement('section');
    inventory.className = 'adventure-card adventure-inventory-card';
    inventory.innerHTML = '<span class="adventure-label">Loot Inventory</span><h2>Collected Items</h2>';

    if (!data.items.length) {
      inventory.innerHTML += '<p class="adventure-muted">Bosses can drop cosmetic trophies and collectible items when you complete a book.</p>';
    } else {
      var itemList = document.createElement('div');
      itemList.className = 'adventure-loot-list';
      data.items.slice(0, 8).forEach(function (item) {
        var row = document.createElement('div');
        row.className = 'adventure-loot-item rarity-' + item.rarity.toLowerCase();
        row.innerHTML = '<b>' + item.name + '</b><span>' + item.rarity + ' · Earned from ' + item.bookTitle + '</span>';
        itemList.appendChild(row);
      });
      inventory.appendChild(itemList);
    }

    content.append(trophies, inventory);
  }

  function install() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.dataset.adventureLootReady) return;
    page.dataset.adventureLootReady = 'true';

    var style = document.createElement('style');
    style.textContent = '.adventure-trophies-card,.adventure-inventory-card{border-color:rgba(168,130,60,.52)}.adventure-trophy-list,.adventure-loot-list{margin-top:12px;border-top:1px solid rgba(168,130,60,.18)}.adventure-trophy-item{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid rgba(168,130,60,.15)}.adventure-trophy-item b,.adventure-trophy-item span{display:block}.adventure-trophy-item b{font:15px Georgia,serif;color:var(--gold,#A8823C)}.adventure-trophy-item span{margin-top:3px;color:var(--muted,#8A8378);font-size:11px}.adventure-trophy-item em{align-self:center;color:var(--gold,#A8823C);font-size:12px;font-style:normal;white-space:nowrap}.adventure-loot-item{padding:10px 0;border-bottom:1px solid rgba(168,130,60,.15)}.adventure-loot-item b,.adventure-loot-item span{display:block}.adventure-loot-item b{font:15px Georgia,serif}.adventure-loot-item span{margin-top:3px;color:var(--muted,#8A8378);font-size:11px}.rarity-uncommon b{color:#79bd8d}.rarity-rare b{color:#74a8e7}.rarity-epic b{color:#c28ad9}.rarity-legendary b,.rarity-mythic b{color:var(--gold,#A8823C)}';
    document.head.appendChild(style);

    new MutationObserver(function () { setTimeout(render, 0); }).observe(page, { childList: true });
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();