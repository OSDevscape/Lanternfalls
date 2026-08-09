(function () {
  var KEY = 'bookshelf-view-mode';

  function applyView(mode) {
    var list = document.getElementById('bookList');
    if (!list) return;
    list.classList.toggle('view-grid', mode === 'grid');
    list.classList.toggle('view-compact', mode === 'compact');
    localStorage.setItem(KEY, mode);
    document.querySelectorAll('[data-view-mode]').forEach(function (button) {
      button.classList.toggle('selected', button.dataset.viewMode === mode);
    });
  }

  function install() {
    var menuCard = document.querySelector('#menuSheet .menu-card');
    if (!menuCard || document.getElementById('viewModeSettings')) return;

    var style = document.createElement('style');
    style.textContent =
      '.view-mode-settings{margin-top:8px;padding-top:14px;border-top:1px solid rgba(42,36,30,.18)}' +
      '.view-mode-settings h3{margin:0 0 10px;color:#55493C;font-size:11px;letter-spacing:.08em;text-transform:uppercase}' +
      '.view-mode-options{display:flex;gap:8px;flex-wrap:wrap}' +
      '.view-mode-options button{padding:9px 12px;border:1px solid #A8823C;border-radius:3px;background:transparent;color:#55493C;font:600 13px -apple-system,Segoe UI,sans-serif;cursor:pointer}' +
      '.view-mode-options button.selected{background:#A8823C;color:#F6F1E4}' +
      '#bookList.view-compact{gap:5px}' +
      '#bookList.view-compact .book-card{padding:8px 10px 8px 12px;border-left-width:4px}' +
      '#bookList.view-compact .book-cover{display:none}' +
      '#bookList.view-compact .book-meta,#bookList.view-compact .card-stars{display:none}' +
      '#bookList.view-compact .book-title{font-size:15px}' +
      '#bookList.view-compact .book-author{font-size:11px}' +
      '#bookList.view-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}' +
      '#bookList.view-grid .book-card{min-height:190px;padding:12px;border-left-width:4px}' +
      '#bookList.view-grid .book-card-top{height:100%;flex-direction:column;align-items:stretch}' +
      '#bookList.view-grid .book-card-content{flex-direction:column;gap:8px}' +
      '#bookList.view-grid .book-cover{width:76px;height:114px;align-self:center}' +
      '#bookList.view-grid .card-stamp{align-self:flex-start}' +
      '#bookList.view-grid .book-title{font-size:15px}' +
      '#bookList.view-grid .book-author{font-size:10px}' +
      '@media(min-width:700px){#bookList.view-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}';
    document.head.appendChild(style);

    var settings = document.createElement('div');
    settings.id = 'viewModeSettings';
    settings.className = 'view-mode-settings';
    settings.innerHTML = '<h3>View</h3><div class="view-mode-options"><button type="button" data-view-mode="list">List</button><button type="button" data-view-mode="compact">Compact</button><button type="button" data-view-mode="grid">Grid</button></div>';
    menuCard.insertBefore(settings, menuCard.firstChild);

    settings.addEventListener('click', function (event) {
      var button = event.target.closest('[data-view-mode]');
      if (button) applyView(button.dataset.viewMode);
    });

    applyView(localStorage.getItem(KEY) || 'list');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();