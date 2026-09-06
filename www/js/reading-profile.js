(function () {
  var PROFILE_KEY = 'bookshelf-reading-profile-v1';
  var LOG_KEY = 'bookshelf-reading-log-v1';
  var PROFILE_PANEL_ID = 'readQuestReaderProfilePanel';
  var PROFILE_PANEL_TRANSITION_MS = 260;

  var profilePanelCloseTimer = null;

  function read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || fallback);
    } catch (_) {
      return JSON.parse(fallback);
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getProfile() {
    var saved = read(PROFILE_KEY, '{}');

    return {
      name: String(saved.name || '').trim(),
      notificationsEnabled: !!saved.notificationsEnabled
    };
  }

  function saveProfile(profile) {
    write(PROFILE_KEY, {
      name: String(profile.name || '').trim(),
      notificationsEnabled: !!profile.notificationsEnabled
    });

    window.dispatchEvent(
      new CustomEvent('bookshelf-reading-profile-changed', {
        detail: getProfile()
      })
    );
  }

  function today() {
    var date = new Date();

    return (
      date.getFullYear() +
      '-' +
      String(date.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(date.getDate()).padStart(2, '0')
    );
  }

  function notifyReadingChange() {
    window.dispatchEvent(new Event('bookshelf-reading-log-changed'));
  }

  async function loadBooks() {
    try {
      return await window.BookStorage.loadBooks();
    } catch (_) {
      return [];
    }
  }

  function tooltipButton(message, label) {
    var button = document.createElement('button');

    button.type = 'button';
    button.className = 'reading-tooltip-trigger';
    button.textContent = 'ⓘ';
    button.setAttribute('data-tooltip', message);
    button.setAttribute('aria-label', label || 'More information');
    button.setAttribute('aria-expanded', 'false');

    return button;
  }

  function headingWithTooltip(text, message) {
    var heading = document.createElement('h2');

    heading.textContent = text + ' ';
    heading.appendChild(tooltipButton(message, 'About ' + text));

    return heading;
  }

  function ledgerEntry(entry) {
    var engine = window.BookShelfRewards;

    if (!engine || !entry || !entry.id) {
      return null;
    }

    return engine.ledger().transactions['session:' + entry.id] || null;
  }

  function rewardStatus(entry) {
    var item = ledgerEntry(entry);

    if (!item) return 'Unclaimed';
    if (item.status === 'reversed') return 'Rewards reversed';
    if (item.migrated) return 'Historical rewards kept';

    return 'Claimed: +' + item.xp + ' XP · +' + item.gold + ' gold';
  }

  function removeSession(entry, reverseRewards) {
    var engine = window.BookShelfRewards;

    if (reverseRewards && engine) {
      var result = engine.reverseSession(entry.id);

      if (!result.ok && result.reason !== 'not-claimed') {
        alert(
          result.reason === 'historical'
            ? 'This is a historical reward from before the ledger was added. Its old reward cannot be safely reversed automatically.'
            : 'This reward was already reversed or cannot be reversed.'
        );
        return;
      }
    } else if (!reverseRewards && engine) {
      engine.detachSession(entry.id);
    }

    write(
      LOG_KEY,
      read(LOG_KEY, '[]').filter(function (item) {
        return item.id !== entry.id;
      })
    );

    notifyReadingChange();
    render();
  }

  function profilePanel() {
    return document.getElementById(PROFILE_PANEL_ID);
  }

  function profilePanelIsOpen() {
    var panel = profilePanel();

    return !!(
      panel &&
      !panel.classList.contains('hidden') &&
      panel.classList.contains('is-open')
    );
  }

  function ensureProfilePanel() {
    var panel = profilePanel();

    if (panel) {
      return panel;
    }

    panel = document.createElement('section');
    panel.id = PROFILE_PANEL_ID;
    panel.className = 'reader-profile-panel hidden';
    panel.setAttribute('aria-label', 'Reader Profile');
    panel.setAttribute('aria-hidden', 'true');

    document.body.appendChild(panel);

    return panel;
  }

  function closeReaderProfilePanel() {
    var panel = profilePanel();

    if (!panel || panel.classList.contains('hidden')) {
      return false;
    }

    if (profilePanelCloseTimer) {
      clearTimeout(profilePanelCloseTimer);
      profilePanelCloseTimer = null;
    }

    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');

    profilePanelCloseTimer = setTimeout(function () {
      profilePanelCloseTimer = null;

      if (panel.classList.contains('is-open')) {
        return;
      }

      panel.className = 'reader-profile-panel hidden';
      panel.innerHTML = '';
    }, PROFILE_PANEL_TRANSITION_MS);

    return true;
  }

  function showToast(message) {
    var toast = document.getElementById('toast');

    if (!toast) {
      return;
    }

    toast.textContent = message;
    toast.classList.remove('hidden');

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(function () {
      toast.classList.add('hidden');
    }, 2400);
  }

  function renderReaderProfilePanel() {
    var panel = ensureProfilePanel();
    var profile = getProfile();

    panel.innerHTML =
      '<header class="reader-profile-panel-header">' +
      '<button type="button" class="reader-profile-back" aria-label="Back to settings">‹ Back</button>' +
      '<h2>Reader Profile</h2>' +
      '<span></span>' +
      '</header>' +
      '<main class="reader-profile-panel-content">' +
      '<form id="readerProfileForm" class="reader-profile-panel-form">' +
      '<label class="reader-profile-field">' +
      '<span>Name</span>' +
      '<input id="readerProfileName" type="text" maxlength="60" autocomplete="name" placeholder="Your name">' +
      '</label>' +

      '<section class="reader-notification-card">' +
      '<button id="readerNotificationsToggle" class="reader-notification-toggle" type="button" aria-controls="readerNotificationsBody" aria-expanded="false">' +
      '<span class="reader-notification-toggle-title">' +
      '<strong>Notifications</strong>' +
      '<small>Manage reading reminders and updates</small>' +
      '</span>' +
      '<span class="reader-notification-chevron" aria-hidden="true">›</span>' +
      '</button>' +
      '<div id="readerNotificationsBody" class="reader-notification-body hidden">' +
      '<label class="reader-switch-row">' +
      '<span>' +
      '<strong>Enable notifications</strong>' +
      '<small>Allow Lanternfalls to send reminders and updates.</small>' +
      '</span>' +
      '<input id="readerNotificationsEnabled" type="checkbox" role="switch">' +
      '</label>' +
      '<p class="reader-notification-note">This saves your Lanternfalls preference. Notification reminders will only appear after notification scheduling is added and device permission is granted.</p>' +
      '</div>' +
      '</section>' +

      '<button type="submit" class="reader-profile-save">Save Profile</button>' +
      '</form>' +
      '</main>';

    var name = panel.querySelector('#readerProfileName');
    var form = panel.querySelector('#readerProfileForm');
    var back = panel.querySelector('.reader-profile-back');
    var notificationToggle = panel.querySelector('#readerNotificationsToggle');
    var notificationBody = panel.querySelector('#readerNotificationsBody');
    var notificationCheckbox = panel.querySelector(
      '#readerNotificationsEnabled'
    );

    name.value = profile.name;
    notificationCheckbox.checked = profile.notificationsEnabled;

    back.onclick = function () {
      closeReaderProfilePanel();
    };

    notificationToggle.onclick = function () {
      var open = notificationToggle.getAttribute('aria-expanded') === 'true';

      notificationToggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      notificationBody.classList.toggle('hidden', open);
    };

    form.onsubmit = async function (event) {
      event.preventDefault();

      var notificationsEnabled = notificationCheckbox.checked;

      if (notificationsEnabled && window.ReadQuestNotifications) {
        var permission = await window.ReadQuestNotifications.requestPermission();

        if (!permission.granted) {
          notificationCheckbox.checked = false;

          saveProfile({
            name: name.value,
            notificationsEnabled: false
          });

          showToast(
            permission.reason ||
            'Notifications were not enabled because Android permission was denied.'
          );

          return;
        }

        var scheduled =
          await window.ReadQuestNotifications.scheduleDailyReadingReminder();

        if (!scheduled.ok) {
          notificationCheckbox.checked = false;

          saveProfile({
            name: name.value,
            notificationsEnabled: false
          });

          showToast(
            scheduled.reason ||
            'Notifications could not be scheduled on this device.'
          );

          return;
        }
      }

      if (!notificationsEnabled && window.ReadQuestNotifications) {
        await window.ReadQuestNotifications.cancelReadQuestNotifications();
      }

      saveProfile({
        name: name.value,
        notificationsEnabled: notificationsEnabled
      });

      showToast(
        notificationsEnabled
          ? 'Profile saved. Daily reading reminders are on.'
          : 'Profile saved. Notifications are off.'
      );

      closeReaderProfilePanel();
      render();
    };
  }

  function openReaderProfilePanel() {
    var panel = ensureProfilePanel();

    if (profilePanelCloseTimer) {
      clearTimeout(profilePanelCloseTimer);
      profilePanelCloseTimer = null;
    }

    renderReaderProfilePanel();

    panel.className = 'reader-profile-panel reader-profile-panel-preparing';
    panel.setAttribute('aria-hidden', 'false');

    void panel.offsetWidth;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (!panel.classList.contains('hidden')) {
          panel.classList.remove('reader-profile-panel-preparing');
          panel.classList.add('is-open');
        }
      });
    });
  }

  function renderRealmSettings() {
    var page = document.getElementById('navPlaceholder');

    if (!page || page.classList.contains('hidden')) {
      return;
    }

    page.innerHTML = '';
    page.classList.remove('adventure-page', 'reading-profile-page');
    page.classList.add('realm-settings-page');

    var header = document.createElement('header');
    header.className = 'realm-settings-header';

    var back = document.createElement('button');
    back.type = 'button';
    back.className = 'realm-settings-back';
    back.textContent = '‹ Realm';

    var title = document.createElement('h1');
    title.textContent = 'Settings';

    header.append(back, title, document.createElement('span'));

    var content = document.createElement('main');
    content.className = 'realm-settings-content';

    var profileButton = document.createElement('button');
    profileButton.type = 'button';
    profileButton.className = 'realm-settings-row';
    profileButton.innerHTML =
      '<span class="realm-settings-row-icon" aria-hidden="true">♙</span>' +
      '<span class="realm-settings-row-copy">' +
      '<strong>Reader Profile</strong>' +
      '<small>Set your name and notification preference.</small>' +
      '</span>' +
      '<span class="realm-settings-row-chevron" aria-hidden="true">›</span>';

    content.appendChild(profileButton);
    page.append(header, content);

    back.onclick = function () {
      var realmTab = document.querySelector(
        '#bottomNavigation [data-page="realm"]'
      );

      if (realmTab) {
        realmTab.click();
      }
    };

    profileButton.onclick = function () {
      openReaderProfilePanel();
    };
  }

  async function render() {
    var page = document.getElementById('navPlaceholder');

    if (!page || page.classList.contains('hidden')) {
      return;
    }

    var profile = getProfile();
    var log = read(LOG_KEY, '[]');
    var books = await loadBooks();

    if (page.classList.contains('hidden')) {
      return;
    }

    page.innerHTML = '';
    page.classList.remove('adventure-page', 'realm-settings-page');
    page.classList.add('reading-profile-page');

    var header = document.createElement('header');
    header.className = 'reading-profile-header';

    var intro = document.createElement('div');
    var title = document.createElement('h1');
    var sub = document.createElement('p');

    title.textContent = profile.name ? profile.name + "'s Profile" : 'My Profile';
    sub.textContent = 'Log your reading and listening time';

    intro.append(title, sub);

    var settingsButton = document.createElement('button');
    settingsButton.type = 'button';
    settingsButton.className = 'reading-settings-button';
    settingsButton.textContent = 'Settings';

    header.append(intro, settingsButton);

    var content = document.createElement('main');
    content.className = 'reading-profile-content';

    var logCard = document.createElement('section');
    logCard.className = 'reading-profile-card';

    logCard.appendChild(
      headingWithTooltip(
        'Log Reading Time',
        'Minutes are your reading record. Eligible sessions can earn XP and gold after they are claimed in Adventure.'
      )
    );

    var logDescription = document.createElement('p');
    logDescription.textContent =
      'Minutes are your reading record. Claimed rewards are retained in your Adventure ledger.';

    logCard.appendChild(logDescription);

    var form = document.createElement('form');
    form.className = 'reading-profile-form';

    var book = document.createElement('select');
    book.setAttribute('aria-label', 'Associated book');
    book.setAttribute(
      'data-tooltip',
      'Optional. Linking a book helps preserve its reading history and completion context.'
    );

    var blank = document.createElement('option');
    blank.value = '';
    blank.textContent = 'Book (optional)';
    book.appendChild(blank);

    books
      .slice()
      .sort(function (a, b) {
        return String(a.title).localeCompare(String(b.title));
      })
      .forEach(function (item) {
        var option = document.createElement('option');
        option.value = item.id;
        option.textContent =
          item.title + (item.author ? ' — ' + item.author : '');

        book.appendChild(option);
      });

    var minutes = document.createElement('input');
    minutes.type = 'number';
    minutes.min = '1';
    minutes.step = '1';
    minutes.placeholder = 'Minutes read or listened';
    minutes.required = true;
    minutes.setAttribute('aria-label', 'Minutes read or listened');
    minutes.setAttribute(
      'data-tooltip',
      'Enter the number of minutes you read or listened during this session.'
    );

    var date = document.createElement('input');
    date.type = 'date';
    date.value = today();
    date.setAttribute('aria-label', 'Session date');
    date.setAttribute(
      'data-tooltip',
      'Choose the date this reading or listening session occurred.'
    );

    var add = document.createElement('button');
    add.type = 'submit';
    add.textContent = 'Add Time Entry';
    add.setAttribute(
      'data-tooltip',
      'Adds this reading session to your history. Add a book only if you want the session linked to that title.'
    );

    form.append(book, minutes, date, add);
    logCard.appendChild(form);

    var history = document.createElement('details');
    history.className = 'reading-profile-card reading-recent-sessions';
    history.open = false;

    var historySummary = document.createElement('summary');
    historySummary.appendChild(
      headingWithTooltip(
        'Recent Sessions',
        'Shows your ten most recent reading or listening entries and their reward status.'
      )
    );

    var historyCount = document.createElement('em');
    historyCount.textContent = log.length ? log.length + ' entries' : 'None';

    historySummary.appendChild(historyCount);
    history.appendChild(historySummary);

    var entries = log
      .slice()
      .sort(function (a, b) {
        return String(b.date || b.createdAt || '').localeCompare(
          String(a.date || a.createdAt || '')
        );
      })
      .slice(0, 10);

    if (!entries.length) {
      var empty = document.createElement('p');
      empty.className = 'reading-profile-empty';
      empty.textContent = 'No reading time logged yet.';
      history.appendChild(empty);
    } else {
      entries.forEach(function (entry) {
        var matched = books.filter(function (item) {
          return item.id === entry.bookId;
        })[0];

        var status = rewardStatus(entry);

        var row = document.createElement('div');
        row.className = 'reading-session-row';

        var text = document.createElement('div');
        var value = document.createElement('strong');
        var detail = document.createElement('span');
        var ledger = document.createElement('small');

        value.textContent = Number(entry.minutes) + ' minutes';
        detail.textContent =
          (matched ? matched.title + ' · ' : '') +
          (entry.date || 'Date unavailable');

        ledger.className = 'reading-session-ledger';
        ledger.textContent = status;
        ledger.setAttribute(
          'data-tooltip',
          status === 'Unclaimed'
            ? 'This session has not been claimed for rewards yet.'
            : status === 'Rewards reversed'
              ? 'The XP and gold previously associated with this session were reversed.'
              : status === 'Historical rewards kept'
                ? 'This entry predates the current reward ledger. Its historical reward is retained and cannot be safely reversed automatically.'
                : 'This session has already recorded its XP and gold in the Adventure ledger.'
        );

        text.append(value, detail, ledger);

        var actions = document.createElement('div');
        actions.className = 'reading-session-actions';

        var removeTime = document.createElement('button');
        removeTime.type = 'button';
        removeTime.textContent =
          status === 'Unclaimed'
            ? 'Remove Time'
            : 'Remove Time · Keep Rewards';

        removeTime.onclick = function () {
          if (
            !confirm(
              status === 'Unclaimed'
                ? 'Remove this unclaimed time entry?'
                : 'Remove this time entry and retain its recorded reward in the Adventure ledger?'
            )
          ) {
            return;
          }

          removeSession(entry, false);
        };

        var removeRewards = document.createElement('button');
        removeRewards.type = 'button';
        removeRewards.className = 'remove-rewards';
        removeRewards.textContent = 'Remove + Reverse Rewards';
        removeRewards.disabled =
          status === 'Unclaimed' || status === 'Rewards reversed';

        removeRewards.onclick = function () {
          if (
            !confirm(
              'Remove this time entry and create a ledger reversal for its XP and gold?'
            )
          ) {
            return;
          }

          removeSession(entry, true);
        };

        actions.append(removeTime, removeRewards);
        row.append(text, actions);
        history.appendChild(row);
      });
    }

    content.append(logCard, history);
    page.append(header, content);

    settingsButton.onclick = function () {
      renderRealmSettings();
    };

    form.onsubmit = function (event) {
      event.preventDefault();

      var amount = Math.floor(Number(minutes.value));

      if (!amount || amount < 1 || !date.value) {
        return;
      }

      log.push({
        id:
          'time-' +
          Date.now().toString(36) +
          Math.random().toString(36).slice(2, 7),
        bookId: book.value,
        minutes: amount,
        date: date.value,
        createdAt: new Date().toISOString()
      });

      write(LOG_KEY, log);
      notifyReadingChange();
      render();
    };
  }

  function installStyles() {
    if (document.getElementById('readQuestReadingProfileStyles')) {
      return;
    }

    var style = document.createElement('style');

    style.id = 'readQuestReadingProfileStyles';

    style.textContent =
      '#navPlaceholder.reading-profile-page,#navPlaceholder.realm-settings-page{display:flex;flex-direction:column;padding:0;overflow:hidden;background:var(--bg,#14181C)}' +
      '.reading-profile-header,.realm-settings-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:21px 20px 15px;border-bottom:1px solid rgba(168,130,60,.24)}' +
      '.reading-profile-header h1,.realm-settings-header h1{margin:0;font:27px Georgia,serif;color:var(--paper-light,#F6F1E4)}' +
      '.reading-profile-header p{margin:4px 0 0;color:var(--muted,#8A8378);font-size:12px}' +
      '.reading-settings-button,.realm-settings-back{border:1px solid var(--gold,#A8823C);border-radius:3px;background:transparent;color:var(--paper-light,#F6F1E4);padding:8px 10px;font:inherit;cursor:pointer}' +
      '.realm-settings-header>span{width:61px}' +
      '.reading-profile-content,.realm-settings-content{flex:1;overflow:auto;padding:16px 20px 130px}' +
      '.reading-profile-card{margin:0 0 13px;padding:16px;background:var(--bg-elevated,#1B2129);border:1px solid rgba(168,130,60,.28);border-radius:4px}' +
      '.reading-profile-card h2{margin:0;color:var(--gold,#A8823C);font-size:15px;text-transform:uppercase}' +
      '.reading-tooltip-trigger{display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;margin:0 0 0 4px;padding:0;border:1px solid currentColor;border-radius:50%;background:transparent;color:inherit;font:700 11px/1 sans-serif;vertical-align:1px;cursor:pointer}' +
      '.reading-tooltip-trigger:focus-visible{outline:2px solid currentColor;outline-offset:2px}' +
      '.reading-profile-card p,.reading-profile-empty{margin:8px 0 0;color:var(--muted,#8A8378);font-size:13px;line-height:1.4}' +
      '.reading-profile-form{display:grid;gap:9px;margin-top:14px}' +
      '.reading-profile-form input,.reading-profile-form select{width:100%;box-sizing:border-box;padding:11px;border:1px solid rgba(168,130,60,.4);border-radius:3px;background:var(--bg,#14181C);color:var(--paper-light,#F6F1E4)}' +
      '.reading-profile-form button{padding:11px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4)}' +
      '.reading-session-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-top:1px solid rgba(168,130,60,.18)}' +
      '.reading-session-row strong,.reading-session-row span,.reading-session-row small{display:block}' +
      '.reading-session-row span{margin-top:3px;color:var(--muted,#8A8378);font-size:12px}' +
      '.reading-session-ledger{margin-top:4px;color:var(--gold,#A8823C);font-size:10px;cursor:help}' +
      '.reading-session-actions{display:flex;flex-direction:column;align-items:flex-end;gap:6px}' +
      '.reading-session-actions button{min-width:154px;padding:7px 9px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--bg,#14181C);color:var(--gold,#A8823C);font-size:11px}' +
      '.reading-session-actions .remove-rewards{border-color:#bd7070;background:rgba(139,58,58,.16);color:#e3a0a0}' +
      '.reading-session-actions button:disabled{opacity:.4;cursor:not-allowed}' +

      '.realm-settings-row{display:flex;align-items:center;gap:12px;width:100%;padding:14px;border:1px solid rgba(168,130,60,.48);border-radius:5px;background:linear-gradient(135deg,rgba(168,130,60,.14),rgba(0,0,0,.14));color:var(--paper-light,#F6F1E4);font:inherit;text-align:left;cursor:pointer}' +
      '.realm-settings-row-icon{display:grid;place-items:center;flex:0 0 auto;width:43px;height:43px;border:1px solid rgba(168,130,60,.42);border-radius:4px;background:rgba(168,130,60,.10);color:var(--gold,#A8823C);font-size:21px}' +
      '.realm-settings-row-copy{min-width:0;flex:1}' +
      '.realm-settings-row-copy strong,.realm-settings-row-copy small{display:block}' +
      '.realm-settings-row-copy strong{font:17px Georgia,serif}' +
      '.realm-settings-row-copy small{margin-top:4px;color:var(--muted,#8A8378);font-size:11px;line-height:1.35}' +
      '.realm-settings-row-chevron{color:var(--gold,#A8823C);font-size:22px}' +

      '#' + PROFILE_PANEL_ID + '{position:fixed;z-index:1150;inset:0;display:flex;flex-direction:column;overflow:hidden;background:var(--bg,#14181C);color:var(--paper-light,#F6F1E4);transform:translateX(100%);transition:transform .26s ease;will-change:transform}' +
      '#' + PROFILE_PANEL_ID + '.hidden{display:none!important}' +
      '#' + PROFILE_PANEL_ID + '.reader-profile-panel-preparing{transition:none!important;transform:translateX(100%)!important}' +
      '#' + PROFILE_PANEL_ID + '.is-open{transform:translateX(0)}' +
      '.reader-profile-panel-header{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;padding:18px 20px;border-bottom:1px solid rgba(168,130,60,.24)}' +
      '.reader-profile-panel-header h2{margin:0;font:22px Georgia,serif}' +
      '.reader-profile-panel-header>span{justify-self:end;width:52px}' +
      '.reader-profile-back{justify-self:start;border:1px solid var(--gold,#A8823C);border-radius:3px;background:transparent;color:var(--paper-light,#F6F1E4);padding:8px 10px;cursor:pointer}' +
      '.reader-profile-panel-content{flex:1;overflow:auto;padding:20px 20px 130px}' +
      '.reader-profile-panel-form{display:grid;gap:14px}' +
      '.reader-profile-field{display:grid;gap:7px}' +
      '.reader-profile-field>span{color:var(--gold,#A8823C);font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}' +
      '.reader-profile-field input{width:100%;box-sizing:border-box;padding:12px;border:1px solid rgba(168,130,60,.45);border-radius:3px;background:var(--bg-elevated,#1B2129);color:var(--paper-light,#F6F1E4);font:16px inherit}' +
      '.reader-notification-card{border:1px solid rgba(168,130,60,.30);border-radius:4px;background:var(--bg-elevated,#1B2129);overflow:hidden}' +
      '.reader-notification-toggle{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:14px;border:0;background:transparent;color:var(--paper-light,#F6F1E4);text-align:left;cursor:pointer}' +
      '.reader-notification-toggle-title strong,.reader-notification-toggle-title small{display:block}' +
      '.reader-notification-toggle-title strong{font:16px Georgia,serif}' +
      '.reader-notification-toggle-title small{margin-top:4px;color:var(--muted,#8A8378);font-size:11px;line-height:1.35}' +
      '.reader-notification-chevron{color:var(--gold,#A8823C);font-size:24px;line-height:1;transition:transform .18s ease}' +
      '.reader-notification-toggle[aria-expanded="true"] .reader-notification-chevron{transform:rotate(90deg)}' +
      '.reader-notification-body{padding:0 14px 14px;border-top:1px solid rgba(168,130,60,.20)}' +
      '.reader-notification-body.hidden{display:none!important}' +
      '.reader-switch-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 0}' +
      '.reader-switch-row strong,.reader-switch-row small{display:block}' +
      '.reader-switch-row strong{font-size:14px}' +
      '.reader-switch-row small{margin-top:4px;color:var(--muted,#8A8378);font-size:11px;line-height:1.35}' +
      '.reader-switch-row input{width:44px;height:24px;margin:0;accent-color:var(--gold,#A8823C);cursor:pointer}' +
      '.reader-notification-note{margin:0;color:var(--muted,#8A8378);font-size:11px;line-height:1.45}' +
      '.reader-profile-save{width:100%;padding:12px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4);font:700 14px inherit;cursor:pointer}' +
      '.hidden{display:none!important}';

    document.head.appendChild(style);
  }

  function install() {
    var nav = document.getElementById('bottomNavigation');

    if (!nav || nav.dataset.readingProfileReady) {
      return;
    }

    nav.dataset.readingProfileReady = 'true';

    installStyles();
    ensureProfilePanel();

    var originalClick = nav.onclick;

    nav.onclick = function (event) {
      if (typeof originalClick === 'function') {
        originalClick.call(nav, event);
      }

      var target = event.target.closest('[data-page]');

      if (target && target.dataset.page === 'profile') {
        render();
      }
    };
  }

  window.ReadQuestReaderProfile = {
    openSettings: renderRealmSettings,
    openProfilePanel: openReaderProfilePanel,
    closeProfilePanel: closeReaderProfilePanel,
    isProfilePanelOpen: profilePanelIsOpen,
    getProfile: getProfile
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();