(function () {
  function books() {
    try { return JSON.parse(localStorage.getItem('bookshelf-data') || '{"books":[]}').books || []; }
    catch (_) { return []; }
  }

  function cover(book) {
    var isbn = String(book.isbn || '').replace(/[^0-9Xx]/g, '');
    return isbn ? 'https://covers.openlibrary.org/b/isbn/' + isbn + '-S.jpg?default=false' : '';
  }

  function install() {
    var head = document.querySelector('.app-header');
    if (!head) return;

    var style = document.createElement('style');
    style.textContent = '#dashboard{position:fixed;inset:0;z-index:80;overflow:auto;background:var(--bg,#14181C);color:var(--paper-light,#F6F1E4);font-family:var(--font-body,-apple-system)}#dashboard.hidden{display:none!important}.dash-head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:18px 20px;background:var(--bg,#14181C)}.dash-head h1{margin:0;font:26px Georgia,serif}.dash-body{padding:0 20px 130px}.dash-card{margin:14px 0;padding:16px;background:var(--bg-elevated,#1B2129);border:1px solid rgba(168,130,60,.25);border-radius:3px}.dash-card h2{margin:0 0 6px;color:var(--gold,#A8823C);font-size:15px;text-transform:uppercase}.dash-muted{color:var(--muted,#8A8378);font-size:13px}.dash-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.dash-number{font:30px Georgia,serif}.dash-books{display:flex;gap:8px;overflow:auto}.dash-books img{width:48px;height:70px;object-fit:cover;border-radius:2px}.dash-action{width:100%;margin-top:8px;padding:11px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4)}.dash-bar{height:74px;display:flex;align-items:end;gap:7px;border-bottom:1px solid var(--muted,#8A8378)}.dash-bar i{flex:1;background:var(--gold,#A8823C);opacity:.75;border-radius:2px 2px 0 0}.dashboard-btn{border:0;background:none;color:var(--paper-light);font-size:22px;padding:8px}';
    document.head.appendChild(style);

    var view = document.createElement('section');
    view.id = 'dashboard';
    view.className = 'hidden';
    document.body.appendChild(view);

    function render() {
      var all = books();
      var wish = all.filter(function (book) { return book.status === 'wishlist'; });
      var loan = all.filter(function (book) { return book.status === 'loaned'; });
      var read = all.filter(function (book) { return book.status === 'finished'; });
      var reading = all.filter(function (book) { return book.status === 'reading'; });
      var paused = all.filter(function (book) { return book.status === 'paused'; });
      var abandoned = all.filter(function (book) { return book.status === 'abandoned'; });
      var tags = {};

      all.forEach(function (book) {
        (book.tags || []).forEach(function (tag) { tags[tag] = (tags[tag] || 0) + 1; });
      });

      var later = all.filter(function (book) { return book.status === 'to-read'; }).slice(0, 8);
      var cards = later.map(function (book) { return '<img src="' + cover(book) + '" alt="">'; }).join('') || '<span class="dash-muted">No books to read later.</span>';

      view.innerHTML = '<header class="dash-head"><span></span><h1>My Dashboard</h1><span></span></header><main class="dash-body"><section class="dash-card"><h2>Welcome</h2><div class="dash-muted">Your personal library at a glance</div><button class="dash-action" id="dashRandom">Random Book Draw</button></section><section class="dash-card"><h2>Books to Read Later</h2><div class="dash-books">' + cards + '</div></section><section class="dash-grid"><section class="dash-card"><h2>Wishlist</h2><div class="dash-number">' + wish.length + '</div></section><section class="dash-card"><h2>Loaned Out</h2><div class="dash-number">' + loan.length + '</div></section></section><section class="dash-grid"><section class="dash-card"><h2>Tag Statistics</h2><div class="dash-number">' + Object.keys(tags).length + '</div><div class="dash-muted">tags used</div></section><section class="dash-card"><h2>My Library</h2><div class="dash-number">' + all.length + '</div><div class="dash-muted">books cataloged</div></section></section><section class="dash-card"><h2>Collections</h2><div class="dash-muted">Browse your personal collections</div></section><section class="dash-card"><h2>Series</h2><div class="dash-muted">Track books in a series</div></section><section class="dash-grid"><section class="dash-card"><h2>Paused Books</h2><div class="dash-number">' + paused.length + '</div></section><section class="dash-card"><h2>Abandoned Books</h2><div class="dash-number">' + abandoned.length + '</div></section></section><section class="dash-card"><h2>Book Calendar</h2><div class="dash-muted">Reading activity this month</div></section><section class="dash-grid"><section class="dash-card"><h2>Reading Streak</h2><div class="dash-number">0</div><div class="dash-muted">days</div></section><section class="dash-card"><h2>Daily Statistics</h2><div class="dash-number">' + reading.length + '</div><div class="dash-muted">currently reading</div></section></section><section class="dash-card"><h2>Annual Statistics</h2><div class="dash-number">' + read.length + ' books read</div><div class="dash-bar"><i style="height:20%"></i><i style="height:50%"></i><i style="height:80%"></i><i style="height:35%"></i><i style="height:60%"></i></div></section><section class="dash-card"><h2>Rewind</h2><div class="dash-muted">Your reading history and milestones will appear here.</div></section></main>';

      view.querySelector('#dashRandom').onclick = function () {
        if (!all.length) return;
        var book = all[Math.floor(Math.random() * all.length)];
        alert('Try reading: ' + book.title + ' by ' + book.author);
      };
    }

    render();
    view.classList.remove('hidden');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();