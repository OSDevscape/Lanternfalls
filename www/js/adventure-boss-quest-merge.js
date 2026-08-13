(function () {
  function currentQuestCard(content) {
    return Array.prototype.filter.call(content.querySelectorAll('.adventure-card'), function (card) {
      return ((card.querySelector('.adventure-label') || {}).textContent || '').trim() === 'Current Reading Quest';
    })[0] || null;
  }

  function merge() {
    var page = document.getElementById('navPlaceholder');
    if (!page || !page.classList.contains('adventure-page')) return;
    var content = page.querySelector('.adventure-content');
    if (!content) return;

    var quest = currentQuestCard(content);
    if (quest) quest.remove();

    var boss = content.querySelector('.adventure-combat-card');
    if (!boss) return;

    var label = boss.querySelector('.adventure-boss-top .adventure-label');
    var bookTitle = boss.querySelector('.adventure-boss-top .adventure-muted');
    if (label) label.textContent = 'Current Reading Quest · Book Boss';
    if (bookTitle) bookTitle.classList.add('adventure-boss-book-title');
  }

  function install() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.dataset.adventureBossQuestMergeReady) return;
    page.dataset.adventureBossQuestMergeReady = 'true';

    var style = document.createElement('style');
    style.textContent = '.adventure-combat-card .adventure-boss-book-title{margin-top:5px;color:var(--paper-light,#F6F1E4);font:15px Georgia,serif}.adventure-combat-card .adventure-boss-book-title:before{content:"Reading: ";color:var(--muted,#8A8378);font:11px var(--font-body,-apple-system)}';
    document.head.appendChild(style);

    new MutationObserver(function () { setTimeout(merge, 0); }).observe(page, { childList:true, subtree:true });
    window.addEventListener('bookshelf-reading-log-changed', merge);
    merge();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();