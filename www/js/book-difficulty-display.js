
(function () {
  var LABELS = { comfortable:'Light Read', challenging:'Focused Read', hard:'Deep Read', brutal:'Intense Read' };

  function library() {
    try { return JSON.parse(localStorage.getItem('bookshelf-data') || '{"books":[]}').books || []; }
    catch (_) { return []; }
  }

  function bookFor(title, author) {
    return library().filter(function (book) { return book && book.title === title && book.author === author; })[0] || {};
  }

  function label(value) {
    return LABELS[String(value || '').toLowerCase()] || '';
  }

  function addCardBadges() {
    document.querySelectorAll('#bookList .book-card').forEach(function (card) {
      if (card.querySelector('.book-difficulty-badge')) return;
      var title = (card.querySelector('.book-title') || {}).textContent || '';
      var author = (card.querySelector('.book-author') || {}).textContent || '';
      var book = bookFor(title, author);
      var difficulty = label(book.difficulty);
      var stamp = card.querySelector('.card-stamp');
      if (!difficulty || !stamp || !stamp.parentNode) return;

      var badges = document.createElement('div');
      badges.className = 'book-card-badges';
      stamp.parentNode.insertBefore(badges, stamp);
      badges.appendChild(stamp);

      var badge = document.createElement('span');
      badge.className = 'book-difficulty-badge difficulty-' + String(book.difficulty).toLowerCase();
      badge.textContent = '⚔ ' + difficulty;
      badges.appendChild(badge);
    });
  }

  function addPreviewDifficulty() {
    var view = document.getElementById('bookDetails');
    if (!view || view.classList.contains('hidden') || view.querySelector('.bd-difficulty-chip')) return;
    var title = (view.querySelector('.bd-title') || {}).textContent || '';
    var author = (view.querySelector('.bd-author') || {}).textContent || '';
    var book = bookFor(title, author);
    var difficulty = label(book.difficulty);
    var chips = view.querySelector('.bd-chips');
    if (!difficulty || !chips) return;
    var chip = document.createElement('span');
    chip.className = 'bd-chip bd-difficulty-chip difficulty-' + String(book.difficulty).toLowerCase();
    chip.textContent = '⚔ ' + difficulty;
    chips.appendChild(chip);
  }

  function install() {
    var style = document.createElement('style');
    style.textContent = '.book-card-badges{display:flex;flex-direction:row;align-items:center;justify-content:flex-end;gap:7px;flex:0 0 auto;flex-wrap:nowrap;white-space:nowrap}#bookList .card-stamp,#bookList .book-difficulty-badge{display:inline-flex;align-items:center;justify-content:center;align-self:auto;height:30px;margin:0;padding:0 9px;border-width:1px;border-style:solid;border-radius:3px;line-height:1;font-size:10px;font-weight:bold;letter-spacing:.03em;text-transform:uppercase;white-space:nowrap}#bookList .card-stamp{border-color:currentColor;background:transparent}#bookList .book-difficulty-badge{border-color:rgba(168,130,60,.5);color:#8b641f;background:rgba(168,130,60,.1)}.book-difficulty-badge.difficulty-challenging,.bd-difficulty-chip.difficulty-challenging{border-color:rgba(185,119,42,.58);color:#ad681d}.book-difficulty-badge.difficulty-hard,.bd-difficulty-chip.difficulty-hard{border-color:rgba(155,77,50,.62);color:#9b4d32}.book-difficulty-badge.difficulty-brutal,.bd-difficulty-chip.difficulty-brutal{border-color:rgba(126,47,55,.7);color:#8b3a3a}.bd-difficulty-chip{border-color:rgba(168,130,60,.58);color:#ad9879;background:rgba(168,130,60,.08)}#bookList.view-compact .book-card-badges{gap:4px}#bookList.view-compact .card-stamp,#bookList.view-compact .book-difficulty-badge{height:24px;padding:0 6px;font-size:9px}#bookList.view-grid .book-card-badges{align-self:flex-start;justify-content:flex-start;margin-top:2px}#bookList.view-grid .card-stamp,#bookList.view-grid .book-difficulty-badge{height:26px;padding:0 7px;font-size:9px}';
    document.head.appendChild(style);
    var list = document.getElementById('bookList');
    if (list) new MutationObserver(function () { setTimeout(addCardBadges, 0); }).observe(list, { childList:true, subtree:true });
    var details = document.getElementById('bookDetails');
    if (details) new MutationObserver(function () { setTimeout(addPreviewDifficulty, 0); }).observe(details, { childList:true, subtree:true });
    addCardBadges();
    addPreviewDifficulty();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();