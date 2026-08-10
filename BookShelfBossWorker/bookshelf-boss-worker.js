const ALLOWED_ORIGINS = new Set([
  'capacitor://localhost',
  'http://localhost',
  'https://localhost'
]);

function cors(request) {
  const origin = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'capacitor://localhost',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
  };
}

function reply(request, body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors(request) });
}

function clean(value, max) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function bossPrompt(title, author, genre) {
  const genreText = genre || 'literary fiction';
  return [
    'Create one original fantasy RPG boss portrait for a cozy dark mobile reading app.',
    'This boss is inspired only by the broad atmosphere of a book titled "' + title + '" by "' + author + '" in the genre "' + genreText + '".',
    'Do not depict, name, copy, or resemble any copyrighted character, cover art, setting, plot event, or person from the book.',
    'Do not reveal spoilers, twists, endings, character deaths, or plot-specific information.',
    'Use only abstract thematic mood, genre, and title-inspired symbolism.',
    'Original fantasy bestiary illustration, one readable central monster silhouette, dramatic moody lighting, navy, charcoal, burgundy and antique-gold color palette, polished mobile game concept art.',
    'No text, letters, logos, watermarks, book cover, or frame. Square composition.'
  ].join(' ');
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(request) });
    }

    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/generate-boss') {
      return reply(request, { error: 'Not found' }, 404);
    }

    if (!env.OPENAI_API_KEY) {
      return reply(request, { error: 'Server configuration is incomplete.' }, 500);
    }

    let input;
    try {
      input = await request.json();
    } catch (_) {
      return reply(request, { error: 'Invalid JSON request.' }, 400);
    }

    const title = clean(input.title, 160);
    const author = clean(input.author, 120);
    const genre = clean(input.genre, 100);
    if (!title) {
      return reply(request, { error: 'A book title is required.' }, 400);
    }

    const prompt = bossPrompt(title, author || 'Unknown Author', genre);
    let apiResponse;

    try {
      apiResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + env.OPENAI_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-image-2',
          prompt: prompt,
          size: '1024x1024',
          quality: 'low',
          output_format: 'webp',
          output_compression: 70,
          moderation: 'auto'
        })
      });
    } catch (_) {
      return reply(request, { error: 'Image generation service could not be reached.' }, 502);
    }

    const result = await apiResponse.json();
    if (!apiResponse.ok) {
      return reply(request, {
        error: result && result.error && result.error.message ? result.error.message : 'Boss image generation failed.',
        code: result && result.error ? result.error.code : 'generation_error'
      }, apiResponse.status);
    }

    const image = result && result.data && result.data[0] ? result.data[0].b64_json : '';
    if (!image) {
      return reply(request, { error: 'The image service returned no image.' }, 502);
    }

    return reply(request, {
      imageDataUrl: 'data:image/webp;base64,' + image,
      promptVersion: 'bookshelf-boss-v1',
      generatedAt: new Date().toISOString()
    });
  }
};