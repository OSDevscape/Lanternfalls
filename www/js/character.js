(function () {
  var PROFILE_KEY = 'bookshelf-adventure-v1';
  var GAME_KEY = 'bookshelf-adventure-progression-v1';
  var CLASSES = ['Scholar', 'Warrior', 'Mage', 'Rogue', 'Ranger', 'Bard'];

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch (_) { return JSON.parse(fallback); }
  }

  function levelFor(xp) {
    return Math.max(1, Math.floor(Math.sqrt((Math.max(0, Number(xp) || 0) + 100) / 100)));
  }

  function tooltip(text, message, label) {
    return '<span class="adventure-tooltip-label">' +
      text +
      '<button type="button" class="tooltip-trigger" data-tooltip="' + message + '" aria-label="' + (label || 'More information') + '" aria-expanded="false">ⓘ</button>' +
      '</span>';
  }

  function achievementRow(item, unlocked, progress) {
    return '<div class="adventure-achievement ' + (unlocked ? 'earned' : '') + '">' +
      '<b>' + (unlocked ? '✓' : '○') + ' ' + item.title + '</b>' +
      '<span>' + (unlocked ? 'Unlocked' : '') + (progress ? ' ' + progress : '') + '</span>' +
    '</div>';
  }

  function render() {
    var page = document.getElementById('navPlaceholder');

    if (!page || page.classList.contains('hidden')) return;
    if (!page.classList.contains('character-page')) return;

    var profile = read(PROFILE_KEY, '{}');
    var game = read(GAME_KEY, '{}');
    var chosen = profile.className || '';
    var level = levelFor(game.xp);

    var achievementData = window.BookShelfAchievements
      ? window.BookShelfAchievements.update()
      : null;

    var unlocked = achievementData ? achievementData.state.achievements : {};
    var definitions = achievementData ? achievementData.achievements : [];
    var metrics = achievementData ? achievementData.metrics : {};

    var classButtons = CLASSES.map(function (name) {
      return '<button type="button" class="adventure-class ' +
        (chosen === name ? 'selected' : '') +
        '" data-adventure-class="' + name +
        '" aria-label="Preview ' + name + ' class details">' +
        name +
      '</button>';
    }).join('');

    var achievements = definitions.map(function (item) {
      var value = metrics[item.kind] || 0;
      return achievementRow(item, !!unlocked[item.id], value + ' / ' + item.target);
    }).join('');

    page.innerHTML =
      '<header class="character-header">' +
  '<div><h1>Character</h1><p>Build the reader you are becoming.</p></div>' +
'</header>' +

        '<section class="character-card character-identity-card">' +
          '<span class="adventure-label">' +
            tooltip('Reader Character', 'Your class, level, and stats shape eligible Adventure bonuses. They never alter your reading record.', 'About your character') +
          '</span>' +
          '<h2>' + (profile.name || 'Your Reader') + '</h2>' +
          '<p class="adventure-muted">' +
            (chosen ? chosen + ' class · Level ' + level : 'Choose a class to begin your journey.') +
          '</p>' +
          '<div id="characterProgressionMount"></div>' +
        '</section>' +

        '<details class="character-card character-class-card" ' + (chosen ? '' : 'open') + '>' +
          '<summary>Choose Class <em>' + (chosen || 'None') + '</em></summary>' +
          '<p class="adventure-muted">Tap a class to preview it. Save it only by using the Choose button in its details panel. Classes shape eligible rewards and presentation; they never change your actual reading record.</p>' +
          '<div class="adventure-classes">' + classButtons + '</div>' +
        '</details>' +

        '<details class="character-card character-achievement-card">' +
          '<summary>Achievements <em>' + Object.keys(unlocked).length + ' earned</em></summary>' +
          '<p class="adventure-muted adventure-achievement-help">Achievements track milestones from your reading and Adventure activity.</p>' +
          achievements +
        '</details>' +
      '</main>';
  }

  function install() {
    var page = document.getElementById('navPlaceholder');

    if (!page || page.dataset.characterReady) return;
    page.dataset.characterReady = 'true';

    var style = document.createElement('style');
    style.textContent =
      '#navPlaceholder.character-page{display:flex;flex-direction:column;padding:0;overflow:hidden;background:var(--bg,#14181C)}' +
      '.character-header{display:flex;align-items:center;justify-content:space-between;padding:20px;border-bottom:1px solid rgba(168,130,60,.24)}' +
      '.character-header h1{margin:0;font:27px Georgia,serif}' +
      '.character-header p{margin:4px 0 0;color:var(--muted,#8A8378);font-size:12px}' + '.character-content{flex:1;overflow:auto;padding:16px 20px 130px}' +
      '.character-card{margin:0 0 13px;padding:16px;background:var(--bg-elevated,#1B2129);border:1px solid rgba(168,130,60,.28);border-radius:4px}' +
      '.character-card h2{margin:5px 0;font:21px Georgia,serif}' +
      '.character-card summary{display:flex;justify-content:space-between;cursor:pointer;font:17px Georgia,serif}' +
      '.character-card summary em{color:var(--muted,#8A8378);font:11px var(--font-body,-apple-system);font-style:normal}' +
      '.character-card .adventure-classes{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}' +
      '.character-card .adventure-class{padding:10px;border:1px solid rgba(168,130,60,.48);border-radius:3px;background:transparent;color:var(--paper-light,#F6F1E4)}' +
      '.character-card .adventure-class.selected{background:var(--gold,#A8823C);border-color:var(--gold,#A8823C)}';
    document.head.appendChild(style);

    window.addEventListener('bookshelf-navigation-changed', function (event) {
      if (event.detail && event.detail.page === 'character') {
        render();
      }
    });

    window.addEventListener('bookshelf-adventure-class-changed', render);
    window.addEventListener('bookshelf-adventure-claim-complete', render);
    window.addEventListener('bookshelf-reading-log-changed', render);

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();