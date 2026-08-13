(function () {
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

  function install() {
    var s = document.createElement('style');
    s.textContent = '#bookDetails{position:fixed;inset:0;z-index:1000;overflow:auto;background:#101016;color:#f3eff5;font-family:-apple-system,Segoe UI,sans-serif}#bookDetails.hidden{display:none!important}.bd-top{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;padding:18px;background:linear-gradient(120deg,#241344,#112331)}.bd-close,.bd-edit{border:0;background:#171522;color:#fff;border-radius:50%;width:48px;height:48px;font-size:29px}.bd-edit{border-radius:24px;width:auto;padding:0 16px;font-size:14px}.bd-body{padding:22px 18px 46px;max-width:620px;margin:auto}.bd-cover{display:block;width:180px;max-height:275px;object-fit:contain;margin:0 auto 22px;border-radius:9px;box-shadow:0 7px 25px #000}.bd-title{text-align:center;margin:0;font-size:29px}.bd-author{text-align:center;color:#e7bfb1;font:italic 20px Georgia,serif}.bd-panel{margin-top:20px;padding:18px;border:1px solid #302f3a;border-radius:24px;background:#181720}.bd-row{display:flex;justify-content:space-between;gap:12px;align-items:center}.bd-status{color:#52d0b1;border:1px solid #398d80;border-radius:24px;padding:10px 14px}.bd-rating{color:#ad9879;font-size:22px}.bd-chips{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}.bd-chip{padding:10px 14px;border:1px solid #302f3a;border-radius:15px;color:#d8c4bb}.bd-heading{margin:28px 0 10px;color:#ff9a32;font-size:16px;text-transform:uppercase}.bd-note{min-height:90px;color:#c8b4ad;white-space:pre-wrap}.bd-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.bd-value{font-size:20px;margin-top:8px}.bd-series-item{display:flex;gap:14px;padding:14px 0;border-top:1px solid #302f3a}.bd-series-item img{width:50px;height:75px;object-fit:cover;border-radius:4px}.bd-history{border-left:3px solid #5b473c;padding-left:16px}.bd-history div{margin:15px 0}.bd-empty{color:#a7989c;font-style:italic}';
    document.head.appendChild(s);

    var view = document.createElement('section');
    view.id = 'bookDetails';
    view.className = 'hidden';
    document.body.appendChild(view);

    function close() {
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

      view.innerHTML = '<div class="bd-top"><button class="bd-close">‹</button><button class="bd-edit">Edit entry</button></div><main class="bd-body"><img class="bd-cover" src="' + coverLarge(b.cover) + '" alt=""><h1 class="bd-title"></h1><p class="bd-author"></p><div class="bd-panel"><div class="bd-row"><span class="bd-status"></span><span class="bd-rating">' + ('☆'.repeat(5 - rating) + '★'.repeat(rating)) + '</span></div><p>Added ' + new Date(b.dateAdded || Date.now()).toLocaleDateString() + '</p></div><div class="bd-chips"><span class="bd-chip">📅 ' + (b.publicationYear || 'Year unknown') + '</span><span class="bd-chip">🌐 ' + (b.language || 'Language unknown') + '</span><span class="bd-chip">📖 ' + (b.pageCount ? (b.pageCount + ' pages') : 'Pages unknown') + '</span></div><h2 class="bd-heading">📝 My Notes</h2><div class="bd-panel bd-note"></div><div class="bd-grid"><div class="bd-panel"><h2 class="bd-heading">🔗 Series</h2><div class="bd-value bd-series"></div></div><div class="bd-panel"><h2 class="bd-heading">📚 Collection</h2><div class="bd-value bd-collection"></div></div></div><h2 class="bd-heading">ℹ Bibliographic Info</h2><div class="bd-panel">Tags: ' + tags + '<br>Format: ' + (b.format || 'Not specified') + '<br>ISBN: ' + (b.isbn || 'Not specified') + '</div><h2 class="bd-heading">📚 Other Books in This Series</h2><div class="bd-panel bd-other"><span class="bd-empty">No other books in this series.</span></div><h2 class="bd-heading">Reading History</h2><div class="bd-history"><div><strong>Added</strong><br>' + new Date(b.dateAdded || Date.now()).toLocaleDateString() + '</div><div><strong>Started</strong><br>' + started + '</div>' + (finished ? '<div><strong>Finished</strong><br>' + finished + '</div>' : '') + '</div></main>';

      view.querySelector('.bd-title').textContent = b.title;
      view.querySelector('.bd-author').textContent = b.author;
      view.querySelector('.bd-status').textContent = statusLabel(b.status);
      view.querySelector('.bd-note').textContent = b.notes || 'No notes yet.';
      view.querySelector('.bd-series').textContent = series;
      view.querySelector('.bd-collection').textContent = b.collection || b.collections || 'Not assigned';
      view.querySelector('.bd-close').onclick = close;
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