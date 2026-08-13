(function () {
  var PROFILE_KEY = 'bookshelf-adventure-v1';
  var GAME_KEY = 'bookshelf-adventure-progression-v1';
  var BOOKS_KEY = 'bookshelf-data';
  var LOG_KEY = 'bookshelf-reading-log-v1';
  var AFFINITIES = { Scholar:['int','wis'], Warrior:['str','vit'], Mage:['int','lck'], Rogue:['dex','lck'], Ranger:['dex','wis'], Bard:['wis','lck'] };
  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || fallback); } catch (_) { return JSON.parse(fallback); } }
  function day(value) { if (/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return String(value); var date = new Date(value || Date.now()); return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0'); }
  function name() { return String(read(PROFILE_KEY, '{}').className || ''); }
  function library() { return read(BOOKS_KEY, '{"books":[]}').books || []; }
  function stat(statName) { return Math.max(10, Number((read(GAME_KEY, '{}').stats || {})[statName]) || 10); }
  function book(bookId) { return library().filter(function (item) { return item.id === bookId; })[0] || {}; }
  function minutes(session) { return Math.max(0, Math.floor(Number((session || {}).minutes) || 0)); }
  function affinity(className) { var pair = AFFINITIES[className] || []; return { names:pair, values:pair.map(stat) }; }
  function perk(className) {
    var data = affinity(className), values = data.values;
    if (!data.names.length) return { className:'', state:'none', percent:0, affinity:data };
    if (values[0] < 12 || values[1] < 12) return { className:className, state:'locked', percent:0, affinity:data, requirement:data.names.map(function (item) { return item.toUpperCase() + ' 12'; }).join(' · ') };
    var percent = Math.min(12, 5 + Math.floor((values[0] - 10) / 5) + Math.floor((values[1] - 10) / 5));
    return { className:className, state:'ready', percent:percent, affinity:data };
  }
  function priorDay(session) { var date = new Date(day(session.date || session.createdAt || session.endedAt)); date.setDate(date.getDate() - 1); var prior = day(date); return read(LOG_KEY, '[]').some(function (item) { return item && day(item.date || item.createdAt || item.endedAt) === prior && minutes(item) > 0; }); }
  function genreRecent(genre, session) { if (!genre) return false; var date = new Date(day(session.date || session.createdAt || session.endedAt)); date.setDate(date.getDate() - 7); var since = day(date), until = day(session.date || session.createdAt || session.endedAt); return read(LOG_KEY, '[]').some(function (item) { var itemBook = book(item && item.bookId); return item && minutes(item) && day(item.date || item.createdAt || item.endedAt) >= since && day(item.date || item.createdAt || item.endedAt) < until && String(itemBook.genre || '').toLowerCase() === String(genre).toLowerCase(); }); }
  function response(className, base, condition, reason) { var info = perk(className); if (!className) return { className:'', perkState:'none', xpBonus:0, goldBonus:0, reason:'', classBonusPercent:0, affinityStats:[] }; if (!condition) return { className:className, perkState:'not-triggered', xpBonus:0, goldBonus:0, reason:'', classBonusPercent:info.percent || 0, affinityStats:info.affinity.values }; if (info.state === 'locked') return { className:className, perkState:'locked', xpBonus:0, goldBonus:0, reason:'Requires ' + info.requirement, classBonusPercent:0, affinityStats:info.affinity.values }; return { className:className, perkState:'triggered', xpBonus:Math.max(1, Math.round(base * info.percent / 100)), goldBonus:0, reason:reason, classBonusPercent:info.percent, affinityStats:info.affinity.values } }
  function session(session, baseXP) { var className = name(), current = book(session.bookId), result; if (className === 'Scholar') result = response(className, baseXP, ['challenging','hard','brutal'].indexOf(String(current.difficulty || '').toLowerCase()) !== -1, 'Scholar challenge bonus'); else if (className === 'Mage') result = response(className, baseXP, !genreRecent(current.genre, session), 'Mage discovery bonus'); else if (className === 'Rogue') result = response(className, baseXP, minutes(session) >= 10 && minutes(session) < 45, 'Rogue quick-session bonus'); else if (className === 'Bard') result = response(className, baseXP, priorDay(session), 'Bard consecutive-day bonus'); else result = response(className, baseXP, false, ''); return result; }
  function completion(current, baseGold) { var className = name(), genre = String(current.genre || '').toLowerCase(), count = library().filter(function (item) { return String(item.genre || '').toLowerCase() === genre; }).length, raw; if (className === 'Warrior') raw = response(className, baseGold, true, 'Warrior completion bonus'); else if (className === 'Ranger') raw = response(className, baseGold, !!genre && count < 2, 'Ranger trailblazer bonus'); else raw = response(className, baseGold, false, ''); raw.goldBonus = raw.xpBonus; raw.xpBonus = 0; return raw; }
  window.BookShelfClassRules = { session:session, completion:completion, perk:perk, affinities:AFFINITIES };
})();