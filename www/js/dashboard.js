(function () {
  var collapseKey = 'readquest-dashboard-collapsed-sections';

  function books() {
    try {
      return JSON.parse(
        localStorage.getItem('bookshelf-data') || '{"books":[]}'
      ).books || [];
    } catch (_) {
      return [];
    }
  }

  function getCollapsedSections() {
    try {
      return JSON.parse(localStorage.getItem(collapseKey)) || {};
    } catch (_) {
      return {};
    }
  }

  function saveCollapsedSections(state) {
    localStorage.setItem(collapseKey, JSON.stringify(state));
  }

  function attachBookCover(image, book) {
    var selectedCover = String((book && book.coverUrl) || '')
      .replace(/^http:\/\//i, 'https://');

    var isbn = String((book && book.isbn) || '')
      .replace(/[^0-9Xx]/g, '');

    image.alt = '';
    image.onerror = function () {
      image.style.visibility = 'hidden';
    };

    if (selectedCover) {
      image.src = selectedCover;
      return;
    }

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

  function install() {
    var head = document.querySelector('.app-header');

    if (!head) return;

    var style = document.createElement('style');

    style.textContent =
      '#dashboard{position:fixed;inset:0;z-index:80;overflow:auto;background:var(--bg,#14181C);color:var(--paper-light,#F6F1E4);font-family:var(--font-body,-apple-system)}' +
      '#dashboard.hidden{display:none!important}' +
      '.dash-head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:18px 20px;background:var(--bg,#14181C)}' +
      '.dash-head h1{margin:0;font:26px Georgia,serif}' +
      '.dash-body{padding:0 20px 130px}' +
      '.dash-card{margin:14px 0;padding:16px;background:var(--bg-elevated,#1B2129);border:1px solid rgba(168,130,60,.25);border-radius:3px}' +
      '.dash-card h2{margin:0 0 6px;color:var(--gold,#A8823C);font-size:15px;text-transform:uppercase}' +
      '.dash-muted{color:var(--muted,#8A8378);font-size:13px}' +
      '.dash-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}' +
      '.dash-number{font:30px Georgia,serif}' +

      /* Books to Read Later carousel */
      '.dash-later-carousel{position:relative;margin-top:12px}' +
      '.dash-later-track{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 10px;scroll-snap-type:x mandatory;scroll-behavior:smooth;scrollbar-width:none;-webkit-overflow-scrolling:touch}' +
      '.dash-later-track::-webkit-scrollbar{display:none}' +
      '.dash-later-book{position:relative;display:block;flex:0 0 92px;min-width:92px;padding:0;border:0;background:transparent;color:var(--paper-light,#F6F1E4);text-align:left;scroll-snap-align:start;cursor:pointer}' +
      '.dash-later-book img{display:block;width:92px;height:136px;object-fit:cover;border:1px solid rgba(168,130,60,.38);border-radius:3px;background:var(--bg,#14181C);box-shadow:0 3px 8px rgba(0,0,0,.3)}' +
      '.dash-later-book span{display:block;overflow:hidden;margin-top:6px;color:var(--paper-light,#F6F1E4);font-size:11px;line-height:1.25;text-overflow:ellipsis;white-space:nowrap}' +
      '.dash-later-nav{position:absolute;z-index:1;top:51px;width:30px;height:40px;border:1px solid rgba(168,130,60,.75);border-radius:3px;background:rgba(20,24,28,.92);color:var(--paper-light,#F6F1E4);font-size:23px;line-height:1;cursor:pointer}' +
      '.dash-later-nav:hover{background:var(--gold,#A8823C);color:#fff}' +
      '.dash-later-prev{left:4px}' +
      '.dash-later-next{right:4px}' +
      '.dash-later-nav[disabled]{visibility:hidden}' +

      /* Collapsible dashboard cards */
      '.dash-collapsible{padding:0;overflow:hidden}' +
      '.dash-collapse-toggle{display:flex;align-items:center;justify-content:space-between;width:100%;padding:16px;border:0;background:transparent;color:var(--paper-light,#F6F1E4);text-align:left;cursor:pointer}' +
      '.dash-collapse-toggle h2{margin:0;color:var(--gold,#A8823C);font-size:15px;text-transform:uppercase}' +
      '.dash-collapse-icon{font-size:22px;line-height:1;transition:transform .16s ease}' +
      '.dash-collapse-toggle[aria-expanded="true"] .dash-collapse-icon{transform:rotate(90deg)}' +
      '.dash-collapse-body{padding:0 16px 16px}' +
      '.dash-collapse-body.hidden{display:none!important}' +
      '.dash-collapse-body .dash-muted{margin:0}' +

      '.dash-action{width:100%;margin-top:8px;padding:11px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4)}' +
      '.dash-bar{height:74px;display:flex;align-items:end;gap:7px;border-bottom:1px solid var(--muted,#8A8378)}' +
      '.dash-bar i{flex:1;background:var(--gold,#A8823C);opacity:.75;border-radius:2px 2px 0 0}' +
      '.dashboard-btn{border:0;background:none;color:var(--paper-light);font-size:22px;padding:8px}' +
      '@media(max-width:360px){.dash-later-book{flex-basis:78px;min-width:78px}.dash-later-book img{width:78px;height:116px}.dash-later-nav{top:41px}}';

    document.head.appendChild(style);

    var view = document.createElement('section');
    view.id = 'dashboard';
    view.className = 'hidden';
    document.body.appendChild(view);

    function openBook(book) {
      var cards = Array.prototype.slice.call(
        document.querySelectorAll('#bookList .book-card')
      );

      var card = cards.filter(function (item) {
        return item.dataset.bookId === String(book.id);
      })[0];

      if (!card) {
        card = cards.filter(function (item) {
          return (
            (item.querySelector('.book-title') || {}).textContent === book.title &&
            (item.querySelector('.book-author') || {}).textContent === book.author
          );
        })[0];
      }

      view.classList.add('hidden');

      if (card) {
        card.click();
      }
    }

    function updateCarouselButtons(track) {
      var carousel = track.closest('.dash-later-carousel');
      var previous = carousel.querySelector('.dash-later-prev');
      var next = carousel.querySelector('.dash-later-next');
      var tolerance = 3;

      previous.disabled = track.scrollLeft <= tolerance;
      next.disabled =
        track.scrollLeft + track.clientWidth >= track.scrollWidth - tolerance;
    }

    function wireCarousel() {
      var track = view.querySelector('#dashLaterTrack');

      if (!track) return;

      var previous = view.querySelector('.dash-later-prev');
      var next = view.querySelector('.dash-later-next');
      var step = function () {
        return Math.max(track.clientWidth * 0.8, 180);
      };

      previous.onclick = function () {
        track.scrollBy({ left: -step(), behavior: 'smooth' });
      };

      next.onclick = function () {
        track.scrollBy({ left: step(), behavior: 'smooth' });
      };

      track.addEventListener('scroll', function () {
        updateCarouselButtons(track);
      }, { passive: true });

      window.requestAnimationFrame(function () {
        updateCarouselButtons(track);
      });
    }

    function wireCollapsibles() {
      var collapsed = getCollapsedSections();

      view.querySelectorAll('.dash-collapse-toggle').forEach(function (button) {
        var section = button.dataset.section;
        var body = document.getElementById(button.getAttribute('aria-controls'));
        var isCollapsed = !!collapsed[section];

        button.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
        body.classList.toggle('hidden', isCollapsed);

        button.onclick = function () {
          var expanded = button.getAttribute('aria-expanded') === 'true';

          button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          body.classList.toggle('hidden', expanded);

          collapsed[section] = expanded;
          saveCollapsedSections(collapsed);
        };
      });
    }

    function render() {
      var all = books();

      var wish = all.filter(function (book) {
        return book.status === 'wishlist';
      });

      var loan = all.filter(function (book) {
        return book.status === 'loaned';
      });

      var read = all.filter(function (book) {
        return book.status === 'finished';
      });

      var reading = all.filter(function (book) {
        return book.status === 'reading';
      });

      var paused = all.filter(function (book) {
        return book.status === 'paused';
      });

      var abandoned = all.filter(function (book) {
        return book.status === 'abandoned';
      });

      var tags = {};

      all.forEach(function (book) {
        (book.tags || []).forEach(function (tag) {
          tags[tag] = (tags[tag] || 0) + 1;
        });
      });

      var later = all.filter(function (book) {
        return book.status === 'to-read';
      });

      var laterMarkup = later.length
        ? '<div class="dash-later-carousel">' +
            '<button type="button" class="dash-later-nav dash-later-prev" aria-label="Previous books">‹</button>' +
            '<div id="dashLaterTrack" class="dash-later-track" aria-label="Books to read later"></div>' +
            '<button type="button" class="dash-later-nav dash-later-next" aria-label="Next books">›</button>' +
          '</div>'
        : '<span class="dash-muted">No books to read later.</span>';

      view.innerHTML =
        '<header class="dash-head"><span></span><h1>My Dashboard</h1><span></span></header>' +
        '<main class="dash-body">' +
          '<section class="dash-card">' +
            '<h2>Welcome</h2>' +
            '<div class="dash-muted">Your personal library at a glance</div>' +
            '<button class="dash-action" id="dashRandom">Random Book Draw</button>' +
          '</section>' +

          '<section class="dash-card">' +
            '<h2>Books to Read Later</h2>' +
            laterMarkup +
          '</section>' +

          '<section class="dash-grid">' +
            '<section class="dash-card"><h2>Wishlist</h2><div class="dash-number">' + wish.length + '</div></section>' +
            '<section class="dash-card"><h2>Loaned Out</h2><div class="dash-number">' + loan.length + '</div></section>' +
          '</section>' +

          '<section class="dash-grid">' +
            '<section class="dash-card"><h2>Tag Statistics</h2><div class="dash-number">' + Object.keys(tags).length + '</div><div class="dash-muted">tags used</div></section>' +
            '<section class="dash-card"><h2>My Library</h2><div class="dash-number">' + all.length + '</div><div class="dash-muted">books cataloged</div></section>' +
          '</section>' +

          '<section class="dash-card dash-collapsible">' +
            '<button type="button" class="dash-collapse-toggle" data-section="collections" aria-controls="dashboardCollectionsBody">' +
              '<h2>Collections</h2>' +
              '<span class="dash-collapse-icon" aria-hidden="true">›</span>' +
            '</button>' +
            '<div id="dashboardCollectionsBody" class="dash-collapse-body">' +
              '<div class="dash-muted">Browse your personal collections</div>' +
            '</div>' +
          '</section>' +

          '<section class="dash-card dash-collapsible">' +
            '<button type="button" class="dash-collapse-toggle" data-section="series" aria-controls="dashboardSeriesBody">' +
              '<h2>Series</h2>' +
              '<span class="dash-collapse-icon" aria-hidden="true">›</span>' +
            '</button>' +
            '<div id="dashboardSeriesBody" class="dash-collapse-body">' +
              '<div class="dash-muted">Track books in a series</div>' +
            '</div>' +
          '</section>' +

          '<section class="dash-grid">' +
            '<section class="dash-card"><h2>Paused Books</h2><div class="dash-number">' + paused.length + '</div></section>' +
            '<section class="dash-card"><h2>Abandoned Books</h2><div class="dash-number">' + abandoned.length + '</div></section>' +
          '</section>' +

          '<section class="dash-card"><h2>Book Calendar</h2><div class="dash-muted">Reading activity this month</div></section>' +

          '<section class="dash-grid">' +
            '<section class="dash-card"><h2>Reading Streak</h2><div class="dash-number">0</div><div class="dash-muted">days</div></section>' +
            '<section class="dash-card"><h2>Daily Statistics</h2><div class="dash-number">' + reading.length + '</div><div class="dash-muted">currently reading</div></section>' +
          '</section>' +

          '<section class="dash-card"><h2>Annual Statistics</h2><div class="dash-number">' + read.length + ' books read</div><div class="dash-bar"><i style="height:20%"></i><i style="height:50%"></i><i style="height:80%"></i><i style="height:35%"></i><i style="height:60%"></i></div></section>' +
          '<section class="dash-card"><h2>Rewind</h2><div class="dash-muted">Your reading history and milestones will appear here.</div></section>' +
        '</main>';

      var laterTrack = view.querySelector('#dashLaterTrack');

      if (laterTrack) {
        later.forEach(function (book) {
          var item = document.createElement('button');
          item.type = 'button';
          item.className = 'dash-later-book';
          item.title = book.title || 'Untitled';

          var image = document.createElement('img');
          var title = document.createElement('span');

          attachBookCover(image, book);
          title.textContent = book.title || 'Untitled';

          item.append(image, title);
          item.onclick = function () {
            openBook(book);
          };

          laterTrack.appendChild(item);
        });
      }

      view.querySelector('#dashRandom').onclick = function () {
        if (!all.length) return;

        var book = all[Math.floor(Math.random() * all.length)];
        alert('Try reading: ' + book.title + ' by ' + book.author);
      };

      wireCarousel();
      wireCollapsibles();
    }

    render();
    view.classList.remove('hidden');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();