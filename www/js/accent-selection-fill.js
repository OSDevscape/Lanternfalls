(function () {
  function install() {
    if (document.getElementById('accentSelectionFillStyles')) return;
    var style = document.createElement('style');
    style.id = 'accentSelectionFillStyles';
    style.textContent =
      '#appearanceSettings .appearance-row [data-accent]{position:relative;overflow:hidden}' +
      '#appearanceSettings .appearance-row [data-accent].selected{background:var(--dot)!important;border-color:var(--dot)!important;color:#fff!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.22),0 0 0 2px rgba(168,130,60,.22)}' +
      '#appearanceSettings .appearance-row [data-accent].selected .accent-dot{background:#fff!important;box-shadow:0 0 0 1px rgba(0,0,0,.2)}' +
      'html[data-theme="light"] #appearanceSettings .appearance-row [data-accent].selected{color:#fff!important}';
    document.head.appendChild(style);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();