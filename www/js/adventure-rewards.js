(function () {
  var GAME_KEY = 'bookshelf-adventure-progression-v1';
  var LEDGER_KEY = 'bookshelf-adventure-ledger-v1';
  var LOG_KEY = 'bookshelf-reading-log-v1';
  var LOOT_KEY = 'bookshelf-adventure-loot-v1';

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch (_) { return JSON.parse(fallback); }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function books() {
    return read('bookshelf-data', '{"books":[]}').books || [];
  }

  function game() {
    var value = read(GAME_KEY, '{}');
    value.xp = Math.max(0, Number(value.xp) || 0);
    value.gold = Math.max(0, Number(value.gold) || 0);
    value.processedSessions = value.processedSessions || {};
    value.stats = value.stats || {};
    return value;
  }

  function ledger() {
    var value = read(LEDGER_KEY, '{"version":1,"transactions":{}}');
    value.version = 1;
    value.transactions = value.transactions || {};
    return value;
  }

  function minutesForBook(bookId) {
    return read(LOG_KEY, '[]').reduce(function (total, item) {
      if (!item || item.bookId !== bookId) return total;
      return total + Math.max(0, Math.floor(Number(item.minutes) || 0));
    }, 0);
  }

  function emptyClassResult() {
    return {
      className: '', perkState: 'none', xpBonus: 0, goldBonus: 0,
      reason: '', classBonusPercent: 0, affinityStats: [], requirement: ''
    };
  }

  function classSessionBonus(session, baseXP) {
    var rules = window.BookShelfClassRules;
    return rules && rules.session ? rules.session(session, baseXP) : emptyClassResult();
  }

  function classCompletionBonus(book, baseGold) {
    var rules = window.BookShelfClassRules;
    return rules && rules.completion ? rules.completion(book, baseGold) : emptyClassResult();
  }

  function classMetadata(bonus) {
    return {
      className: bonus.className || '',
      perkState: bonus.perkState || 'none',
      classBonusPercent: Math.max(0, Number(bonus.classBonusPercent) || 0),
      affinityStats: Array.isArray(bonus.affinityStats) ? bonus.affinityStats : [],
      classPerkRequirement: bonus.requirement || '',
      classBonusReason: bonus.reason || '',
      bonus: bonus.reason || ''
    };
  }

  function calculateSession(session) {
    var minutes = Math.max(0, Math.floor(Number((session || {}).minutes) || 0));
    var baseXP = minutes * 10;
    var baseGold = Math.max(1, Math.floor(minutes / 2));
    var bonus = classSessionBonus(session || {}, baseXP);
    var xpBonus = Math.max(0, Number(bonus.xpBonus) || 0);
    var goldBonus = Math.max(0, Number(bonus.goldBonus) || 0);

    return Object.assign({
      minutes: minutes, baseXP: baseXP, baseGold: baseGold,
      xpBonus: xpBonus, goldBonus: goldBonus,
      xp: baseXP + xpBonus, gold: baseGold + goldBonus,
      bookId: session.bookId || '', bookTitle: session.bookTitle || 'Reading session'
    }, classMetadata(bonus));
  }

  function calculateCompletion(book) {
    var minutes = minutesForBook(book.id);
    var baseXP = 100 + minutes * 5;
    var baseGold = 100 + Math.floor(minutes / 2);
    var bonus = classCompletionBonus(book, baseGold);
    var xpBonus = Math.max(0, Number(bonus.xpBonus) || 0);
    var goldBonus = Math.max(0, Number(bonus.goldBonus) || 0);

    return Object.assign({
      minutes: minutes, baseXP: baseXP, baseGold: baseGold,
      xpBonus: xpBonus, goldBonus: goldBonus,
      xp: baseXP + xpBonus, gold: baseGold + goldBonus,
      bookId: book.id, bookTitle: book.title || 'Untitled'
    }, classMetadata(bonus));
  }

  function migrate() {
    var state = game();
    var data = ledger();
    var changed = false;

    Object.keys(state.processedSessions).forEach(function (id) {
      var key = 'session:' + id;
      if (data.transactions[key]) return;
      data.transactions[key] = {
        id: key, type: 'session', sourceId: id, status: 'claimed',
        migrated: true, xp: null, gold: null, createdAt: new Date().toISOString()
      };
      changed = true;
    });

    var legacyLoot = read(LOOT_KEY, '{"events":[]}');
    (legacyLoot.events || []).forEach(function (event) {
      if (!event || !event.bookId) return;
      var key = 'bookCompletion:' + event.bookId;
      if (data.transactions[key]) return;
      data.transactions[key] = {
        id: key, type: 'bookCompletion', sourceId: event.bookId,
        status: 'claimed', migrated: true,
        xp: event.xp == null ? null : Number(event.xp),
        gold: event.gold == null ? null : Number(event.gold),
        createdAt: event.earnedAt || new Date().toISOString(),
        note: 'Historical completion reward preserved during unified-ledger migration.'
      };
      changed = true;
    });

    Object.keys(state.claimedBosses || {}).forEach(function (key) {
      if (key.indexOf('bookCompletion:') !== 0 || data.transactions[key]) return;
      data.transactions[key] = {
        id: key, type: 'bookCompletion', sourceId: key.slice(15),
        status: 'claimed', migrated: true, xp: null, gold: null,
        createdAt: new Date().toISOString(),
        note: 'Historical completion reward preserved during unified-ledger migration.'
      };
      changed = true;
    });

    if (changed) write(LEDGER_KEY, data);
  }

  function has(key) {
    migrate();
    return !!ledger().transactions[key];
  }

  function claimSession(session) {
    var key = 'session:' + (session || {}).id;
    if (!session || !session.id || has(key)) return { ok: false };

    var reward = calculateSession(session);
    if (!reward.minutes) return { ok: false };

    var state = game();
    var data = ledger();
    state.xp += reward.xp;
    state.gold += reward.gold;
    state.processedSessions[session.id] = true;
    data.transactions[key] = Object.assign({
      id: key, type: 'session', sourceId: session.id,
      status: 'claimed', createdAt: new Date().toISOString()
    }, reward);

    write(GAME_KEY, state);
    write(LEDGER_KEY, data);
    return { ok: true, transaction: data.transactions[key] };
  }

  function pendingCompletions() {
    var data = ledger();
    return books().filter(function (book) {
      return book.status === 'finished' && !data.transactions['bookCompletion:' + book.id];
    });
  }

  function claimCompletion(book) {
    var key = 'bookCompletion:' + (book || {}).id;
    if (!book || !book.id || has(key)) return { ok: false };

    var reward = calculateCompletion(book);
    var state = game();
    var data = ledger();
    state.xp += reward.xp;
    state.gold += reward.gold;
    data.transactions[key] = Object.assign({
      id: key, type: 'bookCompletion', sourceId: book.id,
      status: 'claimed', createdAt: new Date().toISOString()
    }, reward);

    write(GAME_KEY, state);
    write(LEDGER_KEY, data);
    window.dispatchEvent(new CustomEvent('bookshelf-adventure-completion-claimed', {
      detail: { book: book, transaction: data.transactions[key] }
    }));
    return { ok: true, transaction: data.transactions[key] };
  }

  function detachSession(id) {
    var data = ledger();
    var item = data.transactions['session:' + id];
    if (!item) return;
    item.readingEntryRemovedAt = new Date().toISOString();
    item.note = 'Reading entry removed; reward retained.';
    write(LEDGER_KEY, data);
  }

  function reverseSession(id) {
    var key = 'session:' + id;
    var data = ledger();
    var item = data.transactions[key];
    if (!item || item.status === 'reversed' || item.migrated || item.xp === null) {
      return { ok: false, reason: item && item.migrated ? 'historical' : 'not-claimed' };
    }

    var state = game();
    state.xp = Math.max(0, state.xp - item.xp);
    state.gold = Math.max(0, state.gold - item.gold);
    delete state.processedSessions[id];
    item.status = 'reversed';
    item.reversedAt = new Date().toISOString();
    data.transactions['reversal:' + key] = {
      id: 'reversal:' + key, type: 'reversal', sourceId: id,
      status: 'reversed', xp: -item.xp, gold: -item.gold,
      createdAt: item.reversedAt
    };

    write(GAME_KEY, state);
    write(LEDGER_KEY, data);
    return { ok: true };
  }

  window.BookShelfRewards = {
    migrate: migrate,
    has: has,
    ledger: ledger,
    calculateSession: calculateSession,
    calculateCompletion: calculateCompletion,
    claimSession: claimSession,
    claimCompletion: claimCompletion,
    pendingCompletions: pendingCompletions,
    detachSession: detachSession,
    reverseSession: reverseSession
  };

  migrate();
})();