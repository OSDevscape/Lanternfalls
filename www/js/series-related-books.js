(function () {
  function json(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch (_) { return JSON.parse(fallback); }
  }

  function libraryCover(book) {
    var cards = Array.prototype.slice.call(
      document.querySelectorAll('.book-card')
    );

    var matchingCard = cards.filter(function (card) {
      var title = card.querySelector('.book-title');
      var author = card.querySelector('.book-author');

      return title &&
        title.textContent.trim() === String(book.title || '').trim() &&
        (
          !book.author ||
          (
            author &&
            author.textContent.trim() === String(book.author).trim()
          )
        );
    })[0];

    if (!matchingCard) return '';

    var image = matchingCard.querySelector('.book-cover');

    return image
      ? (image.currentSrc || image.src || '')
      : '';
  }

  function openOriginalPreview(book) {
    var details = document.getElementById('bookDetails');

    if (!details) return;

    var title = String(book.title || '').trim();
    var author = String(book.author || '').trim();

    var card = Array.prototype.slice.call(
      document.querySelectorAll('.book-card')
    ).filter(function (item) {
      var cardTitle = item.querySelector('.book-title');
      var cardAuthor = item.querySelector('.book-author');

      return cardTitle &&
        cardTitle.textContent.trim() === title &&
        (!author || (
          cardAuthor &&
          cardAuthor.textContent.trim() === author
        ));
    })[0];

    if (!card) return;

    var history = window.BookDetailsHistory || [];

    history.push({
      title: (details.querySelector('.bd-title') || {}).textContent || '',
      author: (details.querySelector('.bd-author') || {}).textContent || ''
    });

    if (history.length > 100) {
      history.shift();
    }

    window.BookDetailsHistory = history;

    card.click();
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
      return book.id !== current.id &&
        String(data.series || book.series || '').trim().toLowerCase() === series.toLowerCase();
    }).sort(function (a, b) {
      var aData = metadata[a.id] || {};
      var bData = metadata[b.id] || {};
      return Number(aData.seriesNumber || a.seriesNumber || 0) -
        Number(bData.seriesNumber || b.seriesNumber || 0);
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
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'bd-series-item';
      item.setAttribute('aria-label', 'Open ' + (book.title || 'book') + ' preview');

      var image = document.createElement('img');
      var source = libraryCover(book);

      image.alt = '';
      image.loading = 'lazy';

      if (source) {
        image.src = source;
      } else {
        image.style.display = 'none';
      }

      var text = document.createElement('div');
      var name = document.createElement('strong');
      name.textContent = book.title || 'Untitled';
      var detail = document.createElement('div');
      detail.textContent = (book.author || '') +
        ((data.seriesNumber || book.seriesNumber)
          ? ' · Vol. ' + (data.seriesNumber || book.seriesNumber)
          : '');
      text.append(name, detail);
      item.append(image, text);

      item.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();
        openOriginalPreview(book);
      };
      holder.appendChild(item);
    });
  }

  function install() {
    var style = document.createElement('style');
    style.textContent = '.bd-series-item{display:flex;width:100%;gap:14px;padding:14px 0;border:0;border-top:1px solid #302f3a;background:transparent;color:inherit;text-align:left;cursor:pointer;font:inherit}.bd-series-item img{width:50px;height:75px;object-fit:cover;border-radius:4px}.bd-series-item strong{display:block;color:inherit}.bd-series-item div div{margin-top:2px;color:#c8b4ad;font-size:14px}.bd-series-item:hover strong{color:#ff9a32}.bd-series-item:focus{outline:1px solid #ff9a32;outline-offset:2px}';
    document.head.appendChild(style);

    var details = document.getElementById('bookDetails');
    if (!details) {
      setTimeout(install, 150);
      return;
    }
    new MutationObserver(function () {
      if (!details.classList.contains('hidden')) setTimeout(render, 0);
    }).observe(details, { attributes: true, attributeFilter: ['class'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();