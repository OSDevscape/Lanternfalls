(function() {
  function json(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch (_) { return JSON.parse(fallback); }
  }
  
  function cover(isbn) {
    var id = String(isbn || '').replace(/[^0-9Xx]/g, '');
    return id ? 'https://covers.openlibrary.org/b/isbn/' + encodeURIComponent(id) + '-S.jpg?default=false' : '';
  }
  
  function openOriginalLibraryPreview(book) {
    document.querySelectorAll('#dash-series-modal, #dash-book-preview').forEach(function(modal) {
      modal.remove();
    });
    
    var dashboard = document.getElementById('dashboard');
    if (dashboard) dashboard.classList.add('hidden');
    
    function findBookCard() {
      var cards = Array.prototype.slice.call(document.querySelectorAll('.book-card'));
      return cards.filter(function(card) {
        var title = card.querySelector('.book-title');
        var author = card.querySelector('.book-author');
        return title &&
          title.textContent.trim() === String(book.title || '').trim() &&
          (!book.author || (author && author.textContent.trim() === String(book.author).trim()));
      })[0];
    }
    
    var card = findBookCard();
    if (card) {
      card.click();
      return;
    }
    
    var search = document.getElementById('searchInput');
    if (!search) return;
    search.value = book.title || '';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    setTimeout(function() {
      var matchingCard = findBookCard();
      if (matchingCard) matchingCard.click();
    }, 50);
  }
  
  function makeBookRow(entry) {
    var book = entry.book;
    var row = document.createElement('article');
    row.className = 'dash-series-book';
    row.tabIndex = 0;
    row.setAttribute('role', 'button');
    row.setAttribute('aria-label', 'Open ' + (book.title || 'book') + ' in Library');
    
    var image = document.createElement('img');
    image.src = cover(book.isbn);
    image.alt = '';
    image.onerror = function() { image.style.display = 'none'; };
    
    var text = document.createElement('div');
    var volume = document.createElement('span');
    volume.className = 'dash-series-volume';
    volume.textContent = entry.number ? 'Book ' + entry.number : 'Unnumbered';
    var title = document.createElement('h3');
    title.textContent = book.title || 'Untitled';
    var author = document.createElement('p');
    author.textContent = book.author || 'Unknown author';
    text.append(volume, title, author);
    row.append(image, text);
    
    row.onclick = function() { openOriginalLibraryPreview(book); };
    row.onkeydown = function(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openOriginalLibraryPreview(book);
      }
    };
    return row;
  }
  
  function openSeries(name, entries) {
    var existing = document.getElementById('dash-series-modal');
    if (existing) existing.remove();
    
    var sorted = entries.slice().sort(function(a, b) {
      if (!a.number && !b.number) return String(a.book.title || '').localeCompare(String(b.book.title || ''));
      if (!a.number) return 1;
      if (!b.number) return -1;
      return a.number - b.number;
    });
    
    var modal = document.createElement('div');
    modal.id = 'dash-series-modal';
    modal.className = 'dash-series-modal';
    
    var dialog = document.createElement('div');
    dialog.className = 'dash-series-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', name + ' series');
    
    var header = document.createElement('header');
    header.className = 'dash-series-modal-head';
    var heading = document.createElement('div');
    var label = document.createElement('span');
    label.textContent = 'Series';
    var title = document.createElement('h2');
    title.textContent = name;
    heading.append(label, title);
    
    var close = document.createElement('button');
    close.className = 'dash-series-close';
    close.type = 'button';
    close.textContent = 'X';
    close.setAttribute('aria-label', 'Close series');
    header.append(heading, close);
    
    var list = document.createElement('main');
    list.className = 'dash-series-list';
    sorted.forEach(function(entry) {
      list.appendChild(makeBookRow(entry));
    });
    
    dialog.append(header, list);
    modal.appendChild(dialog);
    document.body.appendChild(modal);
    
    close.onclick = function() { modal.remove(); };
    modal.onclick = function(event) {
      if (event.target === modal) modal.remove();
    };
  }
  
  function update() {
    var dashboard = document.getElementById('dashboard');
    if (!dashboard || dashboard.classList.contains('hidden')) return;
    
    var heading = Array.prototype.slice.call(dashboard.querySelectorAll('.dash-card h2')).filter(function(h2) {
      return h2.textContent.trim() === 'Series';
    })[0];
    if (!heading) return;
    
    var card = heading.closest('.dash-card');
    var books = json('bookshelf-data', '{"books":[]}').books || [];
    var metadata = json('bookshelf-metadata-v12', '{}');
    var groups = {};
    
    books.forEach(function(book) {
      var meta = metadata[book.id] || {};
      var series = String(meta.series || book.series || '').trim();
      if (!series) return;
      if (!groups[series]) groups[series] = [];
      groups[series].push({
        book: book,
        number: Number(meta.seriesNumber || book.seriesNumber || 0)
      });
    });
    
    card.querySelectorAll('.dash-series-data').forEach(function(element) {
      element.remove();
    });
    
    var body = document.createElement('div');
    body.className = 'dash-series-data';
    var names = Object.keys(groups).sort(function(a, b) { return a.localeCompare(b); });
    
    if (!names.length) {
      body.innerHTML = '<div class="dash-muted">No series added yet.</div>';
    } else {
      names.forEach(function(name) {
        var entries = groups[name].slice().sort(function(a, b) {
          return a.number - b.number;
        });
        var row = document.createElement('div');
        row.className = 'dash-series-row';
        row.tabIndex = 0;
        row.setAttribute('role', 'button');
        row.setAttribute('aria-label', 'Open ' + name + ' series');
        
        var image = document.createElement('img');
        image.src = cover(entries[0].book.isbn);
        image.alt = '';
        image.onerror = function() { image.style.display = 'none'; };
        
        var text = document.createElement('div');
        var title = document.createElement('strong');
        title.textContent = name;
        var count = document.createElement('span');
        count.textContent = entries.length + ' book' + (entries.length === 1 ? '' : 's');
        text.append(title, count);
        row.append(image, text);
        
        row.onclick = function() { openSeries(name, entries); };
        row.onkeydown = function(event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openSeries(name, entries);
          }
        };
        body.appendChild(row);
      });
    }
    
    card.appendChild(body);
  }
  
  function install() {
    var style = document.createElement('style');
    style.textContent = '.dash-series-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid rgba(168,130,60,.2);cursor:pointer}.dash-series-row:hover strong,.dash-series-row:focus strong{color:var(--gold,#A8823C)}.dash-series-row:focus,.dash-series-book:focus{outline:1px solid var(--gold,#A8823C);outline-offset:2px}.dash-series-row img{width:36px;height:52px;object-fit:cover;border-radius:2px}.dash-series-row strong{display:block;color:var(--paper-light,#F6F1E4);font:600 14px Georgia,serif}.dash-series-row span{display:block;margin-top:2px;color:var(--muted,#8A8378);font-size:12px}.dash-series-modal{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.72);display:flex;align-items:flex-end;justify-content:center;padding:16px}.dash-series-dialog{width:min(620px,100%);max-height:85vh;overflow:auto;background:var(--bg-elevated,#1B2129);border:1px solid var(--gold,#A8823C);border-radius:6px;color:var(--paper-light,#F6F1E4)}.dash-series-modal-head{position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;padding:18px 20px;background:var(--bg-elevated,#1B2129);border-bottom:1px solid rgba(168,130,60,.3);z-index:1}.dash-series-modal-head span,.dash-series-volume{color:var(--gold,#A8823C);font-size:12px;text-transform:uppercase;letter-spacing:.08em}.dash-series-modal-head h2{margin:3px 0 0;font:24px Georgia,serif}.dash-series-close{border:1px solid var(--gold,#A8823C);border-radius:3px;background:transparent;color:var(--paper-light,#F6F1E4);font-size:17px;line-height:1;padding:8px 10px}.dash-series-list{padding:8px 20px 24px}.dash-series-book{display:flex;gap:14px;padding:14px 0;border-bottom:1px solid rgba(168,130,60,.2);cursor:pointer}.dash-series-book img{width:52px;height:76px;flex:0 0 52px;object-fit:cover;border-radius:2px;background:var(--bg,#14181C)}.dash-series-book h3{margin:4px 0;font:18px Georgia,serif}.dash-series-book p{margin:0;color:var(--muted,#8A8378);font-size:13px}';
    document.head.appendChild(style);
    
    var dashboard = document.getElementById('dashboard');
    if (!dashboard) {
      setTimeout(install, 150);
      return;
    }
    
    new MutationObserver(function() {
      setTimeout(update, 0);
    }).observe(dashboard, { childList: true });
    
    update();
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();