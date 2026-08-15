(function () {
  function install() {
    if (document.getElementById('bottomNavigation')) return;

    var style = document.createElement('style');
    style.textContent =
      '#bottomNavigation{position:fixed;z-index:200;left:12px;right:12px;bottom:calc(10px + env(safe-area-inset-bottom));display:flex;justify-content:space-around;padding:7px 5px;background:var(--bg-elevated,#1B2129);border:1px solid var(--surface-border,rgba(42,36,30,.16));border-radius:22px;box-shadow:0 3px 14px var(--shadow,rgba(0,0,0,.28))}' +
      '#bottomNavigation button{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:62px;padding:7px 8px;border:0;border-radius:16px;background:transparent;color:var(--paper-light,#F6F1E4);font:11px var(--font-body,-apple-system);cursor:pointer}' +
      '#bottomNavigation button i{font-style:normal;font-size:22px}' +
      '#bottomNavigation button.active{background:var(--gold,#A8823C);color:#fff}' +
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
      '<button type="button" data-page="achievements"><i>♜</i>Adventure</button>' +
      '<button type="button" data-page="profile"><i>♙</i>Profile</button>';
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

    function showPlaceholder(title, text) {
      placeholder.innerHTML = '<h1>' + title + '</h1><p>' + text + '</p>';
      placeholder.classList.remove('hidden');
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

      if (addButton) addButton.classList.toggle('hidden', !isLibrary);
      if (filterBar) filterBar.classList.toggle('hidden', !isLibrary);

      if (!isLibrary && filterPanel) {
        filterPanel.classList.add('hidden');

        if (filterToggle) {
          filterToggle.setAttribute('aria-expanded', 'false');
        }
      }

      if (page === 'dashboard') {
        if (dashboard) dashboard.classList.remove('hidden');
        return;
      }

      if (page === 'library') {
        if (dashboard) dashboard.classList.add('hidden');
        return;
      }

      if (dashboard) dashboard.classList.add('hidden');

      /*
       * This is only a short-lived shell.
       * adventure.js and reading-profile.js replace it immediately after
       * the original navigation click handler finishes.
       */
      showPlaceholder(
        page === 'achievements' ? 'Adventure' : 'Profile',
        page === 'achievements'
          ? 'Loading your adventure...'
          : 'Loading your profile...'
      );

      /*
       * Android Back calls show() directly rather than a physical tab click.
       * Dispatch a click so the existing Adventure/Profile scripts render
       * their real content exactly as they do when the user taps a tab.
       */
      if (addToHistory === false) {
        var tab = nav.querySelector('[data-page="' + page + '"]');

        if (tab) {
          setTimeout(function () {
            tab.dispatchEvent(
              new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
              })
            );
          }, 0);
        }
      }
    }

    function isOpen(element) {
      return element && !element.classList.contains('hidden');
    }

    function closeFormView() {
      var formView = document.getElementById('formView');

      if (!isOpen(formView)) return false;

      var cancelButton = document.getElementById('formCancel');

      if (cancelButton) {
        cancelButton.click();
      } else {
        formView.classList.add('hidden');
      }

      return true;
    }

    function closeMenuSheet() {
      var menuSheet = document.getElementById('menuSheet');

      if (!isOpen(menuSheet)) return false;

      var closeButton = document.getElementById('menuCancel');

      if (closeButton) {
        closeButton.click();
      } else {
        menuSheet.classList.add('hidden');
      }

      return true;
    }

    function closeStatusPage() {
      var statusPage = document.getElementById('statusPage');

      if (!isOpen(statusPage)) return false;

      var backButton = statusPage.querySelector('button[aria-label="Back"]');

      if (backButton) {
        backButton.click();
      } else {
        statusPage.classList.add('hidden');
      }

      return true;
    }

    function closeFilterPanel() {
      var filterPanel = document.getElementById('statusFilters');
      var filterToggle = document.getElementById('statusFilterToggle');

      if (!isOpen(filterPanel)) return false;

      filterPanel.classList.add('hidden');

      if (filterToggle) {
        filterToggle.setAttribute('aria-expanded', 'false');
      }

      return true;
    }

    function closeBossVictory() {
      var overlay = document.getElementById('bossVictoryOverlay');

      if (!overlay) return false;

      overlay.remove();
      return true;
    }

    function handleBackButton() {
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
        if (
          window.Capacitor &&
          window.Capacitor.Plugins &&
          window.Capacitor.Plugins.App
        ) {
          window.Capacitor.Plugins.App.exitApp();
        }

        return;
      }

      lastDashboardBackAt = now;

      if (dashboardBackTimer) {
        clearTimeout(dashboardBackTimer);
      }

      dashboardBackTimer = setTimeout(function () {
        lastDashboardBackAt = 0;
        dashboardBackTimer = null;
      }, 2000);

      var toast = document.getElementById('toast');

      if (toast) {
        toast.textContent = 'Press Back again to exit';
        toast.classList.remove('hidden');

        setTimeout(function () {
          toast.classList.add('hidden');
        }, 2000);
      }
    }

    nav.onclick = function (event) {
      var button = event.target.closest('[data-page]');

      if (button) {
        show(button.dataset.page, true);
      }
    };

    var dashboard = document.getElementById('dashboard');
    var startsOnDashboard =
      dashboard && !dashboard.classList.contains('hidden');

    show(startsOnDashboard ? 'dashboard' : 'library', false);

    if (
      window.Capacitor &&
      window.Capacitor.Plugins &&
      window.Capacitor.Plugins.App
    ) {
      window.Capacitor.Plugins.App.addListener(
        'backButton',
        handleBackButton
      );
    } else {
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          handleBackButton();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();