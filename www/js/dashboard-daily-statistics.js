(function () {
  var LOG_KEY = 'bookshelf-reading-log-v1';

  function today() {
    var date = new Date();
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  }

  function minutesToday() {
    var sessions;
    try {
      sessions = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    } catch (_) {
      sessions = [];
    }

    var currentDate = today();
    return sessions.reduce(function (total, session) {
      if (!session || session.date !== currentDate) return total;
      return total + Math.max(0, Number(session.minutes) || 0);
    }, 0);
  }

  function updateDailyStatistics() {
    var dashboard = document.getElementById('dashboard');
    if (!dashboard) return;

    Array.prototype.forEach.call(dashboard.querySelectorAll('.dash-card'), function (card) {
      var heading = card.querySelector('h2');
      if (!heading || heading.textContent.trim() !== 'Daily Statistics') return;

      var number = card.querySelector('.dash-number');
      var label = card.querySelector('.dash-muted');
      var minutes = minutesToday();

      if (number) number.textContent = minutes;
      if (label) label.textContent = 'minutes logged today';
    });
  }

  function install() {
    var dashboard = document.getElementById('dashboard');
    if (!dashboard) {
      setTimeout(install, 100);
      return;
    }

    if (dashboard.dataset.dailyStatisticsReady) return;
    dashboard.dataset.dailyStatisticsReady = 'true';

    new MutationObserver(function () {
      setTimeout(updateDailyStatistics, 0);
    }).observe(dashboard, { childList: true });

    window.addEventListener('bookshelf-reading-log-changed', updateDailyStatistics);
    updateDailyStatistics();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();