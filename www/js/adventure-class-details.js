(function () {
  var PROFILE_KEY = 'bookshelf-adventure-v1';
  var previewClass = '';
  var CLASS_INFO = {
    Scholar: { affinity: 'INT / WIS', benefit: '+5% XP from Challenging, Hard, and Brutal books', note: 'Knowledge, consistency, and mastery.' },
    Warrior: { affinity: 'STR / VIT', benefit: '+5% display damage and completion gold', note: 'Persistence and long reading sessions.' },
    Mage: { affinity: 'INT / LCK', benefit: '+5% XP for a genre not read in the previous 7 days', note: 'Imagination and genre exploration.' },
    Rogue: { affinity: 'DEX / LCK', benefit: '+5% XP on quick 10+ minute sessions', note: 'Speed, variety, and precision.' },
    Ranger: { affinity: 'DEX / WIS', benefit: '+5% completion rewards in underexplored genres', note: 'Exploration and breadth.' },
    Bard: { affinity: 'WIS / LCK', benefit: '+5% XP on consecutive-day reading sessions', note: 'Stories, emotion, and consistency.' }
  };

  function profile() {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); }
    catch (_) { return {}; }
  }

  function saveProfile(value) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(value));
  }

  function render() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.classList.contains('hidden') || !page.classList.contains('adventure-page')) return;

    var choices = page.querySelector('.adventure-classes');
    if (!choices) return;

    Array.prototype.forEach.call(choices.querySelectorAll('[data-adventure-class]'), function (button) {
      var info = CLASS_INFO[button.dataset.adventureClass];
      if (!info) return;
      button.innerHTML = '<b>' + button.dataset.adventureClass + '</b><span>' + info.affinity + '</span>';
      button.title = 'View ' + button.dataset.adventureClass + ' details';
    });

    var old = choices.parentNode.querySelector('.adventure-class-details');
    if (old) old.remove();

    var savedClass = profile().className || '';
    var selectedName = previewClass || savedClass || 'Scholar';
    var detail = CLASS_INFO[selectedName];
    var panel = document.createElement('div');
    panel.className = 'adventure-class-details';
    panel.innerHTML =
      '<strong>' + selectedName + '</strong>' +
      '<span class="adventure-class-affinity">Affinity: ' + detail.affinity + '</span>' +
      '<p>' + detail.note + '</p>' +
      '<div class="adventure-class-benefit"><b>Passive Benefit</b><span>' + detail.benefit + '</span></div>' +
      '<button type="button" class="adventure-class-choose" data-confirm-class="' + selectedName + '">' +
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
      render();
    };
  }

  function install() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.dataset.classDetailsReady) return;
    page.dataset.classDetailsReady = 'true';

    var style = document.createElement('style');
    style.textContent = '.adventure-classes .adventure-class{min-height:55px;text-align:left}.adventure-classes .adventure-class b,.adventure-classes .adventure-class span{display:block}.adventure-classes .adventure-class span{margin-top:3px;opacity:.78;font-size:10px}.adventure-class-details{margin-top:12px;padding:12px;border-left:3px solid var(--gold,#A8823C);background:rgba(0,0,0,.14)}.adventure-class-details>strong{display:block;font:17px Georgia,serif}.adventure-class-affinity{display:block;margin-top:3px;color:var(--gold,#A8823C);font-size:11px}.adventure-class-details p{margin:7px 0;color:var(--muted,#8A8378);font-size:12px;line-height:1.4}.adventure-class-benefit{padding-top:8px;border-top:1px solid rgba(168,130,60,.18)}.adventure-class-benefit b,.adventure-class-benefit span{display:block}.adventure-class-benefit b{color:var(--gold,#A8823C);font-size:11px;text-transform:uppercase}.adventure-class-benefit span{margin-top:3px;font-size:12px}.adventure-class-choose{width:100%;margin-top:12px;padding:10px;border:1px solid var(--gold,#A8823C);border-radius:3px;background:var(--accent,#8B3A3A);color:var(--paper-light,#F6F1E4)}.adventure-class-choose:disabled{opacity:.5;background:transparent}';
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