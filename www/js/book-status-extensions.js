(function () {
  var labels = { paused: 'Paused', abandoned: 'Gave Up' };
  function applyLabels() {
    document.querySelectorAll('.card-stamp').forEach(function (stamp) {
      var match = Object.keys(labels).filter(function (status) { return stamp.classList.contains('status-' + status); })[0];
      if (match) stamp.textContent = labels[match];
    });
  }
  function install() {
    var group = document.getElementById('statusGroup');
    if (!group || group.querySelector('[data-status="paused"]')) return;
    ['paused', 'abandoned'].forEach(function (status) {
      var button = document.createElement('button');
      button.type = 'button'; button.className = 'stamp stamp-' + status; button.dataset.status = status; button.textContent = labels[status]; group.appendChild(button);
    });
    var list = document.getElementById('bookList');
    if (list) new MutationObserver(applyLabels).observe(list, { childList:true, subtree:true });
    applyLabels();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();