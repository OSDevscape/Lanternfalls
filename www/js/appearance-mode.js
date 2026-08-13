(function () {
  var KEY = 'bookshelf-appearance';
  var colors = {
    red: '#8B3A3A', blue: '#3976B8', green: '#4C6B4F', yellow: '#B88918',
    teal: '#278A86', purple: '#76539A', orange: '#C66A25', brown: '#76513E',
    pink: '#C94C7C', cyan: '#1D9EB7'
  };

  function loadSettings() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{"mode":"dark","accent":"red"}'); }
    catch (_) { return { mode: 'dark', accent: 'red' }; }
  }

  function apply(settings) {
    var accent = colors[settings.accent] || colors.red;
    var root = document.documentElement;
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--gold', accent);
    root.dataset.theme = settings.mode === 'light' ? 'light' : 'dark';
    localStorage.setItem(KEY, JSON.stringify(settings));

    document.querySelectorAll('[data-appearance-mode]').forEach(function (button) {
      button.classList.toggle('selected', button.dataset.appearanceMode === root.dataset.theme);
    });
    document.querySelectorAll('[data-accent]').forEach(function (button) {
      button.classList.toggle('selected', button.dataset.accent === settings.accent);
    });
  }

  function install() {
    var menu = document.querySelector('#menuSheet .menu-card');
    if (!menu || document.getElementById('appearanceSettings')) return;
    var settings = loadSettings();

    var style = document.createElement('style');
    style.id = 'appearanceModeStyles';
    style.textContent =
      ':root{color-scheme:dark;--bg:#14181C;--bg-elevated:#1B2129;--paper:#EDE6D6;--paper-light:#F6F1E4;--ink:#2A241E;--ink-soft:#55493C;--muted:#8A8378;--line:rgba(246,241,228,.15);--surface-border:rgba(168,130,60,.28);--shadow:rgba(0,0,0,.40)}' +
      'html[data-theme="light"]{color-scheme:light;--bg:#F2EDE3;--bg-elevated:#FFFDF8;--paper:#FFFDF8;--paper-light:#2A241E;--ink:#2A241E;--ink-soft:#695D50;--muted:#756D63;--line:rgba(42,36,30,.16);--surface-border:rgba(87,68,42,.22);--shadow:rgba(42,36,30,.12)}' +
      '#appearanceSettings{margin:0 0 14px;padding:14px 0;border-bottom:1px solid var(--line)}' +
      '#appearanceSettings h3{margin:0 0 10px;color:var(--ink-soft);font-size:11px;letter-spacing:.08em;text-transform:uppercase}' +
      '.appearance-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}' +
      '.appearance-row button{padding:8px 11px;border:1px solid var(--gold);border-radius:3px;background:transparent;color:var(--ink-soft);font:600 12px -apple-system,Segoe UI,sans-serif;cursor:pointer}' +
      '.appearance-row button.selected{background:var(--gold);border-color:var(--gold);color:#fff}' +
      '.accent-dot{display:inline-block;width:12px;height:12px;margin-right:5px;border-radius:50%;vertical-align:-1px;background:var(--dot)}' +
      'body,#app,.sheet,.status-page,#bookDetails,#dashboard,.cover-preview{background:var(--bg);color:var(--paper-light)}' +
      '.app-header,.sheet-header,.status-page-header,.dash-head,#bookDetails .bd-top{background:var(--bg);border-color:var(--surface-border)!important}' +
      '.app-title,.sheet-header h2,.status-page h2,.dash-head h1,#bookDetails .bd-title{color:var(--paper-light)!important}' +
      '.icon-btn,.text-btn,.dashboard-btn,.dash-close{color:var(--paper-light)!important}' +
      '.search-slip input,.menu-action,.index-card,#bookDetails .bd-panel,#bookDetails .bd-chip,.status-page-item,.dash-card,.cover-preview-card{background:var(--bg-elevated)!important;color:var(--paper-light)!important;border-color:var(--surface-border)!important;box-shadow:0 2px 6px var(--shadow)}' +
      '.field-label,.menu-hint,.book-meta,.dash-muted,.status-page-item span,#bookDetails .bd-author{color:var(--muted)!important}' +
      '.field input,.field textarea,.field select{color:var(--paper-light)!important;border-bottom-color:var(--surface-border)!important}' +
      '.field input::placeholder,.field textarea::placeholder{color:var(--muted)!important;opacity:1}' +
      'html[data-theme="dark"] .book-card{background:var(--bg-elevated)!important;color:var(--paper-light)!important}' +
      'html[data-theme="dark"] .book-card .book-title{color:var(--paper-light)!important}' +
      'html[data-theme="dark"] .book-card .book-author{color:var(--paper-light)!important}' +
      'html[data-theme="light"] .book-card{background:var(--paper)!important;color:var(--ink)!important;box-shadow:0 2px 7px var(--shadow)}' +
      'html[data-theme="light"] .book-title,html[data-theme="light"] .status-page-item strong,html[data-theme="light"] #bookDetails .bd-title{color:var(--ink)!important}' +
      'html[data-theme="light"] .book-author,html[data-theme="light"] .status-page-item span,html[data-theme="light"] .dash-muted{color:var(--ink-soft)!important}' +
      'html[data-theme="light"] .bottom-nav,html[data-theme="light"] #bottomNav,html[data-theme="light"] .nav-bar{background:var(--bg-elevated)!important;border-color:var(--surface-border)!important;color:var(--ink)!important}' +
      'html[data-theme="light"] .bottom-nav button,html[data-theme="light"] #bottomNav button,html[data-theme="light"] .nav-bar button{color:var(--ink-soft)!important}' +
      'html[data-theme="light"] .dash-action{color:#fff!important}' +
      'html[data-theme="light"] .dash-add{color:var(--ink)!important}' +
      'html[data-theme="light"] .toast{background:var(--ink)!important;color:#fff!important}';
    document.head.appendChild(style);

    var colorButtons = Object.keys(colors).map(function (name) {
      return '<button type="button" data-accent="' + name + '"><i class="accent-dot" style="--dot:' + colors[name] + '"></i>' + name.charAt(0).toUpperCase() + name.slice(1) + '</button>';
    }).join('');

    var section = document.createElement('div');
    section.id = 'appearanceSettings';
    section.innerHTML =
      '<h3>Appearance</h3>' +
      '<div class="appearance-row"><button type="button" data-appearance-mode="light">Light</button><button type="button" data-appearance-mode="dark">Dark</button></div>' +
      '<h3>Accent Color</h3>' +
      '<div class="appearance-row">' + colorButtons + '</div>';

    var viewSettings = document.getElementById('viewModeSettings');
    var statusPages = document.getElementById('statusPages');
    if (viewSettings) viewSettings.insertAdjacentElement('afterend', section);
    else menu.insertBefore(section, statusPages || document.getElementById('exportBtn'));

    section.addEventListener('click', function (event) {
      var modeButton = event.target.closest('[data-appearance-mode]');
      var colorButton = event.target.closest('[data-accent]');
      if (modeButton) {
        settings.mode = modeButton.dataset.appearanceMode;
        apply(settings);
      }
      if (colorButton) {
        settings.accent = colorButton.dataset.accent;
        apply(settings);
      }
    });

    apply(settings);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();