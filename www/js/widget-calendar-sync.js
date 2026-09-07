(function () {
  var LOG_KEY = 'bookshelf-reading-log-v1';
  var FILE = 'reading-calendar-log.json';
  var DIRECTORY = 'DATA';

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

  async function sync() {
    var fs = filesystem();

    if (!fs) {
      return;
    }

    try {
      await fs.writeFile({
        path: FILE,
        directory: DIRECTORY,
        data: JSON.stringify(readingLog()),
        encoding: 'utf8'
      });

      if (
        window.BookShelfWidgetRefresh &&
        window.BookShelfWidgetRefresh.refresh
      ) {
        await window.BookShelfWidgetRefresh.refresh();
      }
    } catch (error) {
      console.warn('Calendar widget sync failed.', error);
    }
  }

  window.BookShelfWidgetCalendar = {
    sync: sync
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sync);
  } else {
    sync();
  }

  window.addEventListener('focus', sync);

  window.addEventListener(
    'bookshelf-reading-log-changed',
    sync
  );
})();