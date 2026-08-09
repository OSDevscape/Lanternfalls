(function () {
  var activeCard = null;

  function installBookPreview() {
    var style = document.createElement('style');
    style.textContent =
      '#bookPreviewModal{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.82)}' +
      '#bookPreviewModal.hidden{display:none!important}' +
      '#bookPreviewPanel{position:relative;width:min(390px,100%);max-height:90vh;overflow:auto;padding:24px;background:#F6F1E4;color:#2A241E;border-left:6px solid #A8823C;border-radius:3px;box-shadow:0 10px 32px #000}' +
      '#bookPreviewPanel img{display:block;width:150px;max-height:230px;object-fit:contain;margin:0 auto 18px;border-radius:2px;box-shadow:0 2px 8px rgba(0,0,0,.35)}' +
      '#bookPreviewTitle{margin:0 0 5px;font:700 24px Georgia,serif}' +
      '#bookPreviewAuthor{margin:0 0 14px;color:#55493C;font-size:13px;text-transform:uppercase}' +
      '#bookPreviewMeta{margin:0 0 18px;color:#55493C;font:12px monospace;line-height:1.6}' +
      '#bookPreviewEdit{width:100%;padding:12px;border:0;border-radius:3px;background:#8B3A3A;color:#F6F1E4;font:600 15px -apple-system,Segoe UI,sans-serif;cursor:pointer}' +
      '#bookPreviewClose{position:absolute;top:7px;right:9px;border:0;background:none;color:#55493C;font-size:28px;cursor:pointer}';
    document.head.appendChild(style);

    var modal = document.createElement('div');
    modal.id = 'bookPreviewModal';
    modal.className = 'hidden';
    modal.innerHTML = '<div id="bookPreviewPanel" role="dialog" aria-modal="true" aria-label="Book preview"><button id="bookPreviewClose" type="button" aria-label="Close preview">×</button><img id="bookPreviewCover" alt="Book cover"><h2 id="bookPreviewTitle"></h2><p id="bookPreviewAuthor"></p><p id="bookPreviewMeta"></p><button id="bookPreviewEdit" type="button">Edit entry</button></div>';
    document.body.appendChild(modal);

    var cover = document.getElementById('bookPreviewCover');
    var title = document.getElementById('bookPreviewTitle');
    var author = document.getElementById('bookPreviewAuthor');
    var meta = document.getElementById('bookPreviewMeta');

    function close() {
      modal.classList.add('hidden');
      activeCard = null;
    }

    document.getElementById('bookPreviewClose').onclick = close;
    modal.onclick = function (event) { if (event.target === modal) close(); };
    document.getElementById('bookPreviewEdit').onclick = function () {
      var card = activeCard;
      close();
      if (card && typeof card.onclick === 'function') card.onclick();
    };

    document.addEventListener('click', function (event) {
      var card = event.target.closest('.book-card');
      if (!card || modal.contains(card)) return;
      event.preventDefault();
      event.stopImmediatePropagation();

      activeCard = card;
      var thumbnail = card.querySelector('.book-cover');
      var cardTitle = card.querySelector('.book-title');
      var cardAuthor = card.querySelector('.book-author');
      var cardMeta = card.querySelector('.book-meta');

      title.textContent = cardTitle ? cardTitle.textContent : 'Untitled';
      author.textContent = cardAuthor ? cardAuthor.textContent : '';
      meta.textContent = cardMeta ? cardMeta.textContent : '';
      if (thumbnail && thumbnail.src) {
        cover.src = thumbnail.currentSrc || thumbnail.src;
        cover.style.display = 'block';
      } else {
        cover.removeAttribute('src');
        cover.style.display = 'none';
      }
      modal.classList.remove('hidden');
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installBookPreview);
  else installBookPreview();
})();