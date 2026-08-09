(function () {
  function currentMode() {
    return localStorage.getItem('bookshelf-view-mode') || 'list';
  }

  function apply() {
    var page = document.getElementById('statusPage');
    if (!page || page.classList.contains('hidden')) return;
    var list = page.querySelector('.status-page-list');
    if (!list) return;
    var mode = currentMode();
    list.classList.toggle('status-view-grid', mode === 'grid');
    list.classList.toggle('status-view-compact', mode === 'compact');
  }

  function install() {
    var style = document.createElement('style');
    style.textContent =
      '.status-page-list.status-view-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.status-page-list.status-view-grid .status-page-item{min-height:180px;flex-direction:column;align-items:flex-start;padding:12px;border:1px solid rgba(168,130,60,.25)!important;border-radius:3px}.status-page-list.status-view-grid .status-page-item img{width:76px;height:114px;align-self:center}.status-page-list.status-view-grid .status-page-item strong{font-size:15px}.status-page-list.status-view-compact{padding-top:6px}.status-page-list.status-view-compact .status-page-item{gap:10px;padding:7px 0}.status-page-list.status-view-compact .status-page-item img{width:34px;height:50px}.status-page-list.status-view-compact .status-page-item strong{font-size:15px}.status-page-list.status-view-compact .status-page-item span{display:none}@media(min-width:700px){.status-page-list.status-view-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}';
    document.head.appendChild(style);

    var page = document.getElementById('statusPage');
    if (!page) { setTimeout(install, 150); return; }
    new MutationObserver(function () { setTimeout(apply, 0); }).observe(page, { attributes: true, attributeFilter: ['class'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();