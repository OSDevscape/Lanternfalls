const STORAGE_FILE = 'books.json';
const LOCAL_KEY = 'bookshelf-data';
const DATA_DIRECTORY = 'DATA';
const CACHE_DIRECTORY = 'CACHE';
const UTF8 = 'utf8';

function getPlugins() {
  return window.Capacitor && window.Capacitor.Plugins ? window.Capacitor.Plugins : {};
}

function isNative() {
  return !!(
    window.Capacitor &&
    window.Capacitor.isNativePlatform &&
    window.Capacitor.isNativePlatform()
  );
}

function generateId() {
  return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function normalizeBook(raw) {
  const book = raw || {};

  return {
    id: book.id || book.Id || generateId(),
    title: book.title || book.Title || '',
    author: book.author || book.Author || '',
    isbn: book.isbn || book.ISBN || book.Isbn || '',
    genre: book.genre || book.Genre || '',
    difficulty: book.difficulty || book.Difficulty || '',
    price: Math.max(
      0,
      Number(book.price !== undefined ? book.price : book.Price) || 0
    ),
    format: book.format || book.Format || '',
    status: book.status || book.Status || 'to-read',
    rating: Number(
      book.rating !== undefined ? book.rating : book.Rating
    ) || 0,
    notes: book.notes || book.Notes || '',
    dateAdded: book.dateAdded || book.DateAdded || new Date().toISOString()
  };
}

function payload(books) {
  return JSON.stringify({ version: 1.1, books: books }, null, 2);
}

function localBooks() {
  return (
    JSON.parse(localStorage.getItem(LOCAL_KEY) || '{"books":[]}').books || []
  ).map(normalizeBook);
}

async function loadBooks() {
  const plugins = getPlugins();

  if (isNative() && plugins.Filesystem) {
    try {
      const result = await plugins.Filesystem.readFile({
        path: STORAGE_FILE,
        directory: DATA_DIRECTORY,
        encoding: UTF8
      });

      const saved = JSON.parse(result.data);
      const books = (saved.books || []).map(normalizeBook);

      localStorage.setItem(LOCAL_KEY, payload(books));
      return books;
    } catch (_) {
      return localBooks();
    }
  }

  try {
    return localBooks();
  } catch (_) {
    return [];
  }
}

async function saveBooks(books) {
  const data = payload(books);
  const plugins = getPlugins();

  localStorage.setItem(LOCAL_KEY, data);

  if (isNative() && plugins.Filesystem) {
    try {
      await plugins.Filesystem.writeFile({
        path: STORAGE_FILE,
        directory: DATA_DIRECTORY,
        data: data,
        encoding: UTF8
      });
    } catch (error) {
      console.warn(
        'Native file save failed; the local app backup was saved instead.',
        error
      );
    }
  }
}

async function exportBooks(books) {
  const data = payload(books);
  const plugins = getPlugins();

  if (isNative() && plugins.Filesystem) {
    try {
      const fileName = 'bookshelf-export-' + Date.now() + '.json';

      await plugins.Filesystem.writeFile({
        path: fileName,
        directory: CACHE_DIRECTORY,
        data: data,
        encoding: UTF8
      });

      const uri = await plugins.Filesystem.getUri({
        path: fileName,
        directory: CACHE_DIRECTORY
      });

      if (plugins.Share) {
        await plugins.Share.share({
          title: 'Book Shelf export',
          url: uri.uri
        });

        return;
      }
    } catch (error) {
      console.warn(
        'Native export failed; falling back to a browser download.',
        error
      );
    }
  }

  const url = URL.createObjectURL(
    new Blob([data], { type: 'application/json' })
  );

  const link = document.createElement('a');
  link.href = url;
  link.download = 'bookshelf-export.json';

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function mergeBooks(existing, incomingRaw) {
  const rawBooks = Array.isArray(incomingRaw)
    ? incomingRaw
    : ((incomingRaw && incomingRaw.books) || []);

  const byId = new Map(
    existing.map(function (book) {
      return [book.id, book];
    })
  );

  rawBooks.map(normalizeBook).forEach(function (book) {
    byId.set(book.id, book);
  });

  return Array.from(byId.values());
}

window.BookStorage = {
  loadBooks: loadBooks,
  saveBooks: saveBooks,
  exportBooks: exportBooks,
  mergeBooks: mergeBooks,
  generateId: generateId
};