(function () {
  function install() {
    if (document.getElementById('accentSelectionFillStyles')) return;

    var style = document.createElement('style');
    style.id = 'accentSelectionFillStyles';
    style.textContent =
      '#appearanceSettings .appearance-row [data-accent="red"]{--swatch:#8B3A3A}' +
      '#appearanceSettings .appearance-row [data-accent="blue"]{--swatch:#3976B8}' +
      '#appearanceSettings .appearance-row [data-accent="green"]{--swatch:#4C6B4F}' +
      '#appearanceSettings .appearance-row [data-accent="yellow"]{--swatch:#B88918}' +
      '#appearanceSettings .appearance-row [data-accent="teal"]{--swatch:#278A86}' +
      '#appearanceSettings .appearance-row [data-accent="purple"]{--swatch:#76539A}' +
      '#appearanceSettings .appearance-row [data-accent="orange"]{--swatch:#C66A25}' +
      '#appearanceSettings .appearance-row [data-accent="brown"]{--swatch:#76513E}' +
      '#appearanceSettings .appearance-row [data-accent="pink"]{--swatch:#C94C7C}' +
      '#appearanceSettings .appearance-row [data-accent="cyan"]{--swatch:#1D9EB7}' +
      '#appearanceSettings .appearance-row [data-accent]{background:var(--swatch)!important;border-color:var(--swatch)!important;color:#fff!important;transition:background .16s ease,color .16s ease,border-color .16s ease,box-shadow .16s ease}' +
      '#appearanceSettings .appearance-row [data-accent] .accent-dot{display:none!important}' +
      '#appearanceSettings .appearance-row [data-accent].selected{box-shadow:inset 0 0 0 2px rgba(255,255,255,.9),0 0 0 1px rgba(0,0,0,.14)}' +
      '#appearanceSettings .appearance-row [data-accent]:hover,#appearanceSettings .appearance-row [data-accent]:focus-visible{background:#fff!important;border-color:var(--swatch)!important;color:var(--swatch)!important;outline:none;box-shadow:inset 0 0 0 1px var(--swatch)}' +
      '#appearanceSettings .appearance-row [data-accent]:hover .accent-dot,#appearanceSettings .appearance-row [data-accent]:focus-visible .accent-dot{display:inline-block!important;background:var(--swatch)!important;box-shadow:0 0 0 1px rgba(0,0,0,.14)}' +
      '#appearanceSettings .appearance-row [data-appearance-mode],#viewModeSettings .view-mode-options button{background:var(--gold)!important;border-color:var(--gold)!important;color:#fff!important;transition:background .16s ease,color .16s ease,border-color .16s ease,box-shadow .16s ease}' +
      '#appearanceSettings .appearance-row [data-appearance-mode].selected,#viewModeSettings .view-mode-options button.selected{box-shadow:inset 0 0 0 2px rgba(255,255,255,.9),0 0 0 1px rgba(0,0,0,.14)}' +
      '#appearanceSettings .appearance-row [data-appearance-mode]:hover,#appearanceSettings .appearance-row [data-appearance-mode]:focus-visible,#viewModeSettings .view-mode-options button:hover,#viewModeSettings .view-mode-options button:focus-visible{background:#fff!important;border-color:var(--gold)!important;color:var(--gold)!important;outline:none;box-shadow:inset 0 0 0 1px var(--gold)}';
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();