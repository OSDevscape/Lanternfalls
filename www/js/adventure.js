(function () {
  var KEY = 'bookshelf-adventure-v1';
  var CLASSES = ['Scholar', 'Warrior', 'Mage', 'Rogue', 'Ranger', 'Bard'];

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch (_) { return {}; }
  }

  function save(profile) {
    localStorage.setItem(KEY, JSON.stringify(profile));
  }

  function library() {
    try { return JSON.parse(localStorage.getItem('bookshelf-data') || '{"books":[]}').books || []; }
    catch (_) { return []; }
  }

  function render() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.classList.contains('hidden')) return;

    var profile = load();
    var books = library();
    var finished = books.filter(function (book) { return book.status === 'finished'; }).length;
    var reading = books.filter(function (book) { return book.status === 'reading'; })[0];
    var chosen = profile.className || '';
    var classButtons = CLASSES.map(function (name) {
      return '<button type="button" class="adventure-class ' + (chosen === name ? 'selected' : '') + '" data-adventure-class="' + name + '">' + name + '</button>';
    }).join('');

    page.innerHTML = '';
    page.classList.remove('reading-profile-page');
    page.classList.add('adventure-page');
    page.innerHTML =
      '<header class="adventure-header"><div><h1>Adventure</h1><p>Read books. Become legendary.</p></div><span>⚔</span></header>' +
      '<main class="adventure-content">' +
'<section class="adventure-card adventure-coming"><span class="adventure-label">Coming Next</span><p>Reading streaks, deeper quest goals, Book Boss rewards, and collectible loot are next on your adventure.</p></section>' +
'<section class="adventure-card"><span class="adventure-label">Character</span><h2>' + (profile.name || 'Your Reader') + '</h2><p class="adventure-muted">' + (chosen ? chosen + ' class' : 'Choose a class to begin your journey.') + '</p></section>' +
      '<section class="adventure-card"><span class="adventure-label">Character</span><h2>' + (profile.name || 'Your Reader') + '</h2><p class="adventure-muted">' + (chosen ? chosen + ' class' : 'Choose a class to begin your journey.') + '</p></section>' +
      '<section class="adventure-card"><span class="adventure-label">Current Quest</span><h2>' + (reading ? reading.title : 'Choose your next book') + '</h2><p class="adventure-muted">' + (reading ? 'Your current reading adventure is waiting.' : 'Mark a book as Reading to begin an adventure.') + '</p></section>' +
      '<section class="adventure-grid"><section class="adventure-card"><span class="adventure-label">Library</span><h2>' + books.length + '</h2><p class="adventure-muted">books cataloged</p></section><section class="adventure-card"><span class="adventure-label">Completed</span><h2>' + finished + '</h2><p class="adventure-muted">books finished</p></section></section>' +
      '<details class="adventure-card" ' + (chosen ? '' : 'open') + '><summary>Choose Class <em>' + (chosen || 'None') + '</em></summary><p class="adventure-muted">Classes create your RPG identity. They will not change your real reading progress.</p><div class="adventure-classes">' + classButtons + '</div></details>' +
      '<details class="adventure-card"><summary>Achievements <em>' + (books.length ? '1 started' : '0 started') + '</em></summary><div class="adventure-achievement ' + (books.length ? 'earned' : '') + '"><b>' + (books.length ? '✓' : '○') + ' First Chapter</b><span>Catalog your first book</span></div><div class="adventure-achievement ' + (finished ? 'earned' : '') + '"><b>' + (finished ? '✓' : '○') + ' First Tale Complete</b><span>Finish your first book</span></div><div class="adventure-achievement"><b>○ Bookworm</b><span>' + finished + ' / 10 books completed</span></div></details>'
      '</main>';

    page.querySelectorAll('[data-adventure-class]').forEach(function (button) {
      button.onclick = function () {
        var updated = load();
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
    style.textContent = '#navPlaceholder.adventure-page{display:flex;flex-direction:column;padding:0;overflow:hidden;background:var(--bg,#14181C)}.adventure-header{display:flex;align-items:center;justify-content:space-between;padding:20px;border-bottom:1px solid rgba(168,130,60,.24)}.adventure-header h1{margin:0;font:27px Georgia,serif}.adventure-header p{margin:4px 0 0;color:var(--muted,#8A8378);font-size:12px}.adventure-header span{color:var(--gold,#A8823C);font-size:29px}.adventure-content{flex:1;overflow:auto;padding:16px 20px 130px}.adventure-card{margin:0 0 13px;padding:16px;background:var(--bg-elevated,#1B2129);border:1px solid rgba(168,130,60,.28);border-radius:4px}.adventure-card h2{margin:5px 0;font:21px Georgia,serif}.adventure-label{color:var(--gold,#A8823C);font-size:11px;letter-spacing:.08em;text-transform:uppercase}.adventure-muted,.adventure-coming p{margin:7px 0 0;color:var(--muted,#8A8378);font-size:13px;line-height:1.4}.adventure-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.adventure-grid .adventure-card{min-width:0}.adventure-grid h2{font-size:26px}details summary{display:flex;justify-content:space-between;cursor:pointer;font:17px Georgia,serif}details summary em{color:var(--muted,#8A8378);font:11px var(--font-body,-apple-system);font-style:normal}.adventure-classes{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.adventure-class{padding:10px;border:1px solid rgba(168,130,60,.48);border-radius:3px;background:transparent;color:var(--paper-light,#F6F1E4)}.adventure-class.selected{background:var(--gold,#A8823C);border-color:var(--gold,#A8823C)}.adventure-achievement{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid rgba(168,130,60,.18);font-size:13px}.adventure-achievement span{color:var(--muted,#8A8378);font-size:11px;text-align:right}.adventure-achievement.earned b{color:var(--gold,#A8823C)}.hidden{display:none!important}';
    document.head.appendChild(style);

    var originalClick = nav.onclick;
    nav.onclick = function (event) {
      if (typeof originalClick === 'function') originalClick.call(nav, event);
      var target = event.target.closest('[data-page]');
      if (target && target.dataset.page === 'achievements') render();
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();