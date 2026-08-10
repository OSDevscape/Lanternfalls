(function () {
  var SESSION_FILE = 'reading-widget-sessions.json';
  var DIRECTORY = 'DATA';
  var LOG_KEY = 'bookshelf-reading-log-v1';
  var BOOKS_KEY = 'bookshelf-data';
  var syncing = false;

  function filesystem() {
    var capacitor = window.Capacitor;
    var plugins = capacitor && capacitor.Plugins;
    return capacitor && capacitor.isNativePlatform && capacitor.isNativePlatform() && plugins
      ? plugins.Filesystem
      : null;
  }

  function readLog() {
    try {
      var value = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function readBooks() {
    try {
      var value = JSON.parse(localStorage.getItem(BOOKS_KEY) || '{"books":[]}');
      return Array.isArray(value.books) ? value.books : [];
    } catch (_) {
      return [];
    }
  }

  function localDate(value) {
    var date = new Date(Number(value) || Date.now());
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function authorForBook(bookId) {
    var match = readBooks().find(function (book) {
      return String(book.id || book.Id || '') === String(bookId || '');
    });
    return match ? String(match.author || match.Author || 'Unknown author') : 'Unknown author';
  }

  function showToast(message) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () {
      toast.classList.add('hidden');
    }, 3500);
  }

  function validSession(value) {
    return value && value.id && Math.floor(Number(value.minutes) || 0) > 0;
  }

  function repairWidgetSessions(log) {
    var changed = false;
    log.forEach(function (session) {
      if (!session || session.source !== 'home-widget') return;

      if (!session.date) {
        session.date = localDate(session.endedAt);
        changed = true;
      }

      if (!session.author || !session.bookAuthor) {
        var author = authorForBook(session.bookId);
        session.author = author;
        session.bookAuthor = author;
        changed = true;
      }
    });
    return changed;
  }

  async function syncWidgetSessions() {
    var fs = filesystem();
    if (!fs || syncing) return 0;
    syncing = true;

    try {
      var log = readLog();
      var repaired = repairWidgetSessions(log);
      var result;

      try {
        result = await fs.readFile({
          path: SESSION_FILE,
          directory: DIRECTORY,
          encoding: 'utf8'
        });
      } catch (_) {
        if (repaired) localStorage.setItem(LOG_KEY, JSON.stringify(log));
        return 0;
      }

      var incoming;
      try {
        incoming = JSON.parse(result.data || '[]');
      } catch (error) {
        console.warn('Widget session file could not be read.', error);
        if (repaired) localStorage.setItem(LOG_KEY, JSON.stringify(log));
        return 0;
      }

      if (!Array.isArray(incoming) || !incoming.length) {
        if (repaired) localStorage.setItem(LOG_KEY, JSON.stringify(log));
        return 0;
      }

      var known = {};
      log.forEach(function (session) {
        if (session && session.id) known[session.id] = true;
      });

      var added = [];
      incoming.forEach(function (session) {
        if (!validSession(session) || known[session.id]) return;
        var author = authorForBook(session.bookId);
        var clean = {
          id: session.id,
          minutes: Math.floor(Number(session.minutes)),
          bookId: String(session.bookId || ''),
          bookTitle: String(session.bookTitle || 'Reading session'),
          author: author,
          bookAuthor: author,
          date: localDate(session.endedAt),
          endedAt: Number(session.endedAt) || Date.now(),
          source: 'home-widget'
        };
        log.push(clean);
        known[clean.id] = true;
        added.push(clean);
      });

      localStorage.setItem(LOG_KEY, JSON.stringify(log));
      await fs.writeFile({
        path: SESSION_FILE,
        directory: DIRECTORY,
        data: '[]',
        encoding: 'utf8'
      });

      if (added.length) {
        var totalMinutes = added.reduce(function (total, session) {
          return total + session.minutes;
        }, 0);
        window.dispatchEvent(new Event('bookshelf-reading-log-changed'));
        showToast('Widget session recorded: ' + totalMinutes + ' minute' + (totalMinutes === 1 ? '' : 's') + ' ready to claim.');
      }

      return added.length;
    } catch (error) {
      console.warn('Could not sync home-screen widget sessions.', error);
      return 0;
    } finally {
      syncing = false;
    }
  }

  window.BookShelfWidgetSync = { sync: syncWidgetSessions };

  function scheduleSync() {
    setTimeout(syncWidgetSessions, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleSync);
  } else {
    scheduleSync();
  }

  window.addEventListener('focus', scheduleSync);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) scheduleSync();
  });
})();