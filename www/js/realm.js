(function () {
  function page() {
    return document.getElementById('navPlaceholder');
  }

  function openRoute(name) {
    var tab = document.querySelector('#bottomNavigation [data-page="' + name + '"]');
    if (tab) tab.click();
  }

  function render() {
    var target = page();

    if (!target || target.classList.contains('hidden')) return;
    if (!target.classList.contains('realm-page')) return;

    target.innerHTML =
      '<header class="realm-header">' +
        '<div><h1>Realm</h1><p>Your reader’s wider world.</p></div>' +
        '<button type="button" class="reading-settings-button realm-settings-button" data-realm-open="profile" aria-label="Open Profile" data-tooltip="Open your reader profile, settings, and reading-time log.">Settings</button>' +
      '</header>' +
      '<main class="realm-content">' +
        '<section class="realm-intro">' +
          '<span class="adventure-label">ReadQuest Realm</span>' +
          '<h2>Shape your legend</h2>' +
          '<p>Visit your character, prepare enchantments, and discover what lies ahead.</p>' +
        '</section>' +

        '<button type="button" class="realm-destination realm-destination-active" data-realm-open="character">' +
          '<span>♙</span>' +
          '<div><b>Character</b><small>Class, level, gold, stats, and achievements.</small></div>' +
          '<em>›</em>' +
        '</button>' +

        '<button type="button" class="realm-destination realm-destination-active" data-realm-bazaar>' +
          '<span>✦</span>' +
          '<div><b>The Bookwyrm Bazaar</b><small>Buy, store, and activate reading enchantments.</small></div>' +
          '<em>›</em>' +
        '</button>' +

        '<button type="button" class="realm-destination" disabled>' +
          '<span>⚔</span>' +
          '<div><b>Equipment</b><small>Weapons, armor, and trinkets for future expeditions.</small></div>' +
          '<em>Coming soon</em>' +
        '</button>' +

        '<button type="button" class="realm-destination" disabled>' +
          '<span>▣</span>' +
          '<div><b>Collection</b><small>Organize your trophies, relics, and rare finds.</small></div>' +
          '<em>Coming soon</em>' +
        '</button>' +

        '<button type="button" class="realm-destination" disabled>' +
          '<span>⌘</span>' +
          '<div><b>World Map</b><small>Explore new regions in a future release.</small></div>' +
          '<em>Future</em>' +
        '</button>' +

        '<button type="button" class="realm-destination" disabled>' +
          '<span>♜</span>' +
          '<div><b>Dungeon Party</b><small>Build a party for future cooperative adventures.</small></div>' +
          '<em>Future</em>' +
        '</button>' +
      '</main>';

    target.querySelectorAll('[data-realm-open]').forEach(function (button) {
      button.onclick = function () {
        openRoute(button.dataset.realmOpen);
      };
    });

    var bazaarButton = target.querySelector('[data-realm-bazaar]');

    if (bazaarButton) {
      bazaarButton.onclick = function () {
        if (window.BookwyrmBazaar && window.BookwyrmBazaar.open) {
          window.BookwyrmBazaar.open();
        }
      };
    }
  }

  function install() {
    var target = page();

    if (!target || target.dataset.realmReady) return;
    target.dataset.realmReady = 'true';

    var style = document.createElement('style');

    style.textContent =
      '#navPlaceholder.realm-page{display:flex;flex-direction:column;padding:0;overflow:hidden;background:var(--bg,#14181C)}' +
      '.realm-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px;border-bottom:1px solid rgba(168,130,60,.24)}' +
      '.realm-header h1{margin:0;font:27px Georgia,serif}' +
      '.realm-header p{margin:4px 0 0;color:var(--muted,#8A8378);font-size:12px}' +
      '.realm-settings-button{border:1px solid var(--gold,#A8823C);border-radius:3px;background:transparent;color:var(--paper-light,#F6F1E4);padding:8px 10px;font:inherit;font-size:12px;cursor:pointer}' +
      '.realm-settings-button:focus-visible{outline:2px solid var(--gold,#A8823C);outline-offset:2px}' +
      '.realm-content{flex:1;overflow:auto;padding:18px 20px 130px}' +
      '.realm-intro{padding:2px 2px 14px}' +
      '.realm-intro h2{margin:5px 0;font:23px Georgia,serif}' +
      '.realm-intro p{margin:6px 0 0;color:var(--muted,#8A8378);font-size:12px;line-height:1.45}' +
      '.realm-destination{display:flex;align-items:center;gap:12px;width:100%;margin:0 0 11px;padding:14px;border:1px solid rgba(168,130,60,.32);border-radius:5px;background:rgba(0,0,0,.14);color:var(--paper-light,#F6F1E4);font:inherit;text-align:left}' +
      '.realm-destination-active{cursor:pointer;border-color:rgba(168,130,60,.58);background:linear-gradient(135deg,rgba(168,130,60,.14),rgba(0,0,0,.14))}' +
      '.realm-destination:disabled{opacity:.52;cursor:not-allowed}' +
      '.realm-destination>span{display:grid;place-items:center;flex:0 0 auto;width:43px;height:43px;border:1px solid rgba(168,130,60,.42);border-radius:4px;background:rgba(168,130,60,.10);color:var(--gold,#A8823C);font-size:21px}' +
      '.realm-destination div{min-width:0;flex:1}' +
      '.realm-destination b,.realm-destination small{display:block}' +
      '.realm-destination b{font:17px Georgia,serif}' +
      '.realm-destination small{margin-top:4px;color:var(--muted,#8A8378);font-size:11px;line-height:1.35}' +
      '.realm-destination em{color:var(--gold,#A8823C);font-size:22px;font-style:normal;white-space:nowrap}' +
      '.realm-destination:disabled em{font-size:10px}';

    document.head.appendChild(style);

    window.addEventListener('bookshelf-navigation-changed', function (event) {
      if (event.detail && event.detail.page === 'realm') {
        render();
      }
    });

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();