export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method !== 'DELETE') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  const id = params?.id;
  if (!id) return new Response(JSON.stringify({ error: 'missing id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  try {
    // 1) 删除 KV 记录（若存在）
    if (env.img_url) {
      await env.img_url.delete(id);
    }

    const url = new URL(request.url);
    const fileUrl = `${url.origin}/file/${id}`;

    // 2) 清理本地边缘节点缓存（尽力而为）
    try {
      if (typeof caches !== 'undefined' && caches.default) {
        await caches.default.delete(new Request(fileUrl, { method: 'GET' }));
      }
    } catch (e) {
      console.warn('cache delete (edge) failed:', e?.message || e);
    }

    // 3) 可选：通过 Cloudflare API 全局 purge（需要环境变量）
    if (env.CF_API_TOKEN && env.CF_ZONE_ID) {
      try {
        const purgeRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}/purge_cache`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.CF_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files: [fileUrl] }),
        });
        const purgeJson = await purgeRes.json().catch(() => ({}));
        if (!purgeRes.ok || purgeJson?.success === false) {
          console.warn('global purge failed', purgeJson);
        }
      } catch (e) {
        console.warn('global purge exception', e?.message || e);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'delete failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
