(function () {
  function json(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch (_) { return JSON.parse(fallback); }
  }

  function cover(isbn) {
    var id = String(isbn || '').replace(/[^0-9Xx]/g, '');
    return id ? 'https://covers.openlibrary.org/b/isbn/' + encodeURIComponent(id) + '-S.jpg?default=false' : '';
  }

    var dashboard = document.getElementById('dashboard');
    if (dashboard) dashboard.classList.add('hidden');

        var title = card.querySelector('.book-title');
        var author = card.querySelector('.book-author');
        return title &&
          title.textContent.trim() === String(book.title || '').trim() &&
          (!book.author || (author && author.textContent.trim() === String(book.author).trim()));
      })[0];
    }

    if (card) {
      card.click();
      return;
    }

    var search = document.getElementById('searchInput');
    if (!search) return;
    search.value = book.title || '';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    setTimeout(function () {
    }, 50);
  }

  function openSeries(name, entries) {

    var modal = document.createElement('div');

    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', name + ' series');

    var header = document.createElement('header');
    var heading = document.createElement('div');
    var label = document.createElement('span');
    label.textContent = 'Series';
    var title = document.createElement('h2');
    title.textContent = name;
    heading.append(label, title);

    var close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'X';
    close.setAttribute('aria-label', 'Close series');
    header.append(heading, close);

    var list = document.createElement('main');
    });

    dialog.append(header, list);
    modal.appendChild(dialog);
    document.body.appendChild(modal);
    close.onclick = function () { modal.remove(); };
  }

    var dashboard = document.getElementById('dashboard');
    if (!dashboard || dashboard.classList.contains('hidden')) return;

    var heading = Array.prototype.slice.call(dashboard.querySelectorAll('.dash-card h2')).filter(function (h2) {
      return h2.textContent.trim() === 'Series';
    })[0];
    if (!heading) return;

    var card = heading.closest('.dash-card');
    var books = json('bookshelf-data', '{"books":[]}').books || [];
    var metadata = json('bookshelf-metadata-v12', '{}');
    var groups = {};

    books.forEach(function (book) {
      if (!series) return;
      if (!groups[series]) groups[series] = [];
      groups[series].push({
        book: book,
      });
    });

      element.remove();
    });

    var body = document.createElement('div');
    body.className = 'dash-series-data';
    var names = Object.keys(groups).sort(function (a, b) { return a.localeCompare(b); });

    if (!names.length) {
    names.forEach(function (name) {
      var entries = groups[name].slice().sort(function (a, b) {
        return a.number - b.number;
      });
      row.className = 'dash-series-row';
      row.setAttribute('aria-label', 'Open ' + name + ' series');

      var image = document.createElement('img');
      image.src = cover(entries[0].book.isbn);
      image.alt = '';
      image.onerror = function () { image.style.display = 'none'; };

      var text = document.createElement('div');
      var title = document.createElement('strong');
      title.textContent = name;
      var count = document.createElement('span');
      count.textContent = entries.length + ' book' + (entries.length === 1 ? '' : 's');
      text.append(title, count);
      row.append(image, text);
      row.onclick = function () { openSeries(name, entries); };
      body.appendChild(row);
    });

    card.appendChild(body);
  }

  function install() {
    var style = document.createElement('style');
    document.head.appendChild(style);

    var dashboard = document.getElementById('dashboard');
    if (!dashboard) {
      setTimeout(install, 150);
      return;
    }
  }

})();