(function () {
  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || fallback); } catch (_) { return JSON.parse(fallback); } }
  function levelFor(xp) { return Math.max(1, Math.floor(Math.sqrt((Math.max(0, Number(xp) || 0) + 100) / 100))); }
  function latestSkillResult(className) {
    var transactions = (read('bookshelf-adventure-ledger-v1', '{"transactions":{}}').transactions || {});
    return Object.keys(transactions).map(function (key) { return transactions[key]; }).filter(function (item) {
      return item && item.className === className && item.type !== 'reversal' && item.status === 'claimed';
    }).sort(function (a, b) { return String(b.createdAt || '').localeCompare(String(a.createdAt || '')); })[0] || null;
  }
  function characterCard(content) {
    return Array.prototype.filter.call(content.querySelectorAll('.adventure-card'), function (card) {
      return ((card.querySelector('.adventure-label') || {}).textContent || '').trim() === 'Character';
    })[0] || null;
  }
  function render() {
    var page = document.getElementById('navPlaceholder');
    if (!page || !page.classList.contains('adventure-page')) return;
    var content = page.querySelector('.adventure-content'), rules = window.BookShelfClassRules;
    if (!content || !rules) return;
    Array.prototype.forEach.call(content.querySelectorAll('.adventure-skill-panel'), function (panel) { panel.remove(); });

    var adventureProfile = read('bookshelf-adventure-v1', '{}');
    var readingProfile = read('bookshelf-reading-profile-v1', '{}');
    var className = String(adventureProfile.className || '');
    var card = characterCard(content);
    if (!className || !card) return;

    var heading = card.querySelector('h2');
    var subheading = card.querySelector('.adventure-muted');
    if (heading) heading.textContent = (readingProfile.name || adventureProfile.name || 'Your Reader') + ' · Level ' + levelFor(read('bookshelf-adventure-progression-v1', '{}').xp);
    if (subheading) subheading.textContent = '';

    var perk = rules.perk(className), last = latestSkillResult(className);
    var state = perk.state === 'locked' ? 'Locked' : 'Ready';
    var detail = perk.state === 'locked' ? 'Requires ' + (perk.requirement || '') : '+' + perk.percent + '% bonus ready for its class condition.';
    if (last && last.perkState === 'triggered') {
      state = 'Triggered';
      detail = (last.classBonusReason || 'Class skill triggered') + ' · +' + (Number(last.xpBonus) || 0) + ' XP' + ((Number(last.goldBonus) || 0) ? ' · +' + Number(last.goldBonus) + ' gold' : '');
    } else if (last && last.perkState === 'not-triggered') {
      state = 'Not triggered';
      detail = '+' + perk.percent + '% is ready, but the last reward did not meet the class condition.';
    }

    var panel = document.createElement('div');
    panel.className = 'adventure-skill-panel';
    panel.innerHTML = '<div class="adventure-skill-top"><div><span class="adventure-label">Class Skill</span><h3>' + className + ' Passive</h3><p>Affinity: ' + perk.affinity.names.map(function (name, index) { return name.toUpperCase() + ' ' + perk.affinity.values[index]; }).join(' · ') + '</p></div><b class="skill-state skill-' + state.toLowerCase().replace(/\s+/g, '-') + '">' + state + '</b></div><p class="adventure-skill-detail">' + detail + '</p><p class="adventure-skill-bonus">Bonus <b>+' + (perk.percent || 0) + '%</b></p>';
    var progress = card.querySelector('.adventure-progression-card');
    if (progress) card.insertBefore(panel, progress);
    else card.appendChild(panel);
  }
  function install() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.dataset.adventureSkillPanelReady) return;
    page.dataset.adventureSkillPanelReady = 'true';
    var style = document.createElement('style');
    style.textContent = '.adventure-card>.adventure-muted:empty{display:none}.adventure-skill-panel{margin-top:13px;padding-top:13px;border-top:1px solid rgba(168,130,60,.25)}.adventure-skill-top{display:flex;justify-content:space-between;gap:12px;align-items:start}.adventure-skill-top h3{margin:5px 0 2px;font:17px Georgia,serif}.adventure-skill-top p{margin:0;color:var(--muted,#8A8378);font-size:11px}.skill-state{padding:5px 8px;border:1px solid var(--gold,#A8823C);border-radius:3px;color:var(--gold,#A8823C);font-size:10px;text-transform:uppercase;white-space:nowrap}.skill-locked{border-color:#bd7070;color:#e3a0a0}.skill-triggered{border-color:#79bd8d;color:#79bd8d}.adventure-skill-detail{margin:12px 0 3px;color:var(--muted,#8A8378);font-size:12px;line-height:1.4}.adventure-skill-bonus{margin:0;color:var(--muted,#8A8378);font-size:12px;font-weight:bold}.adventure-skill-bonus b{color:var(--accent,#4A90E2)}';
    document.head.appendChild(style);
    new MutationObserver(function () { setTimeout(render, 0); }).observe(page, { childList:true });
    window.addEventListener('bookshelf-adventure-claim-complete', render);
    window.addEventListener('bookshelf-adventure-completion-claimed', render);
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();