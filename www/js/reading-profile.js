(function () {
  var PROFILE_KEY = 'bookshelf-reading-profile-v1';
  var LOG_KEY = 'bookshelf-reading-log-v1';
  var GAME_KEY = 'bookshelf-adventure-progression-v1';

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch (_) { return JSON.parse(fallback); }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function today() {
    var date = new Date();
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function notifyReadingChange() {
    window.dispatchEvent(new Event('bookshelf-reading-log-changed'));
  }

  function removeSession(entry, removeRewards) {
    if (removeRewards) {
      var game = read(GAME_KEY, '{}');

      if (game.processedSessions && game.processedSessions[entry.id]) {
        var sessionMinutes = Math.max(0, Number(entry.minutes) || 0);
        var sessionXP = sessionMinutes * 10;
        var sessionGold = Math.max(1, Math.floor(sessionMinutes / 2));

        game.xp = Math.max(0, (Number(game.xp) || 0) - sessionXP);
        game.gold = Math.max(0, (Number(game.gold) || 0) - sessionGold);
        delete game.processedSessions[entry.id];
        write(GAME_KEY, game);
      }
    }

    write(LOG_KEY, read(LOG_KEY, '[]').filter(function (item) {
      return item.id !== entry.id;
    }));

    notifyReadingChange();
    render();
  }

  function resetAdventureProgress() {
    var processed = {};
    read(LOG_KEY, '[]').forEach(function (entry) {
      if (entry && entry.id) processed[entry.id] = true;
    });

    write(GAME_KEY, {
      xp: 0,
      gold: 0,
      processedSessions: processed,
      stats: { str: 10, vit: 10, int: 10, wis: 10, dex: 10, lck: 10 }
    });

    notifyReadingChange();
  }

  async function loadBooks() {
    try { return await window.BookStorage.loadBooks(); }
    catch (_) { return []; }
  }

  async function render() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.classList.contains('hidden')) return;

    var profile = read(PROFILE_KEY, '{}');
    var log = read(LOG_KEY, '[]');
    var books = await loadBooks();

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
    settingsButton.type = 'button';
    settingsButton.className = 'reading-settings-button';
    settingsButton.textContent = 'Settings';
    header.append(intro, settingsButton);

    var content = document.createElement('main');
    content.className = 'reading-profile-content';

    var logCard = document.createElement('section');
    logCard.className = 'reading-profile-card';
    logCard.innerHTML = '<h2>Log Reading Time</h2><p>Minutes are your reading record. You can add a past session by selecting another date.</p>';

    var form = document.createElement('form');
    form.className = 'reading-profile-form';

    var book = document.createElement('select');
    var blank = document.createElement('option');
    blank.value = '';
    blank.textContent = 'Book (optional)';
    book.appendChild(blank);

    books.sort(function (a, b) {
      return String(a.title).localeCompare(String(b.title));
    }).forEach(function (item) {
      var option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.title + (item.author ? ' — ' + item.author : '');
      book.appendChild(option);
    });

    var minutes = document.createElement('input');
    minutes.type = 'number';
    minutes.min = '1';
    minutes.step = '1';
    minutes.placeholder = 'Minutes read or listened';
    minutes.required = true;

    var date = document.createElement('input');
    date.type = 'date';
    date.value = today();

    var add = document.createElement('button');
    add.type = 'submit';
    add.textContent = 'Add Time Entry';

    form.append(book, minutes, date, add);
    logCard.appendChild(form);

    var history = document.createElement('section');
    history.className = 'reading-profile-card';
    history.innerHTML = '<h2>Recent Sessions</h2>';

    var entries = log.slice().sort(function (a, b) {
      return String(b.date).localeCompare(String(a.date));
    }).slice(0, 10);

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

        var row = document.createElement('div');
        row.className = 'reading-session-row';

        var text = document.createElement('div');
        var value = document.createElement('strong');
        value.textContent = Number(entry.minutes) + ' minutes';
        var detail = document.createElement('span');
        detail.textContent = (matched ? matched.title + ' · ' : '') + entry.date;
        text.append(value, detail);

        var actions = document.createElement('div');
        actions.className = 'reading-session-actions';

        var removeTime = document.createElement('button');
        removeTime.type = 'button';
        removeTime.textContent = 'Remove Time';
        removeTime.onclick = function () {
          if (!confirm('Remove this time entry but keep its XP and gold rewards?')) return;
          removeSession(entry, false);
        };

        var removeRewards = document.createElement('button');
        removeRewards.type = 'button';
        removeRewards.className = 'remove-rewards';
        removeRewards.textContent = 'Remove + Rewards';
        removeRewards.onclick = function () {
          if (!confirm('Remove this time entry and reverse its XP and gold rewards?')) return;
          removeSession(entry, true);
        };

        actions.append(removeTime, removeRewards);
        row.append(text, actions);
        history.appendChild(row);
      });
    }

    var settings = document.createElement('section');
    settings.className = 'reading-profile-card hidden';
    settings.innerHTML = '<h2>Profile Settings</h2>';

    var settingsForm = document.createElement('form');
    settingsForm.className = 'reading-profile-form';

    var name = document.createElement('input');
    name.type = 'text';
    name.maxLength = 60;
    name.placeholder = 'Your name';
    name.value = profile.name || '';

    var age = document.createElement('input');
    age.type = 'number';
    age.min = '1';
    age.max = '130';
    age.placeholder = 'Your age';
    age.value = profile.age || '';

    var saveProfile = document.createElement('button');
    saveProfile.type = 'submit';
    saveProfile.textContent = 'Save Profile';

    var resetProgress = document.createElement('button');
    resetProgress.type = 'button';
    resetProgress.className = 'reading-reset-progress';
    resetProgress.textContent = 'Reset Adventure Progress';

    settingsForm.append(name, age, saveProfile, resetProgress);
    settings.appendChild(settingsForm);

    content.append(logCard, history, settings);
    page.append(header, content);

    settingsButton.onclick = function () {
      settings.classList.toggle('hidden');
      if (!settings.classList.contains('hidden')) {
        settings.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    settingsForm.onsubmit = function (event) {
      event.preventDefault();
      write(PROFILE_KEY, {
        name: name.value.trim(),
        age: age.value ? Number(age.value) : ''
      });
      render();
    };

    resetProgress.onclick = function () {
      if (!confirm('Reset Adventure XP, gold, level progress, and allocated stat points? Your saved time sessions will remain.')) return;
      resetAdventureProgress();
      alert('Adventure progress has been reset. New time entries will earn XP and gold normally.');
    };

    form.onsubmit = function (event) {
      event.preventDefault();

      var amount = Math.floor(Number(minutes.value));
      if (!amount || amount < 1 || !date.value) return;

      log.push({
        id: 'time-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
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

  function install() {
    var nav = document.getElementById('bottomNavigation');
    if (!nav || nav.dataset.readingProfileReady) return;
    nav.dataset.readingProfileReady = 'true';

    var style = document.createElement('style');
    style.textContent =
      '#navPlaceholder.reading-profile-page{display:flex;flex-direction:column;padding:0;overflow:hidden;background:var(--bg,#14181C)}' +
      '.reading-profile-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:21px 20px 15px;border-bottom:1px solid rgba(168,130,60,.24)}' +
      '.reading-profile-header h1{margin:0;font:27px Georgia,serif}' +
      '.reading-profile-header p{margin:4px 0 0;color:var(--muted,#8A8378);font-size:12px}' +
      '.reading-settings-button{border:1px solid var(--gold,#A8823C);border-radius:3px;background:transparent;color:var(--paper-light,#F6F1E4);padding:8px 10px}' +
      '.reading-profile-content{flex:1;overflow:auto;padding:16px 20px 130px}' +
      '.reading-profile-card{margin:0 0 13px;padding:16px;background:var(--bg-elevated,#1B2129);border:1px solid rgba(168,130,60,.28);border-radius:4px}' +
      '.reading-profile-card h2{margin:0;color:var(--gold,#A8823C);font-size:15px;text-transform:uppercase}' +
      '.reading-profile-card p,.reading-profile-empty{margin:8px 0 0;color:var(--muted,#8A8378);font-size:13px;line-height:1.4}' +
      '.reading-profile-form{display:grid;gap:9px;margin-top:14px}' +
      '.reading-profile-form input,.reading-profile-form select{width:100%;box-sizing:border-box;padding:11px;border:1px solid rgba(168,130,60,.4);border-radius:3px;background:var(--bg,#14181C);color:var(--paper-light,#F6F1E4)}' +
      '.reading-profile-form button{padding:11px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4)}' +
      '.reading-reset-progress{background:transparent!important;border-color:#bd7070!important;color:#e3a0a0!important}' +
      '.reading-session-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-top:1px solid rgba(168,130,60,.18)}' +
'.reading-session-row strong,.reading-session-row span{display:block}' +
'.reading-session-row span{margin-top:3px;color:var(--muted,#8A8378);font-size:12px}' +
'.reading-session-actions{display:flex;flex-direction:column;align-items:flex-end;gap:6px}' +
'.reading-session-actions button{min-width:122px;padding:7px 9px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--bg,#14181C);color:var(--gold,#A8823C);font-size:11px}' +
'.reading-session-actions .remove-rewards{border-color:#bd7070;background:rgba(139,58,58,.16);color:#e3a0a0}' +
'.hidden{display:none!important}';;
    document.head.appendChild(style);

    var originalClick = nav.onclick;
    nav.onclick = function (event) {
      if (typeof originalClick === 'function') originalClick.call(nav, event);
      var target = event.target.closest('[data-page]');
      if (target && target.dataset.page === 'profile') render();
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();