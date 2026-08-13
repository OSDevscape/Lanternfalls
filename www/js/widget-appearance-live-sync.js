(function () {
  function install() {
    if (!window.BookShelfWidgetAppearance || window.__widgetAppearanceLiveSync) return;
    window.__widgetAppearanceLiveSync = true;
    var original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      var result = original.call(this, key, value);
      if (key === 'bookshelf-appearance') window.BookShelfWidgetAppearance.sync();
      return result;
    };
    window.BookShelfWidgetAppearance.sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();