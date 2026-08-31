(function () {
  var PANEL_ID = 'readQuestCollectionPanel';
  var REALM_ID = 'readQuestCollectionRealmBackdrop';
  var TRANSITION_MS = 260;

  function panel() {
    return document.getElementById(PANEL_ID);
  }

  function realmBackdrop() {
    return document.getElementById(REALM_ID);
  }

  function placeholder() {
    return document.getElementById('navPlaceholder');
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

  function ensureRealmBackdrop() {
    var target = realmBackdrop();

    if (target) {
      return target;
    }

    target = document.createElement('section');
    target.id = REALM_ID;
    target.className = 'readquest-collection-realm-backdrop hidden';
    target.setAttribute('aria-label', 'Realm');

    document.body.appendChild(target);

    return target;
  }

  function captureRealm() {
    var source = placeholder();
    var backdrop = ensureRealmBackdrop();

    /*
      The Collection button is pressed while Realm is visible in
      #navPlaceholder. Preserve that exact already-rendered Realm markup
      before normal navigation replaces the placeholder with Collection.
    */
    if (
      source &&
      source.classList.contains('realm-page') &&
      !source.classList.contains('hidden')
    ) {
      backdrop.className = 'readquest-collection-realm-backdrop realm-page';
      backdrop.innerHTML = source.innerHTML;
      backdrop.classList.remove('hidden');
    }
  }

  function showRealmBehindCollection() {
    var backdrop = ensureRealmBackdrop();
    var routePlaceholder = placeholder();

    /*
      Keep the actual shared navigation placeholder hidden. The retained Realm
      backdrop is now the visual page below Collection during its exit.
    */
    if (routePlaceholder) {
      routePlaceholder.className = 'hidden';
      routePlaceholder.innerHTML = '';
    }

    if (backdrop.innerHTML) {
      backdrop.classList.remove('hidden');
    }
  }

  function hideRealmBackdrop() {
    var backdrop = realmBackdrop();

    if (!backdrop) {
      return;
    }

    backdrop.classList.add('hidden');
    backdrop.innerHTML = '';
    backdrop.className = 'readquest-collection-realm-backdrop hidden';
  }

  function renderCollection() {
    var target = ensurePanel();

    if (
      window.BookShelfCollection &&
      typeof window.BookShelfCollection.render === 'function'
    ) {
      window.BookShelfCollection.render();
    }

    return target;
  }

  function open() {
    var target = ensurePanel();
    var routePlaceholder = placeholder();

    /*
      This runs when the Collection destination is chosen from Realm. Capture
      Realm first, while it is still present beneath the new Collection route.
    */
    captureRealm();

    if (routePlaceholder) {
      routePlaceholder.classList.add('hidden');
    }

    target.classList.add('hidden');
    target.classList.remove('is-open');
    target.classList.remove('collection-page');

    target.classList.remove('hidden');
    target.classList.add('collection-page');
    target.classList.add('collection-preparing');

    renderCollection();

    /*
      Commit translateX(100%) without a transition before beginning the entry.
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

  function close(options) {
    options = options || {};

    var target = panel();

    if (!target || target.classList.contains('hidden')) {
      return false;
    }

    /*
      Realm must be visible below Collection before .is-open is removed.
      No bottom-navigation tab is clicked here, so Adventure never receives
      a transient navigation/render cycle.
    */
    if (options.returnToRealm) {
      showRealmBehindCollection();
    }

    target.classList.remove('is-open');

    setTimeout(function () {
      if (!target.classList.contains('is-open')) {
        target.classList.add('hidden');
        target.innerHTML = '';
      }

      /*
        Once the outgoing panel is gone, restore real Realm navigation only
        if Collection was closed via its Realm button. This occurs after the
        visible transition, so it cannot cause a flash behind the panel.
      */
      if (options.returnToRealm) {
        hideRealmBackdrop();

        var realmTab = document.querySelector(
          '#bottomNavigation [data-page="realm"]'
        );

        if (realmTab) {
          realmTab.click();
        }
      }
    }, TRANSITION_MS);

    return true;
  }

  function installStyles() {
    if (document.getElementById('readQuestCollectionOverlayStyles')) {
      return;
    }

    var style = document.createElement('style');

    style.id = 'readQuestCollectionOverlayStyles';

    style.textContent =
      '#' + REALM_ID + '{' +
      'position:fixed;z-index:84;inset:0;' +
      'display:flex;flex-direction:column;overflow:hidden;' +
      'background:var(--bg,#14181C);color:var(--paper-light,#F6F1E4)}' +

      '#' + REALM_ID + '.hidden{' +
      'display:none!important}' +

      '#' + PANEL_ID + '{' +
      'position:fixed;z-index:1100;inset:0;' +
      'display:flex;flex-direction:column;overflow:hidden;' +
      'background:var(--bg,#14181C);color:var(--paper-light,#F6F1E4);' +
      'transform:translateX(100%);' +
      'transition:transform .26s ease;' +
      'will-change:transform}' +

      '#' + PANEL_ID + '.collection-preparing{' +
      'transition:none!important;' +
      'transform:translateX(100%)!important}' +

      '#' + PANEL_ID + '.hidden{' +
      'display:none!important}' +

      '#' + PANEL_ID + '.is-open{' +
      'transform:translateX(0)}' +

      '#' + PANEL_ID + '.collection-page{' +
      'padding:0!important;' +
      'background:var(--bg,#14181C)!important}' +

      '#' + PANEL_ID + '.collection-page .collection-content{' +
      'flex:1}';

    document.head.appendChild(style);
  }

  function install() {
    installStyles();
    ensurePanel();
    ensureRealmBackdrop();

    /*
      Capture Realm during the click phase, before bottom-navigation handles
      the hidden Collection route and replaces #navPlaceholder.
    */
    document.addEventListener('click', function (event) {
      var destination = event.target.closest('[data-realm-open="collection"]');

      if (destination) {
        captureRealm();
      }
    }, true);

    window.addEventListener('bookshelf-navigation-changed', function (event) {
      var current = event.detail && event.detail.page;

      if (current === 'collection') {
        open();
        return;
      }

      /*
        If the person navigates away with a bottom-nav tab while Collection is
        open, let its exit animation run but do not force a Realm restore.
      */
      if (isOpen()) {
        close({ returnToRealm: false });
      }
    });

    /*
      Replace Collection's original back-button behavior. It previously clicks
      the Realm tab immediately; we take control in capture phase instead.
    */
    document.addEventListener('click', function (event) {
      var button = event.target.closest('[data-collection-back]');

      if (!button || !isOpen()) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      close({ returnToRealm: true });
    }, true);
  }

  window.BookShelfCollectionOverlay = {
    open: open,
    close: close,
    isOpen: isOpen
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();