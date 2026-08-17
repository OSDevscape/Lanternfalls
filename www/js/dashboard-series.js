(function () {
  function data(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || fallback);
    } catch (_) {
      return JSON.parse(fallback);
    }
  }

  function attachBookCover(image, book) {
    var isbn = String((book && book.isbn) || '')
      .replace(/[^0-9Xx]/g, '');

    image.alt = '';
    image.onerror = function () {
      image.style.visibility = 'hidden';
    };

    if (!isbn) {
      image.style.visibility = 'hidden';
      return;
    }

    if (window.BookCoverCache && window.BookCoverCache.attach) {
      window.BookCoverCache.attach(image, isbn);
      return;
    }

    image.src =
      'https://covers.openlibrary.org/b/isbn/' +
      encodeURIComponent(isbn) +
      '-M.jpg?default=false';
  }

  function seriesGroups() {
    var books = data('bookshelf-data', '{"books":[]}').books || [];
    var metadata = data('bookshelf-metadata-v12', '{}');
    var groups = {};

    books.forEach(function (book) {
      var meta = metadata[book.id] || {};
      var name = String(meta.series || book.series || '').trim();

      if (!name) {
        return;
      }

      var key = name.toLowerCase();

      if (!groups[key]) {
        groups[key] = {
          name: name,
          books: []
        };
      }

      groups[key].books.push({
        id: book.id,
        title: book.title || 'Untitled',
        author: book.author || '',
        isbn: book.isbn || '',
        number: meta.seriesNumber || book.seriesNumber || '',
        status: book.status || 'to-read'
      });
    });

    return Object.keys(groups).map(function (key) {
      groups[key].books.sort(function (a, b) {
        return Number(a.number || 0) - Number(b.number || 0) ||
          a.title.localeCompare(b.title);
      });

      return groups[key];
    }).sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
  }

  function openBook(book) {
    var card = Array.prototype.slice.call(
      document.querySelectorAll('#bookList .book-card')
    ).filter(function (item) {
      return (item.querySelector('.book-title') || {}).textContent === book.title &&
        (item.querySelector('.book-author') || {}).textContent === book.author;
    })[0];

    var seriesWindow = document.getElementById('dashboardSeriesWindow');

    if (seriesWindow) {
      seriesWindow.classList.add('hidden');
    }

    var dashboard = document.getElementById('dashboard');

    if (dashboard) {
      dashboard.classList.add('hidden');
    }

    if (card) {
      card.click();
    }
  }

  function openSeries(group) {
    var window = document.getElementById('dashboardSeriesWindow');

    if (!window) {
      return;
    }

    var title = window.querySelector('h2');
    var list = window.querySelector('.dash-series-window-list');

    title.textContent = group.name;
    list.replaceChildren();

    group.books.forEach(function (book) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'dash-series-book';

      var image = document.createElement('img');
      attachBookCover(image, book);

      var text = document.createElement('div');
      var name = document.createElement('strong');
      var detail = document.createElement('span');

      name.textContent = book.title;
      detail.textContent =
        (book.number ? 'Vol. ' + book.number + ' · ' : '') +
        book.author;

      text.append(name, detail);
      item.append(image, text);

      item.onclick = function () {
        openBook(book);
      };

      list.appendChild(item);
    });

    window.classList.remove('hidden');
  }

  function renderSeries() {
    var dashboard = document.getElementById('dashboard');

    if (!dashboard) {
      return;
    }

    var card = Array.prototype.slice.call(
      dashboard.querySelectorAll('.dash-card')
    ).filter(function (item) {
      var heading = item.querySelector('h2');
      return heading && heading.textContent.trim() === 'Series';
    })[0];

    if (!card) {
      return;
    }

    var old = card.querySelector('.dash-series-list');

    if (old) {
      old.remove();
    }

    var list = document.createElement('div');
    list.className = 'dash-series-list';

    var groups = seriesGroups();

    if (!groups.length) {
      list.innerHTML =
        '<div class="dash-muted">Add a series name when editing a book to see it here.</div>';
    } else {
      groups.forEach(function (group) {
        var row = document.createElement('button');
        row.type = 'button';
        row.className = 'dash-series-row';

        var image = document.createElement('img');
        attachBookCover(image, group.books[0]);

        var text = document.createElement('div');
        var name = document.createElement('strong');
        var count = document.createElement('span');

        name.textContent = group.name;
        count.textContent =
          group.books.length +
          ' book' +
          (group.books.length === 1 ? '' : 's');

        text.append(name, count);
        row.append(image, text);

        row.onclick = function () {
          openSeries(group);
        };

        list.appendChild(row);
      });
    }

    card.appendChild(list);
  }

  function install() {
    var dashboard = document.getElementById('dashboard');

    if (!dashboard || dashboard.dataset.seriesReady) {
      return;
    }

    dashboard.dataset.seriesReady = 'true';

    var style = document.createElement('style');

    style.textContent =
      '.dash-series-list{margin-top:10px;border-top:1px solid rgba(168,130,60,.2)}' +
      '.dash-series-row{display:flex;align-items:center;width:100%;gap:11px;padding:10px 0;text-align:left;border:0;border-bottom:1px solid rgba(168,130,60,.16);background:transparent;color:var(--paper-light,#F6F1E4)}' +
      '.dash-series-row img{width:34px;height:50px;flex:none;object-fit:cover;border-radius:2px;background:var(--bg,#14181C)}' +
      '.dash-series-row strong,.dash-series-row span{display:block}' +
      '.dash-series-row strong{font:16px Georgia,serif}' +
      '.dash-series-row span{margin-top:3px;color:var(--muted,#8A8378);font-size:12px}' +
      '#dashboardSeriesWindow{position:fixed;inset:0;z-index:950;overflow:auto;background:var(--bg,#14181C);color:var(--paper-light,#F6F1E4)}' +
      '#dashboardSeriesWindow.hidden{display:none!important}' +
      '.dash-series-window-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:14px;padding:18px 20px;background:var(--bg,#14181C);border-bottom:1px solid rgba(168,130,60,.25)}' +
      '.dash-series-window-head h2{margin:0;font:24px Georgia,serif}' +
      '.dash-series-window-head button{border:1px solid var(--gold,#A8823C);border-radius:3px;background:transparent;color:var(--paper-light,#F6F1E4);padding:8px 12px}' +
      '.dash-series-window-list{padding:8px 20px 130px}' +
      '.dash-series-book{display:flex;align-items:center;width:100%;gap:14px;padding:13px 0;text-align:left;border:0;border-bottom:1px solid rgba(168,130,60,.18);background:transparent;color:var(--paper-light,#F6F1E4)}' +
      '.dash-series-book img{width:52px;height:76px;flex:none;object-fit:cover;border-radius:2px;background:var(--bg-elevated,#1B2129)}' +
      '.dash-series-book strong,.dash-series-book span{display:block}' +
      '.dash-series-book strong{font:17px Georgia,serif}' +
      '.dash-series-book span{margin-top:4px;color:var(--muted,#8A8378);font-size:12px}';

    document.head.appendChild(style);

    var window = document.createElement('section');
    window.id = 'dashboardSeriesWindow';
    window.className = 'hidden';
    window.innerHTML =
      '<header class="dash-series-window-head">' +
        '<button type="button" aria-label="Back">‹ Back</button>' +
        '<h2>Series</h2>' +
      '</header>' +
      '<main class="dash-series-window-list"></main>';

    document.body.appendChild(window);

    window.querySelector('button').onclick = function () {
      window.classList.add('hidden');
    };

    new MutationObserver(function () {
      setTimeout(renderSeries, 0);
    }).observe(dashboard, {
      childList: true
    });

    renderSeries();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();