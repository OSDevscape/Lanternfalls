(function () {
  var GAME_KEY = 'bookshelf-adventure-progression-v1';
  var PROFILE_KEY = 'bookshelf-adventure-v1';
  var LOG_KEY = 'bookshelf-reading-log-v1';
  var STATS = ['str', 'vit', 'int', 'wis', 'dex', 'lck'];

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch (_) { return JSON.parse(fallback); }
  }

  function save(value) { localStorage.setItem(GAME_KEY, JSON.stringify(value)); }

  function state() {
    var value = read(GAME_KEY, '{}');
    value.xp = Number(value.xp) || 0;
    value.gold = Number(value.gold) || 0;
    value.processedSessions = value.processedSessions || {};
    value.stats = value.stats || {};
    STATS.forEach(function (stat) {
      value.stats[stat] = Math.max(10, Number(value.stats[stat]) || 10);
    });
    return value;
  }

  function levelFor(xp) {
    return Math.max(1, Math.floor(Math.sqrt((xp + 100) / 100)));
  }

  function totalXPForLevel(level) {
    return Math.max(0, 100 * level * level - 100);
  }

  function usedPoints(value) {
    return STATS.reduce(function (total, stat) {
      return total + value.stats[stat] - 10;
    }, 0);
  }

  function availablePoints(value) {
    return Math.max(0, (levelFor(value.xp) - 1) * 2 - usedPoints(value));
  }

  function awardSessions(value) {
    var sessions = read(LOG_KEY, '[]');
    var changed = false;

    sessions.forEach(function (session) {
      if (!session || !session.id || value.processedSessions[session.id]) return;
      var minutes = Math.max(0, Math.floor(Number(session.minutes) || 0));
      value.processedSessions[session.id] = true;
      if (!minutes) return;

      value.xp += minutes * 10;
      value.gold += Math.max(1, Math.floor(minutes / 2));
      changed = true;
    });

    if (changed) save(value);
    return value;
  }

  function render() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.classList.contains('hidden') || !page.classList.contains('adventure-page')) return;
    var content = page.querySelector('.adventure-content');
    if (!content) return;

    var old = content.querySelector('.adventure-progression-card');
    if (old) old.remove();

    var value = awardSessions(state());
    var profile = read(PROFILE_KEY, '{}');
    var level = levelFor(value.xp);
    var thisLevelXP = totalXPForLevel(level);
    var nextLevelXP = totalXPForLevel(level + 1);
    var intoLevel = value.xp - thisLevelXP;
    var needed = nextLevelXP - thisLevelXP;
    var percent = needed ? Math.min(100, Math.round(intoLevel / needed * 100)) : 0;
    var points = availablePoints(value);

    var card = document.createElement('section');
    card.className = 'adventure-card adventure-progression-card';
    card.innerHTML =
      '<span class="adventure-label">Character Progress</span>' +
      '<div class="adventure-progress-top"><div><h2>Level ' + level + '</h2><p class="adventure-muted">' + (profile.className || 'Choose a class below') + '</p></div><strong>◉ ' + value.gold + '</strong></div>' +
      '<div class="adventure-xp-bar"><i style="width:' + percent + '%"></i></div>' +
      '<p class="adventure-xp-text">' + intoLevel + ' / ' + needed + ' XP to Level ' + (level + 1) + '</p>' +
      '<div class="adventure-reward-note">10 XP per minute · 1 gold per 2 minutes</div>' +
      '<details class="adventure-stats" ' + (points ? 'open' : '') + '><summary>Stats <em>' + points + ' point' + (points === 1 ? '' : 's') + ' available</em></summary><div class="adventure-stat-grid">' +
      STATS.map(function (stat) {
        return '<div><span>' + stat.toUpperCase() + '</span><b>' + value.stats[stat] + '</b><button type="button" data-adventure-stat="' + stat + '" ' + (points ? '' : 'disabled') + '>+</button></div>';
      }).join('') +
      '</div></details>';

    content.insertBefore(card, content.firstChild);

    card.querySelectorAll('[data-adventure-stat]').forEach(function (button) {
      button.onclick = function () {
        var updated = state();
        if (!availablePoints(updated)) return;
        updated.stats[button.dataset.adventureStat] += 1;
        save(updated);
        render();
      };
    });
  }

  function install() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.dataset.adventureProgressionReady) return;
    page.dataset.adventureProgressionReady = 'true';

    var style = document.createElement('style');
    style.textContent = '.adventure-progression-card{border-color:rgba(168,130,60,.52)}.adventure-progress-top{display:flex;justify-content:space-between;align-items:start;gap:12px}.adventure-progress-top h2{margin-bottom:2px}.adventure-progress-top>strong{color:var(--gold,#A8823C);font:19px Georgia,serif;white-space:nowrap}.adventure-xp-bar{height:8px;margin-top:12px;overflow:hidden;border-radius:8px;background:rgba(246,241,228,.13)}.adventure-xp-bar i{display:block;height:100%;background:var(--gold,#A8823C);border-radius:8px}.adventure-xp-text{margin:6px 0 0;color:var(--muted,#8A8378);font-size:11px}.adventure-reward-note{margin-top:10px;padding-top:10px;border-top:1px solid rgba(168,130,60,.18);color:var(--gold,#A8823C);font-size:11px}.adventure-stats{margin-top:13px;padding-top:12px;border-top:1px solid rgba(168,130,60,.18)}.adventure-stats summary{display:flex;justify-content:space-between;cursor:pointer;font:15px Georgia,serif}.adventure-stats summary em{color:var(--muted,#8A8378);font:11px var(--font-body,-apple-system);font-style:normal}.adventure-stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}.adventure-stat-grid>div{padding:9px;text-align:center;background:rgba(0,0,0,.14);border-radius:3px}.adventure-stat-grid span,.adventure-stat-grid b{display:block}.adventure-stat-grid span{color:var(--gold,#A8823C);font-size:11px}.adventure-stat-grid b{margin:3px 0;font-size:18px}.adventure-stat-grid button{border:1px solid var(--gold,#A8823C);border-radius:50%;background:transparent;color:var(--paper-light,#F6F1E4);width:25px;height:25px}.adventure-stat-grid button:disabled{opacity:.35}';
    document.head.appendChild(style);

    new MutationObserver(function () {
      setTimeout(render, 0);
    }).observe(page, { childList: true });

    window.addEventListener('bookshelf-reading-log-changed', render);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();