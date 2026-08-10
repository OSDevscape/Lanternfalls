(function () {
  var SESSION_FILE = 'reading-widget-sessions.json';
  var DIRECTORY = 'DATA';
  var LOG_KEY = 'bookshelf-reading-log-v1';
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

  async function syncWidgetSessions() {
    var fs = filesystem();
    if (!fs || syncing) return 0;
    syncing = true;

    try {
      var result;
      try {
        result = await fs.readFile({
          path: SESSION_FILE,
          directory: DIRECTORY,
          encoding: 'utf8'
        });
      } catch (_) {
        return 0;
      }

      var incoming;
      try {
        incoming = JSON.parse(result.data || '[]');
      } catch (error) {
        console.warn('Widget session file could not be read.', error);
        return 0;
      }
      if (!Array.isArray(incoming) || !incoming.length) return 0;

      var log = readLog();
      var known = {};
      log.forEach(function (session) {
        if (session && session.id) known[session.id] = true;
      });

      var added = [];
      incoming.forEach(function (session) {
        if (!validSession(session) || known[session.id]) return;
        var clean = {
          id: session.id,
          minutes: Math.floor(Number(session.minutes)),
          bookId: String(session.bookId || ''),
          bookTitle: String(session.bookTitle || 'Reading session'),
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