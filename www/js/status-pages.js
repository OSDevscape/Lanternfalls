(function () {
  function applyCurrentView(list) {
    var mode = localStorage.getItem('bookshelf-view-mode') || 'list';

    list.classList.toggle('status-view-grid', mode === 'grid');
    list.classList.toggle('status-view-compact', mode === 'compact');
  }

  function install() {
    var menu = document.querySelector('#menuSheet .menu-card');
    if (!menu || document.getElementById('statusPages')) return;

var style = document.createElement('style');

style.textContent =
  '.status-pages{display:flex;gap:9px;flex-wrap:wrap;margin:10px 0}' +
  '.status-pages button{flex:1;min-width:130px;padding:11px;border:1px solid #A8823C;border-radius:3px;background:#1B2129;color:#F6F1E4;text-align:left;cursor:pointer}' +
  '.status-page{position:fixed;inset:0;z-index:190;overflow:auto;background:#14181C;color:#F6F1E4}' +
  '.status-page.hidden{display:none!important}' +
  '.status-page-header{display:flex;align-items:center;gap:14px;padding:20px;border-bottom:1px solid rgba(168,130,60,.25)}' +
  '.status-page-header button{border:0;background:none;color:#F6F1E4;font-size:32px;cursor:pointer}' +
  '.status-page h2{margin:0;font:22px Georgia,serif}' +
  '.status-page-list{padding:18px}' +
  '.status-page-item{display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid rgba(246,241,228,.12);cursor:pointer}' +
  '.status-page-item img{width:48px;height:72px;object-fit:cover;background:#1B2129;border-radius:2px}' +
  '.status-page-item strong{display:block;font:700 17px Georgia,serif}' +
  '.status-page-item span{display:block;margin-top:4px;color:#cdbdb4;font-size:13px}' +
  '.status-page-empty{padding:36px 6px;color:#8A8378;text-align:center}';

document.head.appendChild(style);

    var controls = document.createElement('div');
    controls.id = 'statusPages';
    controls.className = 'status-pages';
    controls.innerHTML = '<button type="button" data-status-page="wishlist">♡ Wishlist</button><button type="button" data-status-page="loaned">↗ Loaned Out</button>';
    menu.insertBefore(controls, document.getElementById('exportBtn'));

    var page = document.createElement('section');
    page.id = 'statusPage';
    page.className = 'status-page hidden';
    page.innerHTML = '<header class="status-page-header"><button type="button" aria-label="Back">‹</button><h2></h2></header><main class="status-page-list"></main>';
    document.body.appendChild(page);

    var close = function () { page.classList.add('hidden'); };
    page.querySelector('button').onclick = close;
    controls.onclick = function (event) {
      var button = event.target.closest('[data-status-page]');
      if (!button) return;
      var wanted = button.dataset.statusPage;
      var label = wanted === 'wishlist' ? 'Wishlist' : 'Loaned Out';
      page.querySelector('h2').textContent = label;
      var list = page.querySelector('.status-page-list');
list.replaceChildren();
applyCurrentView(list);

var cards = Array.prototype.slice.call(document.querySelectorAll('.book-card[data-status="' + wanted + '"]'));
      if (!cards.length) { list.innerHTML = '<p class="status-page-empty">No books in ' + label.toLowerCase() + '.</p>'; }
      cards.forEach(function (card) {
        var item = document.createElement('article');
        item.className = 'status-page-item';
        var source = card.querySelector('.book-cover');
        if (source) { var image = document.createElement('img'); image.src = source.currentSrc || source.src; image.alt = ''; item.appendChild(image); }
        var text = document.createElement('div');
        var title = document.createElement('strong'); title.textContent = (card.querySelector('.book-title') || {}).textContent || 'Untitled';
        var author = document.createElement('span'); author.textContent = (card.querySelector('.book-author') || {}).textContent || '';
        text.append(title, author); item.appendChild(text);
        item.onclick = function () { close(); card.click(); };
        list.appendChild(item);
      });
      document.getElementById('menuSheet').classList.add('hidden');
      page.classList.remove('hidden');
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();