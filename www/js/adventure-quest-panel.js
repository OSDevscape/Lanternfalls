(function () {
  function tooltipButton(message, label) {
    return '<button type="button" class="adventure-quest-tooltip" data-tooltip="' + message + '" aria-label="' + label + '" aria-expanded="false">ⓘ</button>';
  }

  function celebrate(quest) {
    var old = document.getElementById('questRewardOverlay');
    if (old) old.remove();
    var overlay = document.createElement('section');
    overlay.id = 'questRewardOverlay';
    overlay.innerHTML = '<div class="quest-reward-card"><span class="adventure-label">Weekly Quest Claimed</span><h2>Quest Complete</h2><p>' + quest.title + '</p><div class="quest-reward-mark">★ Progress recorded</div><button type="button">Continue Adventure</button></div>';
    document.body.appendChild(overlay);
    for (var burst = 0; burst < 5; burst += 1) {
      setTimeout(function (number) { return function () {
        if (!overlay.isConnected) return;
        for (var i = 0; i < 24; i += 1) {
          var angle = Math.PI * 2 * i / 24, pixel = document.createElement('i'), distance = 38 + Math.random() * 82;
          pixel.className = 'quest-firework'; pixel.style.left = (27 + number * 12) + '%'; pixel.style.top = number % 2 ? '34%' : '46%';
          pixel.style.setProperty('--dx', Math.cos(angle) * distance + 'px'); pixel.style.setProperty('--dy', Math.sin(angle) * distance + 'px');
          overlay.appendChild(pixel); setTimeout(function (item) { return function () { item.remove(); }; }(pixel), 950);
        }
      }; }(burst), burst * 220);
    }
    overlay.querySelector('button').onclick = function () { overlay.remove(); };
  }

  function render() {
    var page = document.getElementById('navPlaceholder');
    if (!page || !page.classList.contains('adventure-page') || !window.BookShelfAchievements) return;
    var content = page.querySelector('.adventure-content');
    if (!content) return;

    Array.prototype.forEach.call(content.querySelectorAll('.adventure-quest-panel, .adventure-weekly-quest'), function (panel) { panel.remove(); });
    var data = window.BookShelfAchievements.update(), streak = data.state.streak || { current:0, longest:0 }, quest = data.quest, state = data.state.weeklyQuest || {};
    if (!quest) return;
    var complete = (Number(state.progress) || 0) >= quest.target, claimed = !!state.claimedAt;
    var panel = document.createElement('section');
    panel.className = 'adventure-card adventure-quest-panel';
    panel.innerHTML = '<div class="adventure-streak-row"><div><span class="adventure-label">Reading Streak ' + tooltipButton('A Reading Streak is the number of consecutive days on which you log at least 10 minutes of reading or listening time. The daily 10-minute minimum is required to maintain the streak.', 'About Reading Streak') + '</span><h2>' + streak.current + ' day' + (streak.current === 1 ? '' : 's') + '</h2><p class="adventure-muted">Best: ' + streak.longest + ' day' + (streak.longest === 1 ? '' : 's') + '</p></div></div><div class="adventure-quest-divider"></div><span class="adventure-label">Weekly Quest ' + tooltipButton('A time-limited reading goal. Complete the listed requirement, then claim the reward once it becomes available.', 'About Weekly Quest') + '</span><h2>' + quest.title + '</h2><p class="adventure-muted">' + quest.detail + '</p><div class="adventure-quest-bar"><i style="width:' + Math.min(100, Math.round((Number(state.progress) || 0) / quest.target * 100)) + '%"></i></div><p class="adventure-quest-count">' + state.progress + ' / ' + quest.target + '</p><button type="button" data-adventure-claim-quest ' + (claimed || !complete ? 'disabled' : '') + '>' + (claimed ? 'Quest Claimed' : complete ? 'Claim Quest Reward' : 'Quest in Progress') + '</button>';
    var readingStats = Array.prototype.filter.call(content.querySelectorAll('.adventure-grid'), function (grid) {
      var labels = Array.prototype.map.call(grid.querySelectorAll('.adventure-label'), function (label) {
        return label.textContent.trim();
      });
      return labels.indexOf('Reading Time') !== -1 && labels.indexOf('Completed') !== -1;
    })[0];

    if (readingStats) content.insertBefore(panel, readingStats);
    else content.appendChild(panel);
    panel.querySelector('[data-adventure-claim-quest]').onclick = function () {
      var result = window.BookShelfAchievements.claimQuest();
      if (!result.ok) return;
      celebrate(result.quest); window.dispatchEvent(new Event('bookshelf-adventure-quest-claimed')); render();
    };
  }

  function install() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.dataset.adventureQuestPanelReady) return;
    page.dataset.adventureQuestPanelReady = 'true';
    var style = document.createElement('style');
    style.textContent = '.adventure-quest-panel{border-color:rgba(168,130,60,.45)}.adventure-streak-row h2,.adventure-quest-panel h2{margin:5px 0;font:21px Georgia,serif}.adventure-quest-tooltip{display:inline-flex;align-items:center;justify-content:center;width:15px!important;height:15px!important;margin:0 0 0 4px!important;padding:0!important;border:1px solid currentColor!important;border-radius:50%!important;background:transparent!important;color:inherit!important;font:700 10px/1 sans-serif!important;vertical-align:middle;cursor:pointer}.adventure-quest-tooltip:focus-visible{outline:2px solid currentColor;outline-offset:2px}.adventure-quest-divider{margin:14px 0 12px;border-top:1px solid rgba(168,130,60,.22)}.adventure-quest-bar{height:8px;overflow:hidden;margin-top:13px;border-radius:8px;background:rgba(246,241,228,.13)}.adventure-quest-bar i{display:block;height:100%;background:var(--gold,#A8823C);border-radius:8px}.adventure-quest-count{margin:6px 0 0;color:var(--muted,#8A8378);font-size:11px}.adventure-quest-panel button{width:100%;margin-top:11px;padding:10px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4);font:inherit;font-weight:bold}.adventure-quest-panel button:disabled{opacity:.48;cursor:not-allowed}#questRewardOverlay{position:fixed;z-index:1300;inset:0;display:grid;place-items:center;padding:24px;overflow:hidden;background:rgba(3,5,8,.82);backdrop-filter:blur(5px)}.quest-reward-card{position:relative;z-index:2;width:min(390px,100%);padding:28px 22px;text-align:center;border:1px solid #d4a64f;border-radius:8px;background:radial-gradient(circle at 50% 0,rgba(212,166,79,.24),transparent 43%),#151a21;color:#f6f1e4;box-shadow:0 18px 60px rgba(0,0,0,.55)}.quest-reward-card h2{margin:10px 0 5px;font:27px Georgia,serif;color:#f5d58f}.quest-reward-card p{margin:0;color:#b8b0a3}.quest-reward-mark{margin:20px 0;padding:14px;border-top:1px solid rgba(212,166,79,.25);border-bottom:1px solid rgba(212,166,79,.25);color:#d4a64f;font:18px Georgia,serif}.quest-reward-card button{width:100%;padding:11px;border:1px solid #d4a64f;border-radius:3px;background:#7c3134;color:#f6f1e4;font:inherit;font-weight:bold}.quest-firework{position:absolute;z-index:3;width:7px;height:7px;background:#ffd369;box-shadow:0 0 12px #ffd369;animation:quest-firework-pop .9s steps(8,end) forwards}@keyframes quest-firework-pop{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}70%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(0)}}';
    document.head.appendChild(style);
    new MutationObserver(function () { setTimeout(render, 0); }).observe(page, { childList:true });
    window.addEventListener('bookshelf-reading-log-changed', render); window.addEventListener('bookshelf-adventure-claim-complete', render); render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();
