(function () {
  var LOG_KEY = 'bookshelf-reading-log-v1';
  var GAME_KEY = 'bookshelf-adventure-progression-v1';

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch (_) { return JSON.parse(fallback); }
  }

  function minutes(entry) { return Math.max(0, Math.floor(Number(entry && entry.minutes) || 0)); }

  function tooltipButton(message, label) {
    return '<button type="button" class="adventure-combat-tooltip" data-tooltip="' + message + '" aria-label="' + label + '" aria-expanded="false">ⓘ</button>';
  }

  function escape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[character];
    });
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

  function equippedWeaponPreview() {
    var api = window.LanternfallsEquipment;

    if (!api || typeof api.getEquippedWeapon !== 'function') {
      return null;
    }

    var weapon = api.getEquippedWeapon();

    if (!weapon || !weapon.name || weapon.id === 'readers-orb') {
      return null;
    }

    return {
      name: String(weapon.name),
      tier: Math.max(0, Math.floor(Number(weapon.tier) || 0)),
      powerBonus: Math.max(0, Number(weapon.powerBonus) || 0),
      role: String(weapon.role || '')
    };
  }

  function artifactPreview() {
    if (
      !window.BookShelfArtifacts ||
      typeof window.BookShelfArtifacts.equipped !== 'function' ||
      typeof window.BookShelfArtifacts.effectFor !== 'function'
    ) {
      return null;
    }

    var item = window.BookShelfArtifacts.equipped();
    var effect = window.BookShelfArtifacts.effectFor(item);

    if (!item || !effect || effect.type === 'none') {
      return null;
    }

    return {
      name: String(item.name || 'Equipped artifact'),
      rarity: String(item.rarity || 'Common'),
      label: String(effect.label || 'Artifact effect applied'),
      type: String(effect.type || ''),
      value: Math.max(0, Number(effect.value) || 0)
    };
  }

  function modifierRowsHtml(reward, artifact, weapon) {
    var rows = [];

    function modifierRow(kind, label, title, detail, extraClass) {
      return (
        '<p class="adventure-combat-modifier ' +
        kind +
        (extraClass ? ' ' + extraClass : '') +
        '">' +
        '<b class="adventure-combat-modifier-label" style="color:var(--accent,#8B3A3A)">' +
        escape(label) +
        '</b>' +
        '<strong>' + escape(title) + '</strong>' +
        '<span>' + escape(detail) + '</span>' +
        '</p>'
      );
    }

    if (weapon) {
      var weaponDetail = 'Tier ' + weapon.tier;

      if (weapon.powerBonus > 0) {
        weaponDetail += ' · +' + weapon.powerBonus + ' Power';
      } else if (weapon.role) {
        weaponDetail += ' · ' + weapon.role;
      }

      rows.push(
        modifierRow(
          'is-weapon',
          'Equipped Weapon Bonus',
          weapon.name,
          weaponDetail
        )
      );
    }

    if (reward && reward.perkState === 'triggered') {
      var classAmount = rewardText(
        reward.xpBonus,
        reward.goldBonus,
        0
      );

      if (classAmount) {
        rows.push(
          modifierRow(
            'is-class',
            'Class Bonus',
            reward.classBonusReason || 'Class bonus',
            classAmount
          )
        );
      }
    }

    if (reward && reward.bazaarApplied) {
      var bazaarAmount = rewardText(
        reward.bazaarXPBonus,
        reward.bazaarGoldBonus,
        0
      );

      if (bazaarAmount) {
        rows.push(
          modifierRow(
            'is-bazaar',
            'Bazaar Bonus',
            reward.bazaarItemName || 'Bazaar enchantment',
            bazaarAmount
          )
        );
      }
    }

    if (artifact) {
      var artifactAmount = '';

      if (artifact.type === 'critical-chance') {
        artifactAmount = rewardText(0, 0, artifact.value);
      } else if (reward) {
        artifactAmount = rewardText(
          reward.artifactXPBonus,
          reward.artifactGoldBonus,
          reward.artifactCritBonus
        );
      }

      rows.push(
        modifierRow(
          'is-artifact',
          'Artifact Bonus',
          artifact.name,
          artifact.label +
          (artifactAmount ? ' · ' + artifactAmount : ''),
          'rarity-' + String(artifact.rarity || 'common').toLowerCase()
        )
      );
    }

    return rows.length
      ? '<div class="adventure-combat-modifiers">' +
      rows.join('') +
      '</div>'
      : '';
  }

  function hash(value) {
    var number = 0;
    String(value || '').split('').forEach(function (character) {
      number = ((number << 5) - number) + character.charCodeAt(0);
      number |= 0;
    });
    return Math.abs(number);
  }

  function bossFor(book) {
    var genre = String(book.genre || '').toLowerCase();
    var map = [
      { word: 'fantasy', region: 'The Dragonlands', boss: 'The Emberbound Wyrm' },
      { word: 'science', region: 'The Astral Frontier', boss: 'The Voidglass Sentinel' },
      { word: 'mystery', region: 'The Shadow District', boss: 'The Lantern Veil Stalker' },
      { word: 'horror', region: 'The Dreadwood', boss: 'The Whispering Hollow' },
      { word: 'romance', region: 'The Heartlands', boss: 'The Roseglass Guardian' },
      { word: 'histor', region: 'The Ancient Kingdoms', boss: 'The Crownless Archivist' },
      { word: 'biography', region: 'The Hall of Legends', boss: 'The Chronicle Keeper' },
      { word: 'nonfiction', region: 'The Scholar’s Archives', boss: 'The Indexbound Colossus' },
      { word: 'thriller', region: 'The Dead City', boss: 'The Nightwire Hunter' },
      { word: 'adventure', region: 'The Wilds', boss: 'The Stormtrail Behemoth' }
    ];
    return map.filter(function (item) { return genre.indexOf(item.word) !== -1; })[0] || { region: 'The Reading Realm', boss: 'The Inkbound Guardian' };
  }

  function getBooks() {
    try {
      var saved = JSON.parse(
        localStorage.getItem('bookshelf-data') || '{"books":[]}'
      );

      return Array.isArray(saved.books) ? saved.books : [];
    } catch (_) {
      return [];
    }
  }

  function latestSession(sessions) {
    return sessions.slice().sort(function (a, b) {
      return String(b.createdAt || b.endedAt || b.date || '').localeCompare(String(a.createdAt || a.endedAt || a.date || ''));
    })[0];
  }

  async function render() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.classList.contains('hidden') || !page.classList.contains('adventure-page')) return;
    var content = page.querySelector('.adventure-content');
    var mount = page.querySelector('#adventureBossMount');

    if (!content || !mount) {
      return;
    }

    mount.innerHTML = '';

    var books = getBooks();
    if (!page.classList.contains('adventure-page')) return;

    var active = books.filter(function (book) { return book.status === 'reading'; })[0];
    var card = document.createElement('section');
    card.className = 'adventure-card adventure-combat-card';

    if (!active) {
      card.innerHTML = '<span class="adventure-label">Book Boss ' + tooltipButton('Each book marked Reading receives a themed Book Boss. Mark a book as Reading to begin its reading quest.', 'About Book Boss') + '</span><h2>No active dungeon</h2><p class="adventure-muted">Mark a book as Reading to summon its boss and begin earning combat moments.</p>';
      mount.appendChild(card);
      return;
    }

    var sessions = read(LOG_KEY, '[]').filter(function (entry) { return entry && entry.bookId === active.id; });
    var totalMinutes = sessions.reduce(function (total, entry) { return total + minutes(entry); }, 0);
    var latest = latestSession(sessions);
    var game = read(GAME_KEY, '{}');
    var rawStrength = Number((game.stats || {}).str);
    var rawLuck = Number((game.stats || {}).lck);
    var strength = Number.isFinite(rawStrength) ? Math.max(10, rawStrength) : 10;
    var luck = Number.isFinite(rawLuck) ? Math.max(10, rawLuck) : 10;
    var rawCritChance = 5 + luck / 20;
    var critChance = Number.isFinite(rawCritChance) ? Math.min(25, rawCritChance) : 5;
    var critDisplay = critChance.toFixed(1).replace(/\.0$/, '');
    var boss = bossFor(active);
    var weapon = equippedWeaponPreview();
    var combat = '';

    if (latest) {
      var reward = window.BookShelfRewards
        ? window.BookShelfRewards.calculateSession(latest)
        : {
          xp: minutes(latest) * 10,
          gold: Math.max(1, Math.floor(minutes(latest) / 2)),
          xpBonus: 0,
          goldBonus: 0,
          artifactXPBonus: 0,
          artifactGoldBonus: 0,
          artifactCritBonus: 0,
          perkState: 'none',
          bazaarApplied: false
        };

      var artifact = artifactPreview();

      /*
        Chronicle Compass changes live combat chance.
        The reward transaction separately carries artifactCritBonus for
        the reward-popup modifier row.
      */
      var combatArtifactCrit = artifact &&
        artifact.type === 'critical-chance'
        ? artifact.value
        : 0;

      var actualCritChance = Math.min(
        100,
        critChance + combatArtifactCrit
      );

      var baseDamage = Math.floor(
        minutes(latest) * (1 + strength / 500)
      );

      var critical = (hash(latest.id) % 10000) <
        Math.round(actualCritChance * 100);

      var damage = critical
        ? Math.floor(baseDamage * 1.5)
        : baseDamage;

      var modifiers = modifierRowsHtml(reward, artifact, weapon);
      combat =
        '<div class="adventure-combat-result">' +
        '<span>' +
        (critical ? '✦ Critical Hit' : '⚔ Combat Result') +
        ' ' +
        tooltipButton(
          critical
            ? 'A critical hit deals 1.5 times the normal display damage. Its chance is based on Luck and can be increased by equipped artifacts such as Chronicle Compass.'
            : 'Display damage is based on the latest session’s minutes and your Strength. It adds flavor to the reading quest and does not change your recorded minutes.',
          'About combat result'
        ) +
        '</span>' +

        '<strong data-tooltip="This is display damage from your latest linked reading session. Base damage equals session minutes adjusted by Strength; a critical hit multiplies it by 1.5." tabindex="0">' +
        damage + ' damage' +
        '</strong>' +

        '<p>' +
        minutes(latest) + ' minutes · +' +
        (Number(reward.xp) || 0) + ' XP · +' +
        (Number(reward.gold) || 0) + ' gold ' +
        tooltipButton(
          'Session rewards are calculated from logged minutes, class bonuses, active Bazaar enchantments, and an equipped artifact. Nothing is awarded until the pending reward is claimed.',
          'About session rewards'
        ) +
        '</p>' +

        modifiers +
        '</div>';
    } else {
      combat = '<p class="adventure-muted">Log time for this book to create your first combat result.</p>';
    }

    card.innerHTML =
      '<div class="adventure-boss-top"><div><span class="adventure-label">Current Reading Quest · Book Boss' + tooltipButton('A themed reading-quest opponent based on the active book’s genre. It represents your progress, not a separate task you can fail.', 'About Book Boss') + '</span><h2>' + boss.boss + '</h2><p class="adventure-muted">' + active.title + '</p></div><b>⚔</b></div>' +
      '<div class="adventure-boss-meta"><span data-tooltip="The boss region is chosen from the active book’s genre." tabindex="0">' + boss.region + '</span><span data-tooltip="Momentum is the total reading or listening time logged while this book is linked to a session." tabindex="0">' + totalMinutes + ' minutes of momentum</span></div>' +
      '<div class="adventure-combat-stats">' +
      '<span data-tooltip="Strength slightly increases display damage from your latest session." tabindex="0">' +
      'STR ' + strength +
      '</span>' +

      '<span data-tooltip="Luck increases critical-hit chance. Chronicle Compass adds its equipped artifact bonus to the final critical chance used in reading encounters." tabindex="0">' +
      'LCK ' + luck + ' · ' +
      Math.min(
        100,
        critChance + (
          artifactPreview() &&
            artifactPreview().type === 'critical-chance'
            ? artifactPreview().value
            : 0
        )
      ).toFixed(1).replace(/\\.0$/, '') +
      '% crit' +
      '</span>' +

      '</div>' +
      combat +
      '<button type="button" class="adventure-combat-log" aria-label="Log time against this boss">Log Time Against Boss</button>';
    mount.appendChild(card);

    card.querySelector('.adventure-combat-log').onclick = function () {
      var profileButton = document.querySelector('#bottomNavigation [data-page="profile"]');
      if (profileButton) profileButton.click();
    };
  }

  function install() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.dataset.adventureCombatReady) return;
    page.dataset.adventureCombatReady = 'true';

    var style = document.createElement('style');
    style.textContent =
      '.adventure-combat-card{' +
      'border-color:rgba(168,130,60,.52)}' +

      '.adventure-boss-top{' +
      'display:flex;justify-content:space-between;gap:12px}' +

      '.adventure-boss-top h2{' +
      'margin-bottom:3px}' +

      '.adventure-boss-top>b{' +
      'color:var(--gold,#A8823C);font-size:31px}' +

      '.adventure-combat-tooltip{' +
      'display:inline-flex;align-items:center;justify-content:center;' +
      'width:15px;height:15px;margin-left:4px;padding:0;' +
      'border:1px solid currentColor;border-radius:50%;background:transparent;' +
      'color:inherit;font:700 10px/1 sans-serif;vertical-align:middle;cursor:pointer}' +

      '.adventure-combat-tooltip:focus-visible,' +
      '.adventure-combat-result strong:focus-visible,' +
      '.adventure-boss-meta [tabindex]:focus-visible,' +
      '.adventure-combat-stats [tabindex]:focus-visible{' +
      'outline:2px solid var(--gold,#A8823C);outline-offset:2px}' +

      '.adventure-boss-meta{' +
      'display:flex;justify-content:space-between;gap:10px;margin-top:12px;' +
      'padding:9px 0;border-top:1px solid rgba(168,130,60,.18);' +
      'border-bottom:1px solid rgba(168,130,60,.18);' +
      'color:var(--muted,#8A8378);font-size:11px}' +

      '.adventure-boss-meta [tabindex],' +
      '.adventure-combat-stats [tabindex]{' +
      'cursor:help}' +

      '.adventure-combat-stats{' +
      'display:flex;justify-content:space-between;gap:10px;margin-top:9px;' +
      'color:var(--gold,#A8823C);font-size:11px}' +

      '.adventure-combat-result{' +
      'margin-top:12px;padding:12px;' +
      'border-left:3px solid var(--gold,#A8823C);' +
      'background:rgba(0,0,0,.13)}' +

      '.adventure-combat-result>span,' +
      '.adventure-combat-result>strong{' +
      'display:block}' +

      '.adventure-combat-result>span{' +
      'color:var(--gold,#A8823C);font-size:11px;text-transform:uppercase}' +

      '.adventure-combat-result>strong{' +
      'margin-top:4px;font:22px Georgia,serif;cursor:help}' +

      '.adventure-combat-result>p{' +
      'margin:4px 0 0;color:var(--muted,#8A8378);font-size:12px}' +

      '.adventure-combat-modifiers{' +
      'margin-top:11px;padding-top:10px;' +
      'border-top:1px solid rgba(168,130,60,.18)}' +

      '.adventure-combat-modifier{' +
      'margin:9px 0;padding-top:9px;border-top:1px solid rgba(168,130,60,.18);' +
      'font-size:11px;line-height:1.4}' +

      '.adventure-combat-modifier b,' +
      '.adventure-combat-modifier strong,' +
      '.adventure-combat-modifier span{' +
      'display:block}' +

      '.adventure-combat-modifier b{' +
      'color:var(--accent,#8B3A3A);font-size:10px;font-weight:bold;' +
      'letter-spacing:.08em;text-transform:uppercase}' +

      '.adventure-combat-modifier strong{' +
      'margin-top:3px;color:var(--paper-light,#F6F1E4);' +
      'font:15px Georgia,serif;line-height:1.25}' +

      '.adventure-combat-modifier span{' +
      'margin-top:2px;color:var(--muted,#8A8378);font-size:11px}' +

      '.adventure-combat-modifier.is-weapon b{' +
      'color:var(--accent,#8B3A3A)}' +

      '.adventure-combat-modifier.is-bazaar b{' +
      'color:var(--accent,#8B3A3A)}' +

      '.adventure-combat-modifier.is-artifact.rarity-common strong{' +
      'color:#d7d0c4}' +
      '.adventure-combat-modifier.is-artifact.rarity-common span{' +
      'color:#b8b0a3}' +

      '.adventure-combat-modifier.is-artifact.rarity-uncommon strong{' +
      'color:#79bd8d}' +
      '.adventure-combat-modifier.is-artifact.rarity-uncommon span{' +
      'color:#b7d9bf}' +

      '.adventure-combat-modifier.is-artifact.rarity-rare strong{' +
      'color:#74a8e7}' +
      '.adventure-combat-modifier.is-artifact.rarity-rare span{' +
      'color:#b7d1ef}' +

      '.adventure-combat-modifier.is-artifact.rarity-epic strong{' +
      'color:#c28ad9}' +
      '.adventure-combat-modifier.is-artifact.rarity-epic span{' +
      'color:#dfc1ec}' +

      '.adventure-combat-modifier.is-artifact.rarity-legendary strong{' +
      'color:#d4a64f}' +
      '.adventure-combat-modifier.is-artifact.rarity-legendary span{' +
      'color:#f0d99d}' +

      '.adventure-combat-modifier.is-artifact.rarity-mythic strong{' +
      'color:#e55353}' +
      '.adventure-combat-modifier.is-artifact.rarity-mythic span{' +
      'color:#ffb3b3}' +

      '.adventure-combat-log{' +
      'width:100%;margin-top:13px;padding:11px;' +
      'border:1px solid var(--gold,#A8823C);border-radius:3px;' +
      'background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4)}';

    '.adventure-combat-modifier.is-weapon b,' +
      '.adventure-combat-modifier.is-weapon strong,' +
      '.adventure-combat-modifier.is-weapon span{' +
      'display:block}' +

      '.adventure-combat-modifier.is-weapon b{' +
      'color:var(--gold,#A8823C);font-size:10px;' +
      'letter-spacing:.08em;text-transform:uppercase}' +

      '.adventure-combat-modifier.is-weapon strong{' +
      'margin-top:3px;color:var(--paper-light,#F6F1E4);' +
      'font:15px Georgia,serif;line-height:1.25}' +

      '.adventure-combat-modifier.is-weapon span{' +
      'margin-top:2px;color:var(--muted,#8A8378);font-size:11px}' +
      '.adventure-combat-modifier.is-bazaar b{' +
      'color:var(--gold,#A8823C)}' +

      '.adventure-combat-modifier.is-artifact.rarity-common b{' +
      'color:#d7d0c4}' +

      '.adventure-combat-modifier.is-artifact.rarity-common span{' +
      'color:#b8b0a3}' +

      '.adventure-combat-modifier.is-artifact.rarity-uncommon b{' +
      'color:#79bd8d}' +

      '.adventure-combat-modifier.is-artifact.rarity-uncommon span{' +
      'color:#b7d9bf}' +

      '.adventure-combat-modifier.is-artifact.rarity-rare b{' +
      'color:#74a8e7}' +

      '.adventure-combat-modifier.is-artifact.rarity-rare span{' +
      'color:#b7d1ef}' +

      '.adventure-combat-modifier.is-artifact.rarity-epic b{' +
      'color:#c28ad9}' +

      '.adventure-combat-modifier.is-artifact.rarity-epic span{' +
      'color:#dfc1ec}' +

      '.adventure-combat-modifier.is-artifact.rarity-legendary b{' +
      'color:#d4a64f}' +

      '.adventure-combat-modifier.is-artifact.rarity-legendary span{' +
      'color:#f0d99d}' +

      '.adventure-combat-modifier.is-artifact.rarity-mythic b{' +
      'color:#e55353}' +

      '.adventure-combat-modifier.is-artifact.rarity-mythic span{' +
      'color:#ffb3b3}' +
      '.adventure-combat-log{' +
      'width:100%;margin-top:13px;padding:11px;' +
      'border:1px solid var(--gold,#A8823C);border-radius:3px;' +
      'background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4)}'

    '.adventure-combat-modifier.is-artifact.rarity-common strong{' +
      'color:#d7d0c4}' +
      '.adventure-combat-modifier.is-artifact.rarity-common span{' +
      'color:#b8b0a3}' +

      '.adventure-combat-modifier.is-artifact.rarity-uncommon strong{' +
      'color:#79bd8d}' +
      '.adventure-combat-modifier.is-artifact.rarity-uncommon span{' +
      'color:#b7d9bf}' +

      '.adventure-combat-modifier.is-artifact.rarity-rare strong{' +
      'color:#74a8e7}' +
      '.adventure-combat-modifier.is-artifact.rarity-rare span{' +
      'color:#b7d1ef}' +

      '.adventure-combat-modifier.is-artifact.rarity-epic strong{' +
      'color:#c28ad9}' +
      '.adventure-combat-modifier.is-artifact.rarity-epic span{' +
      'color:#dfc1ec}' +

      '.adventure-combat-modifier.is-artifact.rarity-legendary strong{' +
      'color:#d4a64f}' +
      '.adventure-combat-modifier.is-artifact.rarity-legendary span{' +
      'color:#f0d99d}' +

      '.adventure-combat-modifier.is-artifact.rarity-mythic strong{' +
      'color:#e55353}' +
      '.adventure-combat-modifier.is-artifact.rarity-mythic span{' +
      'color:#ffb3b3}' +
      '.adventure-combat-modifier.is-artifact.rarity-mythic span{' +
      'color:#ffb3b3}' +

      '.adventure-combat-modifier.is-artifact b{' +
      'color:var(--accent,#8B3A3A)!important}' +

      '.adventure-combat-log{' +
      'width:100%;margin-top:13px;padding:11px;' +
      'border:1px solid var(--gold,#A8823C);border-radius:3px;' +
      'background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4)}' +
      '.adventure-combat-modifier .adventure-combat-modifier-label{' +
      'color:var(--accent,#8B3A3A)!important}';

    document.head.appendChild(style);

    new MutationObserver(function () { setTimeout(render, 0); }).observe(page, { childList: true });
    window.addEventListener('bookshelf-reading-log-changed', render);
    window.addEventListener('bookshelf-adventure-class-changed', render);
    render();
    window.addEventListener('bookshelf-adventure-equipment-changed', render);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();