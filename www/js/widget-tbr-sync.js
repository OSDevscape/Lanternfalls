(function () {
  var FILE = 'monthly-tbr-widget.json';
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

  function currentMonthKey() {
    var now = new Date();

    return (
      now.getFullYear() +
      '-' +
      String(now.getMonth() + 1).padStart(2, '0')
    );
  }

  function readBooks() {
    try {
      var data = JSON.parse(
        localStorage.getItem('bookshelf-data') ||
        '{"books":[]}'
      );

      return Array.isArray(data.books) ? data.books : [];
    } catch (_) {
      return [];
    }
  }

  function readTbrState() {
    try {
      var state = JSON.parse(
        localStorage.getItem('lanternfalls-monthly-tbr-v1') ||
        '{}'
      );

      return state && typeof state === 'object'
        ? state
        : {};
    } catch (_) {
      return {};
    }
  }

  function payload() {
    var month = currentMonthKey();
    var ids = readTbrState()[month];

    if (!Array.isArray(ids)) {
      ids = [];
    }

    var booksById = {};

    readBooks().forEach(function (book) {
      var id = String(book.id || book.Id || '');

      if (id) {
        booksById[id] = book;
      }
    });

    var books = ids
      .map(function (id) {
        return booksById[String(id)] || null;
      })
      .filter(Boolean)
      .slice(0, 4)
      .map(function (book) {
        return {
          title: String(book.title || book.Title || 'Untitled'),
          author: String(
            book.author ||
            book.Author ||
            'Unknown author'
          )
        };
      });

    return {
      month: month,
      books: books
    };
  }

  async function refreshWidgets() {
    if (
      window.BookShelfWidgetRefresh &&
      window.BookShelfWidgetRefresh.refresh
    ) {
      await window.BookShelfWidgetRefresh.refresh();
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
        data: JSON.stringify(payload()),
        encoding: 'utf8'
      });

      await refreshWidgets();
    } catch (error) {
      console.warn('Monthly TBR widget sync failed.', error);
    }
  }

  window.BookShelfWidgetTbr = {
    sync: sync
  };

  function scheduleSync() {
    setTimeout(sync, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleSync);
  } else {
    scheduleSync();
  }

  window.addEventListener('focus', scheduleSync);

  window.addEventListener(
    'lanternfalls-monthly-tbr-changed',
    scheduleSync
  );

  window.addEventListener(
    'bookshelf-books-changed',
    scheduleSync
  );
})();