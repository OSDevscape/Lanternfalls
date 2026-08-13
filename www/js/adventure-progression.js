(function () {
  var GAME_KEY = 'bookshelf-adventure-progression-v1';
  var PROFILE_KEY = 'bookshelf-adventure-v1';
  var LOG_KEY = 'bookshelf-reading-log-v1';
  var STATS = ['str', 'vit', 'int', 'wis', 'dex', 'lck'];

  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || fallback); } catch (_) { return JSON.parse(fallback); } }
  function save(value) { localStorage.setItem(GAME_KEY, JSON.stringify(value)); }
  function state() {
    var value = read(GAME_KEY, '{}');
    value.xp = Math.max(0, Number(value.xp) || 0); value.gold = Math.max(0, Number(value.gold) || 0);
    value.processedSessions = value.processedSessions || {}; value.stats = value.stats || {};
    STATS.forEach(function (stat) { value.stats[stat] = Math.max(10, Number(value.stats[stat]) || 10); });
    return value;
  }
  function levelFor(xp) { return Math.max(1, Math.floor(Math.sqrt((xp + 100) / 100))); }
  function totalXPForLevel(level) { return Math.max(0, 100 * level * level - 100); }
  function usedPoints(value) { return STATS.reduce(function (total, stat) { return total + value.stats[stat] - 10; }, 0); }
  function availablePoints(value) { return Math.max(0, (levelFor(value.xp) - 1) * 2 - usedPoints(value)); }
  function pendingSessions() {
    var engine = window.BookShelfRewards, result = { items: [], minutes: 0, xp: 0, gold: 0 };
    if (!engine) return result;
    read(LOG_KEY, '[]').forEach(function (session) {
      if (!session || !session.id || engine.has('session:' + session.id)) return;
      var reward = engine.calculateSession(session); if (!reward.minutes) return;
      result.items.push({ session: session, reward: reward }); result.minutes += reward.minutes; result.xp += reward.xp; result.gold += reward.gold;
    });
    return result;
  }
  function pendingBosses() {
    var engine = window.BookShelfRewards, result = { books: [], gold: 0 };
    if (!engine) return result;
    engine.pendingCompletions().forEach(function (book) {
      var reward = engine.calculateCompletion(book); result.books.push({ book: book, reward: reward }); result.gold += reward.gold;
    });
    return result;
  }
  function claimAll() {
    var engine = window.BookShelfRewards;
    if (!engine) return { sessions: 0, bosses: 0, xp: 0, gold: 0 };
    var sessions = pendingSessions(), bosses = pendingBosses(), result = { sessions: 0, bosses: 0, xp: 0, gold: 0 };
    sessions.items.forEach(function (item) {
      var claim = engine.claimSession(item.session);
      if (claim.ok) { result.sessions += 1; result.xp += claim.transaction.xp; result.gold += claim.transaction.gold; }
    });
    bosses.books.forEach(function (item) {
      var claim = engine.claimCompletion(item.book);
      if (claim.ok) { result.bosses += 1; result.gold += claim.transaction.gold; }
    });
    return result;
  }
  function fireworks() {
    var effect = document.createElement('div'); effect.className = 'pixel-fireworks'; document.body.appendChild(effect);
    var colors = ['#ffd369', '#ff7a18', '#ff4d6d', '#9c6bff', '#25c8ff', '#a9e34b'];
    for (var i = 0; i < 38; i += 1) {
      var angle = Math.PI * 2 * i / 38, distance = 55 + Math.random() * 135, pixel = document.createElement('i');
      pixel.className = 'pixel-firework'; pixel.style.left = '50%'; pixel.style.top = '33%'; pixel.style.setProperty('--dx', Math.cos(angle) * distance + 'px'); pixel.style.setProperty('--dy', Math.sin(angle) * distance + 'px'); pixel.style.setProperty('--firework-color', colors[i % colors.length]); effect.appendChild(pixel);
    }
    setTimeout(function () { effect.remove(); }, 1000);
  }
  function render() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.classList.contains('hidden') || !page.classList.contains('adventure-page') || page.dataset.progressRendering) return;
    var content = page.querySelector('.adventure-content'); if (!content || !window.BookShelfRewards) return;
    page.dataset.progressRendering = 'true';
    var old = content.querySelector('.adventure-progression-card'); if (old) old.remove();
    var value = state(), profile = read(PROFILE_KEY, '{}'), sessions = pendingSessions(), bosses = pendingBosses();
    var level = levelFor(value.xp), thisLevelXP = totalXPForLevel(level), nextLevelXP = totalXPForLevel(level + 1), intoLevel = value.xp - thisLevelXP, needed = nextLevelXP - thisLevelXP;
    var percent = needed ? Math.min(100, Math.round(intoLevel / needed * 100)) : 0, points = availablePoints(value);
    var totalXp = sessions.xp, totalGold = sessions.gold + bosses.gold, pendingCount = sessions.items.length + bosses.books.length;
    var detail = pendingCount ? sessions.items.length + ' reading session' + (sessions.items.length === 1 ? '' : 's') + (bosses.books.length ? ' · ' + bosses.books.length + ' boss defeat' + (bosses.books.length === 1 ? '' : 's') : '') + ' ready to claim' : 'All logged rewards are claimed.';
    var bossHtml = bosses.books.length ? '<div class="adventure-boss-rewards"><span class="adventure-label">Boss Defeat Ready</span>' + bosses.books.map(function (item) { return '<p><b>' + item.reward.bookTitle + '</b><span>+' + item.reward.gold + ' gold · Trophy · Loot drop</span></p>'; }).join('') + '</div>' : '';
    var card = document.createElement('section'); card.className = 'adventure-card adventure-progression-card';
    card.innerHTML = '<span class="adventure-label">Character Progress</span><div class="adventure-progress-top"><div><h2>Level ' + level + '</h2><p class="adventure-muted">' + (profile.className || 'Choose a class below') + '</p></div><strong>◉ ' + value.gold + '</strong></div><div class="adventure-xp-bar"><i style="width:' + percent + '%"></i></div><p class="adventure-xp-text">' + intoLevel + ' / ' + needed + ' XP to Level ' + (level + 1) + '</p>' + bossHtml + '<div class="adventure-reward-box"><p>' + detail + '</p><button id="claimRewards" type="button" ' + (pendingCount ? '' : 'disabled') + '>' + (pendingCount ? 'Claim ' + totalXp + ' XP · ' + totalGold + ' Gold' : 'No Rewards Ready') + '</button></div><details class="adventure-stats" ' + (points ? 'open' : '') + '><summary>Stats <em>' + points + ' point' + (points === 1 ? '' : 's') + ' available</em></summary><div class="adventure-stat-grid">' + STATS.map(function (stat) { return '<div><span>' + stat.toUpperCase() + '</span><b>' + value.stats[stat] + '</b><button type="button" data-adventure-stat="' + stat + '" ' + (points ? '' : 'disabled') + '>+</button></div>'; }).join('') + '</div></details>';
    content.insertBefore(card, content.firstChild);
    card.querySelectorAll('[data-adventure-stat]').forEach(function (button) { button.onclick = function () { var updated = state(); if (!availablePoints(updated)) return; updated.stats[button.dataset.adventureStat] += 1; save(updated); render(); }; });
    card.querySelector('#claimRewards').onclick = function () {
      var result = claimAll(); if (!result.sessions && !result.bosses) return;
      fireworks();
      window.dispatchEvent(new Event('bookshelf-adventure-claim-complete'));
      render();
    };
    page.dataset.progressRendering = '';
  }
  function install() {
    var page = document.getElementById('navPlaceholder'); if (!page || page.dataset.adventureProgressionReady) return;
    page.dataset.adventureProgressionReady = 'true';
    var style = document.createElement('style');
    style.textContent = '.adventure-progression-card{border-color:rgba(168,130,60,.52)}.adventure-progress-top{display:flex;justify-content:space-between;align-items:start;gap:12px}.adventure-progress-top h2{margin-bottom:2px}.adventure-progress-top>strong{color:var(--gold,#A8823C);font:19px Georgia,serif;white-space:nowrap}.adventure-xp-bar{height:8px;margin-top:12px;overflow:hidden;border-radius:8px;background:rgba(246,241,228,.13)}.adventure-xp-bar i{display:block;height:100%;background:var(--gold,#A8823C);border-radius:8px}.adventure-xp-text{margin:6px 0 0;color:var(--muted,#8A8378);font-size:11px}.adventure-boss-rewards{margin-top:13px;padding:11px;border-left:3px solid var(--gold,#A8823C);background:rgba(0,0,0,.14)}.adventure-boss-rewards p{display:flex;justify-content:space-between;gap:10px;margin:8px 0 0;font-size:12px}.adventure-boss-rewards p b,.adventure-boss-rewards p span{display:block}.adventure-boss-rewards p span{color:var(--muted,#8A8378);text-align:right}.adventure-reward-box{margin-top:10px;padding-top:10px;border-top:1px solid rgba(168,130,60,.18)}.adventure-reward-box p{margin:0 0 8px;color:var(--muted,#8A8378);font-size:11px}.adventure-reward-box button{width:100%;padding:10px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4);font:inherit;font-weight:bold;cursor:pointer}.adventure-reward-box button:disabled{opacity:.45;cursor:not-allowed}.adventure-stats{margin-top:13px;padding-top:12px;border-top:1px solid rgba(168,130,60,.18)}.adventure-stats summary{display:flex;justify-content:space-between;cursor:pointer;font:15px Georgia,serif}.adventure-stats summary em{color:var(--muted,#8A8378);font:11px var(--font-body,-apple-system);font-style:normal}.adventure-stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}.adventure-stat-grid>div{padding:9px;text-align:center;background:rgba(0,0,0,.14);border-radius:3px}.adventure-stat-grid span,.adventure-stat-grid b{display:block}.adventure-stat-grid span{color:var(--gold,#A8823C);font-size:11px}.adventure-stat-grid b{margin:3px 0;font-size:18px}.adventure-stat-grid button{border:1px solid var(--gold,#A8823C);border-radius:50%;background:transparent;color:var(--paper-light,#F6F1E4);width:25px;height:25px}.adventure-stat-grid button:disabled{opacity:.35}.pixel-fireworks{position:fixed;z-index:500;inset:0;pointer-events:none;overflow:hidden}.pixel-firework{position:absolute;width:8px;height:8px;background:var(--firework-color);box-shadow:0 0 12px var(--firework-color);animation:pixel-firework-pop .85s steps(8,end) forwards}@keyframes pixel-firework-pop{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}70%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(0)}}';
    document.head.appendChild(style);
    new MutationObserver(function () { setTimeout(render, 0); }).observe(page, { childList:true });
    window.addEventListener('bookshelf-reading-log-changed', render);
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();