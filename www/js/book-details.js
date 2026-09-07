(function () {
  var DIFFICULTY_TOOLTIPS = {
    comfortable: 'Light Read: easy to pick up and follow.',
    challenging: 'Focused Read: benefits from steady attention.',
    hard: 'Deep Read: rewards slowing down and thinking.',
    brutal: 'Intense Read: demanding, dense, or emotionally heavy.'
  };

  function readBook(card) {
    var title = (card.querySelector('.book-title') || {}).textContent || 'Untitled';
    var author = (card.querySelector('.book-author') || {}).textContent || '';
    var raw = {};
    try { raw = JSON.parse(localStorage.getItem('bookshelf-data') || '{"books":[]}'); } catch (_) { }
    var book = (raw.books || []).filter(function (b) { return b.title === title && b.author === author; })[0] || {};
    book.title = title;
    book.author = author;
    book.status = book.status || ((card.querySelector('.card-stamp') || {}).textContent || 'To Read');
    book.cover = (card.querySelector('.book-cover') || {}).currentSrc || (card.querySelector('.book-cover') || {}).src || '';
    return book;
  }

  function coverLarge(url) {
    return (url || '').replace(/-M\.jpg(\?[^#]*)?$/i, '-L.jpg?default=false');
  }

  function statusLabel(status) {
    var labels = {
      'to-read': 'To Read',
      reading: 'Reading',
      paused: 'Paused',
      finished: 'Finished',
      abandoned: 'Abandoned',
      wishlist: 'Wishlist',
      loaned: 'Loaned Out'
    };
    return labels[status] || status || 'To Read';
  }

  function difficultyLabel(difficulty) {
    var labels = {
      comfortable: '☁ Light Read',
      challenging: '⌁ Focused Read',
      hard: '⚔ Deep Read',
      brutal: '⚔ Intense Read'
    };
    var key = String(difficulty || '').trim().toLowerCase();
    return labels[key] || difficulty || '';
  }

  function money(value) {
    return Number(value) > 0 ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(value)) : 'Not specified';
  }

  function install() {
    var s = document.createElement('style');
    s.textContent = '#bookDetails{position:fixed;inset:0;z-index:1000;overflow:auto;background:#101016;color:#f3eff5;font-family:-apple-system,Segoe UI,sans-serif}#bookDetails.hidden{display:none!important}.bd-top{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;padding:18px;background:linear-gradient(120deg,#241344,#112331)}.bd-close,.bd-edit{border:0;background:#171522;color:#fff;border-radius:50%;width:48px;height:48px;font-size:29px}.bd-edit{border-radius:24px;width:auto;padding:0 16px;font-size:14px}.bd-body{padding:22px 18px 46px;max-width:620px;margin:auto}.bd-cover{display:block;width:180px;max-height:275px;object-fit:contain;margin:0 auto 22px;border-radius:9px;box-shadow:0 7px 25px #000}.bd-title{text-align:center;margin:0;font-size:29px}.bd-author{text-align:center;color:#e7bfb1;font:italic 20px Georgia,serif}.bd-panel{margin-top:20px;padding:18px;border:1px solid #302f3a;border-radius:24px;background:#181720}.bd-row{display:flex;justify-content:space-between;gap:12px;align-items:center}.bd-status-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.bd-status,.bd-difficulty{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;height:56px;padding:0 18px;border-radius:4px;background:transparent;font:inherit;line-height:1;white-space:nowrap}.bd-status{border:1px solid #398d80;color:#52d0b1}.bd-difficulty{border:1px solid #ad9879;color:#ad9879;cursor:pointer}.bd-difficulty:focus-visible,.bd-rating:focus-visible{outline:2px solid currentColor;outline-offset:2px}.bd-difficulty.difficulty-comfortable{border-color:#65bceb;color:#65bceb}.bd-difficulty.difficulty-challenging{border-color:#b38cff;color:#b38cff}.bd-difficulty.difficulty-hard{border-color:#d9a441;color:#d9a441}.bd-difficulty.difficulty-brutal{border-color:#e26d5a;color:#e26d5a}.bd-rating{border:0;background:transparent;padding:6px;color:#ad9879;font:inherit;font-size:22px;line-height:1;cursor:pointer}.bd-chips{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}.bd-chip{padding:10px 14px;border:1px solid #302f3a;border-radius:15px;color:#d8c4bb}.bd-heading{margin:28px 0 10px;color:#ff9a32;font-size:16px;text-transform:uppercase}.bd-note,.bd-description{min-height:90px;color:#c8b4ad;white-space:pre-wrap}.bd-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.bd-value{font-size:20px;margin-top:8px}.bd-series-item{display:flex;gap:14px;padding:14px 0;border-top:1px solid #302f3a}.bd-series-item img{width:50px;height:75px;object-fit:cover;border-radius:4px}.bd-history{border-left:3px solid #5b473c;padding-left:16px}.bd-history div{margin:15px 0}.bd-empty{color:#a7989c;font-style:italic}.bd-info-list{margin:0;line-height:1.8}.bd-info-list strong{color:#f3eff5}';
    document.head.appendChild(s);

    var view = document.createElement('section');
    view.id = 'bookDetails';
    view.className = 'hidden';
    document.body.appendChild(view);

    function close() {
      var history = window.BookDetailsHistory || [];

      if (history.length) {
        var previous = history.pop();

        var card = Array.prototype.slice.call(
          document.querySelectorAll('.book-card')
        ).filter(function (item) {
          var title = item.querySelector('.book-title');
          var author = item.querySelector('.book-author');

          return title &&
            title.textContent.trim() === previous.title &&
            (!previous.author || (
              author &&
              author.textContent.trim() === previous.author
            ));
        })[0];

        if (card) {
          card.click();
          return;
        }
      }

      view.classList.add('hidden');
    }

    document.addEventListener('click', function (e) {
      var card = e.target.closest('.book-card');
      if (!card || view.contains(card)) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      var b = readBook(card);
      var rating = Number(b.rating) || 0;
      var tags = (b.tags || []).join(' · ') || 'No tags';
      var series = b.series ? (b.series + (b.seriesNumber ? ' — Vol. ' + b.seriesNumber : '')) : 'Not in a series';
      var started = b.dateStarted ? new Date(b.dateStarted).toLocaleDateString() : 'Not started';
      var finished = b.dateFinished ? new Date(b.dateFinished).toLocaleDateString() : '';
      var publisher = b.publisher || 'Publisher unknown';
      var description = b.description || 'No publisher description available.';
      var difficulty = b.difficulty || '';
      var difficultyKey = String(difficulty || '').trim().toLowerCase();
      var difficultyText = difficultyLabel(difficulty);
      var difficultyTooltip = DIFFICULTY_TOOLTIPS[difficultyKey] || '';
      var difficultyBadge = difficultyText ? '<button type="button" class="bd-difficulty difficulty-' + difficultyKey + '" data-tooltip="' + difficultyTooltip + '" aria-label="About ' + difficultyText.replace(/^[^A-Za-z]+\s*/, '') + '" aria-expanded="false">' + difficultyText + '</button>' : '';
      var difficultyInfo = difficultyText || 'Not specified';
      var ratingTooltip = rating ? 'Your personal enjoyment rating: ' + rating + ' out of 5 stars. It does not affect Difficulty, XP, or rewards.' : 'No personal rating yet. Ratings do not affect Difficulty, XP, or rewards.';

      view.innerHTML = '<div class="bd-top"><button class="bd-close">‹</button><button class="bd-edit">Edit entry</button></div><main class="bd-body"><img class="bd-cover" src="' + coverLarge(b.cover) + '" alt=""><h1 class="bd-title"></h1><p class="bd-author"></p><div class="bd-panel"><div class="bd-row"><div class="bd-status-row"><span class="bd-status"></span>' + difficultyBadge + '</div><button type="button" class="bd-rating" data-tooltip="' + ratingTooltip + '" aria-label="About rating" aria-expanded="false">' + ('☆'.repeat(5 - rating) + '★'.repeat(rating)) + '</button></div><p>Added ' + new Date(b.dateAdded || Date.now()).toLocaleDateString() + '</p></div><div class="bd-chips"><span class="bd-chip">📅 ' + (b.publicationYear || 'Year unknown') + '</span><span class="bd-chip">🌐 ' + (b.language || 'Language unknown') + '</span><span class="bd-chip">📖 ' + (b.pageCount ? (b.pageCount + ' pages') : 'Pages unknown') + '</span></div><h2 class="bd-heading">📝 My Notes</h2><div class="bd-panel bd-note"></div><div class="bd-grid"><div class="bd-panel"><h2 class="bd-heading">🔗 Series</h2><div class="bd-value bd-series"></div></div><div class="bd-panel"><h2 class="bd-heading">📚 Collection</h2><div class="bd-value bd-collection"></div></div></div><h2 class="bd-heading">ℹ Bibliographic Info</h2><div class="bd-panel bd-info-list"><strong>Publisher:</strong> ' + publisher + '<br><strong>Genre:</strong> ' + (b.genre || 'Not specified') + '<br><strong>Format:</strong> ' + (b.format || 'Not specified') + '<br><strong>Price:</strong> ' + money(b.price) + '<br><strong>Difficulty:</strong> ' + difficultyInfo + '<br><strong>ISBN:</strong> ' + (b.isbn || 'Not specified') + '<br><strong>Tags:</strong> ' + tags + '</div><h2 class="bd-heading">📖 Publisher Description</h2><div class="bd-panel bd-description"></div><h2 class="bd-heading">📚 Other Books in This Series</h2><div class="bd-panel bd-other"><span class="bd-empty">No other books in this series.</span></div><h2 class="bd-heading">Reading History</h2><div class="bd-history"><div><strong>Added</strong><br>' + new Date(b.dateAdded || Date.now()).toLocaleDateString() + '</div><div><strong>Started</strong><br>' + started + '</div>' + (finished ? '<div><strong>Finished</strong><br>' + finished + '</div>' : '') + '</div></main>';

      var tbrButton = document.createElement('button');

      tbrButton.type = 'button';
      tbrButton.className = 'bd-tbr-button';
      tbrButton.setAttribute('data-book-id', b.id || '');
      tbrButton.textContent = "Add to this month's TBR";

      var chips = view.querySelector('.bd-chips');

      if (chips) {
        chips.insertAdjacentElement('beforebegin', tbrButton);
      }

      view.querySelector('.bd-title').textContent = b.title;
      view.querySelector('.bd-author').textContent = b.author;
      view.querySelector('.bd-status').textContent = statusLabel(b.status);
      view.querySelector('.bd-note').textContent = b.notes || 'No notes yet.';
      view.querySelector('.bd-description').textContent = description;
      view.querySelector('.bd-series').textContent = series;
      view.querySelector('.bd-collection').textContent =
        b.collection || b.collections || 'Not assigned';

      view.querySelector('.bd-close').onclick = close;

      if (
        tbrButton &&
        window.LanternfallsMonthlyTbr &&
        typeof window.LanternfallsMonthlyTbr.toggleBook === 'function' &&
        typeof window.LanternfallsMonthlyTbr.isInCurrentMonth === 'function'
      ) {
        function updateTbrButton() {
          var selected =
            window.LanternfallsMonthlyTbr.isInCurrentMonth(b.id);

          tbrButton.textContent = selected
            ? "Remove from this month's TBR"
            : "Add to this month's TBR";

          tbrButton.classList.toggle('is-selected', selected);
          tbrButton.setAttribute(
            'aria-pressed',
            selected ? 'true' : 'false'
          );
        }

        updateTbrButton();

        tbrButton.onclick = function () {
          window.LanternfallsMonthlyTbr.toggleBook(b.id);
          updateTbrButton();
        };
      }

      view.querySelector('.bd-edit').onclick = function () {
        close();
        if (typeof card.onclick === 'function') card.onclick();
      };
      view.classList.remove('hidden');
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();