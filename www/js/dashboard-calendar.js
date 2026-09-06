(function () {
  var LOG_KEY = 'bookshelf-reading-log-v1';
  var BOOKS_KEY = 'bookshelf-data';

  var MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  var WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function readData(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || fallback);
    } catch (_) {
      return JSON.parse(fallback);
    }
  }

  function readLog() {
    return readData(LOG_KEY, '[]');
  }

  function readBooks() {
    return readData(BOOKS_KEY, '{"books":[]}').books || [];
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function dateKey(value) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) {
      return String(value);
    }

    var date = new Date(value || 0);

    if (isNaN(date.getTime())) {
      return '';
    }

    return date.getFullYear() + '-' +
      pad(date.getMonth() + 1) + '-' +
      pad(date.getDate());
  }

  function todayKey() {
    var now = new Date();

    return now.getFullYear() + '-' +
      pad(now.getMonth() + 1) + '-' +
      pad(now.getDate());
  }

  function monthKey(year, month) {
    return year + '-' + pad(month + 1);
  }

  function coverUrl(book) {
    var explicit = String((book && book.coverUrl) || '')
      .replace(/^http:\/\//i, 'https://');

    if (explicit) {
      return explicit;
    }

    var isbn = String((book && book.isbn) || '')
      .replace(/[^0-9Xx]/g, '');

    return isbn
      ? 'https://covers.openlibrary.org/b/isbn/' +
        encodeURIComponent(isbn) +
        '-M.jpg?default=false'
      : '';
  }

  function attachBookCover(image, book) {
    image.alt = '';
    image.loading = 'lazy';

    image.onerror = function () {
      image.style.visibility = 'hidden';
    };

    var url = coverUrl(book);

    if (!url) {
      image.style.visibility = 'hidden';
      return;
    }

    if (
      !book.coverUrl &&
      window.BookCoverCache &&
      typeof window.BookCoverCache.attach === 'function'
    ) {
      window.BookCoverCache.attach(image, String(book.isbn || ''));
      return;
    }

    image.src = url;
  }

  function findBook(bookId) {
    return readBooks().filter(function (book) {
      return book && book.id === bookId;
    })[0] || null;
  }

  function monthActivity(year, month) {
    var prefix = monthKey(year, month) + '-';
    var days = {};

    readLog().forEach(function (entry) {
      var minutes = Math.max(0, Number((entry || {}).minutes) || 0);
      var day = dateKey(
        entry && (entry.date || entry.createdAt || entry.endedAt)
      );

      if (!minutes || day.indexOf(prefix) !== 0) {
        return;
      }

      if (!days[day]) {
        days[day] = {
          minutes: 0,
          sessions: 0,
          books: {}
        };
      }

      days[day].minutes += minutes;
      days[day].sessions += 1;

      if (entry.bookId) {
        days[day].books[entry.bookId] =
          (days[day].books[entry.bookId] || 0) + minutes;
      }
    });

    Object.keys(days).forEach(function (day) {
      var activity = days[day];

      activity.bookList = Object.keys(activity.books)
        .map(function (bookId) {
          var book = findBook(bookId);

          return book
            ? {
              book: book,
              minutes: activity.books[bookId]
            }
            : null;
        })
        .filter(Boolean)
        .sort(function (a, b) {
          return b.minutes - a.minutes;
        });
    });

    return days;
  }

  function removeDetail() {
    var existing = document.getElementById('dashCalendarBookDetail');

    if (existing) {
      existing.remove();
    }
  }

  function openBookDetail(book, minutes, day) {
    removeDetail();

    var modal = document.createElement('section');
    modal.id = 'dashCalendarBookDetail';
    modal.className = 'dash-calendar-detail';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Reading details for ' + (book.title || 'book'));

    var sheet = document.createElement('div');
    sheet.className = 'dash-calendar-detail-sheet';

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'dash-calendar-detail-close';
    close.setAttribute('aria-label', 'Close book details');
    close.textContent = '×';

    var cover = document.createElement('img');
    cover.className = 'dash-calendar-detail-cover';
    cover.alt = 'Cover of ' + (book.title || 'book');
    attachBookCover(cover, book);

    var copy = document.createElement('div');
    copy.className = 'dash-calendar-detail-copy';

    var label = document.createElement('span');
    label.className = 'dash-calendar-detail-label';
    label.textContent = 'Reading Log';

    var title = document.createElement('h2');
    title.textContent = book.title || 'Untitled';

    var author = document.createElement('p');
    author.className = 'dash-calendar-detail-author';
    author.textContent = book.author || 'Unknown author';

    var activity = document.createElement('p');
    activity.className = 'dash-calendar-detail-activity';
    activity.textContent =
      minutes + ' minute' + (minutes === 1 ? '' : 's') +
      ' logged on ' + day + '.';

    var metaParts = [
      book.genre,
      book.format,
      book.status ? String(book.status).replace(/-/g, ' ') : ''
    ].filter(Boolean);

    if (metaParts.length) {
      var meta = document.createElement('p');
      meta.className = 'dash-calendar-detail-meta';
      meta.textContent = metaParts.join(' · ');
      copy.appendChild(meta);
    }

    copy.append(label, title, author, activity);

    var openLibrary = document.createElement('button');
    openLibrary.type = 'button';
    openLibrary.className = 'dash-calendar-detail-library';
    openLibrary.textContent = 'Open Book Details';

    openLibrary.onclick = function () {
      removeDetail();

      var dashboard = document.getElementById('dashboard');

      if (dashboard) {
        dashboard.classList.add('hidden');
      }

      var card = Array.prototype.filter.call(
        document.querySelectorAll('#bookList .book-card'),
        function (item) {
          return item.dataset.bookId === book.id;
        }
      )[0];

      if (card) {
        card.click();
      }
    };

    close.onclick = removeDetail;

    modal.onclick = function (event) {
      if (event.target === modal) {
        removeDetail();
      }
    };

    sheet.append(close, cover, copy, openLibrary);
    modal.appendChild(sheet);
    document.body.appendChild(modal);

    close.focus();
  }

  function activeDashboard() {
    return document.getElementById('dashboard');
  }

  function existingCalendar(dashboard) {
    return dashboard.querySelector('#dashCalendarCard');
  }

  function calendarCard() {
    var card = document.createElement('details');

    card.id = 'dashCalendarCard';
    card.className = 'dash-card dash-calendar-card';
    card.open = false;

    card.innerHTML =
      '<summary class="dash-calendar-summary">' +
        '<span class="dash-calendar-summary-copy">' +
          '<span class="dash-calendar-kicker">Reading Chronicle</span>' +
          '<strong>Calendar</strong>' +
          '<small>Tap to reveal this month’s reading activity</small>' +
        '</span>' +
        '<span class="dash-calendar-chevron" aria-hidden="true">⌄</span>' +
      '</summary>' +
      '<div class="dash-calendar-body"></div>';

    return card;
  }

  function renderImageCard(year, month, days) {
    var activeDays = Object.keys(days);
    var totalMinutes = activeDays.reduce(function (sum, day) {
      return sum + days[day].minutes;
    }, 0);

    var image = document.createElement('section');
    image.className = 'dash-calendar-image-card';

    image.innerHTML =
      '<div class="dash-calendar-image-glow" aria-hidden="true"></div>' +
      '<div class="dash-calendar-image-copy">' +
        '<span>Reading Chronicle</span>' +
        '<strong>' + MONTH_NAMES[month] + ' ' + year + '</strong>' +
        '<small>' +
          (totalMinutes
            ? totalMinutes + ' minutes across ' + activeDays.length +
              ' active day' + (activeDays.length === 1 ? '' : 's')
            : 'Your next reading session will illuminate the archive.') +
        '</small>' +
      '</div>' +
      '<div class="dash-calendar-image-mark" aria-hidden="true">✦</div>';

    return image;
  }

  function renderBookCovers(activity, day) {
    var covers = document.createElement('div');
    covers.className = 'dash-calendar-day-covers';

    var visible = activity.bookList.slice(0, 2);

    visible.forEach(function (item) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'dash-calendar-cover-button';
      button.setAttribute(
        'aria-label',
        'Open reading details for ' + (item.book.title || 'book')
      );
      button.title =
        (item.book.title || 'Untitled') + ' · ' +
        item.minutes + ' reading minutes';

      var image = document.createElement('img');
      image.className = 'dash-calendar-cover';
      image.alt = '';
      attachBookCover(image, item.book);

      button.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();
        openBookDetail(item.book, item.minutes, day);
      };

      button.appendChild(image);
      covers.appendChild(button);
    });

    if (activity.bookList.length > 2) {
      var more = document.createElement('span');
      more.className = 'dash-calendar-more-covers';
      more.textContent = '+' + (activity.bookList.length - 2);
      more.title =
        activity.bookList.length + ' books logged on ' + day;
      covers.appendChild(more);
    }

    return covers;
  }

  function renderCalendarGrid(year, month, days) {
    var grid = document.createElement('div');
    grid.className = 'dash-calendar-grid';

    WEEKDAYS.forEach(function (label) {
      var weekday = document.createElement('span');
      weekday.className = 'dash-calendar-weekday';
      weekday.textContent = label;
      grid.appendChild(weekday);
    });

    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var maxMinutes = Math.max.apply(
      null,
      Object.keys(days).map(function (key) {
        return days[key].minutes;
      }).concat([1])
    );
    var today = todayKey();

    for (var blank = 0; blank < firstDay; blank += 1) {
      var spacer = document.createElement('span');
      spacer.className = 'dash-calendar-blank';
      spacer.setAttribute('aria-hidden', 'true');
      grid.appendChild(spacer);
    }

    for (var number = 1; number <= daysInMonth; number += 1) {
      var day = monthKey(year, month) + '-' + pad(number);
      var activity = days[day];
      var cell = document.createElement('div');

      cell.className = 'dash-calendar-day';

      if (day === today) {
        cell.classList.add('is-today');
      }

      if (activity) {
        var level = Math.max(
          1,
          Math.min(4, Math.ceil(activity.minutes / maxMinutes * 4))
        );

        cell.classList.add('is-active', 'activity-' + level);
      }

      var numberLabel = document.createElement('span');
      numberLabel.className = 'dash-calendar-day-number';
      numberLabel.textContent = number;
      cell.appendChild(numberLabel);

      if (activity && activity.bookList.length) {
        cell.appendChild(renderBookCovers(activity, day));
      } else if (activity) {
        var minutes = document.createElement('small');
        minutes.className = 'dash-calendar-minutes';
        minutes.textContent = activity.minutes + 'm';
        cell.appendChild(minutes);
      }

      if (activity) {
        cell.title =
          activity.minutes + ' reading minutes · ' +
          activity.sessions + ' session' +
          (activity.sessions === 1 ? '' : 's');
      } else {
        cell.title = 'No reading logged';
      }

      grid.appendChild(cell);
    }

    return grid;
  }

  function renderContent(card) {
    var body = card.querySelector('.dash-calendar-body');

    if (!body) {
      return;
    }

    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();
    var days = monthActivity(year, month);
    var activeDays = Object.keys(days).length;
    var totalMinutes = Object.keys(days).reduce(function (sum, day) {
      return sum + days[day].minutes;
    }, 0);
    var totalSessions = Object.keys(days).reduce(function (sum, day) {
      return sum + days[day].sessions;
    }, 0);

    body.innerHTML = '';
    body.appendChild(renderImageCard(year, month, days));

    var heading = document.createElement('div');
    heading.className = 'dash-calendar-month-heading';
    heading.innerHTML =
      '<div><span>This month</span><strong>' +
      MONTH_NAMES[month] + ' ' + year +
      '</strong></div>' +
      '<span class="dash-calendar-legend"><i></i> Reading logged</span>';

    body.appendChild(heading);
    body.appendChild(renderCalendarGrid(year, month, days));

    var stats = document.createElement('div');
    stats.className = 'dash-calendar-stats';
    stats.innerHTML =
      '<div><strong>' + totalMinutes + '</strong><span>minutes</span></div>' +
      '<div><strong>' + activeDays + '</strong><span>active days</span></div>' +
      '<div><strong>' + totalSessions + '</strong><span>sessions</span></div>';

    body.appendChild(stats);

    var note = document.createElement('p');
    note.className = 'dash-calendar-note';
    note.textContent = activeDays
      ? 'Tap a book cover to see that day’s reading details.'
      : 'Log reading time with a selected book to place its cover on the calendar.';
    body.appendChild(note);
  }

  function findAnnualCard(dashboard) {
    return Array.prototype.filter.call(
      dashboard.querySelectorAll('.dash-card'),
      function (card) {
        var title = card.querySelector('h2');
        return title && title.textContent.trim() === 'Annual Statistics';
      }
    )[0] || null;
  }

  function insertCalendar() {
    var dashboard = activeDashboard();

    if (!dashboard) {
      return;
    }

    var calendar = existingCalendar(dashboard);

    if (!calendar) {
      calendar = calendarCard();

      var annual = findAnnualCard(dashboard);

      if (annual && annual.parentNode) {
        annual.parentNode.insertBefore(calendar, annual);
      } else {
        var body = dashboard.querySelector('.dash-body');

        if (body) {
          body.appendChild(calendar);
        }
      }
    }

    var wasOpen = calendar.open;

    renderContent(calendar);

    calendar.open = wasOpen;
  }

  function install() {
    var dashboard = activeDashboard();

    if (!dashboard || dashboard.dataset.calendarReady) {
      return;
    }

    dashboard.dataset.calendarReady = 'true';

    var style = document.createElement('style');

    style.textContent =
      '.dash-calendar-card{padding:0;overflow:hidden}' +
      '.dash-calendar-summary{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px;cursor:pointer;list-style:none}' +
      '.dash-calendar-summary::-webkit-details-marker{display:none}' +
      '.dash-calendar-summary-copy{display:grid;gap:3px}' +
      '.dash-calendar-summary-copy strong{font:20px Georgia,serif;color:var(--paper-light,#F6F1E4)}' +
      '.dash-calendar-summary-copy small{color:var(--muted,#8A8378);font-size:12px}' +
      '.dash-calendar-kicker{color:var(--gold,#A8823C);font-size:10px;font-weight:700;letter-spacing:.11em;text-transform:uppercase}' +
      '.dash-calendar-chevron{color:var(--gold,#A8823C);font-size:25px;line-height:1;transition:transform .2s ease}' +
      '.dash-calendar-card[open] .dash-calendar-chevron{transform:rotate(180deg)}' +
      '.dash-calendar-body{padding:0 16px 16px;border-top:1px solid rgba(168,130,60,.22)}' +
      '.dash-calendar-image-card{position:relative;isolation:isolate;display:flex;align-items:center;justify-content:space-between;min-height:112px;margin:16px 0;padding:18px;overflow:hidden;border:1px solid rgba(168,130,60,.5);border-radius:5px;background:linear-gradient(135deg,#352818 0%,#1b2129 52%,#182427 100%)}' +
      '.dash-calendar-image-card:before{content:"";position:absolute;z-index:-1;inset:0;background:repeating-linear-gradient(135deg,rgba(255,255,255,.025) 0 1px,transparent 1px 7px)}' +
      '.dash-calendar-image-glow{position:absolute;z-index:-1;right:-26px;top:-42px;width:145px;height:145px;border-radius:50%;background:radial-gradient(circle,rgba(204,165,83,.56),rgba(168,130,60,.10) 52%,transparent 70%)}' +
      '.dash-calendar-image-copy{display:grid;gap:5px;max-width:78%}' +
      '.dash-calendar-image-copy span{color:#dfc17d;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}' +
      '.dash-calendar-image-copy strong{font:24px Georgia,serif;color:#fff6df;line-height:1.05}' +
      '.dash-calendar-image-copy small{color:#d4c8b0;font-size:12px;line-height:1.35}' +
      '.dash-calendar-image-mark{display:grid;place-items:center;width:53px;height:53px;border:1px solid rgba(236,202,128,.65);border-radius:50%;color:#ffe2a2;font-size:29px;box-shadow:0 0 24px rgba(222,173,74,.24)}' +
      '.dash-calendar-month-heading{display:flex;align-items:end;justify-content:space-between;gap:12px;margin:2px 0 12px}' +
      '.dash-calendar-month-heading div{display:grid;gap:2px}' +
      '.dash-calendar-month-heading span{color:var(--muted,#8A8378);font-size:11px}' +
      '.dash-calendar-month-heading strong{font:18px Georgia,serif;color:var(--paper-light,#F6F1E4)}' +
      '.dash-calendar-legend{display:flex;align-items:center;gap:5px;white-space:nowrap}' +
      '.dash-calendar-legend i{display:block;width:10px;height:10px;border-radius:2px;background:var(--gold,#A8823C)}' +
      '.dash-calendar-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}' +
      '.dash-calendar-weekday{padding-bottom:2px;color:var(--muted,#8A8378);font-size:10px;text-align:center;text-transform:uppercase}' +
      '.dash-calendar-blank{min-height:54px}' +
      '.dash-calendar-day{position:relative;display:grid;align-content:start;min-height:54px;padding:3px;border:1px solid rgba(168,130,60,.14);border-radius:3px;background:rgba(0,0,0,.12);color:var(--paper-light,#F6F1E4);overflow:hidden}' +
      '.dash-calendar-day-number{position:relative;z-index:1;display:block;font-size:11px;line-height:1;text-align:right}' +
      '.dash-calendar-day.is-today{border-color:#e0bb67;box-shadow:inset 0 0 0 1px rgba(224,187,103,.4)}' +
      '.dash-calendar-day.is-active{border-color:rgba(234,196,113,.62);background:rgba(168,130,60,.32)}' +
      '.dash-calendar-day.activity-1{background:rgba(168,130,60,.28)}' +
      '.dash-calendar-day.activity-2{background:rgba(168,130,60,.43)}' +
      '.dash-calendar-day.activity-3{background:rgba(168,130,60,.61)}' +
      '.dash-calendar-day.activity-4{background:rgba(168,130,60,.82);color:#fff9eb}' +
      '.dash-calendar-minutes{display:block;margin-top:10px;color:rgba(255,246,223,.95);font-size:9px;text-align:center}' +
      '.dash-calendar-day-covers{display:flex;align-items:end;justify-content:center;gap:2px;min-width:0;margin-top:4px}' +
      '.dash-calendar-cover-button{display:block;width:18px;height:29px;flex:0 0 18px;padding:0;overflow:hidden;border:1px solid rgba(255,246,223,.72);border-radius:2px;background:var(--bg,#14181C);box-shadow:0 1px 3px rgba(0,0,0,.4);cursor:pointer}' +
      '.dash-calendar-cover-button:focus-visible{outline:2px solid #fff3c8;outline-offset:1px}' +
      '.dash-calendar-cover{display:block;width:100%;height:100%;object-fit:cover}' +
      '.dash-calendar-more-covers{display:grid;place-items:center;width:18px;height:18px;flex:0 0 18px;border:1px solid rgba(255,246,223,.65);border-radius:50%;background:rgba(20,24,28,.78);color:#fff6df;font-size:8px;font-weight:700}' +
      '.dash-calendar-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:14px}' +
      '.dash-calendar-stats div{display:grid;gap:2px;padding:10px 6px;border:1px solid rgba(168,130,60,.2);border-radius:3px;background:rgba(0,0,0,.1);text-align:center}' +
      '.dash-calendar-stats strong{font:20px Georgia,serif;color:var(--gold,#A8823C)}' +
      '.dash-calendar-stats span{color:var(--muted,#8A8378);font-size:10px;text-transform:uppercase}' +
      '.dash-calendar-note{margin:12px 0 0;color:var(--muted,#8A8378);font-size:11px;line-height:1.35}' +
      '.dash-calendar-detail{position:fixed;z-index:1200;inset:0;display:grid;place-items:end center;padding:18px;background:rgba(0,0,0,.68)}' +
      '.dash-calendar-detail-sheet{display:grid;grid-template-columns:76px minmax(0,1fr);gap:14px;width:min(500px,100%);padding:20px;border:1px solid rgba(210,172,88,.65);border-radius:7px;background:var(--bg-elevated,#1B2129);color:var(--paper-light,#F6F1E4);box-shadow:0 16px 40px rgba(0,0,0,.52)}' +
      '.dash-calendar-detail-close{grid-column:2;justify-self:end;width:28px;height:28px;margin:-8px -8px -24px 0;padding:0;border:0;background:transparent;color:var(--paper-light,#F6F1E4);font-size:28px;line-height:1;cursor:pointer}' +
      '.dash-calendar-detail-cover{grid-row:1 / span 2;width:76px;height:114px;object-fit:cover;border-radius:3px;background:var(--bg,#14181C)}' +
      '.dash-calendar-detail-copy{min-width:0;padding-top:18px}' +
      '.dash-calendar-detail-label{display:block;color:var(--gold,#A8823C);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}' +
      '.dash-calendar-detail-copy h2{margin:5px 0 0;font:21px/1.1 Georgia,serif;color:var(--paper-light,#F6F1E4)}' +
      '.dash-calendar-detail-author{margin:5px 0 0;color:var(--muted,#8A8378);font-size:12px}' +
      '.dash-calendar-detail-activity{margin:11px 0 0;color:var(--paper-light,#F6F1E4);font-size:13px;line-height:1.35}' +
      '.dash-calendar-detail-meta{margin:7px 0 0;color:var(--muted,#8A8378);font-size:11px;text-transform:capitalize}' +
      '.dash-calendar-detail-library{grid-column:1 / -1;width:100%;padding:11px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4);font:inherit;cursor:pointer}' +
      '@media (max-width:360px){.dash-calendar-grid{gap:3px}.dash-calendar-day{min-height:49px;padding:2px}.dash-calendar-blank{min-height:49px}.dash-calendar-cover-button{width:15px;height:25px;flex-basis:15px}.dash-calendar-more-covers{width:15px;height:15px;flex-basis:15px;font-size:7px}}';

    document.head.appendChild(style);

    new MutationObserver(function () {
      setTimeout(insertCalendar, 0);
    }).observe(dashboard, {
      childList: true
    });

    window.addEventListener('bookshelf-reading-log-changed', insertCalendar);
    window.addEventListener('bookshelf-books-changed', insertCalendar);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        removeDetail();
      }
    });

    insertCalendar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();