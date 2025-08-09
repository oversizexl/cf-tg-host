export async function onRequest(context) {
  const { request, env } = context;
  try {
    if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ error: 'Auth not configured. Please set ADMIN_USERNAME and ADMIN_PASSWORD.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!env.SESSION_SECRET) {
      return new Response(JSON.stringify({ error: 'SESSION_SECRET missing' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const contentType = request.headers.get('Content-Type') || '';
    let body;
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported Content-Type' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const username = (body.username || body.user || '').toString();
    const password = (body.password || body.pass || '').toString();

    if (username !== env.ADMIN_USERNAME || password !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7d
    const payload = { user: username, exp };
    const token = await signPayload(payload, env.SESSION_SECRET);

    const cookie = buildCookie('SESSION', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookie },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

function buildCookie(name, value, opts = {}) {
  const parts = [`${name}=${value}`];
  if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  if (opts.secure) parts.push('Secure');
  if (opts.httpOnly) parts.push('HttpOnly');
  return parts.join('; ');
}

async function signPayload(payload, secret) {
  const enc = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  const base64url = (obj) => btoa(String.fromCharCode(...enc.encode(JSON.stringify(obj))))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
  const headerB64 = base64url(header);
  const payloadB64 = base64url(payload);
  const data = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
  return `${data}.${sigB64}`;
}
