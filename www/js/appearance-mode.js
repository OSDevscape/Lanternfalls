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
    root.dataset.theme = settings.mode;
    localStorage.setItem(KEY, JSON.stringify(settings));

    document.querySelectorAll('[data-appearance-mode]').forEach(function (button) {
      button.classList.toggle('selected', button.dataset.appearanceMode === settings.mode);
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
    style.textContent =
      '#appearanceSettings{margin:0 0 14px;padding:14px 0;border-bottom:1px solid rgba(42,36,30,.18)}' +
      '#appearanceSettings h3{margin:0 0 10px;color:#55493C;font-size:11px;letter-spacing:.08em;text-transform:uppercase}' +
      '.appearance-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}' +
      '.appearance-row button{padding:8px 11px;border:1px solid #A8823C;border-radius:3px;background:transparent;color:#55493C;font:600 12px -apple-system,Segoe UI,sans-serif;cursor:pointer}' +
      '.appearance-row button.selected{background:var(--gold);border-color:var(--gold);color:#F6F1E4}' +
      '.accent-dot{display:inline-block;width:12px;height:12px;margin-right:5px;border-radius:50%;vertical-align:-1px;background:var(--dot)}' +
      'html[data-theme="light"] body,html[data-theme="light"] #app,html[data-theme="light"] .sheet,html[data-theme="light"] .status-page,html[data-theme="light"] #bookDetails{background:#F2EDE3!important;color:#2A241E!important}' +
      'html[data-theme="light"] .app-header,html[data-theme="light"] .sheet-header,html[data-theme="light"] #bookDetails .bd-top,html[data-theme="light"] .status-page-header{background:#F2EDE3!important}' +
      'html[data-theme="light"] .app-title,html[data-theme="light"] .sheet-header h2,html[data-theme="light"] #bookDetails .bd-title,html[data-theme="light"] .status-page h2{color:#2A241E!important}' +
      'html[data-theme="light"] .search-slip input,html[data-theme="light"] .menu-action,html[data-theme="light"] #bookDetails .bd-panel,html[data-theme="light"] .status-page-item{background:#FFFDF8!important;color:#2A241E!important}' +
      'html[data-theme="light"] .icon-btn,html[data-theme="light"] .text-btn{color:#2A241E!important}';
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
      if (modeButton) { settings.mode = modeButton.dataset.appearanceMode; apply(settings); }
      if (colorButton) { settings.accent = colorButton.dataset.accent; apply(settings); }
    });

    apply(settings);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();