(function () {
  var LOG_KEY = 'bookshelf-reading-log-v1';

  function readLog() {
    try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); }
    catch (_) { return []; }
  }

  function dateKey(value) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return String(value);
    var date = new Date(value || 0);
    if (isNaN(date.getTime())) return '';
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function findCard(dashboard, title) {
    return Array.prototype.filter.call(dashboard.querySelectorAll('.dash-card'), function (card) {
      var heading = card.querySelector('h2');
      return heading && heading.textContent.trim() === title;
    })[0] || null;
  }

  function update() {
    var dashboard = document.getElementById('dashboard');
    if (!dashboard) return;

    var calendar = findCard(dashboard, 'Book Calendar');
    if (calendar) calendar.remove();

    var log = readLog();
    var totalMinutes = 0;
    var sessionCount = 0;
    var byMonth = {};
    var newestDay = '';

    log.forEach(function (session) {
      var minutes = Math.max(0, Number((session || {}).minutes) || 0);
      var day = dateKey(session && (session.date || session.createdAt || session.endedAt));
      if (!minutes) return;
      totalMinutes += minutes;
      sessionCount += 1;
      if (day) {
        byMonth[day.slice(0, 7)] = (byMonth[day.slice(0, 7)] || 0) + minutes;
        if (day > newestDay) newestDay = day;
      }
    });

    var annual = findCard(dashboard, 'Annual Statistics');
    if (annual) {
      var bars = annual.querySelector('.dash-bar');
      if (bars) {
        var now = new Date();
        var values = [];
        for (var offset = 5; offset >= 0; offset -= 1) {
          var month = new Date(now.getFullYear(), now.getMonth() - offset, 1);
          var key = month.getFullYear() + '-' + String(month.getMonth() + 1).padStart(2, '0');
          values.push(byMonth[key] || 0);
        }
        var max = Math.max.apply(null, values.concat([1]));
        bars.innerHTML = values.map(function (minutes) {
          return '<i style="height:' + (minutes ? Math.max(8, Math.round(minutes / max * 100)) : 2) + '%"></i>';
        }).join('');
      }
    }

    var rewind = findCard(dashboard, 'Rewind');
    if (rewind) {
      var text = rewind.querySelector('.dash-muted');
      if (text) text.textContent = sessionCount ? sessionCount + ' logged session' + (sessionCount === 1 ? '' : 's') + ' · ' + totalMinutes + ' total minutes' + (newestDay ? ' · last read ' + newestDay : '') : 'Log your first reading session to begin your rewind.';
    }
  }

  function install() {
    var dashboard = document.getElementById('dashboard');
    if (!dashboard || dashboard.dataset.realStatsReady) return;
    dashboard.dataset.realStatsReady = 'true';
    new MutationObserver(function () { setTimeout(update, 0); }).observe(dashboard, { childList:true });
    window.addEventListener('bookshelf-reading-log-changed', update);
    update();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();