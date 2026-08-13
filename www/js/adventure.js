(function () {
  var KEY = 'bookshelf-adventure-v1';
  var GAME_KEY = 'bookshelf-adventure-progression-v1';
  var LOG_KEY = 'bookshelf-reading-log-v1';
  var LOOT_KEY = 'bookshelf-adventure-loot-v1';
  var CLASSES = ['Scholar', 'Warrior', 'Mage', 'Rogue', 'Ranger', 'Bard'];

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch (_) { return JSON.parse(fallback); }
  }

  function save(profile) { localStorage.setItem(KEY, JSON.stringify(profile)); }

  function library() {
    try { return JSON.parse(localStorage.getItem('bookshelf-data') || '{"books":[]}').books || []; }
    catch (_) { return []; }
  }

  function levelFor(xp) { return Math.max(1, Math.floor(Math.sqrt((Math.max(0, Number(xp) || 0) + 100) / 100))); }

  function totalMinutes(log) {
    return log.reduce(function (total, entry) { return total + Math.max(0, Math.floor(Number((entry || {}).minutes) || 0)); }, 0);
  }

  function completionCount(data) { return (data.events || []).length; }

  function achievementRow(done, title, detail) {
    return '<div class="adventure-achievement ' + (done ? 'earned' : '') + '"><b>' + (done ? '✓' : '○') + ' ' + title + '</b><span>' + detail + '</span></div>';
  }

  function render() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.classList.contains('hidden')) return;

    var profile = read(KEY, '{}');
    var books = library();
    var log = read(LOG_KEY, '[]');
    var game = read(GAME_KEY, '{}');
    var loot = read(LOOT_KEY, '{"items":[],"events":[]}');
    var finished = books.filter(function (book) { return book.status === 'finished'; }).length;
    var reading = books.filter(function (book) { return book.status === 'reading'; })[0];
    var chosen = profile.className || '';
    var minutes = totalMinutes(log);
    var level = levelFor(game.xp);
    var trophies = completionCount(loot);
    var classButtons = CLASSES.map(function (name) {
      return '<button type="button" class="adventure-class ' + (chosen === name ? 'selected' : '') + '" data-adventure-class="' + name + '">' + name + '</button>';
    }).join('');

    page.innerHTML = '';
    page.classList.remove('reading-profile-page');
    page.classList.add('adventure-page');
    page.innerHTML =
      '<header class="adventure-header"><div><h1>Adventure</h1><p>Read minutes. Become legendary.</p></div><span>⚔</span></header>' +
      '<main class="adventure-content">' +
      '<section class="adventure-card"><span class="adventure-label">Character</span><h2>' + (profile.name || 'Your Reader') + '</h2><p class="adventure-muted">' + (chosen ? chosen + ' class · Level ' + level : 'Choose a class to begin your journey.') + '</p></section>' +
      '<section class="adventure-card"><span class="adventure-label">Current Reading Quest</span><h2>' + (reading ? reading.title : 'Choose your next book') + '</h2><p class="adventure-muted">' + (reading ? 'Log time to build momentum against this book’s boss.' : 'Mark a book as Reading to begin an adventure.') + '</p></section>' +
      '<section class="adventure-grid"><section class="adventure-card"><span class="adventure-label">Reading Time</span><h2>' + minutes + '</h2><p class="adventure-muted">minutes recorded</p></section><section class="adventure-card"><span class="adventure-label">Completed</span><h2>' + finished + '</h2><p class="adventure-muted">books finished</p></section></section>' +
      '<details class="adventure-card" ' + (chosen ? '' : 'open') + '><summary>Choose Class <em>' + (chosen || 'None') + '</em></summary><p class="adventure-muted">Classes shape rewards and presentation; they never change your actual reading record.</p><div class="adventure-classes">' + classButtons + '</div></details>' +
      '<details class="adventure-card"><summary>Achievements <em>' + [minutes >= 10, books.length >= 1, finished >= 1, finished >= 10, level >= 10, trophies >= 1].filter(Boolean).length + ' earned</em></summary>' +
      achievementRow(minutes >= 10, 'First Minutes', minutes + ' / 10 minutes recorded') +
      achievementRow(books.length >= 1, 'First Chapter', books.length + ' / 1 book cataloged') +
      achievementRow(finished >= 1, 'First Tale Complete', finished + ' / 1 book completed') +
      achievementRow(finished >= 10, 'Bookworm', finished + ' / 10 books completed') +
      achievementRow(level >= 10, 'Rising Legend', 'Level ' + level + ' / 10') +
      achievementRow(trophies >= 1, 'Boss Slayer', trophies + ' / 1 boss trophy') +
      '</details>' +
      '</main>';

    page.querySelectorAll('[data-adventure-class]').forEach(function (button) {
      button.onclick = function () {
        var updated = read(KEY, '{}');
        updated.className = button.dataset.adventureClass;
        save(updated);
        render();
      };
    });
  }

  function install() {
    var nav = document.getElementById('bottomNavigation');
    if (!nav || nav.dataset.adventureReady) return;
    nav.dataset.adventureReady = 'true';

    var tab = nav.querySelector('[data-page="achievements"]');
    if (tab) {
      tab.setAttribute('aria-label', 'Open Adventure');
      tab.innerHTML = '<i>⚔</i>Adventure';
    }

    var style = document.createElement('style');
    style.textContent = '#navPlaceholder.adventure-page{display:flex;flex-direction:column;padding:0;overflow:hidden;background:var(--bg,#14181C)}.adventure-header{display:flex;align-items:center;justify-content:space-between;padding:20px;border-bottom:1px solid rgba(168,130,60,.24)}.adventure-header h1{margin:0;font:27px Georgia,serif}.adventure-header p{margin:4px 0 0;color:var(--muted,#8A8378);font-size:12px}.adventure-header span{color:var(--gold,#A8823C);font-size:29px}.adventure-content{flex:1;overflow:auto;padding:16px 20px 130px}.adventure-card{margin:0 0 13px;padding:16px;background:var(--bg-elevated,#1B2129);border:1px solid rgba(168,130,60,.28);border-radius:4px}.adventure-card h2{margin:5px 0;font:21px Georgia,serif}.adventure-label{color:var(--gold,#A8823C);font-size:11px;letter-spacing:.08em;text-transform:uppercase}.adventure-muted{margin:7px 0 0;color:var(--muted,#8A8378);font-size:13px;line-height:1.4}.adventure-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.adventure-grid .adventure-card{min-width:0}.adventure-grid h2{font-size:26px}details summary{display:flex;justify-content:space-between;cursor:pointer;font:17px Georgia,serif}details summary em{color:var(--muted,#8A8378);font:11px var(--font-body,-apple-system);font-style:normal}.adventure-classes{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.adventure-class{padding:10px;border:1px solid rgba(168,130,60,.48);border-radius:3px;background:transparent;color:var(--paper-light,#F6F1E4)}.adventure-class.selected{background:var(--gold,#A8823C);border-color:var(--gold,#A8823C)}.adventure-achievement{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid rgba(168,130,60,.18);font-size:13px}.adventure-achievement span{color:var(--muted,#8A8378);font-size:11px;text-align:right}.adventure-achievement.earned b{color:var(--gold,#A8823C)}.hidden{display:none!important}';
    document.head.appendChild(style);

    var originalClick = nav.onclick;
    nav.onclick = function (event) {
      if (typeof originalClick === 'function') originalClick.call(nav, event);
      var target = event.target.closest('[data-page]');
      if (target && target.dataset.page === 'achievements') render();
    };

    window.addEventListener('bookshelf-reading-log-changed', render);  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();