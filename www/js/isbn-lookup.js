(function () {
  var selectedEdition = null;

  var BOOK_LOOKUP_API =
    'https://readquestbooksapi.readquest-rpg.workers.dev/api/books/search';

  var CACHE_PREFIX = 'readquest-book-lookup-v3:';
  var CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
  var inFlightLookups = {};

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
    return cleanText(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function normalizedAuthor(value) {
    return cleanText(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function lookupCacheKey(title, author, isbn) {
    if (isbn) {
      return 'isbn:' + cleanIsbn(isbn);
    }

    return 'search:' +
      normalizeTitle(title) +
      '|' +
      normalizedAuthor(author);
  }

  function readCachedEditions(cacheKey) {
    try {
      var raw = localStorage.getItem(CACHE_PREFIX + cacheKey);

      if (!raw) {
        return null;
      }

      var cached = JSON.parse(raw);

      if (!cached || !cached.createdAt || !Array.isArray(cached.editions)) {
        localStorage.removeItem(CACHE_PREFIX + cacheKey);
        return null;
      }

      if (Date.now() - cached.createdAt > CACHE_TTL_MS) {
        localStorage.removeItem(CACHE_PREFIX + cacheKey);
        return null;
      }

      return cached.editions;
    } catch (_) {
      return null;
    }
  }

  function cacheEditions(cacheKey, editions) {
    if (!editions || !editions.length) {
      return;
    }

    try {
      localStorage.setItem(
        CACHE_PREFIX + cacheKey,
        JSON.stringify({
          createdAt: Date.now(),
          editions: editions
        })
      );
    } catch (_) {
      // Local cache availability must never block a lookup.
    }
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

  async function searchBookProxy(title, author, isbn, more) {
    var params = new URLSearchParams();

    if (isbn) {
      params.set('isbn', isbn);
    } else {
      if (title) {
        params.set('title', title);
      }

      if (author) {
        params.set('author', author);
      }
    }

    if (more) {
      params.set('more', '1');
    }

    if (!params.toString()) {
      return [];
    }

    try {
      var response = await fetch(
        BOOK_LOOKUP_API + '?' + params.toString()
      );

      if (!response.ok) {
        return [];
      }

      var data = await response.json();

      return Array.isArray(data.editions) ? data.editions : [];
    } catch (_) {
      return [];
    }
  }

  function isDuplicateEdition(existing, candidate) {
    var sameIsbn =
      candidate.isbn &&
      existing.isbn &&
      candidate.isbn === existing.isbn;

    var sameTitle =
      normalizeTitle(candidate.title) &&
      normalizeTitle(candidate.title) === normalizeTitle(existing.title);

    var sameAuthor =
      candidate.authors &&
      candidate.authors[0] &&
      existing.authors &&
      existing.authors[0] &&
      cleanText(candidate.authors[0]).toLowerCase() ===
      cleanText(existing.authors[0]).toLowerCase();

    return sameIsbn || (
      sameTitle &&
      sameAuthor &&
      candidate.cover === existing.cover
    );
  }

  function combineEditions(primary, secondary) {
    var combined = [];

    (primary || []).concat(secondary || []).forEach(function (edition) {
      if (!edition || !edition.title) {
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

  function escapeHtml(value) {
    return cleanText(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function secureCoverUrl(url) {
    return cleanText(url).replace(/^http:\/\//i, 'https://');
  }

  function coverMarkup(edition) {
    var cover = secureCoverUrl(edition.cover);

    if (cover) {
      return '<img src="' + escapeHtml(cover) +
        '" alt="Cover for ' + escapeHtml(edition.title) + '"' +
        ' onerror="this.outerHTML=\'<span class=&quot;edition-cover-placeholder&quot;>No cover</span>\'">';
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

    var authorText = edition.authors && edition.authors.length
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
        escapeHtml(edition.description) +
        '</p>'
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

    if (edition.authors && edition.authors.length) {
      document.getElementById('fieldAuthor').value =
        edition.authors.join(', ');
    }

    if (edition.isbn) {
      document.getElementById('fieldIsbn').value = edition.isbn;
    }
    var coverField = document.getElementById('fieldCoverUrl');

if (coverField) {
  coverField.value = secureCoverUrl(edition.cover);
}

    if (values.publisher) {
      values.publisher.value = edition.publisher || '';
    }

    if (values.publicationYear) {
      values.publicationYear.value = edition.year || '';
    }

    if (values.language) {
      values.language.value = edition.language || '';
    }

    if (values.pageCount) {
      values.pageCount.value = edition.pageCount || '';
    }

    if (values.description) {
      values.description.value = edition.description || '';
    }

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

    clearEditionSearchUI();

    if (message) {
      message.textContent = 'Edition loaded. Review the details, then save.';
    }
  }

  function getNativeScanner() {
    var plugins = window.Capacitor && window.Capacitor.Plugins;

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
      '<button id="moreEditionsBtn" type="button" class="hidden">' +
      'Search more editions' +
      '</button>' +
      '<div id="editionDetailsPanel" class="edition-details hidden"></div>' +
      '</section>' +
      field('fieldPublisher', 'Publisher') +
      field('fieldPublicationYear', 'Publication Year', 'number') +
      field('fieldLanguage', 'Language') +
      field('fieldPageCount', 'Page Count', 'number') +
field('fieldDescription', 'Description') +
'<input id="fieldCoverUrl" type="hidden">'
    );

    var searchButton = document.getElementById('bookSearchBtn');
    var scanButton = document.getElementById('isbnScanBtn');
    var moreEditionsButton = document.getElementById('moreEditionsBtn');
    var message = document.getElementById('isbnLookupStatus');
    var resultsPanel = document.getElementById('editionResults');
    var currentLookup = null;
    var currentEditions = [];

    searchButton.style.cssText =
      'padding:9px 12px;border:1px solid #A8823C;background:#1B2129;' +
      'color:#F6F1E4;border-radius:3px;font-weight:600;cursor:pointer';

    scanButton.style.cssText =
      'padding:9px 12px;border:1px solid #A8823C;background:#8B3A3A;' +
      'color:#F6F1E4;border-radius:3px;font-weight:600;cursor:pointer;' +
      'margin-right:8px';

    moreEditionsButton.style.cssText =
      'margin-top:10px;padding:8px 10px;border:1px solid #A8823C;' +
      'background:#1B2129;color:#F6F1E4;border-radius:3px;' +
      'font-weight:600;cursor:pointer';

    message.style.cssText =
      'margin-left:8px;font-size:12px;color:#cdbdb4';

    function setLookupButtonsDisabled(disabled) {
      searchButton.disabled = disabled;
      scanButton.disabled = disabled;
    }

    function resetResults() {
      selectedEdition = null;
      currentEditions = [];
      resultsPanel.classList.add('hidden');
      renderEditionDetails(null);

      var coverStrip = document.getElementById('editionCoverStrip');

      if (coverStrip) {
        coverStrip.innerHTML = '';
      }

      moreEditionsButton.classList.add('hidden');
      moreEditionsButton.disabled = false;
      moreEditionsButton.textContent = 'Search more editions';
    }

    function showEditions(editions, fromCache, showMoreButton) {
      currentEditions = editions || [];

      if (!currentEditions.length) {
        return false;
      }

      resultsPanel.classList.remove('hidden');
      renderEditionStrip(currentEditions);

      selectEdition(
        currentEditions[0],
        document.querySelector('.edition-cover-choice')
      );

      moreEditionsButton.classList.toggle('hidden', !showMoreButton);

      message.textContent =
        currentEditions.length +
        ' edition' +
        (currentEditions.length === 1 ? '' : 's') +
        (fromCache ? ' loaded from saved search.' : ' found.') +
        (showMoreButton
          ? ' Search more editions for additional matches.'
          : '');

      return true;
    }

    function sharedLookup(cacheKey, task) {
      if (inFlightLookups[cacheKey]) {
        return inFlightLookups[cacheKey];
      }

      inFlightLookups[cacheKey] = Promise.resolve()
        .then(task)
        .finally(function () {
          delete inFlightLookups[cacheKey];
        });

      return inFlightLookups[cacheKey];
    }

    async function searchForEditions(forceIsbn) {
      var titleValue = cleanText(title.value);
      var authorValue = cleanText(author.value);
      var isbnValue = cleanIsbn(forceIsbn || isbn.value);
      var cacheKey = lookupCacheKey(titleValue, authorValue, isbnValue);

      if (!isbnValue && !titleValue) {
        message.textContent = 'Enter a title, or scan/enter an ISBN first.';
        return;
      }

      currentLookup = {
        title: titleValue,
        author: authorValue,
        isbn: isbnValue,
        cacheKey: cacheKey
      };

      resetResults();
      setLookupButtonsDisabled(true);

      var cachedEditions = readCachedEditions(cacheKey);

      if (cachedEditions && cachedEditions.length) {
        showEditions(cachedEditions, true, true);
        setLookupButtonsDisabled(false);
        return;
      }

      message.textContent = isbnValue
        ? 'Looking up ISBN…'
        : 'Searching books…';

      try {
        var editions = await sharedLookup(
          'primary:' + cacheKey,
          function () {
            return searchBookProxy(
              titleValue,
              authorValue,
              isbnValue,
              false
            );
          }
        );

        if (editions.length) {
          cacheEditions(cacheKey, editions);
          showEditions(editions, false, true);
          return;
        }

        message.textContent =
          'No editions found. The book lookup service may be temporarily unavailable. Try again later, scan an ISBN, or enter the book manually.';
      } catch (_) {
        message.textContent =
          'No editions found. The book lookup service may be temporarily unavailable. Try again later, scan an ISBN, or enter the book manually.';
      } finally {
        setLookupButtonsDisabled(false);
      }
    }

    moreEditionsButton.onclick = async function () {
      if (!currentLookup) {
        return;
      }

      moreEditionsButton.disabled = true;
      moreEditionsButton.textContent = 'Searching more editions…';
      message.textContent = 'Searching for additional editions…';

      try {
        var additionalEditions = await sharedLookup(
          'more:' + currentLookup.cacheKey,
          function () {
            return searchBookProxy(
              currentLookup.title,
              currentLookup.author,
              currentLookup.isbn,
              true
            );
          }
        );

        var combined = combineEditions(
          currentEditions,
          additionalEditions
        );

        if (
          !additionalEditions.length ||
          combined.length === currentEditions.length
        ) {
          message.textContent =
            currentEditions.length +
            ' edition' +
            (currentEditions.length === 1 ? '' : 's') +
            ' found. No additional editions are available right now.';
          moreEditionsButton.classList.add('hidden');
          return;
        }

        currentEditions = combined;
        cacheEditions(currentLookup.cacheKey, combined);
        renderEditionStrip(combined);

        selectEdition(
          combined[0],
          document.querySelector('.edition-cover-choice')
        );

        message.textContent =
          combined.length +
          ' editions available. Choose a cover to compare details.';

        moreEditionsButton.classList.add('hidden');
      } catch (_) {
        message.textContent =
          'Could not search for additional editions right now.';
      } finally {
        moreEditionsButton.disabled = false;
        moreEditionsButton.textContent = 'Search more editions';
      }
    };

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

      setLookupButtonsDisabled(true);
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
        setLookupButtonsDisabled(false);
      }
    };

    var form = document.getElementById('formView');
    var wasOpen = false;

    if (form) {
      new MutationObserver(function () {
        var isOpen = !form.classList.contains('hidden');

        if (wasOpen && !isOpen) {
          clearEditionSearchUI();
          currentLookup = null;
          currentEditions = [];
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