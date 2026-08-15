(function () {
  var selectedEdition = null;

  function field(id, label, type) {
    return '<label class="field isbn-extra">' +
      '<span class="field-label">' + label + '</span>' +
      '<input id="' + id + '" type="' + (type || 'text') + '">' +
      '</label>';
  }

  function unique(items) {
    return items.filter(function (item, index) {
      return item && items.indexOf(item) === index;
    });
  }

  function cleanText(value) {
    return String(value || '').trim();
  }

  function cleanIsbn(value) {
    return cleanText(value).replace(/[^0-9Xx]/g, '').toUpperCase();
  }

  function normalizeTitle(value) {
    return cleanText(value).toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function subjectName(subject) {
    return cleanText(subject && subject.name ? subject.name : subject);
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

      if (!type) {
        tags.push(text);
      }
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

  function googleCover(info) {
    var links = info.imageLinks || {};

    return links.thumbnail ||
      links.smallThumbnail ||
      '';
  }

  function googleIsbn(info) {
    var identifiers = info.industryIdentifiers || [];
    var isbn13 = identifiers.filter(function (item) {
      return item.type === 'ISBN_13';
    })[0];

    var isbn10 = identifiers.filter(function (item) {
      return item.type === 'ISBN_10';
    })[0];

    return cleanIsbn(
      (isbn13 && isbn13.identifier) ||
      (isbn10 && isbn10.identifier) ||
      ''
    );
  }

  function mapGoogleEdition(item) {
    var info = item.volumeInfo || {};

    return {
      source: 'Google Books',
      key: 'google-' + item.id,
      title: cleanText(info.title),
      subtitle: cleanText(info.subtitle),
      authors: (info.authors || []).filter(Boolean),
      publisher: cleanText(info.publisher),
      year: cleanText(info.publishedDate)
        .match(/\b(1[0-9]{3}|20[0-9]{2})\b/) ?
        cleanText(info.publishedDate)
          .match(/\b(1[0-9]{3}|20[0-9]{2})\b/)[0] : '',
      language: cleanText(info.language),
      pageCount: info.pageCount || '',
      description: cleanText(info.description),
      subjects: (info.categories || []).filter(Boolean),
      isbn: googleIsbn(info),
      cover: googleCover(info),
      format: cleanText(info.printType)
    };
  }

  function mapOpenLibraryEdition(doc) {
    var isbnList = doc.isbn || [];
    var isbn13 = isbnList.filter(function (item) {
      return cleanIsbn(item).length === 13;
    })[0];

    var isbn10 = isbnList.filter(function (item) {
      return cleanIsbn(item).length === 10;
    })[0];

    var coverId = doc.cover_i;
    var cover = coverId
      ? 'https://covers.openlibrary.org/b/id/' + coverId + '-M.jpg'
      : '';

    return {
      source: 'Open Library',
      key: 'openlibrary-' + (doc.cover_edition_key || doc.key || Math.random()),
      title: cleanText(doc.title),
      subtitle: '',
      authors: (doc.author_name || []).filter(Boolean),
      publisher: (doc.publisher || [])[0] || '',
      year: doc.first_publish_year || doc.publish_year && doc.publish_year[0] || '',
      language: (doc.language || [])[0] || '',
      pageCount: doc.number_of_pages_median || '',
      description: '',
      subjects: (doc.subject || []).slice(0, 8),
      isbn: cleanIsbn(isbn13 || isbn10 || ''),
      cover: cover,
      format: ''
    };
  }

  function isDuplicateEdition(existing, candidate) {
    var sameIsbn = candidate.isbn &&
      existing.isbn &&
      candidate.isbn === existing.isbn;

    var sameTitle = normalizeTitle(candidate.title) &&
      normalizeTitle(candidate.title) === normalizeTitle(existing.title);

    var sameAuthor = candidate.authors[0] &&
      existing.authors[0] &&
      cleanText(candidate.authors[0]).toLowerCase() ===
      cleanText(existing.authors[0]).toLowerCase();

    return sameIsbn || (sameTitle && sameAuthor && candidate.cover === existing.cover);
  }

  function combineEditions(primary, secondary) {
    var combined = [];

    primary.concat(secondary).forEach(function (edition) {
      if (!edition.title) {
        return;
      }

      var duplicate = combined.some(function (existing) {
        return isDuplicateEdition(existing, edition);
      });

      if (!duplicate) {
        combined.push(edition);
      }
    });

    return combined.slice(0, 20);
  }

  async function searchGoogleBooks(title, author, isbn) {
    var parts = [];

    if (isbn) {
      parts.push('isbn:' + isbn);
    } else {
      if (title) {
        parts.push('intitle:' + title);
      }

      if (author) {
        parts.push('inauthor:' + author);
      }
    }

    if (!parts.length) {
      return [];
    }

    var response = await fetch(
      'https://www.googleapis.com/books/v1/volumes?q=' +
      encodeURIComponent(parts.join('+')) +
      '&maxResults=20&printType=books'
    );

    if (!response.ok) {
      return [];
    }

    var data = await response.json();

    return (data.items || []).map(mapGoogleEdition);
  }

  async function searchOpenLibrary(title, author, isbn) {
    var params = [];

    if (isbn) {
      params.push('isbn=' + encodeURIComponent(isbn));
    } else {
      if (title) {
        params.push('title=' + encodeURIComponent(title));
      }

      if (author) {
        params.push('author=' + encodeURIComponent(author));
      }
    }

    if (!params.length) {
      return [];
    }

    params.push('limit=20');
    params.push('fields=key,title,author_name,publisher,first_publish_year,publish_year,language,isbn,cover_i,cover_edition_key,number_of_pages_median,subject');

    var response = await fetch(
      'https://openlibrary.org/search.json?' + params.join('&')
    );

    if (!response.ok) {
      return [];
    }

    var data = await response.json();

    return (data.docs || []).map(mapOpenLibraryEdition);
  }

  function escapeHtml(value) {
    return cleanText(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function coverMarkup(edition) {
    if (edition.cover) {
      return '<img src="' + escapeHtml(edition.cover) +
        '" alt="Cover for ' + escapeHtml(edition.title) + '">';
    }

    return '<span class="edition-cover-placeholder">No cover</span>';
  }

  function renderEditionStrip(editions) {
    var strip = document.getElementById('editionCoverStrip');

    if (!strip) {
      return;
    }

    if (!editions.length) {
      strip.innerHTML = '';
      return;
    }

    strip.innerHTML = editions.map(function (edition, index) {
      return '<button type="button" class="edition-cover-choice" ' +
        'data-edition-index="' + index + '" ' +
        'aria-label="View ' + escapeHtml(edition.title) + '">' +
        coverMarkup(edition) +
        '<span>' + escapeHtml(edition.year || edition.source) + '</span>' +
        '</button>';
    }).join('');

    strip.querySelectorAll('.edition-cover-choice').forEach(function (button) {
      button.addEventListener('click', function () {
        var index = Number(button.getAttribute('data-edition-index'));
        selectEdition(editions[index], button);
      });
    });
  }

  function renderEditionDetails(edition) {
    var panel = document.getElementById('editionDetailsPanel');

    if (!panel) {
      return;
    }

    if (!edition) {
      panel.innerHTML = '';
      panel.classList.add('hidden');
      return;
    }

    var authorText = edition.authors.length
      ? edition.authors.join(', ')
      : 'Author not listed';

    var detailBits = [
      edition.publisher,
      edition.year,
      edition.format,
      edition.isbn ? 'ISBN ' + edition.isbn : '',
      edition.pageCount ? edition.pageCount + ' pages' : '',
      edition.language ? edition.language.toUpperCase() : ''
    ].filter(Boolean);

    panel.classList.remove('hidden');
    panel.innerHTML =
      '<div class="edition-detail-cover">' + coverMarkup(edition) + '</div>' +
      '<div class="edition-detail-copy">' +
        '<p class="edition-source">' + escapeHtml(edition.source) + '</p>' +
        '<h3>' + escapeHtml(edition.title) + '</h3>' +
        (edition.subtitle
          ? '<p class="edition-subtitle">' + escapeHtml(edition.subtitle) + '</p>'
          : '') +
        '<p class="edition-author">' + escapeHtml(authorText) + '</p>' +
        '<p class="edition-meta">' + escapeHtml(detailBits.join(' • ')) + '</p>' +
        (edition.description
          ? '<p class="edition-description">' +
            escapeHtml(edition.description) + '</p>'
          : '') +
        '<button id="useEditionBtn" type="button">Use This Edition</button>' +
      '</div>';

    document.getElementById('useEditionBtn').onclick = function () {
      applyEditionToForm(edition);
    };
  }

  function selectEdition(edition, selectedButton) {
    selectedEdition = edition;

    document.querySelectorAll('.edition-cover-choice').forEach(function (button) {
      button.classList.remove('selected');
    });

    if (selectedButton) {
      selectedButton.classList.add('selected');
    }

    renderEditionDetails(edition);
  }

  function applyEditionToForm(edition) {
    var values = metadataFields();
    var subjects = parseSubjects(edition.subjects);

    if (edition.title) {
      document.getElementById('fieldTitle').value = edition.title;
    }

    if (edition.authors.length) {
      document.getElementById('fieldAuthor').value =
        edition.authors.join(', ');
    }

    if (edition.isbn) {
      document.getElementById('fieldIsbn').value = edition.isbn;
    }

    values.publisher.value = edition.publisher || '';
    values.publicationYear.value = edition.year || '';
    values.language.value = edition.language || '';
    values.pageCount.value = edition.pageCount || '';
    values.description.value = edition.description || '';

    var genre = document.getElementById('fieldGenre');
    var tags = document.getElementById('fieldTags');
    var series = document.getElementById('fieldSeries');

    if (genre && subjects.genre) {
      genre.value = subjects.genre;
    }

    if (tags && subjects.tags.length) {
      tags.value = subjects.tags.join(', ');
    }

    if (series && subjects.series) {
      series.value = subjects.series;
    }

    var message = document.getElementById('isbnLookupStatus');

    if (message) {
      message.textContent = 'Edition selected. Review details, then save.';
    }

    var panel = document.getElementById('editionDetailsPanel');

    if (panel) {
      panel.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }

  function getNativeScanner() {
    var plugins = window.Capacitor &&
      window.Capacitor.Plugins;

    return plugins &&
      plugins.IsbnScanner &&
      typeof plugins.IsbnScanner.scan === 'function'
      ? plugins.IsbnScanner
      : null;
  }

  function clearEditionSearchUI() {
  selectedEdition = null;

  var resultsPanel = document.getElementById('editionResults');
  var coverStrip = document.getElementById('editionCoverStrip');
  var detailsPanel = document.getElementById('editionDetailsPanel');
  var status = document.getElementById('isbnLookupStatus');

  if (resultsPanel) {
    resultsPanel.classList.add('hidden');
  }

  if (coverStrip) {
    coverStrip.innerHTML = '';
  }

  if (detailsPanel) {
    detailsPanel.innerHTML = '';
    detailsPanel.classList.add('hidden');
  }

  if (status) {
    status.textContent = '';
  }
}

  function addLookupUI() {
    var isbn = document.getElementById('fieldIsbn');
    var title = document.getElementById('fieldTitle');
    var author = document.getElementById('fieldAuthor');

    if (!isbn || !title || document.getElementById('bookSearchBtn')) {
      return;
    }

    isbn.closest('.field').insertAdjacentHTML(
      'afterend',
      '<div class="field isbn-lookup">' +
        '<button id="isbnScanBtn" type="button">Scan ISBN</button>' +
        '<button id="bookSearchBtn" type="button">Search</button>' +
        '<span id="isbnLookupStatus" role="status"></span>' +
      '</div>' +
      '<section id="editionResults" class="edition-results hidden">' +
        '<p class="edition-results-title">Choose an edition</p>' +
        '<div id="editionCoverStrip" class="edition-cover-strip"></div>' +
        '<div id="editionDetailsPanel" class="edition-details hidden"></div>' +
      '</section>' +
      field('fieldPublisher', 'Publisher') +
      field('fieldPublicationYear', 'Publication Year', 'number') +
      field('fieldLanguage', 'Language') +
      field('fieldPageCount', 'Page Count', 'number') +
      field('fieldDescription', 'Description')
    );

    var searchButton = document.getElementById('bookSearchBtn');
    var scanButton = document.getElementById('isbnScanBtn');
    var message = document.getElementById('isbnLookupStatus');
    var resultsPanel = document.getElementById('editionResults');

    searchButton.style.cssText =
      'padding:9px 12px;border:1px solid #A8823C;background:#1B2129;' +
      'color:#F6F1E4;border-radius:3px;font-weight:600;cursor:pointer';

    scanButton.style.cssText =
      'padding:9px 12px;border:1px solid #A8823C;background:#8B3A3A;' +
      'color:#F6F1E4;border-radius:3px;font-weight:600;cursor:pointer;' +
      'margin-right:8px';

    message.style.cssText =
      'margin-left:8px;font-size:12px;color:#55493C';

    async function searchForEditions(forceIsbn) {
      var titleValue = cleanText(title.value);
      var authorValue = cleanText(author.value);
      var isbnValue = cleanIsbn(forceIsbn || isbn.value);

      if (!isbnValue && !titleValue) {
        message.textContent = 'Enter a title, or scan/enter an ISBN first.';
        return;
      }

      selectedEdition = null;
      resultsPanel.classList.add('hidden');
      renderEditionDetails(null);
      document.getElementById('editionCoverStrip').innerHTML = '';

      searchButton.disabled = true;
      scanButton.disabled = true;
      message.textContent = isbnValue
        ? 'Searching editions by ISBN…'
        : 'Searching editions…';

      try {
        var results = await Promise.all([
          searchGoogleBooks(titleValue, authorValue, isbnValue),
          searchOpenLibrary(titleValue, authorValue, isbnValue)
        ]);

        var editions = combineEditions(results[0], results[1]);

        if (!editions.length) {
          throw new Error('No editions found. Try a shorter title or author name.');
        }

        resultsPanel.classList.remove('hidden');
        renderEditionStrip(editions);
        selectEdition(
          editions[0],
          document.querySelector('.edition-cover-choice')
        );

        message.textContent = editions.length +
          ' edition' + (editions.length === 1 ? '' : 's') +
          ' found. Choose a cover to compare details.';
      } catch (error) {
        message.textContent =
          error.message || 'Could not search for editions.';
      } finally {
        searchButton.disabled = false;
        scanButton.disabled = false;
      }
    }

    searchButton.onclick = function () {
      searchForEditions('');
    };

    scanButton.onclick = async function () {
      var scanner = getNativeScanner();

      if (!scanner) {
        message.textContent =
          'Scanner is not available. Please restart the Android app.';
        return;
      }

      scanButton.disabled = true;
      searchButton.disabled = true;
      message.textContent = 'Opening camera…';

      try {
        var result = await scanner.scan();

        if (!result || !result.isbn) {
          throw new Error('No ISBN was detected.');
        }

        isbn.value = cleanIsbn(result.isbn);
        await searchForEditions(isbn.value);
      } catch (error) {
        if (error && error.code === 'SCAN_CANCELLED') {
          message.textContent = '';
        } else {
          message.textContent =
            (error && error.message) || 'Could not scan an ISBN.';
        }
      } finally {
        if (!searchButton.disabled) {
          scanButton.disabled = false;
        }
      }
    };

        var form = document.getElementById('formView');
    var wasOpen = false;

    if (form) {
      new MutationObserver(function () {
        var isOpen = !form.classList.contains('hidden');

        if (wasOpen && !isOpen) {
          clearEditionSearchUI();
        }

        wasOpen = isOpen;
      }).observe(form, {
        attributes: true,
        attributeFilter: ['class']
      });
    }
  }

  document.addEventListener('DOMContentLoaded', addLookupUI);
})();