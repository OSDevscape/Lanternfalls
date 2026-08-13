(function () {
  var active = 'all';

  function apply() {
    document.querySelectorAll('#bookList .book-card').forEach(function (card) {
      var show = active === 'all' || card.dataset.status === active;
      card.hidden = !show;
      card.style.display = show ? '' : 'none';
    });

    document.querySelectorAll('#statusFilters [data-filter]').forEach(function (button) {
      var selected = button.dataset.filter === active;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });

    var label = document.querySelector('#statusFilterToggle .status-filter-label');
    if (label) {
      label.textContent = active === 'all' ? 'Filter' : document.querySelector('#statusFilters [data-filter="' + active + '"]').textContent;
    }
  }

  function install() {
    var count = document.getElementById('shelfCount');
    if (!count || document.getElementById('statusFilters')) return;

    var style = document.createElement('style');
    style.textContent =
      '#statusFilterBar{display:flex;justify-content:flex-end;margin:0 20px 12px}' +
      '#statusFilterToggle{display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--gold,#A8823C);color:#fff;font:600 12px -apple-system,Segoe UI,sans-serif;cursor:pointer;transition:background .16s ease,color .16s ease,border-color .16s ease}' +
      '#statusFilterToggle:hover,#statusFilterToggle:focus-visible{background:#fff;color:var(--gold,#A8823C);border-color:var(--gold,#A8823C);outline:none}' +
      '#statusFilterToggle .status-filter-icon{font-size:16px;line-height:1}' +
      '#statusFilters{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:0 20px 14px}' +
      '#statusFilters.hidden{display:none}' +
      '#statusFilters button{min-width:0;padding:8px 7px;border:1px solid rgba(168,130,60,.55);border-radius:3px;background:transparent;color:var(--paper-light,#EDE6D6);font:600 12px -apple-system,Segoe UI,sans-serif;cursor:pointer;white-space:nowrap}' +
      '#statusFilters button.selected,#statusFilters button.selected:hover,#statusFilters button.selected:focus{background:var(--gold,#A8823C);border-color:var(--gold,#A8823C);color:#fff!important}' +
      '#statusFilters button:not(.selected):hover{border-color:var(--gold,#A8823C);color:var(--gold,#A8823C)}' +
      '#bookList .book-card[hidden]{display:none!important}' +
      '@media(min-width:520px){#statusFilters{grid-template-columns:repeat(4,minmax(0,1fr)}}';
    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.id = 'statusFilterBar';
    bar.innerHTML = '<button id="statusFilterToggle" type="button" aria-controls="statusFilters" aria-expanded="false"><span class="status-filter-icon" aria-hidden="true">☷</span><span class="status-filter-label">Filter</span></button>';
    count.insertAdjacentElement('afterend', bar);

    var filters = document.createElement('div');
    filters.id = 'statusFilters';
    filters.className = 'hidden';
    filters.setAttribute('aria-label', 'Filter books by status');
    filters.innerHTML =
      '<button type="button" class="selected" data-filter="all" aria-pressed="true">All</button>' +
      '<button type="button" data-filter="to-read" aria-pressed="false">To Read</button>' +
      '<button type="button" data-filter="reading" aria-pressed="false">Reading</button>' +
      '<button type="button" data-filter="paused" aria-pressed="false">Paused</button>' +
      '<button type="button" data-filter="finished" aria-pressed="false">Finished</button>' +
      '<button type="button" data-filter="abandoned" aria-pressed="false">Abandoned</button>' +
      '<button type="button" data-filter="wishlist" aria-pressed="false">Wishlist</button>' +
      '<button type="button" data-filter="loaned" aria-pressed="false">Loaned Out</button>';
    bar.insertAdjacentElement('afterend', filters);

    var toggle = document.getElementById('statusFilterToggle');
    toggle.onclick = function () {
      var hidden = filters.classList.toggle('hidden');
      toggle.setAttribute('aria-expanded', hidden ? 'false' : 'true');
    };

    filters.onclick = function (event) {
      var button = event.target.closest('button[data-filter]');
      if (!button) return;
      active = button.dataset.filter;
      apply();
      filters.classList.add('hidden');
      toggle.setAttribute('aria-expanded', 'false');
    };

    var list = document.getElementById('bookList');
    if (list) {
      new MutationObserver(function () {
        requestAnimationFrame(apply);
      }).observe(list, { childList: true });
    }

    apply();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();