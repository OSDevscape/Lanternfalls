const ALLOWED_ORIGINS = new Set([
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
  'https://readquest.readquest-rpg.workers.dev'
]);

const CACHE_SECONDS = 60 * 60 * 24 * 30;
const OPEN_LIBRARY_MIN_INTERVAL_MS = 1000;

let lastOpenLibraryRequestAt = 0;
let openLibraryQueue = Promise.resolve();

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.has(origin)
    ? origin
    : 'capacitor://localhost';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json; charset=utf-8',
    'Vary': 'Origin'
  };
}

function jsonResponse(request, body, status, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: {
      ...corsHeaders(request),
      ...(extraHeaders || {})
    }
  });
}

function cleanText(value) {
  return String(value || '').trim();
}

function cleanIsbn(value) {
  return cleanText(value).replace(/[^0-9Xx]/g, '').toUpperCase();
}

function normalizeText(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function validIsbn(value) {
  const isbn = cleanIsbn(value);
  return isbn.length === 10 || isbn.length === 13;
}

function validSearchText(value, maxLength) {
  return cleanText(value).slice(0, maxLength || 160);
}

function cacheKeyUrl(requestUrl, title, author, isbn, more) {
  const url = new URL(requestUrl);
  url.pathname = '/api/books/cache';
  url.search = '';

  url.searchParams.set('isbn', isbn || '');
  url.searchParams.set('title', normalizeText(title));
  url.searchParams.set('author', normalizeText(author));
  url.searchParams.set('more', more ? '1' : '0');

  return url.toString();
}

function googleCover(info) {
  const links = info.imageLinks || {};
  return links.thumbnail || links.smallThumbnail || '';
}

function googleIsbn(info) {
  const identifiers = info.industryIdentifiers || [];
  const isbn13 = identifiers.find((item) => item.type === 'ISBN_13');
  const isbn10 = identifiers.find((item) => item.type === 'ISBN_10');

  return cleanIsbn(
    (isbn13 && isbn13.identifier) ||
    (isbn10 && isbn10.identifier) ||
    ''
  );
}

function mapGoogleEdition(item) {
  const info = item.volumeInfo || {};
  const published = cleanText(info.publishedDate);
  const yearMatch = published.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);

  return {
    source: 'Google Books',
    key: 'google-' + item.id,
    title: cleanText(info.title),
    subtitle: cleanText(info.subtitle),
    authors: (info.authors || []).filter(Boolean),
    publisher: cleanText(info.publisher),
    year: yearMatch ? yearMatch[0] : '',
    language: cleanText(info.language),
    pageCount: info.pageCount || '',
    description: cleanText(info.description),
    subjects: (info.categories || []).filter(Boolean),
    isbn: googleIsbn(info),
    cover: googleCover(info),
    format: cleanText(info.printType)
  };
}

function mapOpenLibraryEdition(doc) {
  const isbnList = doc.isbn || [];
  const isbn13 = isbnList.find((item) => cleanIsbn(item).length === 13);
  const isbn10 = isbnList.find((item) => cleanIsbn(item).length === 10);
  const coverId = doc.cover_i;

  return {
    source: 'Open Library',
    key: 'openlibrary-' + (doc.cover_edition_key || doc.key || crypto.randomUUID()),
    title: cleanText(doc.title),
    subtitle: '',
    authors: (doc.author_name || []).filter(Boolean),
    publisher: (doc.publisher || [])[0] || '',
    year: doc.first_publish_year || (doc.publish_year && doc.publish_year[0]) || '',
    language: (doc.language || [])[0] || '',
    pageCount: doc.number_of_pages_median || '',
    description: '',
    subjects: (doc.subject || []).slice(0, 8),
    isbn: cleanIsbn(isbn13 || isbn10 || ''),
    cover: coverId
      ? 'https://covers.openlibrary.org/b/id/' + coverId + '-M.jpg'
      : '',
    format: ''
  };
}

function isDuplicateEdition(existing, candidate) {
  const sameIsbn =
    candidate.isbn &&
    existing.isbn &&
    candidate.isbn === existing.isbn;

  const sameTitle =
    normalizeText(candidate.title) &&
    normalizeText(candidate.title) === normalizeText(existing.title);

  const sameAuthor =
    candidate.authors[0] &&
    existing.authors[0] &&
    normalizeText(candidate.authors[0]) === normalizeText(existing.authors[0]);

  return sameIsbn || (
    sameTitle &&
    sameAuthor &&
    candidate.cover === existing.cover
  );
}

function combineEditions(primary, secondary) {
  const combined = [];

  [...(primary || []), ...(secondary || [])].forEach((edition) => {
    if (!edition.title) return;

    if (!combined.some((existing) => isDuplicateEdition(existing, edition))) {
      combined.push(edition);
    }
  });

  return combined.slice(0, 20);
}

async function searchGoogleBooks(env, title, author, isbn) {
  if (!env.GOOGLE_BOOKS_API_KEY) {
    return [];
  }

  const parts = [];

  if (isbn) {
    parts.push('isbn:' + isbn);
  } else {
    if (title) parts.push('intitle:' + title);
    if (author) parts.push('inauthor:' + author);
  }

  if (!parts.length) {
    return [];
  }

  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q', parts.join('+'));
  url.searchParams.set('maxResults', '20');
  url.searchParams.set('printType', 'books');
  url.searchParams.set('key', env.GOOGLE_BOOKS_API_KEY);

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return (data.items || []).map(mapGoogleEdition);
  } catch (_) {
    return [];
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function queueOpenLibraryRequest(task) {
  openLibraryQueue = openLibraryQueue.then(async () => {
    const elapsed = Date.now() - lastOpenLibraryRequestAt;
    const delay = Math.max(0, OPEN_LIBRARY_MIN_INTERVAL_MS - elapsed);

    if (delay) {
      await wait(delay);
    }

    lastOpenLibraryRequestAt = Date.now();
    return task();
  });

  return openLibraryQueue;
}

async function searchOpenLibrary(title, author, isbn) {
  const params = new URLSearchParams();

  if (isbn) {
    params.set('isbn', isbn);
  } else {
    if (title) params.set('title', title);
    if (author) params.set('author', author);
  }

  if (![...params.keys()].length) {
    return [];
  }

  params.set('limit', '20');
  params.set(
    'fields',
    'key,title,author_name,publisher,first_publish_year,publish_year,' +
      'language,isbn,cover_i,cover_edition_key,number_of_pages_median,subject'
  );

  return queueOpenLibraryRequest(async () => {
    try {
      const response = await fetch(
        'https://openlibrary.org/search.json?' + params.toString(),
        {
          headers: {
            'User-Agent': 'ReadQuest/1.0 (book metadata lookup)'
          }
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return (data.docs || []).map(mapOpenLibraryEdition);
    } catch (_) {
      return [];
    }
  });
}

async function handleBookLookup(request, env) {
  const url = new URL(request.url);

  const isbn = cleanIsbn(url.searchParams.get('isbn'));
  const title = validSearchText(url.searchParams.get('title'));
  const author = validSearchText(url.searchParams.get('author'));
  const more = url.searchParams.get('more') === '1';

  if (isbn && !validIsbn(isbn)) {
    return jsonResponse(request, {
      error: 'Enter a valid 10- or 13-digit ISBN.'
    }, 400);
  }

  if (!isbn && !title) {
    return jsonResponse(request, {
      error: 'Provide a title or a valid ISBN.'
    }, 400);
  }

  const cache = caches.default;
  const cacheRequest = new Request(
    cacheKeyUrl(request.url, title, author, isbn, more)
  );

  const cached = await cache.match(cacheRequest);

  if (cached) {
    const response = new Response(cached.body, cached);

    Object.entries(corsHeaders(request)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    response.headers.set('X-ReadQuest-Cache', 'HIT');
    return response;
  }

  const googleEditions = await searchGoogleBooks(env, title, author, isbn);

  let editions = googleEditions;
  let provider = googleEditions.length ? 'google' : 'none';

  if (!googleEditions.length || more) {
    const openLibraryEditions = await searchOpenLibrary(title, author, isbn);
    editions = more
      ? combineEditions(googleEditions, openLibraryEditions)
      : openLibraryEditions;
    provider = openLibraryEditions.length
      ? (googleEditions.length ? 'google+openlibrary' : 'openlibrary')
      : provider;
  }

  const responseBody = {
    editions: editions,
    provider: provider,
    cached: false
  };

  const response = jsonResponse(request, responseBody, 200, {
    'Cache-Control': 'public, max-age=' + CACHE_SECONDS,
    'X-ReadQuest-Cache': 'MISS'
  });

  if (editions.length) {
    await cache.put(cacheRequest, response.clone());
  }

  return response;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request)
      });
    }

    if (url.pathname === '/api/books/search' && request.method === 'GET') {
      return handleBookLookup(request, env);
    }

    return jsonResponse(request, {
      error: 'Not found.'
    }, 404);
  }
};