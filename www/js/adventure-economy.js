(function () {
  var ECONOMY_KEY = 'bookshelf-adventure-economy-v1';
  var GAME_KEY = 'bookshelf-adventure-progression-v1';

  var TIERS = {
    potion: 'Potion',
    scroll: 'Scroll',
    tome: 'Tome'
  };

  var TIER_UNLOCKS = {
    potion: 3,
    scroll: 7,
    tome: 10
  };

  var FAMILY_UNLOCKS = {
    insight: 3,
    fortune: 4,
    momentum: 5,
    focus: 6,
    hunt: 8,
    wonders: 9
  };

  var CATALOG = [
    {
      id: 'insight-potion',
      family: 'insight',
      tier: 'potion',
      name: 'Tonic of Insight',
      description: 'Amplifies knowledge gained from your next reward.',
      scope: 'next-eligible-claim',
      appliesTo: 'session-or-completion',
      valueType: 'percent-xp',
      value: 10,
      price: 90,
      artType: 'potion',
      image: 'assets/items/potions/Tonic_of_Insight.png'
    },
    {
      id: 'insight-scroll',
      family: 'insight',
      tier: 'scroll',
      name: 'Scroll of Insight',
      description: 'Amplifies knowledge gained from your next reward.',
      scope: 'next-eligible-claim',
      appliesTo: 'session-or-completion',
      valueType: 'percent-xp',
      value: 20,
      price: 220,
      artType: 'scroll',
      image: 'assets/items/scrolls/Scroll_of_Insight.png'
    },
    {
      id: 'insight-tome',
      family: 'insight',
      tier: 'tome',
      name: 'Tome of Insight',
      description: 'Amplifies knowledge gained from your next reward.',
      scope: 'next-eligible-claim',
      appliesTo: 'session-or-completion',
      valueType: 'percent-xp',
      value: 35,
      price: 450,
      artType: 'tome',
      image: 'assets/items/tomes/Tome_of_Insight.png'
    },
    {
      id: 'fortune-potion',
      family: 'fortune',
      tier: 'potion',
      name: 'Tonic of Fortune',
      description: 'Enriches your next reward with extra gold.',
      scope: 'next-eligible-claim',
      appliesTo: 'session-or-completion',
      valueType: 'percent-gold',
      value: 10,
      price: 100,
      artType: 'potion',
      image: 'assets/items/potions/Tonic_of_Fortune.png'
    },
    {
      id: 'fortune-scroll',
      family: 'fortune',
      tier: 'scroll',
      name: 'Scroll of Fortune',
      description: 'Enriches your next reward with extra gold.',
      scope: 'next-eligible-claim',
      appliesTo: 'session-or-completion',
      valueType: 'percent-gold',
      value: 20,
      price: 240,
      artType: 'scroll',
      image: 'assets/items/scrolls/Scroll_of_Fortune.png'
    },
    {
      id: 'fortune-tome',
      family: 'fortune',
      tier: 'tome',
      name: 'Tome of Fortune',
      description: 'Enriches your next reward with extra gold.',
      scope: 'next-eligible-claim',
      appliesTo: 'session-or-completion',
      valueType: 'percent-gold',
      value: 35,
      price: 480,
      artType: 'tome',
      image: 'assets/items/tomes/Tome_of_Fortune.png'
    },
    {
      id: 'focus-potion',
      family: 'focus',
      tier: 'potion',
      name: 'Tonic of Focus',
      description: 'Rewards a long, deliberate reading session.',
      scope: 'next-eligible-claim',
      appliesTo: 'session-only',
      valueType: 'flat-xp-long-session',
      value: 80,
      minimumMinutes: 30,
      price: 110,
      artType: 'potion',
      image: 'assets/items/potions/Tonic_of_Focus.png'
    },
    {
      id: 'focus-scroll',
      family: 'focus',
      tier: 'scroll',
      name: 'Scroll of Focus',
      description: 'Rewards a long, deliberate reading session.',
      scope: 'next-eligible-claim',
      appliesTo: 'session-only',
      valueType: 'flat-xp-long-session',
      value: 160,
      minimumMinutes: 30,
      price: 260,
      artType: 'scroll',
      image: 'assets/items/scrolls/Scroll_of_Focus.png'
    },
    {
      id: 'focus-tome',
      family: 'focus',
      tier: 'tome',
      name: 'Tome of Focus',
      description: 'Rewards a long, deliberate reading session.',
      scope: 'next-eligible-claim',
      appliesTo: 'session-only',
      valueType: 'flat-xp-long-session',
      value: 280,
      minimumMinutes: 30,
      price: 520,
      artType: 'tome',
      image: 'assets/items/tomes/Tome_of_Focus.png'
    },
    {
      id: 'momentum-potion',
      family: 'momentum',
      tier: 'potion',
      name: 'Tonic of Momentum',
      description: 'Turns a quick reading burst into solid progress.',
      scope: 'next-eligible-claim',
      appliesTo: 'session-only',
      valueType: 'flat-gold-short-session',
      value: 6,
      minimumMinutes: 10,
      maximumMinutes: 25,
      price: 80,
      artType: 'potion',
      image: 'assets/items/potions/Tonic_of_Momentum.png'
    },
    {
      id: 'momentum-scroll',
      family: 'momentum',
      tier: 'scroll',
      name: 'Scroll of Momentum',
      description: 'Turns a quick reading burst into solid progress.',
      scope: 'next-eligible-claim',
      appliesTo: 'session-only',
      valueType: 'flat-gold-short-session',
      value: 12,
      minimumMinutes: 10,
      maximumMinutes: 25,
      price: 190,
      artType: 'scroll',
      image: 'assets/items/scrolls/Scroll_of_Momentum.png'
    },
    {
      id: 'momentum-tome',
      family: 'momentum',
      tier: 'tome',
      name: 'Tome of Momentum',
      description: 'Turns a quick reading burst into solid progress.',
      scope: 'next-eligible-claim',
      appliesTo: 'session-only',
      valueType: 'flat-gold-short-session',
      value: 20,
      minimumMinutes: 10,
      maximumMinutes: 25,
      price: 390,
      artType: 'tome',
      image: 'assets/items/tomes/Tome_of_Momentum.png'
    },
    {
      id: 'hunt-potion',
      family: 'hunt',
      tier: 'potion',
      name: 'Tonic of the Hunt',
      description: 'Empowers the next boss defeat reward you claim.',
      scope: 'next-eligible-claim',
      appliesTo: 'completion-only',
      valueType: 'percent-completion-gold',
      value: 10,
      price: 140,
      artType: 'potion',
      image: 'assets/items/potions/Tonic_of_the_Hunt.png'
    },
    {
      id: 'hunt-scroll',
      family: 'hunt',
      tier: 'scroll',
      name: 'Scroll of the Hunt',
      description: 'Empowers the next boss defeat reward you claim.',
      scope: 'next-eligible-claim',
      appliesTo: 'completion-only',
      valueType: 'percent-completion-gold',
      value: 20,
      price: 320,
      artType: 'scroll',
      image: 'assets/items/scrolls/Scroll_of_the_Hunt.png'
    },
    {
      id: 'hunt-tome',
      family: 'hunt',
      tier: 'tome',
      name: 'Tome of the Hunt',
      description: 'Empowers the next boss defeat reward you claim.',
      scope: 'next-eligible-claim',
      appliesTo: 'completion-only',
      valueType: 'percent-completion-gold',
      value: 35,
      price: 650,
      artType: 'tome',
      image: 'assets/items/tomes/Tome_of_the_Hunt.png'
    },
    {
      id: 'wonders-potion',
      family: 'wonders',
      tier: 'potion',
      name: 'Tonic of Wonders',
      description: 'Bends fate toward a rarer treasure.',
      scope: 'next-eligible-claim',
      appliesTo: 'completion-only',
      valueType: 'loot-luck',
      value: 1,
      price: 150,
      artType: 'potion',
      image: 'assets/items/potions/Tonic_of_Wonders.png'
    },
    {
      id: 'wonders-scroll',
      family: 'wonders',
      tier: 'scroll',
      name: 'Scroll of Wonders',
      description: 'Bends fate toward a rarer treasure.',
      scope: 'next-eligible-claim',
      appliesTo: 'completion-only',
      valueType: 'loot-luck',
      value: 2,
      price: 360,
      artType: 'scroll',
      image: 'assets/items/scrolls/Scroll_of_Wonders.png'
    },
    {
      id: 'wonders-tome',
      family: 'wonders',
      tier: 'tome',
      name: 'Tome of Wonders',
      description: 'Bends fate toward a rarer treasure.',
      scope: 'next-eligible-claim',
      appliesTo: 'completion-only',
      valueType: 'loot-luck',
      value: 3,
      price: 720,
      artType: 'tome',
      image: 'assets/items/tomes/Tome_of_Wonders.png'
    }
  ];

  function read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || fallback);
    } catch (_) {
      return JSON.parse(fallback);
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function now() {
    return new Date().toISOString();
  }

  function economy() {
    var value = read(
      ECONOMY_KEY,
      '{"version":1,"activeItem":null,"ownedItems":[],"history":[],"market":{},"unlocks":{}}'
    );

    value.version = 1;
    value.activeItem = value.activeItem || null;
    value.ownedItems = Array.isArray(value.ownedItems) ? value.ownedItems : [];
    value.history = Array.isArray(value.history) ? value.history : [];
    value.market = value.market || {};
    value.market.lastViewedAt = value.market.lastViewedAt || '';
    value.market.lastPurchaseAt = value.market.lastPurchaseAt || '';
    value.market.totalGoldSpent = Math.max(0, Number(value.market.totalGoldSpent) || 0);
    value.market.totalItemsPurchased = Math.max(0, Number(value.market.totalItemsPurchased) || 0);
    value.market.totalItemsConsumed = Math.max(0, Number(value.market.totalItemsConsumed) || 0);
    value.unlocks = value.unlocks || {};

    return value;
  }

  function game() {
    var value = read(GAME_KEY, '{}');

    value.xp = Math.max(0, Number(value.xp) || 0);
    value.gold = Math.max(0, Number(value.gold) || 0);
    value.processedSessions = value.processedSessions || {};
    value.stats = value.stats || {};

    return value;
  }

  function levelFor(xp) {
    return Math.max(1, Math.floor(Math.sqrt((Math.max(0, Number(xp) || 0) + 100) / 100)));
  }

  function catalogItem(itemId) {
    return CATALOG.filter(function (item) {
      return item.id === itemId;
    })[0] || null;
  }

  function unlockLevel(item) {
    if (!item) return 99;

    return Math.max(
      Number(FAMILY_UNLOCKS[item.family]) || 1,
      Number(TIER_UNLOCKS[item.tier]) || 1
    );
  }

  function isUnlocked(item, level) {
    return Number(level) >= unlockLevel(item);
  }

  function cloneItem(item) {
    return Object.assign({}, item);
  }

  function createInstance(item) {
    return Object.assign(cloneItem(item), {
      instanceId: 'economy-item-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      purchasedAt: now(),
      status: 'inventory'
    });
  }

  function historyEntry(type, detail) {
    return Object.assign({
      id: 'economy-history-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      type: type,
      createdAt: now()
    }, detail || {});
  }

  function updateUnlocks(value, level) {
    var next = {};

    CATALOG.forEach(function (item) {
      next[item.family] = next[item.family] || {};
      next[item.family][item.tier] = isUnlocked(item, level);
    });

    value.unlocks = next;
    return value;
  }

  function getState() {
    var value = economy();
    var progress = game();

    updateUnlocks(value, levelFor(progress.xp));

    return value;
  }

  function saveState(value) {
    write(ECONOMY_KEY, value);
    window.dispatchEvent(new Event('bookshelf-adventure-economy-changed'));
  }

  function markViewed() {
    var value = economy();

    value.market.lastViewedAt = now();
    updateUnlocks(value, levelFor(game().xp));
    saveState(value);
  }

  function purchase(itemId) {
    var item = catalogItem(itemId);
    var progress = game();
    var value = economy();
    var level = levelFor(progress.xp);

    if (!item) {
      return { ok: false, reason: 'Item not found.' };
    }

    if (!isUnlocked(item, level)) {
      return { ok: false, reason: 'Unlocks at Level ' + unlockLevel(item) + '.' };
    }

    if (progress.gold < item.price) {
      return { ok: false, reason: 'You need ' + item.price + ' gold to buy this item.' };
    }

    var instance = createInstance(item);

    progress.gold -= item.price;
    value.ownedItems.unshift(instance);
    value.history.unshift(historyEntry('purchase', {
      itemId: item.id,
      instanceId: instance.instanceId,
      itemName: item.name,
      family: item.family,
      tier: item.tier,
      price: item.price,
      goldDelta: -item.price,
      note: 'Purchased from the Bookwyrm Bazaar.'
    }));

    value.market.lastPurchaseAt = now();
    value.market.totalGoldSpent += item.price;
    value.market.totalItemsPurchased += 1;

    updateUnlocks(value, level);

    write(GAME_KEY, progress);
    saveState(value);

    return {
      ok: true,
      item: instance,
      goldRemaining: progress.gold
    };
  }

  function activate(instanceId) {
    var value = economy();

    if (value.activeItem) {
      return {
        ok: false,
        reason: 'An active enchantment must be consumed first.'
      };
    }

    var index = value.ownedItems.findIndex(function (item) {
      return item.instanceId === instanceId;
    });

    if (index === -1) {
      return { ok: false, reason: 'That item is not in your inventory.' };
    }

    var item = value.ownedItems.splice(index, 1)[0];

    item.status = 'active';
    item.armedAt = now();

    value.activeItem = item;
    value.history.unshift(historyEntry('activation', {
      itemId: item.id,
      instanceId: item.instanceId,
      itemName: item.name,
      family: item.family,
      tier: item.tier,
      note: 'Marked as the active consumable.'
    }));

    saveState(value);

    return { ok: true, item: item };
  }

  function activeItem() {
    return economy().activeItem || null;
  }

  function inventory() {
    return economy().ownedItems.slice();
  }

  function appliesToClaim(item, claimType, minutes) {
    if (!item) return false;

    if (
      item.appliesTo === 'session-only' &&
      claimType !== 'session'
    ) return false;

    if (
      item.appliesTo === 'completion-only' &&
      claimType !== 'completion'
    ) return false;

    if (
      item.valueType === 'flat-xp-long-session' &&
      minutes < Number(item.minimumMinutes || 0)
    ) return false;

    if (
      item.valueType === 'flat-gold-short-session' &&
      (
        minutes < Number(item.minimumMinutes || 0) ||
        minutes > Number(item.maximumMinutes || Infinity)
      )
    ) return false;

    return true;
  }

  function applyToReward(claimType, reward) {
    var value = economy();
    var item = value.activeItem;
    var minutes = Math.max(0, Number((reward || {}).minutes) || 0);

    var result = {
      applied: false,
      item: item ? cloneItem(item) : null,
      xpBonus: 0,
      goldBonus: 0,
      lootLuck: 0,
      reason: ''
    };

    if (!item || !appliesToClaim(item, claimType, minutes)) {
      return result;
    }

    if (item.valueType === 'percent-xp') {
      result.xpBonus = Math.max(1, Math.round((Number(reward.baseXP) + Number(reward.xpBonus || 0)) * Number(item.value) / 100));
    }

    if (item.valueType === 'percent-gold') {
      result.goldBonus = Math.max(1, Math.round((Number(reward.baseGold) + Number(reward.goldBonus || 0)) * Number(item.value) / 100));
    }

    if (item.valueType === 'flat-xp-long-session') {
      result.xpBonus = Math.max(0, Number(item.value) || 0);
    }

    if (item.valueType === 'flat-gold-short-session') {
      result.goldBonus = Math.max(0, Number(item.value) || 0);
    }

    if (item.valueType === 'percent-completion-gold') {
      result.goldBonus = Math.max(1, Math.round((Number(reward.baseGold) + Number(reward.goldBonus || 0)) * Number(item.value) / 100));
    }

    if (item.valueType === 'loot-luck') {
      result.lootLuck = Math.max(0, Number(item.value) || 0);
    }

    result.applied = true;
    result.reason = item.name + ' applied';

    item.status = 'consumed';
    item.consumedAt = now();
    item.consumedBy = claimType;

    value.history.unshift(historyEntry('consumption', {
      itemId: item.id,
      instanceId: item.instanceId,
      itemName: item.name,
      family: item.family,
      tier: item.tier,
      claimType: claimType,
      xpBonus: result.xpBonus,
      goldBonus: result.goldBonus,
      lootLuck: result.lootLuck,
      note: item.name + ' was consumed by a matching reward claim.'
    }));

    value.activeItem = null;
    value.market.totalItemsConsumed += 1;

    saveState(value);

    return result;
  }

  window.BookShelfEconomy = {
    key: ECONOMY_KEY,
    catalog: CATALOG.map(cloneItem),
    tiers: Object.assign({}, TIERS),
    state: getState,
    game: game,
    levelFor: levelFor,
    item: catalogItem,
    unlockLevel: unlockLevel,
    isUnlocked: isUnlocked,
    markViewed: markViewed,
    purchase: purchase,
    activate: activate,
    activeItem: activeItem,
    inventory: inventory,
    applyToReward: applyToReward
  };
})();