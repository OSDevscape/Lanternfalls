(function () {
  var FILE = 'reading-widget-appearance.json';
  var DIRECTORY = 'DATA';
  function appearance() { try { return JSON.parse(localStorage.getItem('bookshelf-appearance') || '{"accent":"red"}'); } catch (_) { return { accent:'red' }; } }
  function color(name) { return ({red:'#8B3A3A',blue:'#3976B8',green:'#4C6B4F',yellow:'#B88918',teal:'#278A86',purple:'#76539A',orange:'#C66A25',brown:'#76513E',pink:'#C94C7C',cyan:'#1D9EB7'})[name] || '#8B3A3A'; }
  async function sync() {
    var capacitor = window.Capacitor, plugins = capacitor && capacitor.Plugins, fs = plugins && plugins.Filesystem;
    if (!fs || !capacitor.isNativePlatform || !capacitor.isNativePlatform()) return;
    try {
  await fs.writeFile({
    path: FILE,
    directory: DIRECTORY,
    data: JSON.stringify({
      accent: color(appearance().accent)
    }),
    encoding: 'utf8'
  });

  if (
    window.BookShelfWidgetRefresh &&
    window.BookShelfWidgetRefresh.refresh
  ) {
    await window.BookShelfWidgetRefresh.refresh();
  }
} catch (error) {
  console.warn('Widget appearance sync failed.', error);
}
  }
  window.BookShelfWidgetAppearance = { sync: sync };

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

window.addEventListener('bookshelf-appearance-changed', sync);