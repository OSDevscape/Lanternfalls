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

  function currentPayload() {
    var monthly = window.LanternfallsMonthlyTbr;

    if (!monthly || !monthly.currentBooks) {
      return {
        month: '',
        books: []
      };
    }

    var now = new Date();

    var month =
      now.getFullYear() +
      '-' +
      String(now.getMonth() + 1).padStart(2, '0');

    return {
      month: month,
      books: monthly.currentBooks()
        .slice(0, 4)
        .map(function (book) {
          return {
            title: String(book.title || 'Untitled'),
            author: String(book.author || 'Unknown author')
          };
        })
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
        data: JSON.stringify(currentPayload()),
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(sync, 300);
    });
  } else {
    setTimeout(sync, 300);
  }

  window.addEventListener('focus', sync);

  window.addEventListener(
    'lanternfalls-monthly-tbr-changed',
    sync
  );
})();