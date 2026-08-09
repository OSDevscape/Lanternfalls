const STORAGE_FILE = 'books.json';
const LOCAL_KEY = 'bookshelf-data';

function getPlugins() {
  return window.Capacitor && window.Capacitor.Plugins ? window.Capacitor.Plugins : null;
}

function isNative() {
  return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}

function generateId() {
  return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function normalizeBook(raw) {
  const b = raw || {};
  return {
    id: b.id || b.Id || generateId(),
    title: b.title || b.Title || '',
    author: b.author || b.Author || '',
    isbn: b.isbn || b.ISBN || b.Isbn || '',
    genre: b.genre || b.Genre || '',
    price: Math.max(0, Number(b.price !== undefined ? b.price : b.Price) || 0),
    format: b.format || b.Format || '',
    status: b.status || b.Status || 'to-read',
    rating: Number(b.rating !== undefined ? b.rating : b.Rating) || 0,
    notes: b.notes || b.Notes || '',
    dateAdded: b.dateAdded || b.DateAdded || new Date().toISOString()
  };
}

function payload(books) {
  return JSON.stringify({ version: 1.1, books: books }, null, 2);
}

async function loadBooks() {
  try {
    if (isNative()) {
      const plugins = getPlugins();
      const result = await plugins.Filesystem.readFile({
        path: STORAGE_FILE,
        directory: plugins.Directory.Data,
        encoding: plugins.Encoding.UTF8
      });
      return (JSON.parse(result.data).books || []).map(normalizeBook);
    }

    return (JSON.parse(localStorage.getItem(LOCAL_KEY) || '{"books":[]}').books || []).map(normalizeBook);
  } catch (error) {
    return [];
  }
}

async function saveBooks(books) {
  const data = payload(books);

  if (isNative()) {
    const plugins = getPlugins();
    await plugins.Filesystem.writeFile({
      path: STORAGE_FILE,
      directory: plugins.Directory.Data,
      data: data,
      encoding: plugins.Encoding.UTF8
    });
  } else {
    localStorage.setItem(LOCAL_KEY, data);
  }
}

async function exportBooks(books) {
  const data = payload(books);

  if (isNative()) {
    const plugins = getPlugins();
    const fileName = 'bookshelf-export-' + Date.now() + '.json';
    await plugins.Filesystem.writeFile({
      path: fileName,
      directory: plugins.Directory.Cache,
      data: data,
      encoding: plugins.Encoding.UTF8
    });

    const uri = await plugins.Filesystem.getUri({
      path: fileName,
      directory: plugins.Directory.Cache
    });

    if (plugins.Share) {
      await plugins.Share.share({ title: 'Book Shelf export', url: uri.uri });
    }
    return;
  }

  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'bookshelf-export.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function mergeBooks(existing, incomingRaw) {
  const rawBooks = Array.isArray(incomingRaw) ? incomingRaw : ((incomingRaw && incomingRaw.books) || []);
  const byId = new Map(existing.map(function (book) { return [book.id, book]; }));
  rawBooks.map(normalizeBook).forEach(function (book) { byId.set(book.id, book); });
  return Array.from(byId.values());
}

window.BookStorage = {
  loadBooks: loadBooks,
  saveBooks: saveBooks,
  exportBooks: exportBooks,
  mergeBooks: mergeBooks,
  generateId: generateId
};