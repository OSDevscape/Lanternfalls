(function () {
  var MAIN_KEY = 'bookshelf-data';
  var TAG_KEY = 'bookshelf-metadata-v12';
  var ISBN_KEY = 'bookshelf-isbn-metadata';
  var DONE_KEY = 'bookshelf-unified-storage-migration-v1';

  function read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || fallback);
    } catch (_) {
      return JSON.parse(fallback);
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function merge(book, tags, isbn) {
    return Object.assign({}, book, tags || {}, isbn || {});
  }

  async function migrate() {
    if (localStorage.getItem(DONE_KEY)) return;
    if (!window.BookStorage) return;

    var saved = read(MAIN_KEY, '{"books":[]}');
    var books = Array.isArray(saved.books) ? saved.books : [];
    var tagMap = read(TAG_KEY, '{}');
    var isbnMap = read(ISBN_KEY, '{}');

    if (!books.length) {
      localStorage.setItem(DONE_KEY, 'true');
      return;
    }

    var migrated = books.map(function (book) {
      return merge(book, tagMap[book.id], isbnMap[book.id]);
    });

    await window.BookStorage.saveBooks(migrated);
    localStorage.setItem(DONE_KEY, 'true');
  }

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      migrate().catch(function (error) {
        console.warn('Book storage migration was not completed.', error);
      });
    }, 0);
  });
})();