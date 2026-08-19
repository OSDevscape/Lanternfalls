(function () {
  var claimed = [];

  function escape(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (c) {
      return { '&': '&amp;', '<': '&gt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c];
    });
  }

  function battleHtml(item) {
    var log = item && item.battleLog;
    var encounters = log && Array.isArray(log.encounters)
      ? log.encounters
      : [];

    if (!encounters.length) return '';

    return (
      '<details class="session-reward-battle">' +
      '<summary class="session-reward-battle-summary">' +
      '<span class="session-reward-battle-label">Battle Log</span>' +
      '<b>' + encounters.length + ' encounter' +
      (encounters.length === 1 ? '' : 's') +
      '</b>' +
      '<small>' + (Number(log.minutes) || 0) + ' minutes</small>' +
      '</summary>' +

      '<div class="session-reward-encounters">' +
      encounters.map(function (encounter) {
        var number = Number(encounter.index) || 1;
        var duration = Number(encounter.duration) || 0;
        var damage = Number(encounter.damage) || 0;

        return (
          '<details class="session-reward-encounter' +
          (encounter.critical ? ' is-critical' : '') + '">' +

          '<summary class="session-reward-encounter-summary">' +
          '<span class="session-reward-encounter-number">' +
          'Encounter ' + number +
          '</span>' +
          '<b>' + escape(encounter.enemyName || 'Unknown foe') + '</b>' +
          '<small>' +
          duration + ' min · ' + damage + ' DMG' +
          (encounter.critical ? ' · Critical' : '') +
          '</small>' +
          '</summary>' +

          '<div class="session-reward-encounter-detail">' +
          '<span>' +
          escape(encounter.region || 'The Reading Realm') +
          '</span>' +
          '<p>' + escape(encounter.message || '') + '</p>' +
          '<small>Relic: ' +
          escape(encounter.relic || 'None') +
          '</small>' +
          '</div>' +

          '</details>'
        );
      }).join('') +
      '</div>' +
      '</details>'
    );
  }

  function fireworkBurst(overlay, number) {
    var colors = ['#ffd369', '#ff7a18', '#ff4d6d', '#9c6bff', '#25c8ff', '#a9e34b'];
    var centerX = 28 + (number * 19) % 45;
    var centerY = number % 2 ? 31 : 43;
    for (var i = 0; i < 26; i += 1) {
      var angle = Math.PI * 2 * i / 26;
      var distance = 36 + Math.random() * 82;
      var pixel = document.createElement('i');
      pixel.className = 'session-reward-firework';
      pixel.style.left = centerX + '%';
      pixel.style.top = centerY + '%';
      pixel.style.setProperty('--dx', Math.cos(angle) * distance + 'px');
      pixel.style.setProperty('--dy', Math.sin(angle) * distance + 'px');
      pixel.style.setProperty('--firework-color', colors[(i + number) % colors.length]);
      overlay.appendChild(pixel);
      setTimeout(function (item) { return function () { item.remove(); }; }(pixel), 950);
    }
  }

  function fireworks(overlay) {
    for (var burst = 0; burst < 5; burst += 1) {
      setTimeout(function (number) {
        return function () { if (overlay.isConnected) fireworkBurst(overlay, number); };
      }(burst), burst * 220);
    }
  }

  function show(items) {
    if (!items.length) return;
    var old = document.getElementById('sessionRewardOverlay');
    if (old) old.remove();

    var xp = items.reduce(function (total, item) { return total + (Number(item.xp) || 0); }, 0);
    var gold = items.reduce(function (total, item) { return total + (Number(item.gold) || 0); }, 0);
    var bonuses = items.filter(function (item) {
      return item.perkState === 'triggered' || item.bazaarApplied;
    });
    var bosses = items.filter(function (item) { return item.type === 'bookCompletion'; });
    var sessions = items.filter(function (item) { return item.type === 'session'; });
    var isBossOnly = bosses.length && !sessions.length;
    var kicker = isBossOnly ? 'Boss Reward Claimed' : (sessions.length && bosses.length ? 'Adventure Rewards Claimed' : 'Reading Reward Claimed');
    var title = isBossOnly ? 'Boss Defeated' : 'Quest Progress';
    var summary = isBossOnly
      ? (bosses.length === 1 ? (bosses[0].bookTitle || 'Completed book') : bosses.length + ' boss rewards claimed')
      : (sessions.length === 1 && !bosses.length ? (sessions[0].bookTitle || 'Reading session') + ' · ' + sessions[0].minutes + ' minutes' : sessions.length + ' reading session' + (sessions.length === 1 ? '' : 's') + (bosses.length ? ' · ' + bosses.length + ' boss defeat' + (bosses.length === 1 ? '' : 's') : ''));
    var bossLoot = bosses.length
      ? '<div class="session-reward-loot">' +
      '<b>' +
      (bosses.length === 1
        ? 'Trophy and loot added'
        : bosses.length + ' trophies and loot drops added') +
      '</b>' +
      bosses.map(function (boss) {
        return '<span>' +
          escape(boss.lootRarity || 'Loot') +
          ' · ' +
          escape(boss.lootName || 'Reward added to Adventure inventory') +
          '</span>';
      }).join('') +
      '</div>'
      : '';

    var battleLogs = sessions
      .filter(function (item) { return item.battleLog; })
      .map(battleHtml)
      .join('');

    var overlay = document.createElement('section');
    overlay.id = 'sessionRewardOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = '<div class="session-reward-card"><span class="session-reward-kicker">' + kicker + '</span><h2>' + title + '</h2><p class="session-reward-summary">' + escape(summary) + '</p><div class="session-reward-totals">' + (xp ? '<b>+' + xp + ' XP</b>' : '') + '<b>+' + gold + ' gold</b></div>' + bossLoot + battleLogs + '<div class="session-reward-bonuses"></div>' + '<div class="session-reward-bonuses"></div><button type="button">Continue Adventure</button></div>';

    var bonusBox = overlay.querySelector('.session-reward-bonuses');
    if (bonuses.length) {
      bonusBox.innerHTML = bonuses.map(function (item) {
        var lines = [];

        if (item.perkState === 'triggered') {
          var classReward =
            (Number(item.xpBonus) || 0
              ? '+' + (Number(item.xpBonus) || 0) + ' XP'
              : '') +
            ((Number(item.goldBonus) || 0)
              ? ((Number(item.xpBonus) || 0) ? ' · ' : '') +
              '+' + (Number(item.goldBonus) || 0) + ' gold'
              : '');

          lines.push(
            '<p><b>' +
            escape(item.classBonusReason || 'Class skill triggered') +
            '</b><span>' +
            classReward +
            '</span></p>'
          );
        }

        if (item.bazaarApplied) {
          var bazaarReward =
            (Number(item.bazaarXPBonus) || 0
              ? '+' + (Number(item.bazaarXPBonus) || 0) + ' XP'
              : '') +
            ((Number(item.bazaarGoldBonus) || 0)
              ? ((Number(item.bazaarXPBonus) || 0) ? ' · ' : '') +
              '+' + (Number(item.bazaarGoldBonus) || 0) + ' gold'
              : '');

          lines.push(
            '<p><b>' +
            escape(item.bazaarItemName || 'Bazaar enchantment') +
            '</b><span>' +
            bazaarReward +
            '</span></p>'
          );
        }

        return lines.join('');
      }).join('');
    } else {
      bonusBox.innerHTML = '<p><span>No class or Bazaar bonus triggered this time.</span></p>';
    }

    overlay.querySelector('button').onclick = function () { overlay.remove(); };
    document.body.appendChild(overlay);
    fireworks(overlay);
  }

  function capture(method) {
    var original = window.BookShelfRewards[method];
    window.BookShelfRewards[method] = function () {
      var result = original.apply(window.BookShelfRewards, arguments);
      if (result && result.ok && result.transaction) claimed.push(result.transaction);
      return result;
    };
  }

  function install() {
    if (!window.BookShelfRewards || window.BookShelfRewards.__sessionRewardPopup) return;
    capture('claimSession');
    capture('claimCompletion');
    window.BookShelfRewards.__sessionRewardPopup = true;

    var style = document.createElement('style');

    style.textContent = `
      #sessionRewardOverlay {
        position: fixed;
        z-index: 1200;
        inset: 0;
        display: grid;
        place-items: center;
        padding: 24px;
        background: rgba(3, 5, 8, .82);
        backdrop-filter: blur(5px);
        overflow: hidden;
      }

      .session-reward-card {
        position: relative;
        z-index: 2;
        width: min(390px, 100%);
        padding: 28px 22px;
        text-align: center;
        border: 1px solid #d4a64f;
        border-radius: 8px;
        background: radial-gradient(
          circle at 50% 0,
          rgba(212, 166, 79, .24),
          transparent 43%
        ), #151a21;
        color: #f6f1e4;
        box-shadow: 0 18px 60px rgba(0, 0, 0, .55);
      }

      .session-reward-kicker {
        color: #d4a64f;
        font-size: 11px;
        font-weight: bold;
        letter-spacing: .15em;
        text-transform: uppercase;
      }

      .session-reward-card h2 {
        margin: 10px 0 5px;
        font: 27px Georgia, serif;
        color: #f5d58f;
      }

      .session-reward-summary {
        margin: 0;
        color: #b8b0a3;
        font-size: 14px;
      }

      .session-reward-totals {
        display: flex;
        justify-content: center;
        gap: 22px;
        margin: 20px 0;
        padding: 14px;
        border-top: 1px solid rgba(212, 166, 79, .25);
        border-bottom: 1px solid rgba(212, 166, 79, .25);
      }

      .session-reward-totals b {
        color: #d4a64f;
        font: 20px Georgia, serif;
      }

      .session-reward-loot {
        margin: -7px 0 14px;
        color: #b8b0a3;
        font-size: 12px;
      }

      .session-reward-loot b,
      .session-reward-loot span {
        display: block;
      }

      .session-reward-loot b {
        color: #f5d58f;
      }

      .session-reward-loot span {
        margin-top: 4px;
      }

      .session-reward-bonuses p {
        margin: 7px 0;
        color: #b8b0a3;
        font-size: 12px;
      }

      .session-reward-bonuses b,
      .session-reward-bonuses span {
        display: block;
      }

      .session-reward-bonuses b {
        color: #f5d58f;
      }

      .session-reward-card button {
        width: 100%;
        margin-top: 16px;
        padding: 11px;
        border: 1px solid #d4a64f;
        border-radius: 3px;
        background: #7c3134;
        color: #f6f1e4;
        font: inherit;
        font-weight: bold;
      }

      .session-reward-firework {
        position: absolute;
        z-index: 3;
        width: 7px;
        height: 7px;
        background: var(--firework-color);
        box-shadow: 0 0 12px var(--firework-color);
        pointer-events: none;
        animation: session-reward-firework-pop .9s steps(8, end) forwards;
      }

      @keyframes session-reward-firework-pop {
        0% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }

        70% {
          opacity: 1;
        }

        100% {
          opacity: 0;
          transform: translate(
            calc(-50% + var(--dx)),
            calc(-50% + var(--dy))
          ) scale(0);
        }
      }

      .session-reward-battle {
        margin: 12px 0;
        border: 1px solid rgba(212, 166, 79, .35);
        background: rgba(0, 0, 0, .22);
        text-align: left;
      }

      .session-reward-battle-summary {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 2px 12px;
        align-items: center;
        width: 100%;
        padding: 12px;
        box-sizing: border-box;
        cursor: pointer;
        list-style: none;
      }

      .session-reward-battle-summary::-webkit-details-marker {
        display: none;
      }

      .session-reward-battle-summary::before {
        content: "▸";
        grid-row: 1 / span 2;
        color: #d4a64f;
        font-size: 16px;
        transition: transform .15s ease;
      }

      .session-reward-battle[open] > .session-reward-battle-summary::before {
        transform: rotate(90deg);
      }

      .session-reward-battle-label {
        grid-column: 1;
        color: #d4a64f;
        font-size: 10px;
        font-weight: bold;
        letter-spacing: .12em;
        text-transform: uppercase;
      }

      .session-reward-battle-summary > b {
        grid-column: 1;
        color: #f5d58f;
        font: 17px Georgia, serif;
      }

      .session-reward-battle-summary > small {
        grid-column: 2;
        grid-row: 1 / span 2;
        color: #b8b0a3;
        font-size: 11px;
        text-align: right;
      }

      .session-reward-encounters {
        padding: 0 12px 12px;
        border-top: 1px solid rgba(212, 166, 79, .22);
      }

      .session-reward-encounter {
        border-bottom: 1px solid rgba(212, 166, 79, .16);
      }

      .session-reward-encounter:last-child {
        border-bottom: 0;
      }

      .session-reward-encounter-summary {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 3px 12px;
        padding: 11px 0;
        cursor: pointer;
        list-style: none;
      }

      .session-reward-encounter-summary::-webkit-details-marker {
        display: none;
      }

      .session-reward-encounter-summary::before {
        content: "▸";
        grid-row: 1 / span 2;
        color: #d4a64f;
        font-size: 13px;
        transition: transform .15s ease;
      }

      .session-reward-encounter[open] >
      .session-reward-encounter-summary::before {
        transform: rotate(90deg);
      }

      .session-reward-encounter-number {
        grid-column: 1;
        color: #d4a64f;
        font-size: 10px;
        font-weight: bold;
        letter-spacing: .1em;
        text-transform: uppercase;
      }

      .session-reward-encounter-summary > b {
        grid-column: 1;
        color: #f5d58f;
        font: 15px Georgia, serif;
      }

      .session-reward-encounter-summary > small {
        grid-column: 2;
        grid-row: 1 / span 2;
        align-self: center;
        color: #b8b0a3;
        font-size: 11px;
        text-align: right;
      }

      .session-reward-encounter-detail {
        padding: 0 0 11px 13px;
        color: #b8b0a3;
        font-size: 12px;
      }

      .session-reward-encounter-detail span,
      .session-reward-encounter-detail small {
        display: block;
      }

      .session-reward-encounter-detail p {
        margin: 6px 0;
      }

      .session-reward-encounter-detail small {
        color: #d4a64f;
      }

      .session-reward-encounter.is-critical {
        padding-left: 8px;
        border-left: 2px solid #ff7a18;
      }

      .session-reward-encounter.is-critical
      .session-reward-encounter-summary > small {
        color: #ff7a18;
      }
    `;

    document.head.appendChild(style);

    window.addEventListener('bookshelf-adventure-claim-complete', function () {
      var items = claimed.slice();
      claimed = [];
      show(items);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();