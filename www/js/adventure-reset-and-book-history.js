(function () {
  var LOG_KEY = 'bookshelf-reading-log-v1';
  var LEDGER_KEY = 'bookshelf-adventure-ledger-v1';
  var RPG_KEYS = [
    'bookshelf-adventure-v1',
    'bookshelf-adventure-progression-v1',
    'bookshelf-adventure-ledger-v1',
    'bookshelf-adventure-loot-v1',
    'bookshelf-book-bosses-v1',
    'bookshelf-boss-events-v1'
  ];

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch (_) { return JSON.parse(fallback); }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function escape(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (character) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[character];
    });
  }

  function books() {
    return read('bookshelf-data', '{"books":[]}').books || [];
  }

  function markExistingHistoryUnclaimable(keepSessions) {
    var transactions = {};

    if (keepSessions) {
      read(LOG_KEY, '[]').forEach(function (entry) {
        if (!entry || !entry.id) return;
        transactions['session:' + entry.id] = {
          id: 'session:' + entry.id,
          type: 'session',
          sourceId: entry.id,
          status: 'reset-history',
          xp: 0,
          gold: 0,
          createdAt: new Date().toISOString(),
          note: 'Pre-reset reading session retained without Adventure rewards.'
        };
      });
    }

    books().forEach(function (book) {
      if (!book || !book.id || book.status !== 'finished') return;
      transactions['bookCompletion:' + book.id] = {
        id: 'bookCompletion:' + book.id,
        type: 'bookCompletion',
        sourceId: book.id,
        status: 'reset-history',
        xp: 0,
        gold: 0,
        createdAt: new Date().toISOString(),
        note: 'Book completed before the Adventure reset.'
      };
    });

    if (Object.keys(transactions).length) write(LEDGER_KEY, { version: 1, transactions: transactions });
  }

  function resetAdventure(keepMinutes) {
    RPG_KEYS.forEach(function (key) { localStorage.removeItem(key); });
    if (keepMinutes) markExistingHistoryUnclaimable(true);
    else {
      localStorage.removeItem(LOG_KEY);
      markExistingHistoryUnclaimable(false);
    }
    window.dispatchEvent(new Event('bookshelf-reading-log-changed'));
    window.dispatchEvent(new Event('bookshelf-adventure-reset'));
    window.location.reload();
  }

  function addResetSettings() {
    var page = document.getElementById('navPlaceholder');
    if (!page || !page.classList.contains('reading-profile-page')) return;

    var settings = Array.prototype.filter.call(page.querySelectorAll('.reading-profile-card'), function (card) {
      var heading = card.querySelector('h2');
      return heading && heading.textContent.trim() === 'Profile Settings';
    })[0];

    if (!settings || settings.querySelector('#adventureResetCard')) return;

    var card = document.createElement('section');
    card.id = 'adventureResetCard';
    card.className = 'adventure-reset-card';
    card.innerHTML = '<h3>Reset Adventure Data</h3><p>Clear your class, XP, gold, stats, rewards, loot, trophies, and boss progress. Your library and profile stay safe.</p><button type="button" data-adventure-reset="keep">Reset Adventure · Keep Logged Minutes</button><button type="button" data-adventure-reset="erase">Reset Adventure + Erase Logged Minutes</button>';

    card.onclick = function (event) {
      var button = event.target.closest('[data-adventure-reset]');
      if (!button) return;
      var keepMinutes = button.dataset.adventureReset === 'keep';
      var message = keepMinutes
        ? 'Reset all Adventure progress but keep reading minutes attached to each book? Existing minutes and completed books will not earn rewards again.'
        : 'Erase all Adventure progress and every logged reading session? This removes reading minutes from every book and cannot be undone.';
      if (window.confirm(message)) resetAdventure(keepMinutes);
    };

    settings.appendChild(card);
  }

  function cleanProfileHistory() {
    var page = document.getElementById('navPlaceholder');
    if (!page || !page.classList.contains('reading-profile-page')) return;
    Array.prototype.forEach.call(page.querySelectorAll('.reading-profile-card h2'), function (heading) {
      if (heading.textContent.trim() === 'Recent Sessions') heading.closest('.reading-profile-card').remove();
    });
  }

  function rewardStatus(entry) {
    var engine = window.BookShelfRewards;
    var transaction = engine && entry && entry.id && engine.ledger().transactions['session:' + entry.id];
    if (!transaction) return 'Unclaimed';
    if (transaction.status === 'reversed') return 'Rewards reversed';
    if (transaction.status === 'reset-history') return 'Saved before Adventure reset';
    if (transaction.migrated) return 'Historical rewards kept';
    return 'Claimed: +' + (Number(transaction.xp) || 0) + ' XP · +' + (Number(transaction.gold) || 0) + ' gold';
  }

  function refreshBookHistory() {
    var view = document.getElementById('bookDetails');
    if (!view || view.classList.contains('hidden')) return;
    var title = (view.querySelector('.bd-title') || {}).textContent || '';
    var author = (view.querySelector('.bd-author') || {}).textContent || '';
    var book = books().filter(function (item) { return item.title === title && item.author === author; })[0];
    var panel = view.querySelector('.bd-body > .bd-panel');
    if (!book || !panel) return;

    var old = panel.querySelector('.bd-reading-time');
    if (old) old.remove();

    var entries = read(LOG_KEY, '[]').filter(function (entry) { return entry && entry.bookId === book.id; }).sort(function (a, b) {
      return String(b.date || b.createdAt || '').localeCompare(String(a.date || a.createdAt || ''));
    });
    var total = entries.reduce(function (sum, entry) { return sum + Math.max(0, Math.floor(Number(entry.minutes) || 0)); }, 0);
    var details = document.createElement('details');
    details.className = 'bd-reading-time';
    details.innerHTML = '<summary><span>Reading Time</span><b>' + total + ' minute' + (total === 1 ? '' : 's') + '</b></summary><div class="bd-reading-time-list">' + (entries.length ? entries.map(function (entry) {
      var status = rewardStatus(entry);
      var disableReverse = status === 'Unclaimed' || status === 'Rewards reversed' || status === 'Saved before Adventure reset';
      return '<article data-session-id="' + escape(entry.id) + '"><div><strong>' + Math.max(0, Math.floor(Number(entry.minutes) || 0)) + ' minutes</strong><span>' + escape(entry.date || 'Date unavailable') + '</span><small>' + escape(status) + '</small></div><div class="bd-reading-actions"><button type="button" data-session-action="remove">' + (status === 'Unclaimed' ? 'Remove Time' : 'Remove Time · Keep Rewards') + '</button><button type="button" data-session-action="reverse"' + (disableReverse ? ' disabled' : '') + '>Remove + Reverse Rewards</button></div></article>';
    }).join('') : '<p class="bd-reading-empty">No reading time has been logged for this book.</p>') + '</div>';

    details.onclick = function (event) {
      var button = event.target.closest('[data-session-action]');
      if (!button) return;
      event.preventDefault();
      var row = button.closest('[data-session-id]');
      var id = row && row.dataset.sessionId;
      if (!id) return;
      var action = button.dataset.sessionAction;
      var engine = window.BookShelfRewards;
      if (action === 'reverse') {
        if (!window.confirm('Remove this time entry and reverse its XP and gold reward?')) return;
        var result = engine && engine.reverseSession(id);
        if (!result || !result.ok) return;
      } else {
        if (!window.confirm('Remove this reading-time entry' + (rewardStatus({ id:id }) === 'Unclaimed' ? '?' : ' and keep its recorded reward?'))) return;
        if (engine) engine.detachSession(id);
      }
      write(LOG_KEY, read(LOG_KEY, '[]').filter(function (entry) { return entry.id !== id; }));
      window.dispatchEvent(new Event('bookshelf-reading-log-changed'));
      refreshBookHistory();
    };
    panel.appendChild(details);
  }

  function install() {
    var style = document.createElement('style');
    style.textContent = '.adventure-reset-card{margin-top:18px;padding-top:16px;border-top:1px solid rgba(189,112,112,.48)}.adventure-reset-card h3{margin:0;color:#e3a0a0;font:15px Georgia,serif;text-transform:uppercase}.adventure-reset-card p{margin:8px 0 0;color:var(--muted,#8A8378);font-size:12px;line-height:1.4}.adventure-reset-card button{width:100%;margin-top:10px;padding:10px;border:1px solid #bd7070;border-radius:3px;background:rgba(139,58,58,.16);color:#f0b2b2;font:inherit;font-size:12px}.adventure-reset-card button[data-adventure-reset="erase"]{background:#7c3134;color:#f6f1e4}.bd-reading-time{margin-top:16px;padding-top:14px;border-top:1px solid #302f3a}.bd-reading-time summary{display:flex;align-items:center;justify-content:space-between;cursor:pointer;color:#ff9a32;font-size:14px}.bd-reading-time summary b{color:#f3eff5;font-size:13px}.bd-reading-time-list{margin-top:10px}.bd-reading-time-list article{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-top:1px solid #302f3a}.bd-reading-time-list strong,.bd-reading-time-list span,.bd-reading-time-list small{display:block}.bd-reading-time-list span{margin-top:3px;color:#a7989c;font-size:12px}.bd-reading-time-list small{margin-top:4px;color:#ad9879;font-size:10px}.bd-reading-actions{display:flex;flex-direction:column;align-items:flex-end;gap:6px}.bd-reading-actions button{padding:6px 8px;border:1px solid #5b473c;border-radius:4px;background:#171522;color:#e7bfb1;font-size:10px}.bd-reading-actions button[data-session-action="reverse"]{border-color:#8b4c4c;color:#e3a0a0}.bd-reading-actions button:disabled{opacity:.4}.bd-reading-empty{margin:0;color:#a7989c;font-style:italic;font-size:12px}';
    document.head.appendChild(style);

    var page = document.getElementById('navPlaceholder');
    if (page) new MutationObserver(function () { setTimeout(function () { addResetSettings(); cleanProfileHistory(); }, 0); }).observe(page, { childList:true, subtree:true });

    var details = document.getElementById('bookDetails');
    if (details) new MutationObserver(function () { setTimeout(refreshBookHistory, 0); }).observe(details, { childList:true, subtree:true });

    document.addEventListener('click', function (event) {
      if (event.target.closest('.book-card')) setTimeout(refreshBookHistory, 0);
    }, true);

    window.addEventListener('bookshelf-reading-log-changed', function () {
      setTimeout(function () { addResetSettings(); cleanProfileHistory(); refreshBookHistory(); }, 0);
    });
    addResetSettings();
    cleanProfileHistory();
    refreshBookHistory();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();