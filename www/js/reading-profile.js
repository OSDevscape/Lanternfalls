(function () {
  var PROFILE_KEY = 'bookshelf-reading-profile-v1';
  var LOG_KEY = 'bookshelf-reading-log-v1';

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch (_) { return JSON.parse(fallback); }
  }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function today() {
    var date = new Date();
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }
  function notifyReadingChange() { window.dispatchEvent(new Event('bookshelf-reading-log-changed')); }
  async function loadBooks() {
    try { return await window.BookStorage.loadBooks(); }
    catch (_) { return []; }
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
    if (!engine || !entry || !entry.id) return null;
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
        alert(result.reason === 'historical'
          ? 'This is a historical reward from before the ledger was added. Its old reward cannot be safely reversed automatically.'
          : 'This reward was already reversed or cannot be reversed.');
        return;
      }
    } else if (!reverseRewards && engine) {
      engine.detachSession(entry.id);
    }
    write(LOG_KEY, read(LOG_KEY, '[]').filter(function (item) { return item.id !== entry.id; }));
    notifyReadingChange();
    render();
  }

  async function render() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.classList.contains('hidden')) return;
    var profile = read(PROFILE_KEY, '{}');
    var log = read(LOG_KEY, '[]');
    var books = await loadBooks();
    if (page.classList.contains('hidden')) return;

    page.innerHTML = '';
    page.classList.remove('adventure-page');
    page.classList.add('reading-profile-page');

    var header = document.createElement('header');
    header.className = 'reading-profile-header';
    var intro = document.createElement('div');
    var title = document.createElement('h1');
    title.textContent = profile.name ? profile.name + "'s Profile" : 'My Profile';
    var sub = document.createElement('p');
    sub.textContent = profile.age ? 'Age ' + profile.age + ' · Reading time' : 'Log your reading and listening time';
    intro.append(title, sub);
    var settingsButton = document.createElement('button');
    settingsButton.type = 'button'; settingsButton.className = 'reading-settings-button'; settingsButton.textContent = 'Settings';
    header.append(intro, settingsButton);

    var content = document.createElement('main');
    content.className = 'reading-profile-content';
    var logCard = document.createElement('section');
    logCard.className = 'reading-profile-card';
    logCard.appendChild(headingWithTooltip('Log Reading Time', 'Minutes are your reading record. Eligible sessions can earn XP and gold after they are claimed in Adventure.'));
    var logDescription = document.createElement('p');
    logDescription.textContent = 'Minutes are your reading record. Claimed rewards are retained in your Adventure ledger.';
    logCard.appendChild(logDescription);
    var form = document.createElement('form');
    form.className = 'reading-profile-form';
    var book = document.createElement('select');
    book.setAttribute('aria-label', 'Associated book');
    book.setAttribute('data-tooltip', 'Optional. Linking a book helps preserve its reading history and completion context.');
    var blank = document.createElement('option'); blank.value = ''; blank.textContent = 'Book (optional)'; book.appendChild(blank);
    books.slice().sort(function (a, b) { return String(a.title).localeCompare(String(b.title)); }).forEach(function (item) {
      var option = document.createElement('option'); option.value = item.id;
      option.textContent = item.title + (item.author ? ' — ' + item.author : ''); book.appendChild(option);
    });
    var minutes = document.createElement('input');
    minutes.type = 'number'; minutes.min = '1'; minutes.step = '1'; minutes.placeholder = 'Minutes read or listened'; minutes.required = true;
    minutes.setAttribute('aria-label', 'Minutes read or listened');
    minutes.setAttribute('data-tooltip', 'Enter the number of minutes you read or listened during this session.');
    var date = document.createElement('input'); date.type = 'date'; date.value = today();
    date.setAttribute('aria-label', 'Session date');
    date.setAttribute('data-tooltip', 'Choose the date this reading or listening session occurred.');
    var add = document.createElement('button'); add.type = 'submit'; add.textContent = 'Add Time Entry';
    add.setAttribute('data-tooltip', 'Adds this reading session to your history. Add a book only if you want the session linked to that title.');
    form.append(book, minutes, date, add); logCard.appendChild(form);

    var history = document.createElement('section');
    history.className = 'reading-profile-card';
    history.appendChild(headingWithTooltip('Recent Sessions', 'Shows your ten most recent reading or listening entries and their reward status.'));
    var entries = log.slice().sort(function (a, b) {
      return String(b.date || b.createdAt || '').localeCompare(String(a.date || a.createdAt || ''));
    }).slice(0, 10);
    if (!entries.length) {
      var empty = document.createElement('p'); empty.className = 'reading-profile-empty'; empty.textContent = 'No reading time logged yet.'; history.appendChild(empty);
    } else entries.forEach(function (entry) {
      var matched = books.filter(function (item) { return item.id === entry.bookId; })[0];
      var status = rewardStatus(entry);
      var row = document.createElement('div'); row.className = 'reading-session-row';
      var text = document.createElement('div');
      var value = document.createElement('strong'); value.textContent = Number(entry.minutes) + ' minutes';
      var detail = document.createElement('span'); detail.textContent = (matched ? matched.title + ' · ' : '') + (entry.date || 'Date unavailable');
      var ledger = document.createElement('small'); ledger.className = 'reading-session-ledger'; ledger.textContent = status;
      ledger.setAttribute('data-tooltip', status === 'Unclaimed'
        ? 'This session has not been claimed for rewards yet.'
        : status === 'Rewards reversed'
          ? 'The XP and gold previously associated with this session were reversed.'
          : status === 'Historical rewards kept'
            ? 'This entry predates the current reward ledger. Its historical reward is retained and cannot be safely reversed automatically.'
            : 'This session has already recorded its XP and gold in the Adventure ledger.');
      text.append(value, detail, ledger);
      var actions = document.createElement('div'); actions.className = 'reading-session-actions';
      var removeTime = document.createElement('button');
      removeTime.type = 'button'; removeTime.textContent = status === 'Unclaimed' ? 'Remove Time' : 'Remove Time · Keep Rewards';
      removeTime.setAttribute('data-tooltip', status === 'Unclaimed'
        ? 'Removes this unclaimed time entry. No XP or gold will be affected.'
        : 'Removes this session from active history but keeps its recorded XP and gold in the Adventure ledger.');
      removeTime.onclick = function () {
        if (!confirm(status === 'Unclaimed' ? 'Remove this unclaimed time entry?' : 'Remove this time entry and retain its recorded reward in the Adventure ledger?')) return;
        removeSession(entry, false);
      };
      var removeRewards = document.createElement('button');
      removeRewards.type = 'button'; removeRewards.className = 'remove-rewards'; removeRewards.textContent = 'Remove + Reverse Rewards';
      removeRewards.disabled = status === 'Unclaimed' || status === 'Rewards reversed';
      removeRewards.setAttribute('data-tooltip', removeRewards.disabled
        ? 'Rewards can be reversed only after this session has been claimed and while they have not already been reversed.'
        : 'Removes this time entry and creates a ledger reversal for its associated XP and gold.');
      removeRewards.onclick = function () {
        if (!confirm('Remove this time entry and create a ledger reversal for its XP and gold?')) return;
        removeSession(entry, true);
      };
      actions.append(removeTime, removeRewards); row.append(text, actions); history.appendChild(row);
    });

    var settings = document.createElement('section');
    settings.className = 'reading-profile-card hidden';
    settings.appendChild(headingWithTooltip('Profile Settings', 'Optional profile details shown on your Reading Profile.'));
    var settingsForm = document.createElement('form'); settingsForm.className = 'reading-profile-form';
    var name = document.createElement('input'); name.type = 'text'; name.maxLength = 60; name.placeholder = 'Your name'; name.value = profile.name || '';
    var age = document.createElement('input'); age.type = 'number'; age.min = '1'; age.max = '130'; age.placeholder = 'Your age'; age.value = profile.age || '';
    var saveProfile = document.createElement('button'); saveProfile.type = 'submit'; saveProfile.textContent = 'Save Profile';
    settingsForm.append(name, age, saveProfile); settings.appendChild(settingsForm);
    content.append(logCard, history, settings); page.append(header, content);

    settingsButton.onclick = function () { settings.classList.toggle('hidden'); if (!settings.classList.contains('hidden')) settings.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    settingsForm.onsubmit = function (event) {
      event.preventDefault(); write(PROFILE_KEY, { name: name.value.trim(), age: age.value ? Number(age.value) : '' }); render();
    };
    form.onsubmit = function (event) {
      event.preventDefault();
      var amount = Math.floor(Number(minutes.value)); if (!amount || amount < 1 || !date.value) return;
      log.push({ id: 'time-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), bookId: book.value, minutes: amount, date: date.value, createdAt: new Date().toISOString() });
      write(LOG_KEY, log); notifyReadingChange(); render();
    };
  }

  function install() {
    var nav = document.getElementById('bottomNavigation');
    if (!nav || nav.dataset.readingProfileReady) return;
    nav.dataset.readingProfileReady = 'true';
    var style = document.createElement('style');
    style.textContent = '#navPlaceholder.reading-profile-page{display:flex;flex-direction:column;padding:0;overflow:hidden;background:var(--bg,#14181C)}.reading-profile-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:21px 20px 15px;border-bottom:1px solid rgba(168,130,60,.24)}.reading-profile-header h1{margin:0;font:27px Georgia,serif}.reading-profile-header p{margin:4px 0 0;color:var(--muted,#8A8378);font-size:12px}.reading-settings-button{border:1px solid var(--gold,#A8823C);border-radius:3px;background:transparent;color:var(--paper-light,#F6F1E4);padding:8px 10px}.reading-profile-content{flex:1;overflow:auto;padding:16px 20px 130px}.reading-profile-card{margin:0 0 13px;padding:16px;background:var(--bg-elevated,#1B2129);border:1px solid rgba(168,130,60,.28);border-radius:4px}.reading-profile-card h2{margin:0;color:var(--gold,#A8823C);font-size:15px;text-transform:uppercase}.reading-tooltip-trigger{display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;margin:0 0 0 4px;padding:0;border:1px solid currentColor;border-radius:50%;background:transparent;color:inherit;font:700 11px/1 sans-serif;vertical-align:1px;cursor:pointer}.reading-tooltip-trigger:focus-visible{outline:2px solid currentColor;outline-offset:2px}.reading-profile-card p,.reading-profile-empty{margin:8px 0 0;color:var(--muted,#8A8378);font-size:13px;line-height:1.4}.reading-profile-form{display:grid;gap:9px;margin-top:14px}.reading-profile-form input,.reading-profile-form select{width:100%;box-sizing:border-box;padding:11px;border:1px solid rgba(168,130,60,.4);border-radius:3px;background:var(--bg,#14181C);color:var(--paper-light,#F6F1E4)}.reading-profile-form button{padding:11px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4)}.reading-session-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-top:1px solid rgba(168,130,60,.18)}.reading-session-row strong,.reading-session-row span,.reading-session-row small{display:block}.reading-session-row span{margin-top:3px;color:var(--muted,#8A8378);font-size:12px}.reading-session-ledger{margin-top:4px;color:var(--gold,#A8823C);font-size:10px;cursor:help}.reading-session-actions{display:flex;flex-direction:column;align-items:flex-end;gap:6px}.reading-session-actions button{min-width:154px;padding:7px 9px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--bg,#14181C);color:var(--gold,#A8823C);font-size:11px}.reading-session-actions .remove-rewards{border-color:#bd7070;background:rgba(139,58,58,.16);color:#e3a0a0}.reading-session-actions button:disabled{opacity:.4;cursor:not-allowed}.hidden{display:none!important}';
    document.head.appendChild(style);
    var originalClick = nav.onclick;
    nav.onclick = function (event) {
      if (typeof originalClick === 'function') originalClick.call(nav, event);
      var target = event.target.closest('[data-page]'); if (target && target.dataset.page === 'profile') render();
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();