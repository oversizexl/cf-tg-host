export async function onRequest(context) {
  const { env, request } = context;
  if (!env.SESSION_SECRET) {
    return new Response(JSON.stringify({ error: 'SESSION_SECRET missing' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const cookie = request.headers.get('Cookie') || '';
  const token = Object.fromEntries(cookie.split(';').map(s=>s.trim().split('='))).SESSION;
  if (!token) return new Response(JSON.stringify({ ok: false }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  // Reuse verify in manage middleware is not available here; do minimal decode
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) throw new Error('bad');
    const payloadJson = new TextDecoder().decode(b64urlDecodeToBytes(p));
    const payload = JSON.parse(payloadJson);
    if (!payload || typeof payload.exp !== 'number' || Date.now() > payload.exp) throw new Error('exp');
    return new Response(JSON.stringify({ ok: true, user: payload.user }), { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
}

function b64urlDecodeToBytes(str) {
  const pad = str.length % 4 === 2 ? '==' : str.length % 4 === 3 ? '=' : '';
  const s = str.replaceAll('-', '+').replaceAll('_', '/') + pad;
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
