(function () {
  var BOSS_KEY = 'bookshelf-book-bosses-v1';
  var EVENT_KEY = 'bookshelf-boss-events-v1';

  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || fallback); } catch (_) { return JSON.parse(fallback); } }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function hash(value) {
    var number = 2166136261;
    String(value || '').split('').forEach(function (character) { number ^= character.charCodeAt(0); number += (number << 1) + (number << 4) + (number << 7) + (number << 8) + (number << 24); });
    return Math.abs(number >>> 0);
  }
  function pick(list, seed, offset) { return list[(seed + offset) % list.length]; }
  function titleWord(title) {
    var ignored = { the:true, a:true, an:true, and:true, of:true, in:true, to:true, for:true, on:true, with:true, at:true, from:true, by:true };
    var words = String(title || '').replace(/[^a-z0-9\s]/gi, ' ').split(/\s+/).filter(function (word) { return word && !ignored[word.toLowerCase()]; });
    return words.length ? words[hash(title) % words.length] : 'Ink';
  }
  function theme(book) {
    var genre = String(book.genre || '').toLowerCase();
    if (genre.indexOf('fantasy') !== -1) return { regions:['The Dragonlands','The Moonlit Marches'], adjectives:['Emberbound','Runebound','Thorncrowned'], forms:['Wyrm','Warden','Revenant'] };
    if (genre.indexOf('science') !== -1 || genre.indexOf('sci-fi') !== -1) return { regions:['The Astral Frontier','The Nebula Reach'], adjectives:['Starforged','Voidglass','Astral'], forms:['Sentinel','Navigator','Colossus'] };
    if (genre.indexOf('mystery') !== -1 || genre.indexOf('crime') !== -1) return { regions:['The Shadow District','The Gaslamp Quarter'], adjectives:['Candleveil','Whispering','Masked'], forms:['Pursuer','Witness','Sleuth'] };
    if (genre.indexOf('horror') !== -1) return { regions:['The Dreadwood','The Hollow Deep'], adjectives:['Pale','Whispering','Gravebound'], forms:['Stalker','Hollow','Nightmare'] };
    if (genre.indexOf('romance') !== -1) return { regions:['The Heartlands','The Rose Court'], adjectives:['Roseglass','Velvet','Gilded'], forms:['Guardian','Duelist','Envoy'] };
    if (genre.indexOf('thriller') !== -1) return { regions:['The Dead City','The Midnight Run'], adjectives:['Nightwire','Steelshadow','Ashen'], forms:['Hunter','Operative','Phantom'] };
    if (genre.indexOf('history') !== -1 || genre.indexOf('histor') !== -1) return { regions:['The Ancient Kingdoms','The Lost Archive'], adjectives:['Crownless','Bronze','Oathbound'], forms:['Archivist','Monarch','Standard-Bearer'] };
    if (genre.indexOf('biograph') !== -1 || genre.indexOf('nonfiction') !== -1) return { regions:['The Scholar’s Archives','The Hall of Legends'], adjectives:['Chronicle','Inkbound','Sage'], forms:['Keeper','Colossus','Curator'] };
    return { regions:['The Reading Realm','The Grand Library'], adjectives:['Gilded','Inkbound','Moonlit'], forms:['Guardian','Warden','Mimic'] };
  }
  function create(book) {
    var seed = hash(String(book.id || '') + '|' + String(book.title || '') + '|' + String(book.genre || ''));
    var set = theme(book), word = titleWord(book.title), style = seed % 3;
    var name = style === 0 ? 'The ' + pick(set.adjectives, seed, 1) + ' ' + word + ' ' + pick(set.forms, seed, 2) : style === 1 ? 'The ' + word + ' of the ' + pick(set.adjectives, seed, 3) + ' Veil' : 'The ' + pick(set.adjectives, seed, 4) + ' ' + pick(set.forms, seed, 5) + ' of ' + word;
    return { bookId:book.id, titleFingerprint:String(book.title || '') + '|' + String(book.genre || ''), name:name, region:pick(set.regions, seed, 6), createdAt:new Date().toISOString(), version:1 };
  }
  function get(book) {
    if (!book || !book.id) return { name:'The Inkbound Guardian', region:'The Reading Realm' };
    var all = read(BOSS_KEY, '{}'), fingerprint = String(book.title || '') + '|' + String(book.genre || '');
    if (!all[book.id] || all[book.id].titleFingerprint !== fingerprint) { all[book.id] = create(book); write(BOSS_KEY, all); }
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
    var boss = get(book), old = document.getElementById('bossVictoryOverlay'); if (old) old.remove();
    var overlay = document.createElement('section'); overlay.id = 'bossVictoryOverlay'; overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true');
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
    var events = read(EVENT_KEY, '{}'), key = 'bossDefeat:' + book.id;
    if (events[key]) return;
    var boss = get(book);
    events[key] = { id:key, bookId:book.id, bookTitle:book.title || 'Untitled', bossName:boss.name, defeatedAt:new Date().toISOString(), status:'pending-claim' };
    write(EVENT_KEY, events); showVictory(book);
  }
  function patchCombatCard() {
    var card = document.querySelector('.adventure-combat-card'); if (!card || card.dataset.bossNamePatched) return;
    var library; try { library = JSON.parse(localStorage.getItem('bookshelf-data') || '{"books":[]}').books || []; } catch (_) { library = []; }
    var active = library.filter(function (book) { return book.status === 'reading'; })[0];
    var title = card.querySelector('.adventure-boss-top h2'); if (!active || !title) return;
    var boss = get(active); title.textContent = boss.name;
    var meta = card.querySelector('.adventure-boss-meta span'); if (meta) meta.textContent = boss.region;
    card.dataset.bossNamePatched = 'true';
  }
  function installSaveHook() {
    if (!window.BookStorage || window.BookStorage.__bossHookInstalled) return;
    var originalSave = window.BookStorage.saveBooks;
    window.BookStorage.saveBooks = async function (nextBooks) {
      var previous = await window.BookStorage.loadBooks();
      var result = await originalSave.call(window.BookStorage, nextBooks);
      (nextBooks || []).forEach(function (book) {
        var old = previous.filter(function (item) { return item.id === book.id; })[0];
        if (old && old.status === 'reading' && book.status === 'finished') recordDefeat(book);
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
    var page = document.getElementById('navPlaceholder'); if (page) new MutationObserver(function () { setTimeout(patchCombatCard, 0); }).observe(page, { childList:true, subtree:true });
    window.addEventListener('bookshelf-reading-log-changed', function () { setTimeout(patchCombatCard, 0); });
  }
  window.BookShelfBosses = { get:get, recordDefeat:recordDefeat };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();