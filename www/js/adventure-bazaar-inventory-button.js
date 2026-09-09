(function () {
  function addInventoryButton() {
    var page = document.getElementById('navPlaceholder');

    if (
      !page ||
      page.classList.contains('hidden') ||
      !page.classList.contains('adventure-page')
    ) {
      return;
    }

    var header = page.querySelector('.adventure-header');

    if (!header || document.getElementById('adventureBazaarInventoryBtn')) {
      return;
    }

    var sword = header.querySelector(':scope > span');
    var actions = document.createElement('div');

    actions.className = 'adventure-bazaar-header-actions';

    var button = document.createElement('button');
    button.id = 'adventureBazaarInventoryBtn';
    button.type = 'button';
    button.textContent = 'â–£';
    button.setAttribute('aria-label', 'Open Inventory');
    button.setAttribute('title', 'Inventory');

    button.addEventListener('click', () => {
      if (
        window.BookwyrmBazaar &&
        typeof window.BookwyrmBazaar.inventory === 'function'
      ) {
        window.BookwyrmBazaar.inventory();
      }
    });

    actions.appendChild(button);

    if (sword) {
      sword.className = 'adventure-bazaar-header-sword';
      actions.appendChild(sword);
    }

    header.appendChild(actions);
  }

  function install() {
    var style = document.createElement('style');

    style.textContent =
      '.adventure-bazaar-header-actions{' +
      'display:flex;align-items:center;gap:12px' +
      '}' +
      '#adventureBazaarInventoryBtn{' +
      'display:inline-flex;align-items:center;justify-content:center;' +
      'width:36px;height:36px;padding:0;' +
      'border:1px solid color-mix(in srgb,var(--accent,#A8823C) 55%,transparent);' +
      'border-radius:50%;' +
      'background:var(--bg-elevated,var(--bg,#14181C));' +
      'color:var(--accent,var(--gold,#A8823C));' +
      'font-size:19px;line-height:1;cursor:pointer' +
      '}' +
      '#adventureBazaarInventoryBtn:active{' +
      'transform:scale(.94)' +
      '}' +
      '#adventureBazaarInventoryBtn:focus-visible{' +
      'outline:2px solid var(--accent,var(--gold,#A8823C));outline-offset:2px' +
      '}' +
      '.adventure-bazaar-header-sword{' +
      'color:var(--gold,#A8823C);font-size:29px;line-height:1' +
      '}';

    document.head.appendChild(style);

    var page = document.getElementById('navPlaceholder');

    if (!page) {
      return;
    }

    new MutationObserver(function () {
      setTimeout(addInventoryButton, 0);
    }).observe(page, {
      childList: true
    });

    window.addEventListener('bookshelf-navigation-changed', function (event) {
      if (event.detail && event.detail.page === 'achievements') {
        setTimeout(addInventoryButton, 0);
      }
    });

    addInventoryButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();