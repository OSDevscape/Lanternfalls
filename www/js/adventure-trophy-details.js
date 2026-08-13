(function () {
  var LOOT_KEY = 'bookshelf-adventure-loot-v1';
  var LOG_KEY = 'bookshelf-reading-log-v1';
  var GAME_KEY = 'bookshelf-adventure-progression-v1';

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch (_) { return JSON.parse(fallback); }
  }

  function number(value) { return Math.max(0, Number(value) || 0); }

  function hash(value) {
    var result = 0;
    String(value || '').split('').forEach(function (character) {
      result = ((result << 5) - result) + character.charCodeAt(0);
      result |= 0;
    });
    return Math.abs(result);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (character) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[character];
    });
  }

  function formatDate(value) {
    var date = new Date(value);
    return isNaN(date) ? 'Unknown date' : date.toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  function trophyDate(event, book, sessions) {
    var latest = (sessions || []).slice().sort(function (a, b) {
      return String(b.date || b.createdAt || b.endedAt || '').localeCompare(String(a.date || a.createdAt || a.endedAt || ''));
    })[0] || {};
    return event.earnedAt || event.defeatedAt || event.claimedAt || event.createdAt || latest.date || latest.createdAt || latest.endedAt || (book && (book.dateFinished || book.dateAdded));
  }

  function metrics(bookId, event) {
    var game = read(GAME_KEY, '{}');
    var stats = game.stats || {};
    var strength = Math.max(10, number(stats.str) || 10);
    var luck = Math.max(10, number(stats.lck) || 10);
    var sessions = read(LOG_KEY, '[]').filter(function (session) {
      return session && session.bookId === bookId && number(session.minutes);
    });
    var minutes = sessions.reduce(function (total, session) { return total + number(session.minutes); }, 0);
    var criticals = 0;
    var damage = 0;
    var critChance = Math.min(25, 5 + luck / 20);

    sessions.forEach(function (session) {
      var base = Math.floor(number(session.minutes) * (1 + strength / 500));
      var critical = (hash(session.id) % 10000) < Math.round(critChance * 100);
      damage += critical ? Math.floor(base * 1.5) : base;
      if (critical) criticals += 1;
    });

    var readingXP = minutes * 10;
    var readingGold = sessions.reduce(function (total, session) {
      return total + Math.max(1, Math.floor(number(session.minutes) / 2));
    }, 0);
    var bossXP = event.xp === undefined ? 0 : number(event.xp);

    return { sessions:sessions, minutes:minutes, sessionXP:readingXP, bossXP:bossXP, totalXP:readingXP + bossXP, gold:number(event.gold) + readingGold, damage:damage, criticals:criticals, critChance:critChance };
  }

  function bossName(book, event) {
    return window.BookShelfBosses && book ? window.BookShelfBosses.get(book).name : (event.bossName || 'Book Boss');
  }

  async function render() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.classList.contains('hidden') || !page.classList.contains('adventure-page') || page.dataset.trophyDetailsRendering) return;
    var list = page.querySelector('.adventure-trophy-list');
    if (!list) return;

    page.dataset.trophyDetailsRendering = 'true';
    var events = (read(LOOT_KEY, '{"events":[]}').events || []).slice(0, 5);
    var books = [];
    try { books = await window.BookStorage.loadBooks(); } catch (_) {}
    if (!page.classList.contains('adventure-page')) { page.dataset.trophyDetailsRendering = ''; return; }

    list.innerHTML = events.map(function (event) {
      var book = books.filter(function (item) { return item.id === event.bookId; })[0];
      var stat = metrics(event.bookId, event);
      var sessions = stat.sessions.length ? stat.sessions.slice().sort(function (a, b) {
        return String(b.date || b.createdAt || b.endedAt || '').localeCompare(String(a.date || a.createdAt || a.endedAt || ''));
      }).map(function (session) {
        return '<li><span>' + escapeHtml(formatDate(session.date || session.createdAt || session.endedAt)) + '</span><b>' + number(session.minutes) + ' min</b></li>';
      }).join('') : '<li>No time entries retained</li>';

      return '<article class="adventure-trophy-detail"><button type="button" class="adventure-trophy-toggle" aria-expanded="false"><span><b>★ ' + escapeHtml(event.title) + '</b><em>' + escapeHtml(bossName(book, event)) + '</em></span><strong>+' + stat.totalXP + ' XP<br><i>+' + stat.gold + ' gold</i></strong></button><div class="adventure-trophy-detail-body"><div class="adventure-trophy-stats"><div><b>' + stat.minutes + '</b><span>Minutes logged</span></div><div><b>' + stat.sessions.length + '</b><span>Sessions logged</span></div><div><b>' + stat.damage + '</b><span>Damage dealt</span></div><div><b>' + stat.criticals + '</b><span>Critical hits</span></div><div><b>' + stat.sessionXP + '</b><span>Reading XP</span></div><div><b>+' + stat.bossXP + '</b><span>Boss XP</span></div></div><div class="adventure-trophy-recap"><p><b>Rewards:</b> ' + stat.totalXP + ' XP · ' + stat.gold + ' gold · ' + escapeHtml(event.loot || 'Trophy') + '</p><p><b>Defeated:</b> ' + formatDate(trophyDate(event, book, stat.sessions)) + ' · Crit chance used: ' + stat.critChance.toFixed(1) + '%</p></div><div class="adventure-session-history"><b>Reading sessions</b><ul>' + sessions + '</ul></div></div></article>';
    }).join('');

    list.querySelectorAll('.adventure-trophy-toggle').forEach(function (button) {
      button.onclick = function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        var card = button.parentElement;
        var body = card.querySelector('.adventure-trophy-detail-body');
        var open = body.style.display !== 'block';
        body.style.display = open ? 'block' : 'none';
        card.classList.toggle('is-open', open);
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
      };
    });

    page.dataset.trophyDetailsRendering = '';
  }

  function install() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.dataset.trophyDetailsReady) return;
    page.dataset.trophyDetailsReady = 'true';
    new MutationObserver(function () { setTimeout(render, 0); }).observe(page, { childList:true });
    window.addEventListener('bookshelf-reading-log-changed', render);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();