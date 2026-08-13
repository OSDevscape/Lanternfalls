(function () {
  function refresh() {
    var dashboard = document.getElementById('dashboard');
    if (dashboard && !dashboard.classList.contains('hidden')) {
      var button = document.querySelector('.dashboard-btn');
      if (button) button.click();
    }
  }
  function install() {
    if (!window.BookStorage || window.BookStorage.__dashboardRefreshHook) return;
    var saveBooks = window.BookStorage.saveBooks;
    window.BookStorage.saveBooks = async function (books) {
      var result = await saveBooks.call(window.BookStorage, books);
      window.dispatchEvent(new CustomEvent('bookshelf-books-changed', { detail:{ books:books } }));
      refresh();
      return result;
    };
    window.BookStorage.__dashboardRefreshHook = true;
    window.addEventListener('bookshelf-books-changed', refresh);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();