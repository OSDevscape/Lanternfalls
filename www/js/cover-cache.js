(function () {
  var DIRECTORY = 'DATA';
  var CACHE_FOLDER = 'covers';
  var CACHE_KEY = 'bookshelf-cover-cache-v1';
  var loading = {};

  function nativeFilesystem() {
    var capacitor = window.Capacitor;
    var plugins = capacitor && capacitor.Plugins;
    return capacitor && capacitor.isNativePlatform && capacitor.isNativePlatform() && plugins && plugins.Filesystem
      ? plugins.Filesystem
      : null;
  }

  function normalizeIsbn(value) {
    return String(value || '').replace(/[^0-9Xx]/g, '');
  }

  function coverUrl(isbn) {
    return 'https://covers.openlibrary.org/b/isbn/' +
      encodeURIComponent(isbn) +
      '-M.jpg?default=false&cb=' +
      Date.now();
  }

  function filePath(isbn) {
    return CACHE_FOLDER + '/' + isbn + '.jpg';
  }

  function remembered() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); }
    catch (_) { return {}; }
  }

  function remember(isbn) {
    var cached = remembered();
    cached[isbn] = true;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  }

  function base64FromBlob(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onloadend = function () {
        var value = String(reader.result || '');
        resolve(value.indexOf(',') >= 0 ? value.split(',')[1] : value);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function nativeUri(isbn) {
    var fs = nativeFilesystem();
    if (!fs) return '';

    try {
      await fs.stat({ path: filePath(isbn), directory: DIRECTORY });
      var result = await fs.getUri({ path: filePath(isbn), directory: DIRECTORY });
      return window.Capacitor.convertFileSrc(result.uri);
    } catch (_) {
      return '';
    }
  }

  async function cacheNative(isbn) {
    var fs = nativeFilesystem();
    if (!fs || !isbn) return '';

    var alreadySaved = await nativeUri(isbn);
    if (alreadySaved) return alreadySaved;
    if (loading[isbn]) return loading[isbn];

    loading[isbn] = (async function () {
      try {
        var response = await fetch(coverUrl(isbn));
        if (!response.ok) throw new Error('Cover was not found');
        var blob = await response.blob();
        if (!blob.type || blob.type.indexOf('image/') !== 0) throw new Error('Cover response was not an image');
        var base64 = await base64FromBlob(blob);

        try {
          await fs.mkdir({ path: CACHE_FOLDER, directory: DIRECTORY, recursive: true });
        } catch (_) { }

        await fs.writeFile({
          path: filePath(isbn),
          directory: DIRECTORY,
          data: base64
        });

        remember(isbn);
        return await nativeUri(isbn);
      } catch (_) {
        return '';
      } finally {
        delete loading[isbn];
      }
    })();

    return loading[isbn];
  }

  async function cachedUrl(isbn) {
    isbn = normalizeIsbn(isbn);
    if (!isbn) return '';

    var fs = nativeFilesystem();
    if (fs) return cacheNative(isbn);

    return coverUrl(isbn);
  }

  async function attach(image, isbn) {
    isbn = normalizeIsbn(isbn);
    if (!image || !isbn) return;

    var url = await cachedUrl(isbn);
    if (url && image.isConnected) image.src = url;
  }

  window.BookCoverCache = {
    attach: attach,
    cachedUrl: cachedUrl,
    normalizeIsbn: normalizeIsbn
  };
})();