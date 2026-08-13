(function () {
  var LOG_KEY = 'bookshelf-reading-log-v1';
  var GAME_KEY = 'bookshelf-adventure-progression-v1';

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch (_) { return JSON.parse(fallback); }
  }

  function minutes(entry) { return Math.max(0, Math.floor(Number(entry && entry.minutes) || 0)); }

  function hash(value) {
    var number = 0;
    String(value || '').split('').forEach(function (character) {
      number = ((number << 5) - number) + character.charCodeAt(0);
      number |= 0;
    });
    return Math.abs(number);
  }

  function bossFor(book) {
    var genre = String(book.genre || '').toLowerCase();
    var map = [
      { word: 'fantasy', region: 'The Dragonlands', boss: 'The Emberbound Wyrm' },
      { word: 'science', region: 'The Astral Frontier', boss: 'The Voidglass Sentinel' },
      { word: 'mystery', region: 'The Shadow District', boss: 'The Lantern Veil Stalker' },
      { word: 'horror', region: 'The Dreadwood', boss: 'The Whispering Hollow' },
      { word: 'romance', region: 'The Heartlands', boss: 'The Roseglass Guardian' },
      { word: 'histor', region: 'The Ancient Kingdoms', boss: 'The Crownless Archivist' },
      { word: 'biography', region: 'The Hall of Legends', boss: 'The Chronicle Keeper' },
      { word: 'nonfiction', region: 'The Scholar’s Archives', boss: 'The Indexbound Colossus' },
      { word: 'thriller', region: 'The Dead City', boss: 'The Nightwire Hunter' },
      { word: 'adventure', region: 'The Wilds', boss: 'The Stormtrail Behemoth' }
    ];
    return map.filter(function (item) { return genre.indexOf(item.word) !== -1; })[0] || { region: 'The Reading Realm', boss: 'The Inkbound Guardian' };
  }

  function getBooks() {
    try { return window.BookStorage.loadBooks(); }
    catch (_) { return Promise.resolve([]); }
  }

  function latestSession(sessions) {
    return sessions.slice().sort(function (a, b) {
      return String(b.createdAt || b.endedAt || b.date || '').localeCompare(String(a.createdAt || a.endedAt || a.date || ''));
    })[0];
  }

  async function render() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.classList.contains('hidden') || !page.classList.contains('adventure-page')) return;
    var content = page.querySelector('.adventure-content');
    if (!content) return;

    var old = content.querySelector('.adventure-combat-card');
    if (old) old.remove();

    var books = await getBooks();
    if (!page.classList.contains('adventure-page')) return;

    var active = books.filter(function (book) { return book.status === 'reading'; })[0];
    var card = document.createElement('section');
    card.className = 'adventure-card adventure-combat-card';

    if (!active) {
      card.innerHTML = '<span class="adventure-label">Book Boss</span><h2>No active dungeon</h2><p class="adventure-muted">Mark a book as Reading to summon its boss and begin earning combat moments.</p>';
      content.appendChild(card);
      return;
    }

    var sessions = read(LOG_KEY, '[]').filter(function (entry) { return entry && entry.bookId === active.id; });
    var totalMinutes = sessions.reduce(function (total, entry) { return total + minutes(entry); }, 0);
    var latest = latestSession(sessions);
    var game = read(GAME_KEY, '{}');
    var strength = Math.max(10, Number((game.stats || {}).str) || 10);
    var luck = Math.max(10, Number((game.stats || {}).lck) || 10);
    var boss = bossFor(active);
    var combat = '';

    if (latest) {
      var reward = window.BookShelfRewards ? window.BookShelfRewards.calculateSession(latest) : { xp: minutes(latest) * 10, gold: Math.max(1, Math.floor(minutes(latest) / 2)), bonus: '' };
      var baseDamage = Math.floor(minutes(latest) * (1 + strength / 500));
      var critChance = Math.min(25, 5 + luck / 20);
      var critical = (hash(latest.id) % 10000) < Math.round(critChance * 100);
      var damage = critical ? Math.floor(baseDamage * 1.5) : baseDamage;
      var rewardNote = reward.bonus ? ' · ' + reward.bonus : '';
      combat = '<div class="adventure-combat-result"><span>' + (critical ? '✦ Critical Hit' : '⚔ Combat Result') + '</span><strong>' + damage + ' damage</strong><p>' + minutes(latest) + ' minutes · +' + reward.xp + ' XP · +' + reward.gold + ' gold' + rewardNote + '</p></div>';
    } else {
      combat = '<p class="adventure-muted">Log time for this book to create your first combat result.</p>';
    }

    card.innerHTML =
      '<div class="adventure-boss-top"><div><span class="adventure-label">Book Boss</span><h2>' + boss.boss + '</h2><p class="adventure-muted">' + active.title + '</p></div><b>⚔</b></div>' +
      '<div class="adventure-boss-meta"><span>' + boss.region + '</span><span>' + totalMinutes + ' minutes of momentum</span></div>' +
      combat +
      '<button type="button" class="adventure-combat-log">Log Time Against Boss</button>';

    var progression = content.querySelector('.adventure-progression-card');
    if (progression && progression.nextSibling) content.insertBefore(card, progression.nextSibling);
    else content.insertBefore(card, content.firstChild);

    card.querySelector('.adventure-combat-log').onclick = function () {
      var profileButton = document.querySelector('#bottomNavigation [data-page="profile"]');
      if (profileButton) profileButton.click();
    };
  }

  function install() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.dataset.adventureCombatReady) return;
    page.dataset.adventureCombatReady = 'true';

    var style = document.createElement('style');
    style.textContent = '.adventure-combat-card{border-color:rgba(168,130,60,.52)}.adventure-boss-top{display:flex;justify-content:space-between;gap:12px}.adventure-boss-top h2{margin-bottom:3px}.adventure-boss-top>b{color:var(--gold,#A8823C);font-size:31px}.adventure-boss-meta{display:flex;justify-content:space-between;gap:10px;margin-top:12px;padding:9px 0;border-top:1px solid rgba(168,130,60,.18);border-bottom:1px solid rgba(168,130,60,.18);color:var(--muted,#8A8378);font-size:11px}.adventure-combat-result{margin-top:12px;padding:12px;border-left:3px solid var(--gold,#A8823C);background:rgba(0,0,0,.13)}.adventure-combat-result span,.adventure-combat-result strong{display:block}.adventure-combat-result span{color:var(--gold,#A8823C);font-size:11px;text-transform:uppercase}.adventure-combat-result strong{margin-top:4px;font:22px Georgia,serif}.adventure-combat-result p{margin:4px 0 0;color:var(--muted,#8A8378);font-size:12px}.adventure-combat-log{width:100%;margin-top:13px;padding:11px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4)}';
    document.head.appendChild(style);

    new MutationObserver(function () { setTimeout(render, 0); }).observe(page, { childList: true });
    window.addEventListener('bookshelf-reading-log-changed', render);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();