(function () {
  function install() {
    if (document.getElementById('dashboardScrollFix')) return;
    var style = document.createElement('style');
    style.id = 'dashboardScrollFix';
    style.textContent =
      '#dashboard{display:flex!important;flex-direction:column!important;height:100dvh!important;overflow:hidden!important;touch-action:pan-y}' +
      '#dashboard .dash-head{position:relative;flex:0 0 auto}' +
      '#dashboard .dash-body{flex:1 1 auto;min-height:0;overflow-x:hidden!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain;touch-action:pan-y;padding-bottom:130px!important}';
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();