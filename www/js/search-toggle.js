(function () {
  function install() {
    var header = document.querySelector('.app-header');
    var searchSlip = document.querySelector('.search-slip');
    var input = document.getElementById('searchInput');
    var menu = document.getElementById('menuBtn');
    if (!header || !searchSlip || !input || document.getElementById('searchToggleBtn')) return;

    var style = document.createElement('style');
    style.textContent =
      '.search-slip{display:none}.search-slip.search-open{display:block;position:absolute;z-index:15;top:calc(58px + env(safe-area-inset-top));left:0;right:0;margin:0;padding:10px 20px 12px;background:#14181C;border-bottom:1px solid rgba(168,130,60,.2)}.search-toggle-btn{background:none;border:0;color:var(--paper-light,#F6F1E4);font-size:25px;line-height:1;padding:8px;cursor:pointer}.header-actions{display:flex;align-items:center;gap:4px}';
    document.head.appendChild(style);

    var actions = document.createElement('div');
    actions.className = 'header-actions';
    var button = document.createElement('button');
    button.id = 'searchToggleBtn';
    button.className = 'search-toggle-btn';
    button.type = 'button';
    button.setAttribute('aria-label', 'Search books');
    button.textContent = '⌕';

    header.removeChild(menu);
    actions.appendChild(button);
    actions.appendChild(menu);
    header.appendChild(actions);

    function close() {
      searchSlip.classList.remove('search-open');
      button.textContent = '⌕';
      button.setAttribute('aria-label', 'Search books');
    }
    button.onclick = function () {
      var isOpen = searchSlip.classList.toggle('search-open');
      button.textContent = isOpen ? '×' : '⌕';
      button.setAttribute('aria-label', isOpen ? 'Close search' : 'Search books');
      if (isOpen) input.focus();
    };
    input.addEventListener('keydown', function (event) { if (event.key === 'Escape') close(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();