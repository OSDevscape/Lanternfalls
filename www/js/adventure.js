(function () {
  var KEY = 'bookshelf-adventure-v1';
  var LOG_KEY = 'bookshelf-reading-log-v1';

  function read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || fallback);
    } catch (_) {
      return JSON.parse(fallback);
    }
  }

  function library() {
    return read('bookshelf-data', '{"books":[]}').books || [];
  }

  function totalMinutes(log) {
    return log.reduce(function (total, entry) {
      return total + Math.max(0, Math.floor(Number((entry || {}).minutes) || 0));
    }, 0);
  }

  function tooltip(text, message, label) {
    return '<span class="adventure-tooltip-label">' +
      text +
      '<button type="button" class="tooltip-trigger" data-tooltip="' +
      message +
      '" aria-label="' +
      (label || 'More information') +
      '" aria-expanded="false">ⓘ</button>' +
    '</span>';
  }

  function render() {
    var page = document.getElementById('navPlaceholder');

    if (!page || page.classList.contains('hidden')) return;
    if (!page.classList.contains('achievements-page')) return;

    var books = library();
    var log = read(LOG_KEY, '[]');

    var finished = books.filter(function (book) {
      return book.status === 'finished';
    }).length;

    var reading = books.filter(function (book) {
      return book.status === 'reading';
    })[0];

    var minutes = totalMinutes(log);

    var achievementData = window.BookShelfAchievements
      ? window.BookShelfAchievements.update()
      : null;

    var quest = achievementData && achievementData.quest;
    var questState = achievementData && achievementData.state.weeklyQuest;
    var streak = achievementData && achievementData.state.streak;

    var questHtml = quest
      ? '<section class="adventure-card adventure-weekly-quest">' +
          '<span class="adventure-label">' +
            tooltip(
              'Weekly Quest',
              'A time-limited reading goal. Complete its requirement before claiming its reward.',
              'About Weekly Quest'
            ) +
          '</span>' +
          '<h2>' + quest.title + '</h2>' +
          '<p class="adventure-muted">' + quest.detail + '</p>' +
          '<div class="adventure-quest-progress"><i style="width:' +
            Math.min(100, Math.round(questState.progress / quest.target * 100)) +
          '%"></i></div>' +
          '<p class="adventure-quest-count">' +
            questState.progress +
            ' / ' +
            quest.target +
          '</p>' +
          '<button type="button" data-claim-quest data-tooltip="Claims this completed weekly-quest reward once. The button becomes available only when the goal is complete." aria-label="About claiming the weekly quest reward" aria-expanded="false" ' +
            (questState.claimedAt || questState.progress < quest.target ? 'disabled' : '') +
          '>' +
            (questState.claimedAt
              ? 'Quest Claimed'
              : questState.progress >= quest.target
                ? 'Claim Quest Reward'
                : 'Quest in Progress') +
          '</button>' +
        '</section>'
      : '';

    page.className = 'adventure-page';

    page.innerHTML =
      '<header class="adventure-header">' +
  '<div><h1>Adventure</h1><p>Read minutes. Become legendary.</p></div>' +
'</header>' +

      '<main class="adventure-content">' +
        '<section class="adventure-card">' +
          '<span class="adventure-label">' +
            tooltip(
              'Current Reading Quest',
              'Your current Reading book becomes the active quest. Log time to build its reading history and later earn completion rewards.',
              'About Current Reading Quest'
            ) +
          '</span>' +
          '<h2>' + (reading ? reading.title : 'Choose your next book') + '</h2>' +
          '<p class="adventure-muted">' +
            (reading
              ? 'Log time to build momentum against this book’s boss.'
              : 'Mark a book as Reading to begin an adventure.') +
          '</p>' +
        '</section>' +

        '<section class="adventure-card">' +
          '<span class="adventure-label">Rewards Ready</span>' +
          '<h2>Claim your progress</h2>' +
          '<p class="adventure-muted">Claim completed reading sessions and boss rewards to add their XP and gold.</p>' +
          '<div id="adventureRewardsMount"></div>' +
        '</section>' +

        '<section class="adventure-grid">' +
          '<section class="adventure-card">' +
            '<span class="adventure-label">' +
              tooltip(
                'Reading Time',
                'Total minutes recorded across reading and listening sessions. Logging time does not award XP or gold until rewards are claimed.',
                'About Reading Time'
              ) +
            '</span>' +
            '<h2>' + minutes + '</h2>' +
            '<p class="adventure-muted">minutes recorded</p>' +
          '</section>' +

          '<section class="adventure-card">' +
            '<span class="adventure-label">' +
              tooltip(
                'Completed',
                'The number of books marked Finished in your library.',
                'About Completed Books'
              ) +
            '</span>' +
            '<h2>' + finished + '</h2>' +
            '<p class="adventure-muted">books finished</p>' +
          '</section>' +
        '</section>' +

        '<section class="adventure-grid">' +
          '<section class="adventure-card">' +
            '<span class="adventure-label">' +
              tooltip(
                'Reading Streak',
                'Your current streak is the number of consecutive days on which you log at least 10 minutes of reading or listening time.',
                'About Reading Streak'
              ) +
            '</span>' +
            '<h2>' + (streak ? streak.current : 0) + '</h2>' +
            '<p class="adventure-muted">current days</p>' +
          '</section>' +

          '<section class="adventure-card">' +
            '<span class="adventure-label">' +
              tooltip(
                'Longest Streak',
                'Your highest number of consecutive days that each met the minimum of 10 logged reading or listening minutes.',
                'About Longest Streak'
              ) +
            '</span>' +
            '<h2>' + (streak ? streak.longest : 0) + '</h2>' +
            '<p class="adventure-muted">days achieved</p>' +
          '</section>' +
        '</section>' +

        questHtml +
      '</main>';

    var claim = page.querySelector('[data-claim-quest]');

    if (claim) {
      claim.onclick = function () {
        var result = window.BookShelfAchievements.claimQuest();

        if (result.ok) {
          window.dispatchEvent(new Event('bookshelf-adventure-quest-claimed'));
          render();
        }
      };
    }
  }

  function install() {
    var nav = document.getElementById('bottomNavigation');

    if (!nav || nav.dataset.adventureReady) return;
    nav.dataset.adventureReady = 'true';

    var tab = nav.querySelector('[data-page="achievements"]');

    if (tab) {
      tab.setAttribute('aria-label', 'Open Adventure');
      tab.innerHTML = '<i>⚔</i>Adventure';
    }

    var style = document.createElement('style');

    style.textContent =
      '#navPlaceholder.adventure-page{display:flex;flex-direction:column;padding:0;overflow:hidden;background:var(--bg,#14181C)}' +
      '.adventure-header{display:flex;align-items:center;justify-content:space-between;padding:20px;border-bottom:1px solid rgba(168,130,60,.24)}' +
      '.adventure-header h1{margin:0;font:27px Georgia,serif}' +
      '.adventure-header p{margin:4px 0 0;color:var(--muted,#8A8378);font-size:12px}' + '.adventure-content{flex:1;overflow:auto;padding:16px 20px 130px}' +
      '.adventure-card{margin:0 0 13px;padding:16px;background:var(--bg-elevated,#1B2129);border:1px solid rgba(168,130,60,.28);border-radius:4px}' +
      '.adventure-card h2{margin:5px 0;font:21px Georgia,serif}' +
      '.adventure-label{color:var(--gold,#A8823C);font-size:11px;letter-spacing:.08em;text-transform:uppercase}' +
      '.adventure-tooltip-label{display:inline-flex;align-items:center}' +
      '.adventure-muted{margin:7px 0 0;color:var(--muted,#8A8378);font-size:13px;line-height:1.4}' +
      '.adventure-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}' +
      '.adventure-grid .adventure-card{min-width:0}' +
      '.adventure-grid h2{font-size:26px}' +
      '.adventure-weekly-quest button{width:100%;margin-top:10px;padding:10px;border:1px solid rgba(168,130,60,.48);border-radius:3px;background:transparent;color:var(--paper-light,#F6F1E4)}' +
      '.adventure-weekly-quest button:not(:disabled){background:var(--gold,#A8823C);border-color:var(--gold,#A8823C)}' +
      '.adventure-weekly-quest button:disabled{opacity:.5}' +
      '.adventure-quest-progress{height:7px;overflow:hidden;margin-top:13px;border-radius:7px;background:rgba(246,241,228,.13)}' +
      '.adventure-quest-progress i{display:block;height:100%;background:var(--gold,#A8823C)}' +
      '.adventure-quest-count{margin:6px 0 0;color:var(--muted,#8A8378);font-size:11px}' +
      '.hidden{display:none!important}';

    document.head.appendChild(style);

    var originalClick = nav.onclick;

    nav.onclick = function (event) {
      if (typeof originalClick === 'function') {
        originalClick.call(nav, event);
      }

      var target = event.target.closest('[data-page]');

      if (target && target.dataset.page === 'achievements') {
        render();
      }
    };

    window.addEventListener('bookshelf-navigation-changed', function (event) {
      if (event.detail && event.detail.page === 'achievements') {
        render();
      }
    });

    window.addEventListener('bookshelf-reading-log-changed', render);
    window.addEventListener('bookshelf-adventure-claim-complete', render);
    window.addEventListener('bookshelf-adventure-class-changed', render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();