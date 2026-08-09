(function () {
  function install() {
    if (document.getElementById('bottomNavigation')) return;
    var style = document.createElement('style');
    style.textContent =
      '#bottomNavigation{position:fixed;z-index:200;left:12px;right:12px;bottom:calc(10px + env(safe-area-inset-bottom));display:flex;justify-content:space-around;padding:7px 5px;background:var(--paper-light,#F6F1E4);border:1px solid rgba(42,36,30,.16);border-radius:22px;box-shadow:0 3px 14px rgba(0,0,0,.28)}#bottomNavigation button{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:62px;padding:7px 8px;border:0;border-radius:16px;background:transparent;color:var(--ink-soft,#55493C);font:11px var(--font-body,-apple-system);cursor:pointer}#bottomNavigation button i{font-style:normal;font-size:22px}#bottomNavigation button.active{background:var(--gold,#A8823C);color:var(--paper-light,#F6F1E4)}#navPlaceholder{position:fixed;inset:0;z-index:85;padding:80px 24px 110px;background:var(--bg,#14181C);color:var(--paper-light,#F6F1E4)}#navPlaceholder.hidden{display:none!important}#navPlaceholder h1{font:28px Georgia,serif;margin:0 0 10px}#navPlaceholder p{color:var(--muted,#8A8378)}#app{padding-bottom:100px!important}';
    document.head.appendChild(style);

    var nav = document.createElement('nav');
    nav.id = 'bottomNavigation';
    nav.setAttribute('aria-label', 'Main navigation');
    nav.innerHTML = '<button type="button" data-page="dashboard"><i>⌂</i>Dashboard</button><button type="button" data-page="library"><i>▥</i>Library</button><button type="button" data-page="achievements"><i>♜</i>Achievements</button><button type="button" data-page="profile"><i>♙</i>Profile</button>';
    document.body.appendChild(nav);

    var placeholder = document.createElement('section');
    placeholder.id = 'navPlaceholder';
    placeholder.className = 'hidden';
    document.body.appendChild(placeholder);

    function active(page) {
      nav.querySelectorAll('button').forEach(function (button) { button.classList.toggle('active', button.dataset.page === page); });
    }
    function showPlaceholder(title, text) {
      placeholder.innerHTML = '<h1>' + title + '</h1><p>' + text + '</p>';
      placeholder.classList.remove('hidden');
    }
    function show(page) {
      var dashboard = document.getElementById('dashboard');
      active(page);
      placeholder.classList.add('hidden');
      if (page === 'dashboard') {
        if (dashboard) dashboard.classList.remove('hidden');
      } else if (page === 'library') {
        if (dashboard) dashboard.classList.add('hidden');
      } else {
        if (dashboard) dashboard.classList.add('hidden');
        showPlaceholder(page === 'achievements' ? 'Achievements' : 'Profile', page === 'achievements' ? 'Achievements are coming soon.' : 'Profile settings are coming soon.');
      }
    }

    nav.onclick = function (event) {
      var button = event.target.closest('[data-page]');
      if (button) show(button.dataset.page);
    };

    show(document.getElementById('dashboard') && !document.getElementById('dashboard').classList.contains('hidden') ? 'dashboard' : 'library');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();