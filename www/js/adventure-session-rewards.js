(function () {
  var claimed = [];

  function escape(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];
    });
  }

  function fireworkBurst(overlay, number) {
    var colors = ['#ffd369', '#ff7a18', '#ff4d6d', '#9c6bff', '#25c8ff', '#a9e34b'];
    var centerX = 28 + (number * 19) % 45;
    var centerY = number % 2 ? 31 : 43;

    for (var i = 0; i < 26; i += 1) {
      var angle = Math.PI * 2 * i / 26;
      var distance = 36 + Math.random() * 82;
      var pixel = document.createElement('i');
      pixel.className = 'session-reward-firework';
      pixel.style.left = centerX + '%';
      pixel.style.top = centerY + '%';
      pixel.style.setProperty('--dx', Math.cos(angle) * distance + 'px');
      pixel.style.setProperty('--dy', Math.sin(angle) * distance + 'px');
      pixel.style.setProperty('--firework-color', colors[(i + number) % colors.length]);
      overlay.appendChild(pixel);
      setTimeout(function (item) { return function () { item.remove(); }; }(pixel), 950);
    }
  }

  function fireworks(overlay) {
    for (var burst = 0; burst < 5; burst += 1) {
      setTimeout(function (number) {
        return function () {
          if (overlay.isConnected) fireworkBurst(overlay, number);
        };
      }(burst), burst * 220);
    }
  }

  function show(items) {
    if (!items.length) return;

    var old = document.getElementById('sessionRewardOverlay');
    if (old) old.remove();

    var xp = items.reduce(function (total, item) { return total + (Number(item.xp) || 0); }, 0);
    var gold = items.reduce(function (total, item) { return total + (Number(item.gold) || 0); }, 0);
    var bonuses = items.filter(function (item) { return item.classBonusReason; });
    var overlay = document.createElement('section');

    overlay.id = 'sessionRewardOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = '<div class="session-reward-card"><span class="session-reward-kicker">Reading Reward Claimed</span><h2>Quest Progress</h2><p class="session-reward-summary"></p><div class="session-reward-totals"><b>+' + xp + ' XP</b><b>+' + gold + ' gold</b></div><div class="session-reward-bonuses"></div><button type="button">Continue Adventure</button></div>';

    overlay.querySelector('.session-reward-summary').textContent = items.length === 1
      ? (items[0].bookTitle || 'Reading session') + ' · ' + items[0].minutes + ' minutes'
      : items.length + ' reading sessions claimed';

    var bonusBox = overlay.querySelector('.session-reward-bonuses');
    if (bonuses.length) {
      bonusBox.innerHTML = bonuses.map(function (item) {
        return '<p><b>' + escape(item.classBonusReason) + '</b><span>+' + (Number(item.xpBonus) || 0) + ' XP · +' + (Number(item.goldBonus) || 0) + ' gold</span></p>';
      }).join('');
    } else {
      bonusBox.innerHTML = '<p><span>No class bonus triggered this time.</span></p>';
    }

    overlay.querySelector('button').onclick = function () { overlay.remove(); };
    document.body.appendChild(overlay);
    fireworks(overlay);
  }

  function install() {
    if (!window.BookShelfRewards || window.BookShelfRewards.__sessionRewardPopup) return;

    var original = window.BookShelfRewards.claimSession;
    window.BookShelfRewards.claimSession = function (session) {
      var result = original.call(window.BookShelfRewards, session);
      if (result && result.ok && result.transaction) claimed.push(result.transaction);
      return result;
    };
    window.BookShelfRewards.__sessionRewardPopup = true;

    var style = document.createElement('style');
    style.textContent = '#sessionRewardOverlay{position:fixed;z-index:1200;inset:0;display:grid;place-items:center;padding:24px;background:rgba(3,5,8,.82);backdrop-filter:blur(5px);overflow:hidden}.session-reward-card{position:relative;z-index:2;width:min(390px,100%);padding:28px 22px;text-align:center;border:1px solid #d4a64f;border-radius:8px;background:radial-gradient(circle at 50% 0,rgba(212,166,79,.24),transparent 43%),#151a21;color:#f6f1e4;box-shadow:0 18px 60px rgba(0,0,0,.55)}.session-reward-kicker{color:#d4a64f;font-size:11px;font-weight:bold;letter-spacing:.15em;text-transform:uppercase}.session-reward-card h2{margin:10px 0 5px;font:27px Georgia,serif;color:#f5d58f}.session-reward-summary{margin:0;color:#b8b0a3;font-size:14px}.session-reward-totals{display:flex;justify-content:center;gap:22px;margin:20px 0;padding:14px;border-top:1px solid rgba(212,166,79,.25);border-bottom:1px solid rgba(212,166,79,.25)}.session-reward-totals b{color:#d4a64f;font:20px Georgia,serif}.session-reward-bonuses p{margin:7px 0;color:#b8b0a3;font-size:12px}.session-reward-bonuses b,.session-reward-bonuses span{display:block}.session-reward-bonuses b{color:#f5d58f}.session-reward-card button{width:100%;margin-top:16px;padding:11px;border:1px solid #d4a64f;border-radius:3px;background:#7c3134;color:#f6f1e4;font:inherit;font-weight:bold}.session-reward-firework{position:absolute;z-index:3;width:7px;height:7px;background:var(--firework-color);box-shadow:0 0 12px var(--firework-color);pointer-events:none;animation:session-reward-firework-pop .9s steps(8,end) forwards}@keyframes session-reward-firework-pop{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}70%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(0)}}';
    document.head.appendChild(style);

    window.addEventListener('bookshelf-adventure-claim-complete', function () {
      var items = claimed.slice();
      claimed = [];
      show(items);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();