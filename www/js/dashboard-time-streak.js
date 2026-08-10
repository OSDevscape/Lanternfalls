(function () {
  var LOG_KEY = 'bookshelf-reading-log-v1';

  function localDateKey(date) {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  }

  function previousDay(key) {
    var date = new Date(key + 'T12:00:00');
    date.setDate(date.getDate() - 1);
    return localDateKey(date);
  }

  function currentStreak() {
    var sessions;
    try {
      sessions = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    } catch (_) {
      sessions = [];
    }

    var minutesByDay = {};

    sessions.forEach(function (session) {
      if (!session || !session.date) return;

      /* Current Profile format: { minutes: 11, date: "YYYY-MM-DD" } */
      var minutes = Math.max(0, Number(session.minutes) || 0);
      if (!minutes) return;

      minutesByDay[session.date] = (minutesByDay[session.date] || 0) + minutes;
    });

    var count = 0;
    var day = localDateKey(new Date());

    while ((minutesByDay[day] || 0) >= 10) {
      count += 1;
      day = previousDay(day);
    }

    return count;
  }

  function updateDashboardStreak() {
    var dashboard = document.getElementById('dashboard');
    if (!dashboard) return;

    Array.prototype.forEach.call(dashboard.querySelectorAll('.dash-card'), function (card) {
      var heading = card.querySelector('h2');
      if (!heading || heading.textContent.trim() !== 'Reading Streak') return;

      var streak = currentStreak();
      var number = card.querySelector('.dash-number');
      var label = card.querySelector('.dash-muted');

      if (number) number.textContent = streak;
      if (label) label.textContent = 'day' + (streak === 1 ? '' : 's') + ' · 10 min/day';
    });
  }

  function install() {
    var dashboard = document.getElementById('dashboard');

    if (!dashboard) {
      setTimeout(install, 100);
      return;
    }

    if (dashboard.dataset.timeStreakReady) return;
    dashboard.dataset.timeStreakReady = 'true';

    new MutationObserver(function () {
      setTimeout(updateDashboardStreak, 0);
    }).observe(dashboard, { childList: true });

    window.addEventListener('bookshelf-reading-log-changed', updateDashboardStreak);
    updateDashboardStreak();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();