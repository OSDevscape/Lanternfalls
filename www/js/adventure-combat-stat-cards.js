(function () {
  var LEDGER_KEY = 'bookshelf-adventure-ledger-v1';

  function read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || fallback);
    } catch (_) {
      return JSON.parse(fallback);
    }
  }

  function totals() {
    var ledger = read(LEDGER_KEY, '{"transactions":{}}');
    var transactions = ledger && ledger.transactions
      ? Object.keys(ledger.transactions).map(function (key) {
          return ledger.transactions[key];
        })
      : [];

    var monstersFinished = 0;
    var highestCriticalDamage = 0;

    transactions.forEach(function (transaction) {
      var battleLog = transaction && transaction.battleLog;
      var encounters = battleLog && Array.isArray(battleLog.encounters)
        ? battleLog.encounters
        : [];

      encounters.forEach(function (encounter) {
        var outcome = String(encounter.outcome || '').toLowerCase();
        var attacks = Array.isArray(encounter.attacks)
          ? encounter.attacks
          : [];

        /*
          Count only an encounter explicitly marked complete, defeated,
          victory, or slain. Retreated and survived encounters do not count.
        */
        if (
          outcome === 'complete' ||
          outcome === 'defeated' ||
          outcome === 'victory' ||
          outcome === 'slain'
        ) {
          monstersFinished += 1;
        }

        attacks.forEach(function (attack) {
          var damage = Math.max(0, Number((attack || {}).damage) || 0);

          if (
            attack &&
            attack.actor === 'player' &&
            attack.critical &&
            damage > highestCriticalDamage
          ) {
            highestCriticalDamage = damage;
          }
        });
      });
    });

    return {
      monstersFinished: monstersFinished,
      highestCriticalDamage: highestCriticalDamage
    };
  }

  function replaceCard(content, labelText, title, value, detail, tooltipMessage, tooltipLabel) {
    var cards = content.querySelectorAll('.adventure-grid .adventure-card');
    var target = null;

    Array.prototype.forEach.call(cards, function (card) {
      var label = card.querySelector('.adventure-label');

      if (
        label &&
        label.textContent.replace(/\s+/g, ' ').trim().indexOf(labelText) === 0
      ) {
        target = card;
      }
    });

    if (!target) return;

    target.innerHTML =
      '<span class="adventure-label">' +
      title +
      '<button type="button" class="adventure-combat-stat-tooltip" ' +
      'data-tooltip="' + tooltipMessage + '" ' +
      'aria-label="' + tooltipLabel + '" ' +
      'aria-expanded="false">ⓘ</button>' +
      '</span>' +
      '<h2>' + value + '</h2>' +
      '<p class="adventure-muted">' + detail + '</p>';
  }

  function render() {
    var page = document.getElementById('navPlaceholder');

    if (
      !page ||
      page.classList.contains('hidden') ||
      !page.classList.contains('adventure-page')
    ) {
      return;
    }

    var content = page.querySelector('.adventure-content');

    if (!content || page.dataset.combatStatCardsRendering) {
      return;
    }

    page.dataset.combatStatCardsRendering = 'true';

    var stats = totals();

    replaceCard(
      content,
      'Reading Streak',
      'Monsters Finished',
      stats.monstersFinished,
      'encounters defeated',
      'The number of reading encounters you finished with a defeat, victory, slain, or complete outcome. Enemies that retreat or survive are not counted.',
      'About Monsters Finished'
    );

    replaceCard(
      content,
      'Longest Streak',
      'Highest Critical Hit',
      stats.highestCriticalDamage,
      stats.highestCriticalDamage
        ? 'damage in one critical strike'
        : 'land a critical hit to set a record',
      'Your largest single critical-hit damage value from a completed reading encounter. Only player critical attacks count.',
      'About Highest Critical Hit'
    );

    page.dataset.combatStatCardsRendering = '';
  }

  function install() {
    var page = document.getElementById('navPlaceholder');

    if (!page || page.dataset.combatStatCardsReady) {
      return;
    }

    page.dataset.combatStatCardsReady = 'true';

    var style = document.createElement('style');

    style.textContent =
      '.adventure-combat-stat-tooltip{' +
      'display:inline-flex;align-items:center;justify-content:center;' +
      'width:15px;height:15px;margin-left:4px;padding:0;' +
      'border:1px solid currentColor;border-radius:50%;' +
      'background:transparent;color:inherit;' +
      'font:700 10px/1 sans-serif;vertical-align:middle;cursor:pointer' +
      '}' +
      '.adventure-combat-stat-tooltip:focus-visible{' +
      'outline:2px solid var(--gold,#A8823C);outline-offset:2px' +
      '}';

    document.head.appendChild(style);

    new MutationObserver(function (mutations) {
      var rebuilt = mutations.some(function (mutation) {
        return Array.prototype.some.call(mutation.addedNodes, function (node) {
          return node.nodeType === 1 &&
            (
              node.matches && node.matches('.adventure-content') ||
              node.querySelector && node.querySelector('.adventure-content')
            );
        });
      });

      if (rebuilt) {
        setTimeout(render, 60);
      }
    }).observe(page, {
      childList: true,
      subtree: false
    });

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