(function () {
  var claimed = [];

  function escape(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (c) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[c];
    });
  }

  function attackLogHtml(encounter) {
    var attacks = Array.isArray(encounter.attacks) ? encounter.attacks : [];

    if (!attacks.length) {
      return '<p class="session-reward-attack legacy">' +
        escape(encounter.message || 'No detailed battle record is available.') +
        '</p>';
    }

    return (
      '<div class="session-reward-attack-log">' +
      attacks.map(function (attack) {
        var actor = attack.actor || 'player';
        var actorLabel = actor === 'player'
          ? (attack.className || 'Reader')
          : actor === 'enemy'
            ? (encounter.enemyName || 'Enemy')
            : 'Outcome';

        var meta = '';

        if (actor === 'player') {
          meta =
            '<small>' +
            (attack.critical ? 'Critical · ' : '') +
            (Number(attack.damage) || 0) + ' DMG' +
            '</small>';
        } else if (actor === 'outcome') {
          meta =
            '<small>Encounter ' +
            escape(encounter.outcome || 'complete') +
            '</small>';
        }

        return (
          '<p class="session-reward-attack is-' +
          actor +
          (attack.critical ? ' is-critical' : '') +
          '">' +
          '<b>' + escape(actorLabel) + '</b>' +
          '<span>' + escape(attack.message || '') + '</span>' +
          meta +
          '</p>'
        );
      }).join('') +
      '</div>'
    );
  }
  function weaponSummaryHtml(log) {
    var weapon = log && log.weapon;

    if (!weapon || !weapon.name) {
      return '';
    }

    var tier = Math.max(0, Math.floor(Number(weapon.tier) || 0));
    var power = Math.max(0, Number(weapon.powerBonus) || 0);
    var parts = [
      escape(weapon.name) + ' · Tier ' + tier
    ];

    if (power > 0) {
      parts.push('+' + power + ' Power');
    }

    return (
      '<span class="session-reward-battle-weapon">' +
      '⚔ ' + parts.join(' · ') +
      '</span>'
    );
  }

  function battleHtml(item) {
    var log = item && item.battleLog;
    var encounters = log && Array.isArray(log.encounters)
      ? log.encounters
      : [];

    if (!encounters.length) {
      return '';
    }

    return (
      '<details class="session-reward-battle">' +
      '<summary class="session-reward-battle-summary">' +
      '<span class="session-reward-battle-label">Battle Log</span>' +
      '<b>' + encounters.length + ' encounter' +
      (encounters.length === 1 ? '' : 's') +
      '</b>' +
      '<small>' +
      (Number(log.minutes) || 0) +
      ' minutes' +
      '</small>' +
      '</summary>' +

      '<div class="session-reward-encounters">' +
      encounters.map(function (encounter) {
        var number = Number(encounter.index) || 1;
        var duration = Number(encounter.duration) || 0;
        var damage = Number(encounter.damage) || 0;
        var enemyName = encounter.enemyName || 'Unknown foe';
        var relic = encounter.relic || 'None';
        var outcome = encounter.outcome || '';

        return (
          '<details class="session-reward-encounter' +
          (encounter.critical ? ' is-critical' : '') +
          '">' +

          '<summary class="session-reward-encounter-summary">' +
          '<span class="session-reward-encounter-number">' +
          'Encounter ' + number +
          '</span>' +
          '<b>' + escape(enemyName) + '</b>' +
          '<small>' +
          duration + ' min · ' + damage + ' DMG' +
          (encounter.critical ? ' · Critical' : '') +
          '</small>' +
          '</summary>' +

          '<div class="session-reward-encounter-detail">' +
          '<span class="session-reward-encounter-region">' +
          escape(encounter.region || 'The Reading Realm') +
          '</span>' +

          attackLogHtml(encounter) +

          '<p class="session-reward-relic">' +
          'Relic recovered: ' + escape(relic) +
          '<button type="button" ' +
          'class="session-reward-relic-tooltip adventure-relic-tooltip" ' +
          'data-tooltip="Relics are encounter traces recovered while reading. They are collectible for now; a future Bazaar update may let you sell, trade, or refine them." ' +
          'aria-label="About relics" ' +
          'aria-expanded="false">&#9432;</button>' +
          '</p>' +

          (outcome
            ? '<small class="session-reward-outcome">Outcome: ' +
            escape(outcome) +
            '</small>'
            : '') +
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
      pixel.style.setProperty(
        '--firework-color',
        colors[(i + number) % colors.length]
      );

      overlay.appendChild(pixel);

      setTimeout(function (item) {
        return function () {
          item.remove();
        };
      }(pixel), 950);
    }
  }

  function fireworks(overlay) {
    for (var burst = 0; burst < 5; burst += 1) {
      setTimeout(function (number) {
        return function () {
          if (overlay.isConnected) {
            fireworkBurst(overlay, number);
          }
        };
      }(burst), burst * 220);
    }
  }

  function rewardText(xp, gold, crit) {
    var parts = [];

    if (Math.max(0, Number(xp) || 0)) {
      parts.push('+' + (Number(xp) || 0) + ' XP');
    }

    if (Math.max(0, Number(gold) || 0)) {
      parts.push('+' + (Number(gold) || 0) + ' gold');
    }

    if (Math.max(0, Number(crit) || 0)) {
      parts.push('+' + (Number(crit) || 0) + '% crit chance');
    }

    return parts.join(' · ');
  }

  function weaponBonusHtml(item) {
    var log = item && item.battleLog;
    var weapon = log && log.weapon;

    if (!weapon || !weapon.name || weapon.id === 'readers-orb') {
        return '';
    }

    var tier = Math.max(0, Math.floor(Number(weapon.tier) || 0));

    return (
        '<p class="session-reward-weapon-bonus">' +
        '<b>' + escape(weapon.name) + '</b>' +
        '<span>Tier ' + tier + '</span>' +
        '</p>'
    );
}

  function bonusHtml(item) {
    var lines = [];

    if (item.perkState === 'triggered') {
      var classReward = rewardText(item.xpBonus, item.goldBonus, 0);

      lines.push(
        '<p><b>' +
        escape(item.classBonusReason || 'Class skill triggered') +
        '</b><span>' +
        escape(classReward) +
        '</span></p>'
      );
    }

    if (item.bazaarApplied) {
      var bazaarReward = rewardText(
        item.bazaarXPBonus,
        item.bazaarGoldBonus,
        0
      );

      lines.push(
        '<p><b>' +
        escape(item.bazaarItemName || 'Bazaar enchantment') +
        '</b><span>' +
        escape(bazaarReward) +
        '</span></p>'
      );
    }

    if (
      item.artifactItemName &&
      (
        (Number(item.artifactXPBonus) || 0) ||
        (Number(item.artifactGoldBonus) || 0) ||
        (Number(item.artifactCritBonus) || 0)
      )
    ) {
      var artifactXPBonus = Number(item.artifactXPBonus) || 0;
      var artifactGoldBonus = Number(item.artifactGoldBonus) || 0;
      var artifactCritBonus = Number(item.artifactCritBonus) || 0;

      var artifactReward = rewardText(
        artifactXPBonus,
        artifactGoldBonus,
        0
      );

      var artifactDescription = String(
        item.artifactBonusReason || ''
      ).trim();

      lines.push(
        '<p class="session-reward-artifact-bonus rarity-' +
        escape(String(item.artifactItemRarity || 'Common').toLowerCase()) +
        '"><b>' +
        escape(item.artifactItemName) +
        '</b><span>' +
        escape(artifactDescription || 'Artifact effect applied') +
        (artifactReward ? ' · ' + escape(artifactReward) : '') +
        '</span></p>'
      );
    }

    return lines.join('');
  }

  function show(items) {
    if (!items.length) {
      return;
    }

    var old = document.getElementById('sessionRewardOverlay');

    if (old) {
      old.remove();
    }

    var xp = items.reduce(function (total, item) {
      return total + (Number(item.xp) || 0);
    }, 0);

    var gold = items.reduce(function (total, item) {
      return total + (Number(item.gold) || 0);
    }, 0);

    var bonuses = items.filter(function (item) {
      return (
        item.perkState === 'triggered' ||
        item.bazaarApplied ||
        item.artifactItemName
      );
    });

    var bosses = items.filter(function (item) {
      return item.type === 'bookCompletion';
    });

    var sessions = items.filter(function (item) {
      return item.type === 'session';
    });

    var isBossOnly = bosses.length && !sessions.length;

    var kicker = isBossOnly
      ? 'Boss Reward Claimed'
      : (sessions.length && bosses.length
        ? 'Adventure Rewards Claimed'
        : 'Reading Reward Claimed');

    var title = isBossOnly
      ? 'Boss Defeated'
      : 'Quest Progress';

    var summary = isBossOnly
      ? (
        bosses.length === 1
          ? (bosses[0].bookTitle || 'Completed book')
          : bosses.length + ' boss rewards claimed'
      )
      : (
        sessions.length === 1 && !bosses.length
          ? (sessions[0].bookTitle || 'Reading session') +
          ' · ' + sessions[0].minutes + ' minutes'
          : sessions.length + ' reading session' +
          (sessions.length === 1 ? '' : 's') +
          (
            bosses.length
              ? ' · ' + bosses.length + ' boss defeat' +
              (bosses.length === 1 ? '' : 's')
              : ''
          )
      );

    var bossLoot = bosses.length
      ? '<div class="session-reward-loot">' +
      '<b>' +
      (
        bosses.length === 1
          ? 'Trophy and loot added'
          : bosses.length + ' trophies and loot drops added'
      ) +
      '</b>' +
      bosses.map(function (boss) {
        return '<span>' +
          escape(boss.lootRarity || 'Loot') +
          ' · ' +
          escape(boss.lootName || 'Reward added to Collection') +
          '</span>';
      }).join('') +
      '</div>'
      : '';

    var battleLogs = sessions
      .filter(function (item) {
        return item.battleLog;
      })
      .map(battleHtml)
      .join('');

    var overlay = document.createElement('section');

    overlay.id = 'sessionRewardOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    overlay.innerHTML =
      '<div class="session-reward-card">' +
      '<span class="session-reward-kicker">' + kicker + '</span>' +
      '<h2>' + title + '</h2>' +
      '<p class="session-reward-summary">' + escape(summary) + '</p>' +
      '<div class="session-reward-totals">' +
      (xp ? '<b>+' + xp + ' XP</b>' : '') +
      '<b>+' + gold + ' gold</b>' +
      '</div>' +
      bossLoot +
      battleLogs +
      '<div class="session-reward-bonuses"></div>' +
      '<button type="button" class="session-reward-continue">' +
      'Continue Adventure' +
      '</button>' +
      '</div>';

    var bonusBox = overlay.querySelector('.session-reward-bonuses');

    var weaponBonuses = items
      .map(weaponBonusHtml)
      .filter(function (html) {
        return !!html;
      });

    var otherBonuses = bonuses.map(bonusHtml).filter(function (html) {
      return !!html;
    });

    if (weaponBonuses.length || otherBonuses.length) {
      bonusBox.innerHTML =
        weaponBonuses.join('') +
        otherBonuses.join('');
    } else {
      bonusBox.innerHTML =
        '<p><span>No class, equipped item, or Bazaar bonus triggered this time.</span></p>';
    }

    var continueButton = overlay.querySelector('.session-reward-continue');

    continueButton.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      overlay.remove();
    });

    document.body.appendChild(overlay);
    fireworks(overlay);
  }

  function capture(method) {
    var original = window.BookShelfRewards[method];

    window.BookShelfRewards[method] = function () {
      var result = original.apply(window.BookShelfRewards, arguments);

      if (result && result.ok && result.transaction) {
        claimed.push(result.transaction);
      }

      return result;
    };
  }

  function install() {
    if (
      !window.BookShelfRewards ||
      window.BookShelfRewards.__sessionRewardPopup
    ) {
      return;
    }

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
  overflow-y: auto;
  overscroll-behavior: contain;
  background: rgba(3, 5, 8, .82);
  backdrop-filter: blur(5px);
  -webkit-overflow-scrolling: touch;
}

.session-reward-card {
  position: relative;
  z-index: 2;
  width: min(390px, 100%);
  max-height: calc(100dvh - 48px);
  padding: 28px 22px;
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid #d4a64f;
  border-radius: 8px;
  background:
    radial-gradient(
      circle at 50% 0,
      rgba(212, 166, 79, .24),
      transparent 43%
    ),
    #151a21;
  color: #f6f1e4;
  text-align: center;
  box-shadow: 0 18px 60px rgba(0, 0, 0, .55);
  -webkit-overflow-scrolling: touch;
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
  color: #f5d58f;
  font: 27px Georgia, serif;
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
.session-reward-loot span,
.session-reward-bonuses b,
.session-reward-bonuses span {
  display: block;
}

.session-reward-loot b,
.session-reward-bonuses b {
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

.session-reward-artifact-bonus.rarity-common b {
  color: #d7d0c4;
}

.session-reward-artifact-bonus.rarity-common span {
  color: #b8b0a3;
}

.session-reward-artifact-bonus.rarity-uncommon b {
  color: #79bd8d;
}

.session-reward-artifact-bonus.rarity-uncommon span {
  color: #b7d9bf;
}

.session-reward-artifact-bonus.rarity-rare b {
  color: #74a8e7;
}

.session-reward-artifact-bonus.rarity-rare span {
  color: #b7d1ef;
}

.session-reward-artifact-bonus.rarity-epic b {
  color: #c28ad9;
}

.session-reward-artifact-bonus.rarity-epic span {
  color: #dfc1ec;
}

.session-reward-artifact-bonus.rarity-legendary b {
  color: #d4a64f;
}

.session-reward-artifact-bonus.rarity-legendary span {
  color: #f0d99d;
}

.session-reward-artifact-bonus.rarity-mythic b {
  color: #e55353;
}

.session-reward-artifact-bonus.rarity-mythic span {
  color: #ffb3b3;
}

.session-reward-card .session-reward-continue {
  width: 100%;
  margin-top: 16px;
  padding: 11px;
  border: 1px solid #d4a64f;
  border-radius: 3px;
  background: #7c3134;
  color: #f6f1e4;
  font: inherit;
  font-weight: bold;
  cursor: pointer;
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
    transform:
      translate(
        calc(-50% + var(--dx)),
        calc(-50% + var(--dy))
      )
      scale(0);
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

.session-reward-battle-summary::-webkit-details-marker,
.session-reward-encounter-summary::-webkit-details-marker {
  display: none;
}

.session-reward-battle-summary::before,
.session-reward-encounter-summary::before {
  content: "▸";
  grid-row: 1 / span 2;
  color: #d4a64f;
  transition: transform .15s ease;
}

.session-reward-battle-summary::before {
  font-size: 16px;
}

.session-reward-encounter-summary::before {
  font-size: 13px;
}

.session-reward-battle[open] > .session-reward-battle-summary::before,
.session-reward-encounter[open] > .session-reward-encounter-summary::before {
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

.session-reward-encounter-region {
  display: block;
  color: #d4a64f;
  font-size: 11px;
  letter-spacing: .04em;
}

.session-reward-attack-log {
  margin: 10px 0 8px;
  padding-left: 10px;
  border-left: 1px solid rgba(212, 166, 79, .28);
}

.session-reward-attack {
  margin: 0;
  padding: 8px 0;
  border-bottom: 1px solid rgba(212, 166, 79, .13);
}

.session-reward-attack:last-child {
  border-bottom: 0;
}

.session-reward-attack b,
.session-reward-attack span,
.session-reward-attack small {
  display: block;
}

.session-reward-attack b {
  color: #f5d58f;
  font-size: 11px;
}

.session-reward-attack.is-enemy b {
  color: #b8b0a3;
}

.session-reward-attack.is-outcome b {
  color: #d4a64f;
}

.session-reward-attack span {
  margin-top: 3px;
  color: #d7d0c4;
  font-size: 12px;
  line-height: 1.4;
}

.session-reward-attack small {
  margin-top: 4px;
  color: #d4a64f;
  font-size: 10px;
}

.session-reward-attack.is-critical {
  margin-left: -10px;
  padding-left: 8px;
  border-left: 2px solid #ff7a18;
}

.session-reward-attack.is-critical b,
.session-reward-attack.is-critical small {
  color: #ffb15d;
}

.session-reward-attack.legacy {
  margin: 8px 0;
  color: #d7d0c4;
  font-size: 12px;
  line-height: 1.4;
}

.session-reward-relic {
  margin: 9px 0 0;
  color: #d4a64f;
  font-size: 11px;
}

.session-reward-relic .session-reward-relic-tooltip,
.session-reward-card .session-reward-relic-tooltip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin: 0 0 0 5px;
  padding: 0;
  border: 1px solid currentColor;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  font: 700 12px/1 sans-serif;
  vertical-align: middle;
  cursor: pointer;
}

.session-reward-relic .session-reward-relic-tooltip:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.session-reward-outcome {
  display: block;
  margin-top: 3px;
  color: #b8b0a3;
  text-transform: capitalize;
}

.session-reward-battle-weapon {
  grid-column: 1 / -1;
  display: block;
  margin-top: 4px;
  color: #d4a64f;
  font-size: 10px;
  letter-spacing: .03em;
}

.session-reward-weapon-bonus {
  margin: 7px 0;
  color: #b8b0a3;
  font-size: 12px;
}

.session-reward-weapon-bonus b,
.session-reward-weapon-bonus span {
  display: block;
}

.session-reward-weapon-bonus b {
  color: #f5d58f;
  font-size: 12px;
}

.session-reward-weapon-bonus span {
  margin-top: 2px;
  color: #b8b0a3;
  font-size: 12px;
}
`;

    document.head.appendChild(style);

    window.addEventListener('bookshelf-adventure-claim-complete', function () {
      var items = claimed.slice();

      claimed = [];

      show(items);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();