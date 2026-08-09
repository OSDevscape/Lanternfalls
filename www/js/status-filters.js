(function () {
  var active = 'all';

  function apply() {
    document.querySelectorAll('#bookList .book-card').forEach(function (card) {
      card.style.display = active === 'all' || card.dataset.status === active ? '' : 'none';
    });
    document.querySelectorAll('#statusFilters [data-filter]').forEach(function (button) {
      button.classList.toggle('selected', button.dataset.filter === active);
    });
  }

  function install() {
    var count = document.getElementById('shelfCount');
    if (!count || document.getElementById('statusFilters')) return;

    var style = document.createElement('style');
    style.textContent =
      '#statusFilters{display:flex;gap:7px;overflow-x:auto;margin:0 20px 14px;padding-bottom:2px}#statusFilters button{flex:0 0 auto;padding:7px 11px;border:1px solid rgba(168,130,60,.55);border-radius:3px;background:transparent;color:#EDE6D6;font:600 12px -apple-system,Segoe UI,sans-serif;cursor:pointer}#statusFilters button.selected{background:#A8823C;border-color:#A8823C;color:#F6F1E4}';
    document.head.appendChild(style);

    var filters = document.createElement('div');
    filters.id = 'statusFilters';
    filters.setAttribute('aria-label', 'Filter books by status');
    filters.innerHTML = '<button type="button" class="selected" data-filter="all">All</button><button type="button" data-filter="to-read">To Read</button><button type="button" data-filter="reading">Reading</button><button type="button" data-filter="finished">Finished</button>';
    count.insertAdjacentElement('afterend', filters);

    filters.onclick = function (event) {
      var button = event.target.closest('[data-filter]');
      if (!button) return;
      active = button.dataset.filter;
      apply();
    };

    var list = document.getElementById('bookList');
    if (list) new MutationObserver(function () { setTimeout(apply, 0); }).observe(list, { childList: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();