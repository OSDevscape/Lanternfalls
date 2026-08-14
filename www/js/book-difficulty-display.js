(function () {
  var LABELS = {
    comfortable: 'Light Read',
    challenging: 'Focused Read',
    hard: 'Deep Read',
    brutal: 'Intense Read'
  };

  var TOOLTIPS = {
    comfortable: 'Light Read: easy to pick up and follow.',
    challenging: 'Focused Read: benefits from steady attention.',
    hard: 'Deep Read: rewards slowing down and thinking.',
    brutal: 'Intense Read: demanding, dense, or emotionally heavy.'
  };

  function library() {
    try { return JSON.parse(localStorage.getItem('bookshelf-data') || '{"books":[]}').books || []; }
    catch (_) { return []; }
  }

  function bookFor(title, author) {
    return library().filter(function (book) {
      return book && book.title === title && book.author === author;
    })[0] || {};
  }

  function label(value) {
    return LABELS[String(value || '').trim().toLowerCase()] || '';
  }

  function addCardBadges() {
    document.querySelectorAll('#bookList .book-card').forEach(function (card) {
      if (card.querySelector('.book-difficulty-badge')) return;

      var title = (card.querySelector('.book-title') || {}).textContent || '';
      var author = (card.querySelector('.book-author') || {}).textContent || '';
      var book = bookFor(title, author);
      var difficultyKey = String(book.difficulty || '').trim().toLowerCase();
      var difficulty = label(difficultyKey);
      var stamp = card.querySelector('.card-stamp');
      if (!difficulty || !stamp || !stamp.parentNode) return;

      var badges = document.createElement('div');
      badges.className = 'book-card-badges';
      stamp.parentNode.insertBefore(badges, stamp);
      badges.appendChild(stamp);

      var badge = document.createElement('button');
      badge.type = 'button';
      badge.className = 'book-difficulty-badge difficulty-' + difficultyKey;
      badge.textContent = '⚔ ' + difficulty;
      badge.setAttribute('data-tooltip', TOOLTIPS[difficultyKey]);
      badge.setAttribute('aria-label', 'About ' + difficulty);
      badge.setAttribute('aria-expanded', 'false');
      badges.appendChild(badge);
    });
  }

  function install() {
    var style = document.createElement('style');
    style.textContent = '.book-card-badges{display:flex;flex-direction:row;align-items:center;justify-content:flex-end;gap:7px;flex:0 0 auto;flex-wrap:nowrap;white-space:nowrap}#bookList .card-stamp,#bookList .book-difficulty-badge{display:inline-flex;align-items:center;justify-content:center;align-self:auto;height:30px;margin:0;padding:0 9px;border-width:1px;border-style:solid;border-radius:3px;line-height:1;font-size:10px;font-weight:bold;letter-spacing:.03em;text-transform:uppercase;white-space:nowrap}#bookList .card-stamp{border-color:currentColor;background:transparent}#bookList .book-difficulty-badge{border-color:#65bceb;color:#65bceb;background:rgba(101,188,235,.10);font-family:inherit;cursor:pointer}#bookList .book-difficulty-badge:focus-visible{outline:2px solid currentColor;outline-offset:2px}#bookList .book-difficulty-badge.difficulty-comfortable{border-color:#65bceb;color:#65bceb;background:rgba(101,188,235,.10)}#bookList .book-difficulty-badge.difficulty-challenging{border-color:#b38cff;color:#b38cff;background:rgba(179,140,255,.10)}#bookList .book-difficulty-badge.difficulty-hard{border-color:#d9a441;color:#d9a441;background:rgba(217,164,65,.10)}#bookList .book-difficulty-badge.difficulty-brutal{border-color:#e26d5a;color:#e26d5a;background:rgba(226,109,90,.10)}#bookList.view-compact .book-card-badges{gap:4px}#bookList.view-compact .card-stamp,#bookList.view-compact .book-difficulty-badge{height:24px;padding:0 6px;font-size:9px}#bookList.view-grid .book-card-badges{align-self:flex-start;justify-content:flex-start;margin-top:2px}#bookList.view-grid .card-stamp,#bookList.view-grid .book-difficulty-badge{height:26px;padding:0 7px;font-size:9px}';
    document.head.appendChild(style);

    var list = document.getElementById('bookList');
    if (list) {
      new MutationObserver(function () {
        setTimeout(addCardBadges, 0);
      }).observe(list, { childList: true, subtree: true });
    }

    addCardBadges();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();