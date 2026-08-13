(function () {
  var KEY = 'bookshelf-adventure-achievements-v1';
  var LOG_KEY = 'bookshelf-reading-log-v1';
  var GAME_KEY = 'bookshelf-adventure-progression-v1';
  var LOOT_KEY = 'bookshelf-adventure-loot-v1';

  var ACHIEVEMENTS = [
    { id:'first-minutes', title:'First Minutes', target:10, kind:'minutes', detail:'Record 10 reading minutes' },
    { id:'first-chapter', title:'First Chapter', target:1, kind:'cataloged', detail:'Catalog your first book' },
    { id:'first-tale', title:'First Tale Complete', target:1, kind:'finished', detail:'Complete your first book' },
    { id:'bookworm', title:'Bookworm', target:10, kind:'finished', detail:'Complete 10 books' },
    { id:'rising-legend', title:'Rising Legend', target:10, kind:'level', detail:'Reach Level 10' },
    { id:'boss-slayer', title:'Boss Slayer', target:1, kind:'trophies', detail:'Claim your first boss trophy' }
  ];
  var QUESTS = [
    { id:'read-60-minutes', title:'Study the Scrolls', target:60, kind:'weekMinutes', detail:'Read 60 minutes this week' },
    { id:'claim-3-sessions', title:'Steady Steps', target:3, kind:'weekSessions', detail:'Claim 3 reading sessions this week' },
    { id:'read-3-days', title:'Three-Day Trail', target:3, kind:'weekDays', detail:'Read on 3 separate days this week' },
    { id:'finish-a-book', title:'Boss Hunt', target:1, kind:'weekFinished', detail:'Finish 1 book this week' }
  ];

  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || fallback); } catch (_) { return JSON.parse(fallback); } }
  function write(value) { localStorage.setItem(KEY, JSON.stringify(value)); }
  function day(value) { var d = new Date(value || Date.now()); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function monday() { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return day(d); }
  function state() {
    var value = read(KEY, '{}');
    value.version = 1; value.achievements = value.achievements || {}; value.streak = value.streak || { current:0, longest:0, lastQualifiedDay:'' }; value.weeklyQuest = value.weeklyQuest || {};
    return value;
  }
  function books() { return read('bookshelf-data', '{"books":[]}').books || []; }
  function log() { return read(LOG_KEY, '[]'); }
  function level(xp) { return Math.max(1, Math.floor(Math.sqrt((Math.max(0, Number(xp) || 0) + 100) / 100))); }
  function metrics() {
    var allBooks = books(), sessions = log(), now = monday(), start = new Date(now + 'T12:00:00');
    var values = { minutes:0, cataloged:allBooks.length, finished:0, level:level(read(GAME_KEY, '{}').xp), trophies:(read(LOOT_KEY, '{"events":[]}').events || []).length, weekMinutes:0, weekSessions:0, weekDays:0, weekFinished:0 };
    var days = {};
    allBooks.forEach(function (book) { if (book.status === 'finished') { values.finished += 1; if (day(book.finishedAt || book.updatedAt || book.createdAt) >= now) values.weekFinished += 1; } });
    sessions.forEach(function (session) { var minutes = Math.max(0, Number((session || {}).minutes) || 0), date = day(session && (session.date || session.createdAt || session.endedAt)); values.minutes += minutes; if (minutes && date >= now) { values.weekMinutes += minutes; values.weekSessions += 1; days[date] = true; } });
    values.weekDays = Object.keys(days).length;
    return values;
  }
  function update() {
    var value = state(), values = metrics(), today = day();
    ACHIEVEMENTS.forEach(function (item) { if (values[item.kind] >= item.target && !value.achievements[item.id]) value.achievements[item.id] = { unlockedAt:new Date().toISOString() }; });
    var qualifyingDays = {}; log().forEach(function (session) { var date = day(session && (session.date || session.createdAt || session.endedAt)), minutes = Math.max(0, Number((session || {}).minutes) || 0); qualifyingDays[date] = (qualifyingDays[date] || 0) + minutes; });
    var streak = 0, cursor = new Date(today + 'T12:00:00');
    while ((qualifyingDays[day(cursor)] || 0) >= 10) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
    value.streak.current = streak; value.streak.longest = Math.max(Number(value.streak.longest) || 0, streak); value.streak.lastQualifiedDay = streak ? today : value.streak.lastQualifiedDay;
    if (value.weeklyQuest.weekOf !== monday()) { var index = Math.floor(new Date(monday() + 'T12:00:00').getTime() / 604800000) % QUESTS.length; value.weeklyQuest = { weekOf:monday(), id:QUESTS[index].id, claimedAt:null }; }
    var quest = QUESTS.filter(function (item) { return item.id === value.weeklyQuest.id; })[0];
    value.weeklyQuest.progress = quest ? Math.min(quest.target, values[quest.kind]) : 0;
    write(value);
    return { state:value, metrics:values, quest:quest, achievements:ACHIEVEMENTS };
  }
  function claimQuest() { var result = update(), quest = result.quest; if (!quest || result.state.weeklyQuest.claimedAt || result.state.weeklyQuest.progress < quest.target) return { ok:false }; result.state.weeklyQuest.claimedAt = new Date().toISOString(); write(result.state); return { ok:true, quest:quest }; }
  window.BookShelfAchievements = { update:update, claimQuest:claimQuest, definitions:ACHIEVEMENTS };
})();