(function () {
  async function refresh() {
    var plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.WidgetRefresh;
    if (!plugin || !plugin.refresh) return;
    try { await plugin.refresh(); } catch (error) { console.warn('Widget refresh failed.', error); }
  }
  function install() {
    window.BookShelfWidgetRefresh = { refresh:refresh };
    if (!window.BookStorage || window.BookStorage.__widgetRefreshHook) return;
    var saveBooks = window.BookStorage.saveBooks;
    window.BookStorage.saveBooks = async function (books) {
      var result = await saveBooks.call(window.BookStorage, books);
      await refresh();
      return result;
    };
    window.BookStorage.__widgetRefreshHook = true;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();