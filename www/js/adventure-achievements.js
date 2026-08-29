(function () {
  var KEY = 'bookshelf-adventure-achievements-v1';
  var LOG_KEY = 'bookshelf-reading-log-v1';
  var GAME_KEY = 'bookshelf-adventure-progression-v1';
  var LOOT_KEY = 'bookshelf-adventure-loot-v1';

  var ACHIEVEMENTS = [
    { id: 'first-minutes', title: 'First Minutes', target: 10, kind: 'minutes', detail: 'Record 10 reading minutes' },
    { id: 'first-chapter', title: 'First Chapter', target: 1, kind: 'cataloged', detail: 'Catalog your first book' },
    { id: 'first-tale', title: 'First Tale Complete', target: 1, kind: 'finished', detail: 'Complete your first book' },
    { id: 'bookworm', title: 'Bookworm', target: 10, kind: 'finished', detail: 'Complete 10 books' },
    { id: 'rising-legend', title: 'Rising Legend', target: 10, kind: 'level', detail: 'Reach Level 10' },
    { id: 'boss-slayer', title: 'Boss Slayer', target: 1, kind: 'trophies', detail: 'Claim your first boss trophy' }
  ];

  var QUESTS = [
    {
      id: 'read-60-minutes',
      title: 'Study the Scrolls',
      target: 60,
      kind: 'weekMinutes',
      detail: 'Read 60 minutes this week',
      xp: 120,
      gold: 24
    },
    {
      id: 'read-180-minutes',
      title: 'Deep Delve',
      target: 180,
      kind: 'weekMinutes',
      detail: 'Read 180 minutes this week',
      xp: 280,
      gold: 56
    },
    {
      id: 'claim-3-sessions',
      title: 'Steady Steps',
      target: 3,
      kind: 'weekSessions',
      detail: 'Claim 3 reading sessions this week',
      xp: 90,
      gold: 18
    },
    {
      id: 'read-3-days',
      title: 'Three-Day Trail',
      target: 3,
      kind: 'weekDays',
      detail: 'Read on 3 separate days this week',
      xp: 100,
      gold: 20
    },
    {
      id: 'read-5-days',
      title: 'Weeklong Wayfarer',
      target: 5,
      kind: 'weekDays',
      detail: 'Read on 5 separate days this week',
      xp: 200,
      gold: 40
    },
    {
      id: 'finish-a-book',
      title: 'Boss Hunt',
      target: 1,
      kind: 'weekFinished',
      detail: 'Finish 1 book this week',
      xp: 180,
      gold: 36
    }
  ];

  function read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || fallback);
    } catch (_) {
      return JSON.parse(fallback);
    }
  }

  function write(value) {
    localStorage.setItem(KEY, JSON.stringify(value));
  }

  function day(value) {
    var date = new Date(value || Date.now());

    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  }

  function monday() {
    var date = new Date();

    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));

    return day(date);
  }

  function state() {
    var value = read(KEY, '{}');

    value.version = 2;
    value.achievements = value.achievements || {};
    value.streak = value.streak || {
      current: 0,
      longest: 0,
      lastQualifiedDay: ''
    };

    if (
      !value.weeklyQuests ||
      typeof value.weeklyQuests !== 'object' ||
      Array.isArray(value.weeklyQuests)
    ) {
      value.weeklyQuests = {};
    }

    /*
      Migrates the original one-quest format safely. A prior quest is treated
      as claimed only if its saved `claimedAt` value exists.
    */
    if (value.weeklyQuest && value.weeklyQuest.id) {
      var legacy = value.weeklyQuest;

      if (!value.weeklyQuests[legacy.id]) {
        value.weeklyQuests[legacy.id] = {
          weekOf: legacy.weekOf || monday(),
          claimedAt: legacy.claimedAt || null,
          rewardXP: Math.max(0, Number(legacy.rewardXP) || 0),
          rewardGold: Math.max(0, Number(legacy.rewardGold) || 0)
        };
      }
    }

    return value;
  }

  function books() {
    return read('bookshelf-data', '{"books":[]}').books || [];
  }

  function log() {
    return read(LOG_KEY, '[]');
  }

  function level(xp) {
    return Math.max(
      1,
      Math.floor(
        Math.sqrt((Math.max(0, Number(xp) || 0) + 100) / 100)
      )
    );
  }

  function metrics() {
    var allBooks = books();
    var sessions = log();
    var weekStart = monday();
    var game = read(GAME_KEY, '{}');
    var values = {
      minutes: 0,
      cataloged: allBooks.length,
      finished: 0,
      level: level(game.xp),
      trophies: (read(LOOT_KEY, '{"events":[]}').events || []).length,
      weekMinutes: 0,
      weekSessions: 0,
      weekDays: 0,
      weekFinished: 0
    };
    var days = {};

    allBooks.forEach(function (book) {
      if (book.status !== 'finished') return;

      values.finished += 1;

      if (day(book.finishedAt || book.updatedAt || book.createdAt) >= weekStart) {
        values.weekFinished += 1;
      }
    });

    sessions.forEach(function (session) {
      var minutes = Math.max(0, Number((session || {}).minutes) || 0);
      var date = day(session && (session.date || session.createdAt || session.endedAt));

      values.minutes += minutes;

      if (minutes && date >= weekStart) {
        values.weekMinutes += minutes;
        values.weekSessions += 1;
        days[date] = true;
      }
    });

    values.weekDays = Object.keys(days).length;

    return values;
  }

  function update() {
    var value = state();
    var values = metrics();
    var today = day();
    var weekStart = monday();
    var qualifyingDays = {};

    ACHIEVEMENTS.forEach(function (item) {
      if (values[item.kind] >= item.target && !value.achievements[item.id]) {
        value.achievements[item.id] = {
          unlockedAt: new Date().toISOString()
        };
      }
    });

    log().forEach(function (session) {
      var date = day(
        session && (session.date || session.createdAt || session.endedAt)
      );
      var minutes = Math.max(0, Number((session || {}).minutes) || 0);

      qualifyingDays[date] = (qualifyingDays[date] || 0) + minutes;
    });

    var streak = 0;
    var cursor = new Date(today + 'T12:00:00');

    while ((qualifyingDays[day(cursor)] || 0) >= 10) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    value.streak.current = streak;
    value.streak.longest = Math.max(
      Number(value.streak.longest) || 0,
      streak
    );
    value.streak.lastQualifiedDay = streak ? today : value.streak.lastQualifiedDay;

    /*
      A new week resets all weekly quest claim statuses. Progress is always
      computed fresh from this week's reading/session/book data.
    */
    QUESTS.forEach(function (quest) {
      var entry = value.weeklyQuests[quest.id];

      if (!entry || entry.weekOf !== weekStart) {
        value.weeklyQuests[quest.id] = {
          weekOf: weekStart,
          claimedAt: null,
          rewardXP: 0,
          rewardGold: 0
        };
      }
    });

    var quests = QUESTS.map(function (quest) {
      var entry = value.weeklyQuests[quest.id];
      var progress = Math.min(
        quest.target,
        Math.max(0, Number(values[quest.kind]) || 0)
      );

      entry.progress = progress;

      return {
        id: quest.id,
        title: quest.title,
        target: quest.target,
        kind: quest.kind,
        detail: quest.detail,
        xp: quest.xp,
        gold: quest.gold,
        progress: progress,
        claimedAt: entry.claimedAt || null
      };
    });

    write(value);

    return {
      state: value,
      metrics: values,
      quests: quests,
      achievements: ACHIEVEMENTS
    };
  }

  function claimQuest(questId) {
    var result = update();
    var quest = result.quests.filter(function (item) {
      return item.id === questId;
    })[0];

    if (!quest || quest.claimedAt || quest.progress < quest.target) {
      return { ok: false };
    }

    var game = read(
      GAME_KEY,
      '{"xp":0,"gold":0,"processedSessions":{}}'
    );
    var entry = result.state.weeklyQuests[quest.id];
    var xp = Math.max(0, Number(quest.xp) || 0);
    var gold = Math.max(0, Number(quest.gold) || 0);

    game.xp = Math.max(0, Number(game.xp) || 0) + xp;
    game.gold = Math.max(0, Number(game.gold) || 0) + gold;

    entry.claimedAt = new Date().toISOString();
    entry.rewardXP = xp;
    entry.rewardGold = gold;

    localStorage.setItem(GAME_KEY, JSON.stringify(game));
    write(result.state);

    window.dispatchEvent(new CustomEvent('bookshelf-adventure-quest-claimed', {
      detail: {
        quest: quest,
        xp: xp,
        gold: gold
      }
    }));

    window.dispatchEvent(new Event('bookshelf-adventure-economy-changed'));

    return {
      ok: true,
      quest: quest,
      xp: xp,
      gold: gold
    };
  }

  window.BookShelfAchievements = {
    update: update,
    claimQuest: claimQuest,
    definitions: ACHIEVEMENTS,
    weeklyQuests: QUESTS
  };
})();