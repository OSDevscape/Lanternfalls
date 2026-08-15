(() => {
  const S = window.BookStorage;
  let books = [], editingId = null, selectedStatus = 'to-read', selectedRating = 0;
  const $ = id => document.getElementById(id);
  const el = {
    list: $('bookList'), empty: $('emptyState'), count: $('shelfCount'), search: $('searchInput'),
    add: $('addBtn'), menu: $('menuBtn'), form: $('formView'), formTitle: $('formTitle'),
    cancel: $('formCancel'), save: $('formSave'), del: $('formDelete'), title: $('fieldTitle'),
    author: $('fieldAuthor'), isbn: $('fieldIsbn'), genre: $('fieldGenre'), difficulty: $('fieldDifficulty'),
    price: $('fieldPrice'), format: $('fieldFormat'), notes: $('fieldNotes'), statuses: $('statusGroup'),
    ratings: $('ratingGroup'), menuSheet: $('menuSheet'), menuCancel: $('menuCancel'), export: $('exportBtn'),
    import: $('importBtn'), file: $('importFile'), toast: $('toast')
  };
  const status = {
    'to-read': 'To Read',
    reading: 'Reading',
    paused: 'Paused',
    finished: 'Finished',
    abandoned: 'Abandoned',
    wishlist: 'Wishlist',
    loaned: 'Loaned Out'
  };
  const formats = { paperback: 'Paperback', 'hardback-special': 'Hardback (Special)', ebook: 'Ebook', kindle: 'Kindle', audiobook: 'Audiobook' };
  const cover = isbn => {
    const value = String(isbn || '').replace(/[^0-9Xx]/g, '');
    return value ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(value)}-M.jpg?default=false` : '';
  };

  function normalizeStatus(value) {
    const key = String(value || '').trim().toLowerCase().replace(/[ _]+/g, '-');
    const aliases = {
      'to-read': 'to-read',
      toread: 'to-read',
      reading: 'reading',
      paused: 'paused',
      finished: 'finished',
      abandoned: 'abandoned',
      'gave-up': 'abandoned',
      wishlist: 'wishlist',
      'wish-list': 'wishlist',
      loaned: 'loaned',
      'loaned-out': 'loaned'
    };
    return aliases[key] || 'to-read';
  }

  function toast(message) {
    el.toast.textContent = message;
    el.toast.classList.remove('hidden');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.toast.classList.add('hidden'), 2200);
  }

  function setStatus(value) {
    selectedStatus = normalizeStatus(value);
    el.statuses.querySelectorAll('.stamp').forEach(button => {
      button.classList.toggle('selected', normalizeStatus(button.dataset.status) === selectedStatus);
    });
  }

  function setRating(value) {
    selectedRating = value;
    el.ratings.querySelectorAll('.star').forEach(button => button.classList.toggle('filled', +button.dataset.star <= value));
  }

  function card(book) {
    const bookStatus = normalizeStatus(book.status);
    const article = document.createElement('article');
    article.className = 'book-card';
    article.dataset.bookId = book.id || '';
    article.dataset.status = bookStatus;
    article.onclick = () => open(book);

    const top = document.createElement('div');
    top.className = 'book-card-top';
    const content = document.createElement('div');
    content.className = 'book-card-content';
    const url = cover(book.isbn);

    if (url) {
      const image = new Image();
      image.className = 'book-cover';
      image.src = url;
      image.alt = `Cover of ${book.title || 'book'}`;
      image.loading = 'lazy';
      image.onerror = () => image.remove();
      content.append(image);
      if (window.BookCoverCache) window.BookCoverCache.attach(image, book.isbn);
    }

    const text = document.createElement('div');
    text.className = 'book-card-text';
    text.innerHTML = '<p class="book-title"></p><p class="book-author"></p>';
    text.children[0].textContent = book.title || 'Untitled';
    text.children[1].textContent = book.author || 'Unknown author';
    content.append(text);

    const stamp = document.createElement('span');
    stamp.className = `card-stamp status-${bookStatus}`;
    stamp.textContent = status[bookStatus];
    top.append(content, stamp);
    article.append(top);

    const price = +book.price > 0 ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(+book.price) : '';
    const meta = [book.genre, formats[book.format] || book.format, price, book.isbn].filter(Boolean);
    if (meta.length) {
      const line = document.createElement('p');
      line.className = 'book-meta';
      line.textContent = meta.join(' · ');
      article.append(line);
    }

    if (+book.rating > 0) {
      const stars = document.createElement('div');
      stars.className = 'card-stars';
      stars.textContent = '★'.repeat(book.rating) + '☆'.repeat(5 - book.rating);
      article.append(stars);
    }
    return article;
  }

  function render() {
    const query = el.search.value.trim().toLowerCase();
    const filtered = books
      .filter(book => !query || String(book.title || '').toLowerCase().includes(query) || String(book.author || '').toLowerCase().includes(query))
      .sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
    el.count.textContent = `${books.length} book${books.length === 1 ? '' : 's'} on the shelf`;
    el.list.replaceChildren();
    el.empty.classList.toggle('hidden', books.length !== 0);
    el.list.classList.toggle('hidden', books.length === 0);
    if (!books.length) return;
    if (!filtered.length) {
      el.list.textContent = `No books match “${el.search.value.trim()}”`;
      return;
    }
    filtered.forEach(book => el.list.append(card(book)));
  }

  function open(book) {
    editingId = book?.id || null;
    el.formTitle.textContent = book ? 'Edit Book' : 'New Book';
    el.del.classList.toggle('hidden', !book);
    for (const [key, node] of Object.entries({ title: el.title, author: el.author, isbn: el.isbn, genre: el.genre, difficulty: el.difficulty, price: el.price, format: el.format, notes: el.notes })) {
      node.value = book ? (key === 'price' ? (+book.price || '') : (book[key] || '')) : '';
    }
    setStatus(book?.status || 'to-read');
    setRating(book?.rating || 0);
    el.form.classList.remove('hidden');
    el.add.classList.add('hidden');
    el.title.focus();;
  }

  function close() {
    el.form.classList.add('hidden');
    el.add.classList.remove('hidden');
    editingId = null;
  }

  async function save() {
    const title = el.title.value.trim();
    if (!title) return el.title.focus();
    const prior = books.find(book => book.id === editingId);
    const book = {
      id: editingId || S.generateId(),
      title,
      author: el.author.value.trim(),
      isbn: el.isbn.value.trim(),
      genre: el.genre.value.trim(),
      difficulty: el.difficulty.value,
      price: Math.max(0, +el.price.value || 0),
      format: el.format.value,
      status: normalizeStatus(selectedStatus),
      rating: selectedRating,
      notes: el.notes.value.trim(),
      dateAdded: prior?.dateAdded || new Date().toISOString()
    };
    books = editingId ? books.map(item => item.id === editingId ? book : item) : [...books, book];
    await S.saveBooks(books);
    const update = !!editingId;
    close();
    render();
    toast(update ? 'Book updated' : 'Added to shelf');
  }

  async function remove() {
    if (!editingId) return;
    books = books.filter(book => book.id !== editingId);
    await S.saveBooks(books);
    close();
    render();
    toast('Removed from shelf');
  }

  function wire() {
    el.search.oninput = render;
    el.add.onclick = () => open();
    el.cancel.onclick = close;
    el.save.onclick = save;
    el.del.onclick = remove;
    el.statuses.onclick = event => {
      const button = event.target.closest('[data-status]');
      if (button) setStatus(button.dataset.status);
    };
    el.ratings.onclick = event => {
      const value = +event.target.dataset.star;
      if (value) setRating(value === selectedRating ? 0 : value);
    };
    el.menu.onclick = () => el.menuSheet.classList.remove('hidden');
    el.menuCancel.onclick = () => el.menuSheet.classList.add('hidden');
    el.export.onclick = () => S.exportBooks(books);
    el.import.onclick = () => el.file.click();
    el.file.onchange = () => {
      const file = el.file.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          books = S.mergeBooks(books, JSON.parse(reader.result));
          await S.saveBooks(books);
          render();
          el.menuSheet.classList.add('hidden');
          toast('Library imported');
        } catch (_) {
          toast('Could not read that JSON file');
        }
      };
      reader.readAsText(file);
      el.file.value = '';
    };
  }

  document.addEventListener('DOMContentLoaded', async () => {
    wire();
    books = (await S.loadBooks()).map(book => ({ ...book, status: normalizeStatus(book.status) }));
    render();
  });
})();