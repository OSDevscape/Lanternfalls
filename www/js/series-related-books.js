(function () {
  function json(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch (_) { return JSON.parse(fallback); }
  }

  function cover(isbn) {
    var id = String(isbn || '').replace(/[^0-9Xx]/g, '');
    return id ? 'https://covers.openlibrary.org/b/isbn/' + encodeURIComponent(id) + '-S.jpg?default=false' : '';
  }

  function render() {
    var details = document.getElementById('bookDetails');
    if (!details || details.classList.contains('hidden')) return;

    var holder = details.querySelector('.bd-other');
    var title = details.querySelector('.bd-title');
    var author = details.querySelector('.bd-author');
    if (!holder || !title) return;

    var books = json('bookshelf-data', '{"books":[]}').books || [];
    var metadata = json('bookshelf-metadata-v12', '{}');
    var current = books.filter(function (book) {
      return book.title === title.textContent && book.author === (author ? author.textContent : '');
    })[0];

    if (!current) return;
    var currentData = metadata[current.id] || {};
    var series = String(currentData.series || current.series || '').trim();

    if (!series) {
      holder.innerHTML = '<span class="bd-empty">Add a series name to show related books.</span>';
      return;
    }

    var related = books.filter(function (book) {
      var data = metadata[book.id] || {};
      return book.id !== current.id && String(data.series || book.series || '').trim().toLowerCase() === series.toLowerCase();
    }).sort(function (a, b) {
      var aData = metadata[a.id] || {};
      var bData = metadata[b.id] || {};
      return Number(aData.seriesNumber || a.seriesNumber || 0) - Number(bData.seriesNumber || b.seriesNumber || 0);
    });

    if (!related.length) {
      holder.textContent = 'No other books in this series have been added yet.';
      holder.className = 'bd-other bd-empty';
      return;
    }

    holder.className = 'bd-other';
    holder.replaceChildren();
    related.forEach(function (book) {
      var data = metadata[book.id] || {};
      var item = document.createElement('div');
      item.className = 'bd-series-item';
      var image = document.createElement('img');
      image.src = cover(book.isbn);
      image.alt = '';
      image.onerror = function () { image.style.display = 'none'; };
      var text = document.createElement('div');
      var name = document.createElement('strong');
      name.textContent = book.title || 'Untitled';
      var detail = document.createElement('div');
      detail.textContent = (book.author || '') + ((data.seriesNumber || book.seriesNumber) ? ' · Vol. ' + (data.seriesNumber || book.seriesNumber) : '');
      text.append(name, detail);
      item.append(image, text);
      holder.appendChild(item);
    });
  }

  function install() {
    var details = document.getElementById('bookDetails');
    if (!details) { setTimeout(install, 150); return; }

    new MutationObserver(function () {
      if (!details.classList.contains('hidden')) setTimeout(render, 0);
    }).observe(details, { attributes: true, attributeFilter: ['class'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();