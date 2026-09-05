(function () {
  'use strict';

  var GOODREADS_STATUS = {
    read: 'finished',
    'currently-reading': 'reading',
    'to-read': 'to-read'
  };

  function text(value) {
    return String(value || '').trim();
  }

  function normalizeText(value) {
    return text(value)
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  function normalizeIsbn(value) {
    return text(value)
      .replace(/[^0-9Xx]/g, '')
      .toUpperCase();
  }

  function uniqueStrings(values) {
    var seen = new Set();

    return values.filter(function (item) {
      var clean = text(item);
      var key = normalizeText(clean);

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  function parseRating(value) {
    var rating = Number(value);

    if (!Number.isFinite(rating)) {
      return 0;
    }

    return Math.max(0, Math.min(5, Math.round(rating)));
  }

  function parseDate(value) {
    var timestamp = Date.parse(text(value));

    return Number.isFinite(timestamp)
      ? new Date(timestamp).toISOString()
      : new Date().toISOString();
  }

  function mapStatus(value) {
    return GOODREADS_STATUS[normalizeText(value)] || 'to-read';
  }

  function mapFormat(binding) {
    var value = normalizeText(binding);

    if (value === 'paperback') {
      return 'paperback';
    }

    if (value === 'hardcover' || value === 'hardback') {
      return 'hardback-special';
    }

    if (value === 'kindle') {
      return 'kindle';
    }

    if (value === 'ebook' || value === 'e-book') {
      return 'ebook';
    }

    if (
      value === 'audiobook' ||
      value === 'audio cd' ||
      value === 'audio'
    ) {
      return 'audiobook';
    }

    return '';
  }

  function parseShelves(value) {
    return uniqueStrings(
      text(value)
        .split(',')
        .map(function (shelf) {
          return text(shelf);
        })
        .filter(Boolean)
    );
  }

  function joinNotes(review, privateNotes) {
    var parts = [];

    if (text(review)) {
      parts.push('Goodreads review:\n' + text(review));
    }

    if (text(privateNotes)) {
      parts.push('Goodreads private notes:\n' + text(privateNotes));
    }

    return parts.join('\n\n');
  }

  function parseCsv(csvText) {
    var rows = [];
    var row = [];
    var field = '';
    var quoted = false;
    var position = 0;

    while (position < csvText.length) {
      var character = csvText[position];
      var next = csvText[position + 1];

      if (character === '"') {
        if (quoted && next === '"') {
          field += '"';
          position += 2;
          continue;
        }

        quoted = !quoted;
        position += 1;
        continue;
      }

      if (character === ',' && !quoted) {
        row.push(field);
        field = '';
        position += 1;
        continue;
      }

      if ((character === '\n' || character === '\r') && !quoted) {
        if (character === '\r' && next === '\n') {
          position += 1;
        }

        row.push(field);

        if (row.some(function (cell) {
          return text(cell);
        })) {
          rows.push(row);
        }

        row = [];
        field = '';
        position += 1;
        continue;
      }

      field += character;
      position += 1;
    }

    row.push(field);

    if (row.some(function (cell) {
      return text(cell);
    })) {
      rows.push(row);
    }

    if (!rows.length) {
      return [];
    }

    var headers = rows.shift().map(function (header) {
      return text(header).replace(/^\uFEFF/, '');
    });

    return rows.map(function (cells) {
      return headers.reduce(function (record, header, index) {
        record[header] = text(cells[index]);
        return record;
      }, {});
    });
  }

  function rowValue(row, column) {
    return text(row[column]);
  }

  function mapRow(row) {
    var isbn13 = normalizeIsbn(rowValue(row, 'ISBN13'));
    var isbn = isbn13 || normalizeIsbn(rowValue(row, 'ISBN'));

    return {
      id: window.BookStorage.generateId(),
      title: rowValue(row, 'Title'),
      author: rowValue(row, 'Author'),
      isbn: isbn,
      status: mapStatus(rowValue(row, 'Exclusive Shelf')),
      rating: parseRating(rowValue(row, 'My Rating')),
      format: mapFormat(rowValue(row, 'Binding')),
      tags: parseShelves(rowValue(row, 'Bookshelves')),
      publisher: rowValue(row, 'Publisher'),
      publicationYear: rowValue(row, 'Year Published'),
      pageCount: rowValue(row, 'Number of Pages'),
      notes: joinNotes(
        rowValue(row, 'My Review'),
        rowValue(row, 'Private Notes')
      ),
      dateAdded: parseDate(rowValue(row, 'Date Added')),
      goodreadsId: rowValue(row, 'Book Id'),
      source: 'goodreads',
      importedAt: new Date().toISOString()
    };
  }

  function bookKey(book) {
    return normalizeText(book.title) + '|' + normalizeText(book.author);
  }

  function findMatch(books, importedBook) {
    var goodreadsId = text(importedBook.goodreadsId);
    var isbn = normalizeIsbn(importedBook.isbn);
    var titleAuthor = bookKey(importedBook);

    return books.find(function (book) {
      if (
        goodreadsId &&
        text(book.goodreadsId) === goodreadsId
      ) {
        return true;
      }

      if (isbn && normalizeIsbn(book.isbn) === isbn) {
        return true;
      }

      return titleAuthor !== '|' && bookKey(book) === titleAuthor;
    }) || null;
  }

  function mergeTags(existing, imported) {
    return uniqueStrings(
      (Array.isArray(existing) ? existing : [])
        .concat(Array.isArray(imported) ? imported : [])
    );
  }

  function enrichBook(existing, imported) {
    var result = Object.assign({}, existing);

    [
      'isbn',
      'publisher',
      'publicationYear',
      'pageCount',
      'format',
      'goodreadsId'
    ].forEach(function (field) {
      if (!result[field] && imported[field]) {
        result[field] = imported[field];
      }
    });

    if (!result.rating && imported.rating) {
      result.rating = imported.rating;
    }

    if (!result.notes && imported.notes) {
      result.notes = imported.notes;
    }

    if (!result.source) {
      result.source = 'goodreads';
    }

    result.tags = mergeTags(result.tags, imported.tags);

    return result;
  }

  function buildImportPlan(existingBooks, rows) {
    var plan = {
      books: existingBooks.slice(),
      added: 0,
      matched: 0,
      invalid: 0
    };

    rows.forEach(function (row) {
      var importedBook = mapRow(row);

      if (!importedBook.title) {
        plan.invalid += 1;
        return;
      }

      var existingBook = findMatch(plan.books, importedBook);

      if (existingBook) {
        var index = plan.books.findIndex(function (book) {
          return book.id === existingBook.id;
        });

        plan.books[index] = enrichBook(existingBook, importedBook);
        plan.matched += 1;
        return;
      }

      plan.books.push(importedBook);
      plan.added += 1;
    });

    return plan;
  }

  function setStatus(message, isError) {
    var status = document.getElementById('goodreadsImportStatus');

    if (!status) {
      return;
    }

    status.textContent = message;
    status.classList.toggle('goodreads-import-error', !!isError);
  }

  function install() {
    var button = document.getElementById('goodreadsImportBtn');
    var input = document.getElementById('goodreadsImportFile');

    if (!button || !input || !window.BookStorage) {
      return;
    }

    button.addEventListener('click', function () {
      input.click();
    });

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];

      if (!file) {
        return;
      }

      if (!/\.csv$/i.test(file.name)) {
        setStatus('Choose a Goodreads CSV export file.', true);
        input.value = '';
        return;
      }

      var reader = new FileReader();

      reader.onload = async function () {
        try {
          var rows = parseCsv(String(reader.result || ''));

          if (!rows.length) {
            throw new Error('No readable rows were found in that CSV file.');
          }

          if (!Object.prototype.hasOwnProperty.call(rows[0], 'Title')) {
            throw new Error(
              'This does not appear to be a Goodreads library CSV export.'
            );
          }

          var currentBooks = await window.BookStorage.loadBooks();
          var plan = buildImportPlan(currentBooks, rows);

          var message =
            'Import ' +
            plan.added + ' new book' +
            (plan.added === 1 ? '' : 's') +
            ', enrich ' +
            plan.matched + ' matching book' +
            (plan.matched === 1 ? '' : 's') +
            ', and skip ' +
            plan.invalid + ' row' +
            (plan.invalid === 1 ? '' : 's') +
            ' with no title?\n\n' +
            'This does not change your Google Drive backup.';

          if (!window.confirm(message)) {
            setStatus('Goodreads import cancelled.');
            return;
          }

          await window.BookStorage.saveBooks(plan.books);

          setStatus(
            'Goodreads import complete: ' +
            plan.added + ' added, ' +
            plan.matched + ' matched, ' +
            plan.invalid + ' skipped. Reloading library...'
          );

          setTimeout(function () {
            window.location.reload();
          }, 650);
        } catch (error) {
          console.error(error);

          setStatus(
            error && error.message
              ? error.message
              : 'Could not read that Goodreads CSV file.',
            true
          );
        } finally {
          input.value = '';
        }
      };

      reader.readAsText(file);
    });
  }

  window.GoodreadsImport = {
    parseCsv: parseCsv,
    mapRow: mapRow,
    buildImportPlan: buildImportPlan
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();