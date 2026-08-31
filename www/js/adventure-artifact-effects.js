(function () {
  var LOOT_KEY = 'bookshelf-adventure-loot-v1';

  function read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || fallback);
    } catch (_) {
      return JSON.parse(fallback);
    }
  }

  function equippedArtifact() {
    var selection = read(
      'bookshelf-adventure-artifacts-v1',
      '{"version":1,"equippedId":"","equippedName":""}'
    );

    var equippedId = String((selection || {}).equippedId || '');

    if (!equippedId) {
      return null;
    }

    var loot = read(
      LOOT_KEY,
      '{"items":[]}'
    );

    var items = Array.isArray((loot || {}).items)
      ? loot.items
      : [];

    return items.filter(function (item) {
      return item &&
        String(item.instanceId || item.id || '') === equippedId;
    })[0] || null;
  }

  function effectFor(item) {
    var name = String((item || {}).name || '');

    var effects = {
      'Inkstone Charm': {
        label: '+2 XP on every claimed reading session',
        type: 'flat-session-xp',
        value: 2
      },
      'Paperbound Token': {
        label: '+1 gold on every claimed reading session',
        type: 'flat-session-gold',
        value: 1
      },
      'Reader’s Candle': {
        label: '+1 XP and +1 gold on every claimed reading session',
        type: 'balanced-session',
        value: 1
      },
      'Gilded Bookmark': {
        label: '+5% XP on claimed reading sessions',
        type: 'percent-session-xp',
        value: 5
      },
      'Lantern of Focus': {
        label: '+5% gold on claimed reading sessions',
        type: 'percent-session-gold',
        value: 5
      },
      'Wanderer’s Satchel': {
        label: '+10% gold on claimed reading sessions',
        type: 'percent-session-gold',
        value: 10
      },
      'Moonlit Quill': {
        label: '+10% XP on claimed reading sessions',
        type: 'percent-session-xp',
        value: 10
      },
      'Archivist’s Key': {
        label: '+10% gold on claimed reading sessions',
        type: 'percent-session-gold',
        value: 10
      },
      'Chronicle Compass': {
        label: '+8% critical-hit chance in reading encounters',
        type: 'critical-chance',
        value: 8
      },
      'Runeshelf Reliquary': {
        label: '+15% XP on claimed sessions and +1 gold',
        type: 'epic-xp-gold',
        value: 15
      },
      'Starlit Codex': {
        label: '+15% gold on claimed sessions',
        type: 'percent-session-gold',
        value: 15
      },
      'Dragonhide Journal': {
        label: '+10% XP and +10% gold on claimed sessions',
        type: 'percent-session-balanced',
        value: 10
      },
      'Crown of the First Library': {
        label: '+20% XP on claimed reading sessions',
        type: 'percent-session-xp',
        value: 20
      },
      'Everscript Grimoire': {
        label: '+20% gold on claimed sessions',
        type: 'percent-session-gold',
        value: 20
      },
      'The Infinite Bookmark': {
        label: '+15% XP and +15% gold on claimed sessions',
        type: 'percent-session-balanced',
        value: 15
      }
    };

    return effects[name] || {
      label: '',
      type: 'none',
      value: 0
    };
  }

  function applyToSessionReward(reward) {
    var artifact = equippedArtifact();
    var effect = effectFor(artifact);
    var minutes = Math.max(0, Number((reward || {}).minutes) || 0);
    var xpBonus = 0;
    var goldBonus = 0;

    if (!artifact || effect.type === 'none') {
      return {
        artifact: null,
        effect: effect,
        xpBonus: 0,
        goldBonus: 0,
        critBonus: 0
      };
    }

    if (effect.type === 'flat-session-xp') {
      xpBonus = effect.value;
    }

    if (effect.type === 'flat-session-gold') {
      goldBonus = effect.value;
    }

    if (effect.type === 'balanced-session') {
      xpBonus = effect.value;
      goldBonus = effect.value;
    }

    if (effect.type === 'percent-session-xp') {
      xpBonus = Math.max(
        1,
        Math.round(Math.max(0, Number(reward.baseXP) || 0) * effect.value / 100)
      );
    }

    if (effect.type === 'percent-session-gold') {
      goldBonus = Math.max(
        1,
        Math.round(Math.max(0, Number(reward.baseGold) || 0) * effect.value / 100)
      );
    }

    if (effect.type === 'long-session-gold' && minutes >= 30) {
      goldBonus = effect.value;
    }

    if (effect.type === 'epic-xp-gold') {
      xpBonus = Math.max(
        1,
        Math.round(Math.max(0, Number(reward.baseXP) || 0) * effect.value / 100)
      );
      goldBonus = 1;
    }

    if (effect.type === 'percent-session-balanced') {
      xpBonus = Math.max(
        1,
        Math.round(Math.max(0, Number(reward.baseXP) || 0) * effect.value / 100)
      );
      goldBonus = Math.max(
        1,
        Math.round(Math.max(0, Number(reward.baseGold) || 0) * effect.value / 100)
      );
    }

    return {
      artifact: artifact,
      effect: effect,
      xpBonus: xpBonus,
      goldBonus: goldBonus,
      critBonus: effect.type === 'critical-chance'
        ? Math.max(0, Number(effect.value) || 0)
        : 0
    };
  }

  function decorateReward(reward) {
    if (!reward || reward.__artifactEffectApplied) {
      return reward;
    }

    var applied = applyToSessionReward(reward);

    reward.artifactItemId = applied.artifact
      ? String(applied.artifact.instanceId || applied.artifact.id || '')
      : '';

    reward.artifactItemName = applied.artifact
      ? String(applied.artifact.name || '')
      : '';

    reward.artifactBonusReason = applied.artifact
      ? applied.effect.label
      : '';

    reward.artifactXPBonus = applied.xpBonus;
    reward.artifactGoldBonus = applied.goldBonus;
    reward.artifactCritBonus = applied.critBonus;

    reward.xp = Math.max(0, Number(reward.xp) || 0) + applied.xpBonus;
    reward.gold = Math.max(0, Number(reward.gold) || 0) + applied.goldBonus;

    reward.__artifactEffectApplied = true;

    return reward;
  }

  function installRewardHook() {
    if (
      !window.BookShelfRewards ||
      window.BookShelfRewards.__artifactEffectsInstalled
    ) {
      return false;
    }

    var originalCalculateSession = window.BookShelfRewards.calculateSession;

    if (typeof originalCalculateSession !== 'function') {
      return false;
    }

    window.BookShelfRewards.calculateSession = function (session) {
      return decorateReward(originalCalculateSession(session));
    };

    window.BookShelfRewards.__artifactEffectsInstalled = true;
    return true;
  }

  function install() {
    if (!installRewardHook()) {
      setTimeout(install, 100);
    }
  }

  window.BookShelfArtifacts = {
    equipped: equippedArtifact,
    effectFor: effectFor,
    applyToSessionReward: applyToSessionReward
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();