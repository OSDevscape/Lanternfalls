(function () {
  function convert(card, type) {
    if (card.dataset.collapsibleReady) return;
    card.dataset.collapsibleReady = 'true';

    var label = card.querySelector('.adventure-label');
    var heading = card.querySelector('h2');
    if (!label || !heading) return;

    var count = type === 'trophies'
      ? card.querySelectorAll('.adventure-trophy-item').length
      : card.querySelectorAll('.adventure-loot-item').length;

    var details = document.createElement('details');
    details.className = card.className + ' adventure-collapsible-card';

    var summary = document.createElement('summary');
    var title = document.createElement('div');
    title.append(label.cloneNode(true), heading.cloneNode(true));
    var status = document.createElement('em');
    status.textContent = count ? count + ' item' + (count === 1 ? '' : 's') : 'Empty';
    summary.append(title, status);

    label.remove();
    heading.remove();

    var body = document.createElement('div');
    body.className = 'adventure-collapsible-body';
    while (card.firstChild) body.appendChild(card.firstChild);

    details.append(summary, body);
    card.replaceWith(details);
  }

  function enhance() {
    var page = document.getElementById('navPlaceholder');
    if (!page || !page.classList.contains('adventure-page')) return;

    page.querySelectorAll('section.adventure-trophies-card').forEach(function (card) {
      convert(card, 'trophies');
    });

    page.querySelectorAll('section.adventure-inventory-card').forEach(function (card) {
      convert(card, 'inventory');
    });
  }

  function install() {
    var page = document.getElementById('navPlaceholder');
    if (!page || page.dataset.lootCollapsibleReady) return;
    page.dataset.lootCollapsibleReady = 'true';

    var style = document.createElement('style');
    style.textContent = '.adventure-collapsible-card summary{display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;list-style:none}.adventure-collapsible-card summary::-webkit-details-marker{display:none}.adventure-collapsible-card summary h2{margin:4px 0 0;font:20px Georgia,serif}.adventure-collapsible-card summary em{color:var(--muted,#8A8378);font:11px var(--font-body,-apple-system);font-style:normal;white-space:nowrap}.adventure-collapsible-card summary:after{content:"+";margin-left:4px;color:var(--gold,#A8823C);font-size:20px}.adventure-collapsible-card[open] summary:after{content:"−"}.adventure-collapsible-body{margin-top:12px}';
    document.head.appendChild(style);

    new MutationObserver(function () {
      setTimeout(enhance, 0);
    }).observe(page, { childList: true, subtree: true });

    enhance();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();