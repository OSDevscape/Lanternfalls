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

  function parseOptionalDate(value) {
    var source = text(value);

    if (!source) {
      return '';
    }

    var timestamp = Date.parse(source);

    return Number.isFinite(timestamp)
      ? new Date(timestamp).toISOString()
      : '';
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
        .split(/[,\s]+/)
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
    var dateAdded = parseOptionalDate(rowValue(row, 'Date Added'));

    return {
      id: window.BookStorage.generateId(),
      title: rowValue(row, 'Title'),
      author: rowValue(row, 'Author'),
      isbn: isbn,
      status: mapStatus(
        rowValue(row, 'Exclusive Shelf') ||
        rowValue(row, 'Shelves')
      ),
      rating: parseRating(rowValue(row, 'My Rating')),
      format: mapFormat(rowValue(row, 'Binding')),
      tags: parseShelves(rowValue(row, 'Bookshelves')),
      publisher: rowValue(row, 'Publisher'),
      publicationYear: rowValue(row, 'Year Published'),
      originalPublicationYear: rowValue(
        row,
        'Original Publication Year'
      ),
      pageCount: rowValue(row, 'Number of Pages'),
      dateRead: parseOptionalDate(rowValue(row, 'Date Read')),
      goodreadsAverageRating: rowValue(row, 'Average Rating'),
      notes: joinNotes(
        rowValue(row, 'My Review'),
        rowValue(row, 'Private Notes')
      ),
      dateAdded: dateAdded || new Date().toISOString(),
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
      'originalPublicationYear',
      'pageCount',
      'format',
      'goodreadsId',
      'goodreadsAverageRating',
      'dateRead'
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

  function uniqueImportedBooks(rows) {
    var books = [];
    var duplicates = 0;

    rows.forEach(function (row) {
      var book = mapRow(row);

      if (!book.title) {
        return;
      }

      if (findMatch(books, book)) {
        duplicates += 1;
        return;
      }

      books.push(book);
    });

    return {
      books: books,
      duplicates: duplicates
    };
  }

  function buildPlan(existingBooks, rows, mode) {
    var result = {
      books: [],
      added: 0,
      matched: 0,
      skipped: 0,
      duplicates: 0
    };

    var imported = uniqueImportedBooks(rows);
    result.duplicates = imported.duplicates;

    if (mode === 'replace') {
      result.books = imported.books;
      result.added = imported.books.length;
      result.skipped = rows.length - imported.books.length - imported.duplicates;

      return result;
    }

    result.books = existingBooks.slice();

    imported.books.forEach(function (book) {
      var match = findMatch(result.books, book);

      if (!match) {
        result.books.push(book);
        result.added += 1;
        return;
      }

      if (mode === 'merge') {
        var index = result.books.findIndex(function (item) {
          return item.id === match.id;
        });

        result.books[index] = enrichBook(match, book);
        result.matched += 1;
      } else {
        result.skipped += 1;
      }
    });

    result.skipped += rows.length - imported.books.length - imported.duplicates;

    return result;
  }

  function setStatus(message, isError) {
    var status = document.getElementById('goodreadsImportStatus');

    if (!status) {
      return;
    }

    status.textContent = message;
    status.classList.toggle('goodreads-import-error', !!isError);
  }

  function actionLabel(mode) {
    if (mode === 'merge') {
      return 'restore and merge';
    }

    if (mode === 'replace') {
      return 'restore and replace';
    }

    return 'import';
  }

  function confirmationMessage(mode, plan) {
    var base;

    if (mode === 'replace') {
      base =
        'Replace this device\'s current Lanternfalls book library with ' +
        plan.added + ' book' +
        (plan.added === 1 ? '' : 's') +
        ' from the selected Goodreads CSV?';
    } else if (mode === 'merge') {
      base =
        'Merge Goodreads into this device\'s library?\n\n' +
        plan.added + ' new book' +
        (plan.added === 1 ? '' : 's') +
        ' will be added and ' +
        plan.matched + ' matching book' +
        (plan.matched === 1 ? '' : 's') +
        ' will be enriched with missing Goodreads data.';
    } else {
      base =
        'Import ' +
        plan.added + ' new book' +
        (plan.added === 1 ? '' : 's') +
        '? ' +
        plan.skipped + ' matching or invalid row' +
        (plan.skipped === 1 ? '' : 's') +
        ' will be skipped.';
    }

    if (mode === 'replace') {
      base +=
        '\n\nThis replaces only the book list. It does not restore ' +
        'Lanternfalls RPG progress, settings, reading sessions, or Google Drive data.' +
        '\n\nExport a Lanternfalls JSON backup first if you may want to undo this.';
    }

    return base;
  }

  function chooseFile(input, mode) {
    input.dataset.mode = mode;
    input.click();
  }

  function install() {
    var menu = document.querySelector('#menuSheet .menu-card');

    if (!menu || document.getElementById('goodreadsImport')) {
      return;
    }

    var box = document.createElement('section');

    box.id = 'goodreadsImport';
    box.className = 'goodreads-import';

    box.innerHTML =
      '<h3>Goodreads Import</h3>' +
      '<div class="goodreads-import-actions">' +
        '<button type="button" data-goodreads-action="import">' +
          'Import Goodreads CSV' +
        '</button>' +
        '<button type="button" data-goodreads-action="merge">' +
          'Restore and Merge from Goodreads' +
        '</button>' +
        '<button type="button" data-goodreads-action="replace">' +
          'Restore and Replace from Goodreads' +
        '</button>' +
      '</div>' +
      '<input id="goodreadsImportFile" type="file" accept=".csv,text/csv" class="hidden">' +
      '<p id="goodreadsImportStatus">' +
        'Choose a Goodreads library CSV. Import adds only new books; Merge enriches matches; Replace replaces the book list only.' +
      '</p>';

    menu.appendChild(box);

    var input = document.getElementById('goodreadsImportFile');

    box.addEventListener('click', function (event) {
      var button = event.target.closest('[data-goodreads-action]');

      if (!button) {
        return;
      }

      chooseFile(input, button.dataset.goodreadsAction);
    });

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      var mode = input.dataset.mode || 'import';

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
          var plan = buildPlan(currentBooks, rows, mode);

          if (!plan.books.length && mode === 'replace') {
            throw new Error(
              'The selected Goodreads CSV has no valid titled books, so nothing was replaced.'
            );
          }

          if (!window.confirm(confirmationMessage(mode, plan))) {
            setStatus('Goodreads ' + actionLabel(mode) + ' cancelled.');
            return;
          }

          setStatus('Saving Goodreads library...');

          await window.BookStorage.saveBooks(plan.books);

          setStatus(
            'Goodreads ' + actionLabel(mode) + ' complete: ' +
            plan.added + ' added, ' +
            plan.matched + ' matched, ' +
            plan.skipped + ' skipped. Reloading ReadQuest...'
          );

          setTimeout(function () {
            window.location.reload();
          }, 700);
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
          input.dataset.mode = '';
        }
      };

      reader.readAsText(file);
    });
  }

  window.GoodreadsImport = {
    parseCsv: parseCsv,
    mapRow: mapRow,
    buildPlan: buildPlan
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();