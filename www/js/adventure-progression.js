(function () {
  var GAME_KEY = 'bookshelf-adventure-progression-v1';
  var LOG_KEY = 'bookshelf-reading-log-v1';
  var STATS = ['str', 'vit', 'int', 'wis', 'dex', 'lck'];
  var STAT_TOOLTIPS = {
    str: 'Strength supports combat power.',
    vit: 'Vitality represents endurance.',
    int: 'Intelligence represents analytical ability.',
    wis: 'Wisdom represents insight and reflection.',
    dex: 'Dexterity supports speed and precision.',
    lck: 'Luck influences critical-hit chance.'
  };

  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || fallback); } catch (_) { return JSON.parse(fallback); } }
  function save(value) { localStorage.setItem(GAME_KEY, JSON.stringify(value)); }
  function state() {
    var value = read(GAME_KEY, '{}');
    value.xp = Math.max(0, Number(value.xp) || 0);
    value.gold = Math.max(0, Number(value.gold) || 0);
    value.processedSessions = value.processedSessions || {};
    value.stats = value.stats || {};
    STATS.forEach(function (stat) { value.stats[stat] = Math.max(10, Number(value.stats[stat]) || 10); });
    return value;
  }
  function levelFor(xp) { return Math.max(1, Math.floor(Math.sqrt((xp + 100) / 100))); }
  function totalXPForLevel(level) { return Math.max(0, 100 * level * level - 100); }
  function usedPoints(value) { return STATS.reduce(function (total, stat) { return total + value.stats[stat] - 10; }, 0); }
  function availablePoints(value) { return Math.max(0, (levelFor(value.xp) - 1) * 2 - usedPoints(value)); }
  function characterCard(content) {
    return Array.prototype.filter.call(content.querySelectorAll('.adventure-card'), function (card) {
      return ((card.querySelector('.adventure-label') || {}).textContent || '').trim().indexOf('Character') === 0;
    })[0] || null;
  }
  function tooltipButton(message, label) {
    return '<button type="button" class="adventure-progress-tooltip" data-tooltip="' + message + '" aria-label="' + label + '" aria-expanded="false">ⓘ</button>';
  }

  function pendingSessions() {
    var engine = window.BookShelfRewards, result = { items: [], minutes: 0, xp: 0, gold: 0 };
    if (!engine) return result;
    read(LOG_KEY, '[]').forEach(function (session) {
      if (!session || !session.id || engine.has('session:' + session.id)) return;
      var reward = engine.calculateSession(session);
      if (!reward.minutes) return;
      result.items.push({ session: session, reward: reward });
      result.minutes += reward.minutes; result.xp += reward.xp; result.gold += reward.gold;
    });
    return result;
  }
  function pendingBosses() {
    var engine = window.BookShelfRewards, result = { books: [], xp: 0, gold: 0 };
    if (!engine) return result;
    engine.pendingCompletions().forEach(function (book) {
      var reward = engine.calculateCompletion(book);
      result.books.push({ book: book, reward: reward });
      result.xp += reward.xp; result.gold += reward.gold;
    });
    return result;
  }
  function rememberSkillBonus(result, transaction) {
    if (!transaction || transaction.perkState !== 'triggered') return;
    result.skillBonuses.push({ reason: transaction.classBonusReason || 'Class skill triggered', xp: Number(transaction.xpBonus) || 0, gold: Number(transaction.goldBonus) || 0 });
  }
  function claimAll() {
    var engine = window.BookShelfRewards, result = { sessions: 0, bosses: 0, xp: 0, gold: 0, skillBonuses: [] };
    if (!engine) return result;
    pendingSessions().items.forEach(function (item) {
      var claim = engine.claimSession(item.session);
      if (!claim.ok) return;
      result.sessions += 1; result.xp += claim.transaction.xp; result.gold += claim.transaction.gold;
      rememberSkillBonus(result, claim.transaction);
    });
    pendingBosses().books.forEach(function (item) {
      var claim = engine.claimCompletion(item.book);
      if (!claim.ok) return;
      result.bosses += 1; result.xp += claim.transaction.xp; result.gold += claim.transaction.gold;
      rememberSkillBonus(result, claim.transaction);
    });
    return result;
  }
  function fireworks() {
    var effect = document.createElement('div'), colors = ['#ffd369', '#ff7a18', '#ff4d6d', '#9c6bff', '#25c8ff', '#a9e34b'];
    effect.className = 'pixel-fireworks'; document.body.appendChild(effect);
    for (var i = 0; i < 38; i += 1) {
      var angle = Math.PI * 2 * i / 38, distance = 55 + Math.random() * 135, pixel = document.createElement('i');
      pixel.className = 'pixel-firework'; pixel.style.left = '50%'; pixel.style.top = '33%';
      pixel.style.setProperty('--dx', Math.cos(angle) * distance + 'px'); pixel.style.setProperty('--dy', Math.sin(angle) * distance + 'px'); pixel.style.setProperty('--firework-color', colors[i % colors.length]); effect.appendChild(pixel);
    }
    setTimeout(function () { effect.remove(); }, 1000);
  }
  function rewardPopup(result) {
    var old = document.querySelector('.adventure-reward-popup');
    if (old) old.remove();
    var bonusHtml = result.skillBonuses.length ? '<div class="adventure-popup-skill"><span class="adventure-label">Class Skill Triggered</span>' + result.skillBonuses.map(function (bonus) {
      var reward = (bonus.xp ? '+' + bonus.xp + ' XP' : '') + (bonus.gold ? (bonus.xp ? ' · ' : '') + '+' + bonus.gold + ' gold' : '');
      return '<p><b>' + bonus.reason + '</b><span>' + reward + '</span></p>';
    }).join('') + '</div>' : '';
    var popup = document.createElement('div');
    popup.className = 'adventure-reward-popup';
    popup.innerHTML = '<div class="adventure-popup-card" role="dialog" aria-modal="true" aria-label="Rewards claimed"><button class="adventure-popup-close" type="button" aria-label="Close">×</button><span class="adventure-label">Rewards Claimed</span><h2>+' + result.xp + ' XP · +' + result.gold + ' Gold</h2>' + bonusHtml + '<button class="adventure-popup-done" type="button">Continue</button></div>';
    document.body.appendChild(popup);
    function close() { popup.remove(); }
    popup.querySelector('.adventure-popup-close').onclick = close;
    popup.querySelector('.adventure-popup-done').onclick = close;
    popup.onclick = function (event) { if (event.target === popup) close(); };
  }

  function render() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.classList.contains('hidden') || !page.classList.contains('adventure-page') || page.dataset.progressRendering) return;
    var content = page.querySelector('.adventure-content');
    if (!content || !window.BookShelfRewards) return;
    var card = characterCard(content);
    if (!card) return;
    page.dataset.progressRendering = 'true';
    Array.prototype.forEach.call(card.querySelectorAll('.adventure-progression-card, .adventure-gold-total'), function (old) { old.remove(); });

    var value = state(), sessions = pendingSessions(), bosses = pendingBosses();
    var level = levelFor(value.xp), thisLevelXP = totalXPForLevel(level), nextLevelXP = totalXPForLevel(level + 1);
    var intoLevel = value.xp - thisLevelXP, needed = nextLevelXP - thisLevelXP;
    var percent = needed ? Math.min(100, Math.round(intoLevel / needed * 100)) : 0;
    var points = availablePoints(value), totalXp = sessions.xp + bosses.xp, totalGold = sessions.gold + bosses.gold;
    var pendingCount = sessions.items.length + bosses.books.length;
    var detail = pendingCount ? sessions.items.length + ' reading session' + (sessions.items.length === 1 ? '' : 's') + (bosses.books.length ? ' · ' + bosses.books.length + ' boss defeat' + (bosses.books.length === 1 ? '' : 's') : '') + ' ready to claim' : 'All logged rewards are claimed.';
    var bossHtml = bosses.books.length ? '<div class="adventure-boss-rewards"><span class="adventure-label">Boss Defeat Ready ' + tooltipButton('A Finished book with a completion reward that has not yet been claimed. Claiming records its XP, gold, trophy, and loot reward.', 'About Boss Defeat Ready') + '</span>' + bosses.books.map(function (item) { return '<p><b>' + item.reward.bookTitle + '</b><span>+' + item.reward.xp + ' XP · +' + item.reward.gold + ' gold · Trophy · Loot drop</span></p>'; }).join('') + '</div>' : '';

    var gold = document.createElement('div');
    gold.className = 'adventure-gold-total';
    gold.innerHTML = '<button type="button" data-tooltip="Gold is Adventure currency earned from eligible reading sessions and completion rewards after you claim them." aria-label="About gold" aria-expanded="false">◉ ' + value.gold + '</button>';
    var progress = document.createElement('div');
    progress.className = 'adventure-progression-card';
    progress.innerHTML = '<div class="adventure-xp-bar" data-tooltip="XP is earned by claiming eligible reading and completion rewards. The bar shows progress toward your next Adventure level." aria-label="About XP progress" aria-expanded="false" role="button" tabindex="0"><i style="width:' + percent + '%"></i></div><p class="adventure-xp-text">' + intoLevel + ' / ' + needed + ' XP to Level ' + (level + 1) + ' ' + tooltipButton('This is your claimed XP progress within the current level. New levels grant 2 stat points.', 'About level progress') + '</p>' + bossHtml + '<div class="adventure-reward-box"><p data-tooltip="Pending rewards come from logged reading sessions and Finished books. Rewards are added to XP and gold only after you claim them." tabindex="0">' + detail + '</p><button id="claimRewards" type="button" data-tooltip="Claims all pending session and completion rewards once, then records their XP and gold in the Adventure ledger." aria-label="About claiming rewards" aria-expanded="false" ' + (pendingCount ? '' : 'disabled') + '>' + (pendingCount ? 'Claim ' + totalXp + ' XP · ' + totalGold + ' Gold' : 'No Rewards Ready') + '</button></div><details class="adventure-stats" ' + (points ? 'open' : '') + '><summary>Stats <em>' + points + ' point' + (points === 1 ? '' : 's') + ' available</em></summary><p class="adventure-stat-help">Spend available points to raise a stat. Each new level grants 2 points.</p><div class="adventure-stat-grid">' + STATS.map(function (stat) { return '<div><span>' + stat.toUpperCase() + ' ' + tooltipButton(STAT_TOOLTIPS[stat], 'About ' + stat.toUpperCase()) + '</span><b>' + value.stats[stat] + '</b><button type="button" data-adventure-stat="' + stat + '" data-tooltip="Spend 1 available stat point on ' + stat.toUpperCase() + '. ' + STAT_TOOLTIPS[stat] + '" aria-label="Increase ' + stat.toUpperCase() + '" aria-expanded="false" ' + (points ? '' : 'disabled') + '>+</button></div>'; }).join('') + '</div></details>';
    var characterHeading = card.querySelector('h2');
    if (characterHeading) {
      characterHeading.insertAdjacentElement('afterend', gold);
    } else {
      card.appendChild(gold);
    }
    card.appendChild(progress);

    progress.querySelectorAll('[data-adventure-stat]').forEach(function (button) {
      button.onclick = function () { var updated = state(); if (!availablePoints(updated)) return; updated.stats[button.dataset.adventureStat] += 1; save(updated); render(); };
    });
    progress.querySelector('#claimRewards').onclick = function () {
      var result = claimAll();
      if (!result.sessions && !result.bosses) return;
      fireworks(); window.dispatchEvent(new Event('bookshelf-adventure-claim-complete')); render();
    };
    page.dataset.progressRendering = '';
  }

  function install() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.dataset.adventureProgressionReady) return;
    page.dataset.adventureProgressionReady = 'true';
    var style = document.createElement('style');
    style.textContent = '.adventure-gold-total{float:right;margin-top:-28px;padding-bottom:13px}.adventure-gold-total button{padding:0;border:0;background:transparent;color:var(--gold,#A8823C);font:19px Georgia,serif;white-space:nowrap;cursor:pointer}.adventure-gold-total button:focus-visible,.adventure-progress-tooltip:focus-visible,.adventure-xp-bar:focus-visible{outline:2px solid var(--gold,#A8823C);outline-offset:2px}.adventure-progression-card{margin-top:0;padding-top:13px;border-top:1px solid rgba(168,130,60,.25)}.adventure-xp-bar{height:8px;margin-top:0;overflow:hidden;border-radius:8px;background:rgba(246,241,228,.13);cursor:pointer}.adventure-xp-bar i{display:block;height:100%;background:var(--gold,#A8823C);border-radius:8px}.adventure-xp-text{margin:6px 0 0;color:var(--muted,#8A8378);font-size:11px}.adventure-progress-tooltip{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;margin-left:4px;padding:0;border:1px solid currentColor;border-radius:50%;background:transparent;color:inherit;font:700 10px/1 sans-serif;vertical-align:middle;cursor:pointer}.adventure-boss-rewards{margin-top:13px;padding:11px;border-left:3px solid var(--gold,#A8823C);background:rgba(0,0,0,.14)}.adventure-boss-rewards p{display:flex;justify-content:space-between;gap:10px;margin:8px 0 0;font-size:12px}.adventure-boss-rewards p b,.adventure-boss-rewards p span{display:block}.adventure-boss-rewards p span{color:var(--muted,#8A8378);text-align:right}.adventure-reward-box{margin-top:10px;padding-top:10px;border-top:1px solid rgba(168,130,60,.18)}.adventure-reward-box p{margin:0 0 8px;color:var(--muted,#8A8378);font-size:11px;cursor:help}.adventure-reward-box button{width:100%;padding:10px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4);font:inherit;font-weight:bold;cursor:pointer}.adventure-reward-box button:disabled{opacity:.45;cursor:not-allowed}.adventure-stats{margin-top:13px;padding-top:12px;border-top:1px solid rgba(168,130,60,.18)}.adventure-stats summary{display:flex;justify-content:space-between;cursor:pointer;font:15px Georgia,serif}.adventure-stats summary em{color:var(--muted,#8A8378);font:11px var(--font-body,-apple-system);font-style:normal}.adventure-stat-help{margin:8px 0 0;color:var(--muted,#8A8378);font-size:11px;line-height:1.4}.adventure-stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}.adventure-stat-grid>div{padding:9px;text-align:center;background:rgba(0,0,0,.14);border-radius:3px}.adventure-stat-grid span,.adventure-stat-grid b{display:block}.adventure-stat-grid span{color:var(--gold,#A8823C);font-size:11px}.adventure-stat-grid b{margin:3px 0;font-size:18px}.adventure-stat-grid button{border:1px solid var(--gold,#A8823C);border-radius:50%;background:transparent;color:var(--paper-light,#F6F1E4);width:25px;height:25px}.adventure-stat-grid button:disabled{opacity:.35}.pixel-fireworks{position:fixed;z-index:500;inset:0;pointer-events:none;overflow:hidden}.pixel-firework{position:absolute;width:8px;height:8px;background:var(--firework-color);box-shadow:0 0 12px var(--firework-color);animation:pixel-firework-pop .85s steps(8,end) forwards}@keyframes pixel-firework-pop{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}70%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(0)}}.adventure-reward-popup{position:fixed;z-index:600;inset:0;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.62)}.adventure-popup-card{position:relative;width:min(100%,390px);padding:22px;border:1px solid var(--gold,#A8823C);border-radius:4px;background:var(--paper,#24211d);box-shadow:0 18px 52px rgba(0,0,0,.5)}.adventure-popup-card h2{margin:7px 28px 16px 0;color:var(--paper-light,#F6F1E4);font:21px Georgia,serif}.adventure-popup-close{position:absolute;top:10px;right:11px;border:0;background:transparent;color:var(--muted,#8A8378);font-size:23px;cursor:pointer}.adventure-popup-skill{margin:14px 0;padding:11px;border-left:3px solid var(--accent,#4A90E2);background:rgba(0,0,0,.15)}.adventure-popup-skill p{display:flex;justify-content:space-between;gap:10px;margin:8px 0 0;font-size:12px}.adventure-popup-skill p b{font-weight:normal}.adventure-popup-skill p span{color:var(--accent,#4A90E2);white-space:nowrap}.adventure-popup-done{width:100%;padding:9px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:transparent;color:var(--paper-light,#F6F1E4);font:inherit;font-weight:bold;cursor:pointer}';
    document.head.appendChild(style);
    new MutationObserver(function () { setTimeout(render, 0); }).observe(page, { childList:true });
    window.addEventListener('bookshelf-reading-log-changed', render);
    window.addEventListener('bookshelf-adventure-completion-claimed', render);
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();