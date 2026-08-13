(function () {
  var META_KEY = 'bookshelf-isbn-metadata';
  var pendingMetadata = null;
  var originalLoad = window.BookStorage.loadBooks;
  var originalSave = window.BookStorage.saveBooks;

  function readStore() {
    try { return JSON.parse(localStorage.getItem(META_KEY) || '{}'); }
    catch (_) { return {}; }
  }

  function writeStore(data) {
    localStorage.setItem(META_KEY, JSON.stringify(data));
  }

  function merge(book, store) {
    return Object.assign(book, store[book.id] || {});
  }

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

  function subjectName(subject) {
    return String((subject && subject.name) || '').trim();
  }

  function unique(items) {
    return items.filter(function (item, index) { return item && items.indexOf(item) === index; });
  }

  function parseSubjects(rawSubjects) {
    var values = (rawSubjects || []).map(subjectName).filter(Boolean);
    var genres = [];
    var series = [];
    var tags = [];

    values.forEach(function (value) {
      var match = value.match(/^([a-z]+)\s*:\s*(.+)$/i);
      var type = match ? match[1].toLowerCase() : '';
      var text = match ? match[2].trim() : value;

      if (type === 'series') {
        series.push(text);
        return;
      }

      if (type === 'genre') {
        genres.push(text);
        tags.push(text);
        return;
      }

      if (!type) tags.push(text);
    });

    return {
      genre: unique(genres)[0] || unique(tags)[0] || '',
      series: unique(series)[0] || '',
      tags: unique(tags).slice(0, 8)
    };
  }

  function metadataFields() {
    return {
      publisher: document.getElementById('fieldPublisher'),
      publicationYear: document.getElementById('fieldPublicationYear'),
      language: document.getElementById('fieldLanguage'),
      pageCount: document.getElementById('fieldPageCount'),
      description: document.getElementById('fieldDescription')
    };
  }

  function clearMetadataFields() {
    var values = metadataFields();
    Object.keys(values).forEach(function (key) {
      values[key].value = '';
    });
  }

  function currentBookId() {
    var isbn = document.getElementById('fieldIsbn').value.trim();
    var title = document.getElementById('fieldTitle').value.trim();
    var author = document.getElementById('fieldAuthor').value.trim();
    var stored;

    try { stored = JSON.parse(localStorage.getItem('bookshelf-data') || '{"books":[]}').books || []; }
    catch (_) { stored = []; }

    var match = stored.filter(function (book) {
      if (isbn && book.isbn === isbn) return true;
      return !isbn && book.title === title && book.author === author;
    }).pop();

    return match ? match.id : '';
  }

  function populateMetadataFields() {
    var form = document.getElementById('formView');
    if (!form || form.classList.contains('hidden')) return;

    var id = currentBookId();
    var data = id ? readStore()[id] : null;
    var values = metadataFields();

    values.publisher.value = data && data.publisher ? data.publisher : '';
    values.publicationYear.value = data && data.publicationYear ? data.publicationYear : '';
    values.language.value = data && data.language ? data.language : '';
    values.pageCount.value = data && data.pageCount ? data.pageCount : '';
    values.description.value = data && data.description ? data.description : '';
  }

  async function lookupEditionPageCount(isbn) {
    try {
      var response = await fetch('https://openlibrary.org/isbn/' + encodeURIComponent(isbn) + '.json');
      if (!response.ok) return '';
      var edition = await response.json();
      return edition.number_of_pages || '';
    } catch (_) {
      return '';
    }
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
      if (!value) {
        message.textContent = 'Enter an ISBN first.';
        return;
      }

      button.disabled = true;
      message.textContent = 'Looking up book…';

      try {
        var endpoint = 'https://openlibrary.org/api/books?bibkeys=ISBN:' + encodeURIComponent(value) + '&format=json&jscmd=data';
        var response = await fetch(endpoint);
        if (!response.ok) throw new Error('Lookup failed');

        var result = await response.json();
        var book = result['ISBN:' + value];
        if (!book) throw new Error('No matching book found');

        var values = metadataFields();
        if (book.title) document.getElementById('fieldTitle').value = book.title;
        if (book.authors && book.authors.length) document.getElementById('fieldAuthor').value = book.authors.map(function (author) { return author.name; }).join(', ');
        if (book.publishers && book.publishers.length) values.publisher.value = book.publishers.map(function (publisher) { return publisher.name; }).join(', ');
        if (book.publish_date) values.publicationYear.value = (book.publish_date.match(/\b(1[0-9]{3}|20[0-9]{2})\b/) || [''])[0];
        if (book.languages && book.languages.length) values.language.value = book.languages.map(function (language) { return language.key.replace('/languages/', ''); }).join(', ');

        if (book.subjects && book.subjects.length) {
          var subjects = parseSubjects(book.subjects);
          var genre = document.getElementById('fieldGenre');
          var tags = document.getElementById('fieldTags');
          var series = document.getElementById('fieldSeries');

          if (subjects.genre) genre.value = subjects.genre;
          if (tags && subjects.tags.length) tags.value = subjects.tags.join(', ');
          if (series && subjects.series) series.value = subjects.series;
        }

        if (book.notes) values.description.value = typeof book.notes === 'string' ? book.notes : (book.notes.value || '');

        var pageCount = book.number_of_pages || await lookupEditionPageCount(value);
        values.pageCount.value = pageCount || '';
        message.textContent = pageCount ? 'Book information found.' : 'Book information found; page count was not available.';
      } catch (error) {
        message.textContent = error.message || 'Could not find that ISBN.';
      }

      button.disabled = false;
    };

    document.addEventListener('click', function (event) {
      if (!event.target.closest('#formSave')) return;

      var values = metadataFields();
      pendingMetadata = {
        title: document.getElementById('fieldTitle').value.trim(),
        isbn: document.getElementById('fieldIsbn').value.trim(),
        data: {
          publisher: values.publisher.value.trim(),
          publicationYear: values.publicationYear.value.trim(),
          language: values.language.value.trim(),
          pageCount: values.pageCount.value.trim(),
          description: values.description.value.trim()
        }
      };
    }, true);

    var form = document.getElementById('formView');
    if (form) {
      new MutationObserver(function () {
        requestAnimationFrame(populateMetadataFields);
      }).observe(form, { attributes: true, attributeFilter: ['class'] });
    }
  }

  document.addEventListener('DOMContentLoaded', addLookupUI);
})();