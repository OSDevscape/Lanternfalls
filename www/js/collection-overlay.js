(function () {
  var PANEL_ID = 'readQuestCollectionPanel';
  var TRANSITION_MS = 260;
  var closeTimer = null;

  function panel() {
    return document.getElementById(PANEL_ID);
  }

  function placeholder() {
    return document.getElementById('navPlaceholder');
  }

  function realmTab() {
    return document.querySelector(
      '#bottomNavigation [data-page="realm"]'
    );
  }

  function isOpen() {
    var target = panel();

    return !!(
      target &&
      !target.classList.contains('hidden') &&
      target.classList.contains('is-open')
    );
  }

  function ensurePanel() {
    var target = panel();

    if (target) {
      return target;
    }

    target = document.createElement('section');
    target.id = PANEL_ID;
    target.className = 'readquest-collection-panel hidden';
    target.setAttribute('aria-label', 'Collection');

    document.body.appendChild(target);

    return target;
  }

  function renderCollection() {
    if (
      window.BookShelfCollection &&
      typeof window.BookShelfCollection.render === 'function'
    ) {
      window.BookShelfCollection.render();
    }
  }

  function open() {
    var target = ensurePanel();
    var routePlaceholder = placeholder();

    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    /*
      Keep Realm in the shared placeholder underneath. Collection is a visual
      overlay, not an independently routed page.
    */
    if (routePlaceholder) {
      routePlaceholder.classList.remove('hidden');
    }

    target.className =
      'readquest-collection-panel collection-page collection-preparing';

    renderCollection();

    /*
      Commit the full right-edge start position before enabling the slide.
    */
    void target.offsetWidth;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (!target.classList.contains('hidden')) {
          target.classList.remove('collection-preparing');
          target.classList.add('is-open');
        }
      });
    });
  }

  function close() {
    var target = panel();

    if (!target || target.classList.contains('hidden')) {
      return false;
    }

    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    target.classList.remove('is-open');

    closeTimer = setTimeout(function () {
      closeTimer = null;

      if (target.classList.contains('is-open')) {
        return;
      }

      target.className = 'readquest-collection-panel hidden';
      target.innerHTML = '';
    }, TRANSITION_MS);

    return true;
  }

  /*
    Bazaar's native Back handler asks its panel to go back one layer.
    Collection has only one layer, so Back simply closes it to Realm.
  */
  function back() {
    return close();
  }

  function installStyles() {
    if (document.getElementById('readQuestCollectionOverlayStyles')) {
      return;
    }

    var style = document.createElement('style');

    style.id = 'readQuestCollectionOverlayStyles';

    style.textContent =
      '#' + PANEL_ID + '{' +
        'position:fixed;z-index:1100;inset:0;' +
        'display:flex;flex-direction:column;overflow:hidden;' +
        'background:var(--bg,#14181C);' +
        'color:var(--paper-light,#F6F1E4);' +
        'transform:translateX(100%);' +
        'transition:transform .26s ease;' +
        'will-change:transform' +
      '}' +

      '#' + PANEL_ID + '.hidden{' +
        'display:none!important' +
      '}' +

      '#' + PANEL_ID + '.collection-preparing{' +
        'transition:none!important;' +
        'transform:translateX(100%)!important' +
      '}' +

      '#' + PANEL_ID + '.is-open{' +
        'transform:translateX(0)' +
      '}' +

      '#' + PANEL_ID + '.collection-page{' +
        'padding:0!important;' +
        'background:var(--bg,#14181C)!important' +
      '}' +

      '#' + PANEL_ID + '.collection-page .collection-content{' +
        'flex:1' +
      '}';

    document.head.appendChild(style);
  }

  function install() {
    installStyles();
    ensurePanel();

    /*
      Realm's Collection button normally calls the hidden route button.
      Intercept it so Collection is never added to bottom-navigation history.
    */
    document.addEventListener('click', function (event) {
      var destination = event.target.closest(
        '[data-realm-open="collection"]'
      );

      if (!destination) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      open();
    }, true);

    /*
      Collection's visible back button uses the same close path as Android
      native Back. Realm stays mounted below the sliding panel.
    */
    document.addEventListener('click', function (event) {
      var button = event.target.closest('[data-collection-back]');

      if (!button || !isOpen()) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      back();
    }, true);
  }

  window.BookShelfCollectionOverlay = {
    open: open,
    close: close,
    back: back,
    isOpen: isOpen
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();