(function () {
  var KEY = 'bookshelf-metadata-v12';
  var pending = null;
  var originalLoad = window.BookStorage.loadBooks;
  var originalSave = window.BookStorage.saveBooks;
  var originalExport = window.BookStorage.exportBooks;

  function getMap() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) { return {}; } }
  function putMap(map) { localStorage.setItem(KEY, JSON.stringify(map)); }
  function readFields() {
    return {
      tags: document.getElementById('fieldTags').value.split(',').map(function (x) { return x.trim(); }).filter(Boolean),
      series: document.getElementById('fieldSeries').value.trim(),
      seriesNumber: document.getElementById('fieldSeriesNumber').value.trim(),
      collection: document.getElementById('fieldCollection').value.trim()
    };
  }
  function merge(book, map) { return Object.assign(book, map[book.id] || { tags: [], series: '', seriesNumber: '', collection: '' }); }

  window.BookStorage.loadBooks = async function () {
    var map = getMap();
    var books = await originalLoad();
    return books.map(function (book) { return merge(book, map); });
  };

  window.BookStorage.saveBooks = async function (books) {
    var map = getMap();
    if (pending) {
      var target = null;
      for (var i = books.length - 1; i >= 0; i--) {
        if (books[i].title === pending.title && books[i].author === pending.author && books[i].isbn === pending.isbn) { target = books[i]; break; }
      }
      if (target) { map[target.id] = pending.meta; Object.assign(target, pending.meta); }
      pending = null;
      putMap(map);
    }
    books.forEach(function (book) { merge(book, map); });
    return originalSave(books);
  };

  window.BookStorage.exportBooks = function (books) {
    var map = getMap();
    return originalExport(books.map(function (book) { return merge(Object.assign({}, book), map); }));
  };

  function addFields() {
    var notes = document.getElementById('fieldNotes');
    if (!notes || document.getElementById('fieldTags')) return;
    var html = '<label class="field"><span class="field-label">Tags</span><input id="fieldTags" type="text" placeholder="Sci-Fi, Favorite"></label>' +
      '<label class="field"><span class="field-label">Series</span><input id="fieldSeries" type="text" placeholder="Series name"></label>' +
      '<label class="field"><span class="field-label">Series Number</span><input id="fieldSeriesNumber" type="text" inputmode="decimal" placeholder="Optional"></label>' +
      '<label class="field"><span class="field-label">Collection</span><input id="fieldCollection" type="text" placeholder="Signed Books"></label>';
    notes.closest('.field').insertAdjacentHTML('beforebegin', html);
  }

  function populateFields(card) {
    var title = card.querySelector('.book-title');
    var author = card.querySelector('.book-author');
    var map = getMap(), match = null;
    document.querySelectorAll('.book-card').forEach(function (item) {
      if (item === card) match = item;
    });
    var cards = Array.prototype.slice.call(document.querySelectorAll('.book-card'));
    var index = cards.indexOf(match);
    var id = card.dataset.bookId;
    var meta = id ? map[id] : null;
    document.getElementById('fieldTags').value = meta && meta.tags ? meta.tags.join(', ') : '';
    document.getElementById('fieldSeries').value = meta ? meta.series || '' : '';
    document.getElementById('fieldSeriesNumber').value = meta ? meta.seriesNumber || '' : '';
    document.getElementById('fieldCollection').value = meta ? meta.collection || '' : '';
  }

  document.addEventListener('DOMContentLoaded', function () {
    addFields();
    document.addEventListener('click', function (event) {
      var save = event.target.closest('#formSave');
      if (save) {
        pending = { title: document.getElementById('fieldTitle').value.trim(), author: document.getElementById('fieldAuthor').value.trim(), isbn: document.getElementById('fieldIsbn').value.trim(), meta: readFields() };
      }
    }, true);
  });
})();