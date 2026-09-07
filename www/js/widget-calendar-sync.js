(function () {
  var LOG_KEY = 'bookshelf-reading-log-v1';
  var FILE = 'reading-calendar-log.json';
  var DIRECTORY = 'DATA';
  var syncing = false;
  var queued = false;

  function filesystem() {
    var capacitor = window.Capacitor;
    var plugins = capacitor && capacitor.Plugins;

    if (
      !capacitor ||
      !capacitor.isNativePlatform ||
      !capacitor.isNativePlatform() ||
      !plugins
    ) {
      return null;
    }

    return plugins.Filesystem || null;
  }

  function readingLog() {
    try {
      var saved = JSON.parse(
        localStorage.getItem(LOG_KEY) || '[]'
      );

      return Array.isArray(saved) ? saved : [];
    } catch (_) {
      return [];
    }
  }

  async function refreshWidgets() {
    var plugin = window.Capacitor &&
      window.Capacitor.Plugins &&
      window.Capacitor.Plugins.WidgetRefresh;

    if (plugin && typeof plugin.refresh === 'function') {
      try {
        await plugin.refresh();
      } catch (_) {
        // ignore refresh failures
      }
    }
  }

  async function sync() {
    if (syncing) {
      queued = true;
      return;
    }

    var fs = filesystem();

    if (!fs) {
      return;
    }

    syncing = true;
    queued = false;

    try {
      await fs.writeFile({
        path: FILE,
        directory: DIRECTORY,
        data: JSON.stringify(readingLog()),
        encoding: 'utf8'
      });

      await refreshWidgets();
    } catch (error) {
      console.warn('Calendar widget sync failed.', error);
    } finally {
      syncing = false;

      if (queued) {
        setTimeout(sync, 0);
      }
    }
  }

  function scheduleSync() {
    clearTimeout(scheduleSync.timer);

    scheduleSync.timer = setTimeout(sync, 150);
  }

  function installStorageHook() {
    if (window.__calendarWidgetStorageHook) {
      return;
    }

    window.__calendarWidgetStorageHook = true;

    var originalSetItem = Storage.prototype.setItem;

    Storage.prototype.setItem = function (key, value) {
      var result = originalSetItem.call(this, key, value);

      if (key === LOG_KEY) {
        scheduleSync();
      }

      return result;
    };
  }

  window.BookShelfWidgetCalendar = {
    sync: sync,
    scheduleSync: scheduleSync
  };

  installStorageHook();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleSync);
  } else {
    scheduleSync();
  }

  window.addEventListener('focus', scheduleSync);

  window.addEventListener(
    'bookshelf-reading-log-changed',
    scheduleSync
  );
})();