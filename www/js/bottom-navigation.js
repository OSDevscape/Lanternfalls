(function () {
  function install() {
    if (document.getElementById('bottomNavigation')) return;

    var style = document.createElement('style');
    style.textContent =
      '#bottomNavigation{position:fixed;z-index:200;left:12px;right:12px;bottom:calc(10px + env(safe-area-inset-bottom));display:flex;justify-content:space-around;padding:7px 5px;background:var(--bg-elevated,#1B2129);border:1px solid var(--surface-border,rgba(42,36,30,.16));border-radius:22px;box-shadow:0 3px 14px var(--shadow,rgba(0,0,0,.28))}' +
      '#bottomNavigation button{display:flex;flex:1;flex-direction:column;align-items:center;gap:3px;min-width:0;padding:7px 3px;border:0;border-radius:16px;background:transparent;color:var(--paper-light,#F6F1E4);font:10px var(--font-body,-apple-system);cursor:pointer}' +
      '#bottomNavigation button i{font-style:normal;font-size:20px}' +
      '#bottomNavigation button.active{background:var(--gold,#A8823C);color:#fff}' +
      '#bottomNavigation .hidden{display:none!important}' +
      '#navPlaceholder{position:fixed;inset:0;z-index:85;padding:80px 24px 110px;background:var(--bg,#14181C);color:var(--paper-light,#F6F1E4)}' +
      '#navPlaceholder.hidden{display:none!important}' +
      '#navPlaceholder h1{font:28px Georgia,serif;margin:0 0 10px}' +
      '#navPlaceholder p{color:var(--muted,#8A8378)}' +
      '#app{padding-bottom:100px!important}' +
      '#addBtn{bottom:96px!important;z-index:190}';
    document.head.appendChild(style);

    var nav = document.createElement('nav');
    nav.id = 'bottomNavigation';
    nav.setAttribute('aria-label', 'Main navigation');
    nav.innerHTML =
      '<button type="button" data-page="dashboard"><i>⌂</i>Dashboard</button>' +
      '<button type="button" data-page="library"><i>▥</i>Library</button>' +
      '<button type="button" data-page="achievements"><i>⚔</i>Adventure</button>' +
      '<button type="button" data-page="realm"><i>✦</i>Realm</button>' +
      '<button type="button" class="hidden" data-page="profile">Profile</button>' +
      '<button type="button" class="hidden" data-page="character">Character</button>' +
      '<button type="button" class="hidden" data-page="collection">Collection</button>';
    document.body.appendChild(nav);

    var placeholder = document.createElement('section');
    placeholder.id = 'navPlaceholder';
    placeholder.className = 'hidden';
    document.body.appendChild(placeholder);

    var currentPage = null;
    var pageHistory = [];
    var lastDashboardBackAt = 0;
    var dashboardBackTimer = null;

    function active(page) {
      nav.querySelectorAll('button').forEach(function (button) {
        button.classList.toggle('active', button.dataset.page === page);
      });
    }

    function showPlaceholder(title, text, pageClass) {
      placeholder.className = pageClass || '';
      placeholder.innerHTML = '<h1>' + title + '</h1><p>' + text + '</p>';
      placeholder.classList.remove('hidden');
    }

    function announce(page) {
      window.dispatchEvent(new CustomEvent('bookshelf-navigation-changed', {
        detail: { page: page }
      }));
    }

    function show(page, addToHistory) {
      var dashboard = document.getElementById('dashboard');
      var addButton = document.getElementById('addBtn');
      var filterBar = document.getElementById('statusFilterBar');
      var filterPanel = document.getElementById('statusFilters');
      var filterToggle = document.getElementById('statusFilterToggle');
      var isLibrary = page === 'library';

      if (addToHistory !== false && currentPage && currentPage !== page) {
        pageHistory.push(currentPage);
      }

      currentPage = page;
      active(page);

      placeholder.classList.add('hidden');
      placeholder.className = 'hidden';

      if (addButton) addButton.classList.toggle('hidden', !isLibrary);
      if (filterBar) filterBar.classList.toggle('hidden', !isLibrary);

      if (!isLibrary && filterPanel) {
        filterPanel.classList.add('hidden');
        if (filterToggle) filterToggle.setAttribute('aria-expanded', 'false');
      }

      if (page === 'dashboard') {
        if (dashboard) dashboard.classList.remove('hidden');
        announce(page);
        return;
      }

      if (page === 'library') {
        if (dashboard) dashboard.classList.add('hidden');
        announce(page);
        return;
      }

      if (dashboard) dashboard.classList.add('hidden');

      var labels = {
        achievements: 'Adventure',
        realm: 'Realm',
        profile: 'Profile',
        character: 'Character',
        collection: 'Collection'
      };

      var loading = {
        achievements: 'Loading your adventure...',
        realm: 'Loading your realm...',
        profile: 'Loading your profile...',
        character: 'Loading your character...',
        collection: 'Loading your collection...'
      };

      showPlaceholder(labels[page] || 'ReadQuest', loading[page] || 'Loading...', page + '-page');
      announce(page);
    }

    function isOpen(element) {
      return element && !element.classList.contains('hidden');
    }

    function closeFormView() {
      var formView = document.getElementById('formView');
      if (!isOpen(formView)) return false;
      var cancelButton = document.getElementById('formCancel');
      if (cancelButton) cancelButton.click();
      else formView.classList.add('hidden');
      return true;
    }

    function closeMenuSheet() {
      var menuSheet = document.getElementById('menuSheet');
      if (!isOpen(menuSheet)) return false;
      var closeButton = document.getElementById('menuCancel');
      if (closeButton) closeButton.click();
      else menuSheet.classList.add('hidden');
      return true;
    }

    function closeStatusPage() {
      var statusPage = document.getElementById('statusPage');
      if (!isOpen(statusPage)) return false;
      var backButton = statusPage.querySelector('button[aria-label="Back"]');
      if (backButton) backButton.click();
      else statusPage.classList.add('hidden');
      return true;
    }

    function closeFilterPanel() {
      var filterPanel = document.getElementById('statusFilters');
      var filterToggle = document.getElementById('statusFilterToggle');
      if (!isOpen(filterPanel)) return false;
      filterPanel.classList.add('hidden');
      if (filterToggle) filterToggle.setAttribute('aria-expanded', 'false');
      return true;
    }

    function closeBossVictory() {
      var overlay = document.getElementById('bossVictoryOverlay');
      if (!overlay) return false;
      overlay.remove();
      return true;
    }

    function closeBookDetails() {
      var bookDetails = document.getElementById('bookDetails');

      if (!isOpen(bookDetails)) return false;

      var closeButton = bookDetails.querySelector('.bd-close');

      if (closeButton) {
        closeButton.click();
      } else {
        bookDetails.classList.add('hidden');
      }

      return true;
    }

    function closeBookwyrmBazaar() {
      var bazaar = document.getElementById('bookwyrmBazaar');

      if (
        !bazaar ||
        bazaar.classList.contains('hidden') ||
        !bazaar.classList.contains('is-open')
      ) {
        return false;
      }

      if (window.BookwyrmBazaar && typeof window.BookwyrmBazaar.back === 'function') {
        window.BookwyrmBazaar.back();
      } else if (window.BookwyrmBazaar && typeof window.BookwyrmBazaar.close === 'function') {
        window.BookwyrmBazaar.close();
      } else {
        bazaar.classList.remove('is-open');

        setTimeout(function () {
          bazaar.classList.add('hidden');
        }, 260);
      }

      return true;
    }

    function closeCollectionOverlay() {
      var collection = window.BookShelfCollectionOverlay;

      if (
        !collection ||
        typeof collection.isOpen !== 'function' ||
        !collection.isOpen()
      ) {
        return false;
      }

      if (typeof collection.back === 'function') {
        collection.back();
      } else if (typeof collection.close === 'function') {
        collection.close();
      }

      return true;
    }

    function handleBackButton() {
      if (closeBookDetails()) return;
      if (closeBookwyrmBazaar()) return;
      if (closeCollectionOverlay()) return;
      if (closeBossVictory()) return;
      if (closeFormView()) return;
      if (closeStatusPage()) return;
      if (closeMenuSheet()) return;
      if (closeFilterPanel()) return;

      if (pageHistory.length > 0) {
        show(pageHistory.pop(), false);
        return;
      }

      if (currentPage !== 'dashboard') {
        show('dashboard', false);
        return;
      }

      var now = Date.now();
      if (now - lastDashboardBackAt < 2000) {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
          window.Capacitor.Plugins.App.exitApp();
        }
        return;
      }

      lastDashboardBackAt = now;
      if (dashboardBackTimer) clearTimeout(dashboardBackTimer);

      dashboardBackTimer = setTimeout(function () {
        lastDashboardBackAt = 0;
        dashboardBackTimer = null;
      }, 2000);

      var toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = 'Press Back again to exit';
        toast.classList.remove('hidden');
        setTimeout(function () { toast.classList.add('hidden'); }, 2000);
      }
    }

    nav.onclick = function (event) {
      var button = event.target.closest('[data-page]');
      if (button) show(button.dataset.page, true);
    };

    var dashboard = document.getElementById('dashboard');
    show(dashboard && !dashboard.classList.contains('hidden') ? 'dashboard' : 'library', false);

    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      window.Capacitor.Plugins.App.addListener('backButton', handleBackButton);
    } else {
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') handleBackButton();
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();