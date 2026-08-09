(function () {
  var META_KEY = 'bookshelf-isbn-metadata';
  var pendingMetadata = null;
  var originalLoad = window.BookStorage.loadBooks;
  var originalSave = window.BookStorage.saveBooks;

  function readStore() { try { return JSON.parse(localStorage.getItem(META_KEY) || '{}'); } catch (_) { return {}; } }
  function writeStore(data) { localStorage.setItem(META_KEY, JSON.stringify(data)); }
  function merge(book, store) { return Object.assign(book, store[book.id] || {}); }

  window.BookStorage.loadBooks = async function () {
    var store = readStore();
    var books = await originalLoad();
    return books.map(function (book) { return merge(book, store); });
  };

  window.BookStorage.saveBooks = async function (books) {
    var store = readStore();
    if (pendingMetadata) {
      var found = books.filter(function (book) {
        return book.title === pendingMetadata.title && book.isbn === pendingMetadata.isbn;
      }).pop();
      if (found) {
        store[found.id] = pendingMetadata.data;
        Object.assign(found, pendingMetadata.data);
      }
      pendingMetadata = null;
    }
    books.forEach(function (book) { merge(book, store); });
    writeStore(store);
    return originalSave(books);
  };

  function field(id, label, type) {
    return '<label class="field isbn-extra"><span class="field-label">' + label + '</span><input id="' + id + '" type="' + (type || 'text') + '"></label>';
  }

  function addLookupUI() {
    var isbn = document.getElementById('fieldIsbn');
    if (!isbn || document.getElementById('isbnLookupBtn')) return;

    isbn.closest('.field').insertAdjacentHTML('afterend',
      '<div class="field isbn-lookup"><button id="isbnLookupBtn" type="button">Lookup ISBN</button><span id="isbnLookupStatus"></span></div>' +
      field('fieldPublisher', 'Publisher') + field('fieldPublicationYear', 'Publication Year', 'number') +
      field('fieldLanguage', 'Language') + field('fieldPageCount', 'Page Count', 'number') +
      field('fieldDescription', 'Description')
    );

    var button = document.getElementById('isbnLookupBtn');
    var message = document.getElementById('isbnLookupStatus');
    button.style.cssText = 'padding:9px 12px;border:1px solid #A8823C;background:#1B2129;color:#F6F1E4;border-radius:3px;font-weight:600;cursor:pointer';
    message.style.cssText = 'margin-left:8px;font-size:12px;color:#55493C';

    button.onclick = async function () {
      var value = isbn.value.replace(/[^0-9Xx]/g, '');
      if (!value) { message.textContent = 'Enter an ISBN first.'; return; }
      button.disabled = true; message.textContent = 'Looking up book…';
      try {
        var endpoint = 'https://openlibrary.org/api/books?bibkeys=ISBN:' + encodeURIComponent(value) + '&format=json&jscmd=data';
        var response = await fetch(endpoint);
        if (!response.ok) throw new Error('Lookup failed');
        var result = await response.json();
        var book = result['ISBN:' + value];
        if (!book) throw new Error('No matching book found');

        if (book.title) document.getElementById('fieldTitle').value = book.title;
        if (book.authors && book.authors.length) document.getElementById('fieldAuthor').value = book.authors.map(function (author) { return author.name; }).join(', ');
        if (book.publishers && book.publishers.length) document.getElementById('fieldPublisher').value = book.publishers.map(function (publisher) { return publisher.name; }).join(', ');
        if (book.publish_date) { document.getElementById('fieldPublicationYear').value = (book.publish_date.match(/\b(1[0-9]{3}|20[0-9]{2})\b/) || [''])[0]; }
        if (book.number_of_pages) document.getElementById('fieldPageCount').value = book.number_of_pages;
        if (book.languages && book.languages.length) document.getElementById('fieldLanguage').value = book.languages.map(function (language) { return language.key.replace('/languages/', ''); }).join(', ');
        if (book.subjects && book.subjects.length) {
          var subjects = book.subjects.slice(0, 5).map(function (subject) { return subject.name; });
          document.getElementById('fieldGenre').value = subjects[0] || document.getElementById('fieldGenre').value;
          var tags = document.getElementById('fieldTags'); if (tags) tags.value = subjects.join(', ');
        }
        if (book.notes) document.getElementById('fieldDescription').value = typeof book.notes === 'string' ? book.notes : (book.notes.value || '');
        message.textContent = 'Book information found.';
      } catch (error) { message.textContent = error.message || 'Could not find that ISBN.'; }
      button.disabled = false;
    };

    document.addEventListener('click', function (event) {
      if (!event.target.closest('#formSave')) return;
      pendingMetadata = {
        title: document.getElementById('fieldTitle').value.trim(),
        isbn: document.getElementById('fieldIsbn').value.trim(),
        data: {
          publisher: document.getElementById('fieldPublisher').value.trim(),
          publicationYear: document.getElementById('fieldPublicationYear').value.trim(),
          language: document.getElementById('fieldLanguage').value.trim(),
          pageCount: document.getElementById('fieldPageCount').value.trim(),
          description: document.getElementById('fieldDescription').value.trim()
        }
      };
    }, true);
  }

  document.addEventListener('DOMContentLoaded', addLookupUI);
})();