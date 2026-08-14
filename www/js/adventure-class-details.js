(function () {
  var PROFILE_KEY = 'bookshelf-adventure-v1';
  var previewClass = '';
  var CLASS_INFO = {
    Scholar: { affinity: 'INT / WIS', benefit: 'XP bonus from Challenging, Deep Read, and Intense Read books', condition: 'Read a book with Challenging, Hard, or Brutal difficulty', note: 'Knowledge, consistency, and mastery.' },
    Warrior: { affinity: 'STR / VIT', benefit: 'Completion gold bonus', condition: 'Claim a completed-book reward', note: 'Persistence and long reading sessions.' },
    Mage: { affinity: 'INT / LCK', benefit: 'XP bonus for genre discovery', condition: 'Read a genre not logged in the previous 7 days', note: 'Imagination and genre exploration.' },
    Rogue: { affinity: 'DEX / LCK', benefit: 'XP bonus for quick sessions', condition: 'Log a session from 10 through 44 minutes', note: 'Speed, variety, and precision.' },
    Ranger: { affinity: 'DEX / WIS', benefit: 'Completion gold bonus in underexplored genres', condition: 'Finish a book in a genre with fewer than 2 library books', note: 'Exploration and breadth.' },
    Bard: { affinity: 'WIS / LCK', benefit: 'XP bonus for consecutive-day reading', condition: 'Log reading on the day after another reading day', note: 'Stories, emotion, and consistency.' }
  };

  function profile() {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); }
    catch (_) { return {}; }
  }

  function saveProfile(value) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(value));
  }

  function perkInfo(className) {
    var rules = window.BookShelfClassRules;
    return rules && rules.perk ? rules.perk(className) : { state: 'none', percent: 0, affinity: { values: [] } };
  }

  function tooltipButton(message, label) {
    return '<button type="button" class="adventure-class-tooltip" data-tooltip="' + message + '" aria-label="' + label + '" aria-expanded="false">ⓘ</button>';
  }

  function statusText(info) {
    if (info.state === 'locked') return 'Locked — raise both affinity stats to 12';
    if (info.state === 'ready') return 'Ready — ' + info.percent + '% when its condition is met';
    return 'Choose this class to view its perk state.';
  }

  function render() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.classList.contains('hidden') || !page.classList.contains('adventure-page')) return;

    var choices = page.querySelector('.adventure-classes');
    if (!choices) return;

    var savedClass = profile().className || '';
    var selectedName = previewClass || savedClass || 'Scholar';
    var detail = CLASS_INFO[selectedName];
    var perk = perkInfo(selectedName);

    Array.prototype.forEach.call(choices.querySelectorAll('[data-adventure-class]'), function (button) {
      var name = button.dataset.adventureClass;
      var info = CLASS_INFO[name];
      if (!info) return;
      button.classList.toggle('selected', savedClass === name);
      button.innerHTML = '<b>' + name + '</b><span>' + info.affinity + '</span>';
      button.removeAttribute('data-tooltip');
      button.removeAttribute('aria-expanded');
      button.setAttribute('aria-label', 'Preview ' + name + ' class details');
    });

    var old = choices.parentNode.querySelector('.adventure-class-details');
    if (old) old.remove();

    var affinityValues = (perk.affinity && perk.affinity.values) || [];
    var affinityValueText = affinityValues.length ? 'Current: ' + affinityValues.join(' / ') : 'Current values unavailable';
    var panel = document.createElement('div');
    panel.className = 'adventure-class-details';
    panel.innerHTML =
      '<strong>' + selectedName + ' ' + tooltipButton('Affinity: ' + detail.affinity + '. ' + detail.benefit + '. Trigger: ' + detail.condition + '.', 'About ' + selectedName + ' class') + '</strong>' +
      '<span class="adventure-class-affinity">Affinity: ' + detail.affinity + ' ' + tooltipButton('Both affinity stats must reach at least 12 before this class perk can trigger. ' + affinityValueText + '.', 'About ' + selectedName + ' affinity') + '</span>' +
      '<p>' + detail.note + '</p>' +
      '<div class="adventure-class-benefit"><b>Passive Benefit ' + tooltipButton('The perk is locked until both affinity stats are 12 or higher. Once unlocked, its bonus starts at 5% and can scale up to 12% as both affinity stats increase.', 'About class perk scaling') + '</b><span>' + detail.benefit + '</span><small>Trigger: ' + detail.condition + '</small><small class="adventure-class-perk-state">' + statusText(perk) + '</small></div>' +
      '<button type="button" class="adventure-class-choose" data-confirm-class="' + selectedName + '" data-tooltip="Makes ' + selectedName + ' your active class. This changes which eligible class bonus can apply to future rewards; it does not change your reading history." aria-label="Choose ' + selectedName + ' as your class" aria-expanded="false">' +
      (savedClass === selectedName ? 'Current Class' : 'Choose ' + selectedName) +
      '</button>';
    choices.insertAdjacentElement('afterend', panel);

    var choose = panel.querySelector('[data-confirm-class]');
    choose.disabled = savedClass === selectedName;
    choose.onclick = function () {
      var updated = profile();
      updated.className = selectedName;
      saveProfile(updated);
      previewClass = '';
      window.dispatchEvent(new Event('bookshelf-adventure-class-changed'));
      render();
    };
  }

  function install() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.dataset.classDetailsReady) return;
    page.dataset.classDetailsReady = 'true';

    var style = document.createElement('style');
    style.textContent = '.adventure-classes .adventure-class{min-height:55px;text-align:left}.adventure-classes .adventure-class b,.adventure-classes .adventure-class span{display:block}.adventure-classes .adventure-class span{margin-top:3px;opacity:.78;font-size:10px}.adventure-class-details{margin-top:12px;padding:12px;border-left:3px solid var(--gold,#A8823C);background:rgba(0,0,0,.14)}.adventure-class-details>strong{display:block;font:17px Georgia,serif}.adventure-class-affinity{display:block;margin-top:3px;color:var(--gold,#A8823C);font-size:11px}.adventure-class-tooltip{display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;margin-left:4px;padding:0;border:1px solid currentColor;border-radius:50%;background:transparent;color:inherit;font:700 10px/1 sans-serif;vertical-align:middle;cursor:pointer}.adventure-class-tooltip:focus-visible{outline:2px solid currentColor;outline-offset:2px}.adventure-class-details p{margin:7px 0;color:var(--muted,#8A8378);font-size:12px;line-height:1.4}.adventure-class-benefit{padding-top:8px;border-top:1px solid rgba(168,130,60,.18)}.adventure-class-benefit b,.adventure-class-benefit span,.adventure-class-benefit small{display:block}.adventure-class-benefit b{color:var(--gold,#A8823C);font-size:11px;text-transform:uppercase}.adventure-class-benefit span{margin-top:3px;font-size:12px}.adventure-class-benefit small{margin-top:5px;color:var(--muted,#8A8378);font-size:11px;line-height:1.35}.adventure-class-perk-state{color:var(--paper-light,#F6F1E4)!important}.adventure-class-choose{width:100%;margin-top:12px;padding:10px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4)}.adventure-class-choose:disabled{opacity:.5;background:transparent}';
    document.head.appendChild(style);

    page.addEventListener('click', function (event) {
      var choice = event.target.closest('[data-adventure-class]');
      if (!choice || !page.classList.contains('adventure-page')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      previewClass = choice.dataset.adventureClass;
      render();
    }, true);

    new MutationObserver(function () {
      setTimeout(render, 0);
    }).observe(page, { childList: true });

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();