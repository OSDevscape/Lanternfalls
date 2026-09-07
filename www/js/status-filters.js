(function () {
  var active = 'all';
  var hiddenStatusesKey = 'readquest-library-hidden-statuses';
  var hidePanelOpenKey = 'readquest-library-hide-panel-open';

  var statuses = [
    { key: 'to-read', label: 'To Read' },
    { key: 'reading', label: 'Reading' },
    { key: 'paused', label: 'Paused' },
    { key: 'finished', label: 'Finished' },
    { key: 'abandoned', label: 'Gave Up' },
    { key: 'wishlist', label: 'Wishlist' },
    { key: 'loaned', label: 'Loaned Out' }
  ];

  function getHiddenStatuses() {
    var saved = null;

    try {
      saved = JSON.parse(localStorage.getItem(hiddenStatusesKey));
    } catch (error) {
      saved = null;
    }

    var state = {};

    statuses.forEach(function (status) {
      state[status.key] = !!(saved && saved[status.key]);
    });

    return state;
  }

  var hiddenStatuses = getHiddenStatuses();

  function getHidePanelOpen() {
    return localStorage.getItem(hidePanelOpenKey) === 'true';
  }

  var hidePanelOpen = getHidePanelOpen();

  function saveHiddenStatuses() {
    localStorage.setItem(hiddenStatusesKey, JSON.stringify(hiddenStatuses));
  }

  function saveHidePanelOpen() {
    localStorage.setItem(hidePanelOpenKey, hidePanelOpen ? 'true' : 'false');
  }

  function visibleStatusCount() {
    return statuses.filter(function (status) {
      return !hiddenStatuses[status.key];
    }).length;
  }

  function showNotice(message) {
    var toast = document.getElementById('toast');

    if (!toast) return;

    toast.textContent = message;
    toast.classList.remove('hidden');

    window.clearTimeout(showNotice.timeout);
    showNotice.timeout = window.setTimeout(function () {
      toast.classList.add('hidden');
    }, 2800);
  }

  function closeHidePanel() {
    hidePanelOpen = false;
    saveHidePanelOpen();
    updateHidePanel();
  }

  function updateHidePanel() {
    var panel = document.getElementById('statusHidePanel');
    var button = document.getElementById('statusHideToggle');

    if (!panel || !button) return;

    panel.classList.toggle('hidden', !hidePanelOpen);
    button.setAttribute('aria-expanded', hidePanelOpen ? 'true' : 'false');
    button.classList.toggle('expanded', hidePanelOpen);

    var summary = button.querySelector('.status-hide-summary');
    if (summary) {
      var hiddenCount = statuses.filter(function (status) {
        return hiddenStatuses[status.key];
      }).length;

      summary.textContent = hiddenCount
        ? hiddenCount + ' hidden'
        : 'None hidden';
    }
  }

  function apply() {
    document.querySelectorAll('#bookList .book-card').forEach(function (card) {
      var status = card.dataset.status;
      var matchesStatusFilter =
        active === 'all' || status === active;

      /*
       * Hide preferences apply only to All. Selecting a specific status
       * intentionally shows that status, even when it is hidden from All.
       */
      var hiddenByPreference =
        active === 'all' && !!hiddenStatuses[status];

      var show = matchesStatusFilter && !hiddenByPreference;

      card.hidden = !show;
      card.style.display = show ? '' : 'none';
    });

    document.querySelectorAll('#statusFilters [data-filter]').forEach(function (button) {
      var selected = button.dataset.filter === active;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });

    document.querySelectorAll('#statusFilters input[data-hide-status]').forEach(function (checkbox) {
      checkbox.checked = !!hiddenStatuses[checkbox.dataset.hideStatus];
    });

    var label = document.querySelector('#statusFilterToggle .status-filter-label');

    if (label) {
      if (active === 'all') {
        label.textContent = 'Filter';
      } else {
        var currentButton = document.querySelector(
          '#statusFilters [data-filter="' + active + '"]'
        );

        label.textContent = currentButton
          ? currentButton.textContent
          : 'Filter';
      }
    }

    updateHidePanel();
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
      '#statusFilters .status-filter-divider{grid-column:1/-1;height:1px;margin:5px 0 2px;background:rgba(168,130,60,.35)}' +
      '#statusHideToggle{display:flex;grid-column:1/-1;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:9px 8px!important;border-color:rgba(168,130,60,.42)!important;text-align:left;white-space:normal!important}' +
      '#statusHideToggle:hover{border-color:var(--gold,#A8823C)!important}' +
      '#statusHideToggle .status-hide-title{display:flex;align-items:center;gap:8px}' +
      '#statusHideToggle .status-hide-title::before{content:"›";font-size:19px;line-height:1;transition:transform .16s ease}' +
      '#statusHideToggle.expanded .status-hide-title::before{transform:rotate(90deg)}' +
      '#statusHideToggle .status-hide-summary{color:var(--muted,#8A8378);font-size:11px;font-weight:600;white-space:nowrap}' +
      '#statusHidePanel{display:grid;grid-column:1/-1;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}' +
      '#statusHidePanel.hidden{display:none}' +
      '#statusFilters .status-hide-option{display:flex;align-items:center;gap:9px;min-width:0;padding:8px;border:1px solid rgba(168,130,60,.42);border-radius:3px;color:var(--paper-light,#EDE6D6);font:600 12px -apple-system,Segoe UI,sans-serif;cursor:pointer}' +
      '#statusFilters .status-hide-option:hover{border-color:var(--gold,#A8823C);color:var(--gold,#A8823C)}' +
      '#statusFilters .status-hide-option input{width:16px;height:16px;flex:none;margin:0;accent-color:var(--gold,#A8823C);cursor:pointer}' +
      '#statusFilters .status-hide-option span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '#bookList .book-card[hidden]{display:none!important}' +
      '@media(min-width:520px){#statusFilters{grid-template-columns:repeat(4,minmax(0,1fr)}}' +
      '@media(min-width:520px){#statusHidePanel{grid-template-columns:repeat(4,minmax(0,1fr)}}';

    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.id = 'statusFilterBar';
    bar.innerHTML =
      '<button id="statusFilterToggle" type="button" aria-controls="statusFilters" aria-expanded="false">' +
      '<span class="status-filter-icon" aria-hidden="true">☷</span>' +
      '<span class="status-filter-label">Filter</span>' +
      '</button>';

    count.insertAdjacentElement('afterend', bar);

    var filters = document.createElement('div');
    filters.id = 'statusFilters';
    filters.className = 'hidden';
    filters.setAttribute('aria-label', 'Filter books by status');

    var filterButtons =
      '<button type="button" class="selected" data-filter="all" aria-pressed="true">All</button>' +
      '<button type="button" data-filter="to-read" aria-pressed="false">To Read</button>' +
      '<button type="button" data-filter="reading" aria-pressed="false">Reading</button>' +
      '<button type="button" data-filter="paused" aria-pressed="false">Paused</button>' +
      '<button type="button" data-filter="finished" aria-pressed="false">Finished</button>' +
      '<button type="button" data-filter="abandoned" aria-pressed="false">Gave Up</button>' +
      '<button type="button" data-filter="wishlist" aria-pressed="false">Wishlist</button>' +
      '<button type="button" data-filter="loaned" aria-pressed="false">Loaned Out</button>';

    var hideOptions = '';

    statuses.forEach(function (status) {
      hideOptions +=
        '<label class="status-hide-option">' +
        '<input type="checkbox" data-hide-status="' + status.key + '">' +
        '<span>Hide ' + status.label + '</span>' +
        '</label>';
    });

    filters.innerHTML =
      filterButtons +
      '<div class="status-filter-divider" aria-hidden="true"></div>' +
      '<button id="statusHideToggle" type="button" aria-controls="statusHidePanel" aria-expanded="false">' +
      '<span class="status-hide-title">Hide from main library</span>' +
      '<span class="status-hide-summary">None hidden</span>' +
      '</button>' +
      '<div id="statusHidePanel" class="hidden">' +
      hideOptions +
      '</div>';

    bar.insertAdjacentElement('afterend', filters);

    var toggle = document.getElementById('statusFilterToggle');
    var hideToggle = document.getElementById('statusHideToggle');

    toggle.onclick = function () {
      var hidden = filters.classList.toggle('hidden');

      toggle.setAttribute('aria-expanded', hidden ? 'false' : 'true');

      if (hidden) {
        closeHidePanel();
      }
    };

    hideToggle.onclick = function () {
      hidePanelOpen = !hidePanelOpen;
      saveHidePanelOpen();
      updateHidePanel();
    };

    filters.onclick = function (event) {
      var button = event.target.closest('button[data-filter]');

      if (!button) return;

      active = button.dataset.filter;
      apply();

      filters.classList.add('hidden');
      toggle.setAttribute('aria-expanded', 'false');

      closeHidePanel();
    };

    filters.onchange = function (event) {
      var checkbox = event.target.closest('input[data-hide-status]');

      if (!checkbox) return;

      var status = checkbox.dataset.hideStatus;
      hiddenStatuses[status] = checkbox.checked;

      if (hiddenStatuses[status] && visibleStatusCount() === 0) {
        hiddenStatuses[status] = false;
        checkbox.checked = false;
        showNotice('Keep at least one library category visible.');
      }

      saveHiddenStatuses();
      apply();
    };

    var list = document.getElementById('bookList');

    if (list) {
      new MutationObserver(function () {
        requestAnimationFrame(apply);
      }).observe(list, { childList: true });
    }

    apply();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();