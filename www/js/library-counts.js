(function () {
  function getBooks() {
    try {
      var stored = JSON.parse(localStorage.getItem('bookshelf-data') || '{"books":[]}');
      if (stored.books && stored.books.length) return stored.books;
    } catch (_) {}
    return Array.prototype.slice.call(document.querySelectorAll('.book-card')).map(function (card) {
      return { status: card.dataset.status || '' };
    });
  }

  function updateCounts() {
    var count = document.getElementById('shelfCount');
    if (!count) return;
    var books = getBooks();
    var wishlist = books.filter(function (book) { return book.status === 'wishlist'; }).length;
    var loaned = books.filter(function (book) { return book.status === 'loaned'; }).length;
    count.textContent = books.length + ' book' + (books.length === 1 ? '' : 's') + ' on the shelf · ' + wishlist + ' in Wishlist · ' + loaned + ' Loaned Out';
  }

  function install() {
    updateCounts();
    var list = document.getElementById('bookList');
    if (list) new MutationObserver(function () { setTimeout(updateCounts, 0); }).observe(list, { childList: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();