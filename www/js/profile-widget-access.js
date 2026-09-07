(function () {
  function fallbackHelp(message) {
    var old = document.getElementById('widgetInstallHelp');
    if (old) old.remove();

    var sheet = document.createElement('section');
    sheet.id = 'widgetInstallHelp';
    sheet.className = 'widget-install-help';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.innerHTML = '<div><span class="widget-help-label">Lanternfalls Home Widget</span><h2>Add to your home screen</h2><p>' + (message || 'Your launcher needs you to add widgets manually.') + '</p><ol><li>Go to your Android home screen.</li><li>Touch and hold an empty area.</li><li>Tap <b>Widgets</b>.</li><li>Find <b>Lanternfalls</b>, then drag the widget onto the home screen.</li></ol><button type="button">Done</button></div>';
    sheet.querySelector('button').onclick = function () { sheet.remove(); };
    document.body.appendChild(sheet);
  }

  function setButtonState(button, label, disabled) {
    button.textContent = label;
    button.disabled = disabled;
  }

  async function requestWidgetPin(button) {
    var plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.WidgetRefresh;
    if (!plugin || typeof plugin.requestPinWidget !== 'function') {
      fallbackHelp('Direct widget adding is available after you rebuild and reinstall the Android app with the latest widget integration.');
      return;
    }

    setButtonState(button, 'Opening widget prompt…', true);

    try {
      var result = await plugin.requestPinWidget();
      if (!result || !result.supported || !result.requested) {
        fallbackHelp((result && result.reason) || 'Your home-screen launcher did not open the widget prompt. You can still add Lanternfalls manually.');
        return;
      }
      setButtonState(button, 'Check your home screen prompt', false);
      setTimeout(function () {
        if (button.isConnected) setButtonState(button, 'Add Lanternfalls Widget', false);
      }, 5000);
    } catch (error) {
      console.error(error);
      fallbackHelp('Lanternfalls could not open the add-widget prompt. You can still add the widget from your home screen.');
    } finally {
      if (button.isConnected && button.textContent === 'Opening widget prompt…') setButtonState(button, 'Add Lanternfalls Widget', false);
    }
  }

  function addCard() {
    var page = document.getElementById('navPlaceholder');
    if (!page || (!page.classList.contains('reading-profile-page') && !page.classList.contains('realm-settings-page')) || page.querySelector('.profile-widget-card')) return;

    var content = page.querySelector('.reading-profile-content, .realm-settings-content');
    if (!content) return;

    var card = document.createElement('section');
    card.className = 'reading-profile-card profile-widget-card';
    card.innerHTML = '<h2>Home Screen Widget</h2><p>Start a reading timer from your home screen. Completed widget sessions will appear here ready to claim.</p><button type="button" class="profile-widget-button">Add Lanternfalls Widget</button><p class="profile-widget-note">Android will show a confirmation prompt before it adds the widget.</p>';
    card.querySelector('.profile-widget-button').onclick = function () { requestWidgetPin(this); };
    content.insertBefore(card, content.firstChild);
  }

  function install() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.dataset.profileWidgetAccessReady) return;
    page.dataset.profileWidgetAccessReady = 'true';

    var style = document.createElement('style');
    style.textContent = '.profile-widget-card{border-color:rgba(168,130,60,.52)!important}.profile-widget-card .profile-widget-button{display:block;width:100%;box-sizing:border-box;margin-top:13px;padding:11px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4);font:inherit;font-weight:normal;line-height:1.2;text-align:center;cursor:pointer}.profile-widget-card .profile-widget-button:disabled{opacity:.6;cursor:wait}.profile-widget-note{margin:9px 0 0!important;color:var(--muted,#8A8378)!important;font-size:11px!important}.widget-install-help{position:fixed;z-index:1300;inset:0;display:grid;place-items:end center;padding:18px;background:rgba(0,0,0,.65)}.widget-install-help>div{width:min(480px,100%);padding:22px;border:1px solid var(--gold,#A8823C);border-radius:8px;background:var(--bg-elevated,#1B2129);color:var(--paper-light,#F6F1E4)}.widget-help-label{color:var(--gold,#A8823C);font-size:11px;letter-spacing:.08em;text-transform:uppercase}.widget-install-help h2{margin:6px 0 12px;font:23px Georgia,serif}.widget-install-help ol{margin:0;padding-left:22px;line-height:1.7;color:var(--muted,#8A8378);font-size:13px}.widget-install-help p{color:var(--muted,#8A8378);font-size:12px;line-height:1.4}.widget-install-help button{width:100%;padding:11px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4);font:inherit;font-weight:normal;text-align:center}';
    document.head.appendChild(style);

    new MutationObserver(function () {
      setTimeout(addCard, 0); new MutationObserver(function () {
        setTimeout(addCard, 0);
      }).observe(page, {
        childList: true,
        subtree: true
      });

      window.addEventListener('bookshelf-navigation-changed', function (event) {
        if (event.detail && event.detail.page === 'profile') {
          setTimeout(addCard, 100);
          setTimeout(addCard, 350);
        }
      });
    }).observe(page, { childList: true });
    addCard();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();