export async function onRequest(context) {
  const cookie = buildCookie('SESSION', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 0,
  });
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookie },
  });
}

function buildCookie(name, value, opts = {}) {
  const parts = [`${name}=${value}`];
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  if (opts.secure) parts.push('Secure');
  if (opts.httpOnly) parts.push('HttpOnly');
  return parts.join('; ');
}
