(function () {
  var FILE = 'reading-widget-appearance.json';
  var DIRECTORY = 'DATA';

  function appearance() {
    try {
      return JSON.parse(
        localStorage.getItem('bookshelf-appearance') ||
        '{"accent":"red"}'
      );
    } catch (_) {
      return { accent: 'red' };
    }
  }

  function color(name) {
    var colors = {
      red: '#8B3A3A',
      blue: '#3976B8',
      green: '#4C6B4F',
      yellow: '#B88918',
      teal: '#278A86',
      purple: '#76539A',
      orange: '#C66A25',
      brown: '#76513E',
      pink: '#C94C7C',
      cyan: '#1D9EB7'
    };

    return colors[name] || colors.red;
  }

  async function refreshWidgets() {
    var capacitor = window.Capacitor;
    var plugin = capacitor &&
      capacitor.Plugins &&
      capacitor.Plugins.WidgetRefresh;

    if (!plugin || !plugin.refresh) {
      return;
    }

    await plugin.refresh();
  }

  async function sync() {
    var capacitor = window.Capacitor;
    var plugins = capacitor && capacitor.Plugins;
    var filesystem = plugins && plugins.Filesystem;

    if (
      !filesystem ||
      !capacitor.isNativePlatform ||
      !capacitor.isNativePlatform()
    ) {
      return;
    }

    try {
      await filesystem.writeFile({
        path: FILE,
        directory: DIRECTORY,
        data: JSON.stringify({
          accent: color(appearance().accent)
        }),
        encoding: 'utf8'
      });

      await refreshWidgets();
    } catch (error) {
      console.warn('Widget appearance sync failed.', error);
    }
  }

  window.BookShelfWidgetAppearance = {
    sync: sync
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sync);
  } else {
    sync();
  }

  window.addEventListener('focus', sync);

  window.addEventListener(
    'bookshelf-appearance-changed',
    sync
  );
})();