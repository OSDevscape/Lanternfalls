const ALLOWED_ORIGINS = new Set([
  'capacitor://localhost',
  'http://localhost',
  'https://localhost'
]);

function headers(request) {
  const origin = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'capacitor://localhost',
    'Access-Control-Allow-Methods': 'OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
  };
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: headers(request) });
    }
    return new Response(JSON.stringify({
      error: 'Boss artwork generation has been removed. ReadQuest uses deterministic local boss names and text only.'
    }), { status: 410, headers: headers(request) });
  }
};