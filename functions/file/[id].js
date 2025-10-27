export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  let fileUrl = "https://telegra.ph/" + url.pathname + url.search;
  const fileId = url.pathname.split(".")[0].split("/")[2];
  
  // 防盗链检查
  const referer = request.headers.get("Referer");
  const origin = request.headers.get("Origin");
  
  const allowed = new Set([
    url.origin,
    ...String(env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  ]);
  
  let allowedReferer = false;
  
  if (referer) {
    try {
      const r = new URL(referer);
      if (r.hostname === 'localhost' || r.hostname === '127.0.0.1') {
        allowedReferer = true;
      } else if (allowed.has(r.origin)) {
        allowedReferer = true;
      }
    } catch {}
  } else if (origin) {
    // 检查 Origin 头
    allowedReferer = allowed.has(origin);
  } else {
    // ✅ 关键修改：允许无 Referer 的直接访问
    allowedReferer = true;
  }

  console.log('Referer:', referer);
  console.log('Origin:', origin);
  console.log('URL Origin:', url.origin);
  console.log('Allowed Origins:', Array.from(allowed));
  console.log('Allowed Referer:', allowedReferer);
  
  if (!allowedReferer) {
    return new Response("Hotlink forbidden", {
      status: 403,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  }

  if (fileId) {
    const filePath = await getFilePath(env, fileId);
    fileUrl = `https://api.telegram.org/file/bot${env.TG_Bot_Token}/${filePath}`;
  }
  const response = await fetch(fileUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
  console.log(response.ok, response.status);
  if (response.ok) {
    if (request.headers.get("Referer") === `${url.origin}/admin`) {
      return response;
    }
    const fullFileName = url.pathname.split("/").pop() || fileId;
    
    if (env.img_url && fileId) {
      const kvKey = fullFileName.includes('.') ? fullFileName : fileId;
      
      const record = await env.img_url.getWithMetadata(kvKey);
      if (!record || !record.metadata) {
        await env.img_url.put(kvKey, "", {
          metadata: { TimeStamp: Date.now() }
        });
      }
    }
    
    const headers = new Headers(response.headers);
    const filename = fullFileName || "file";
    headers.delete("Content-Disposition");
    headers.set("Content-Disposition", `inline; filename="${filename}"`);
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
  return response;
}
async function getFilePath(env, file_id) {
  try {
    const url = `https://api.telegram.org/bot${env.TG_Bot_Token}/getFile?file_id=${file_id}`;
    const res = await fetch(url, {
      method: "GET"
    });
    if (!res.ok) {
      console.error(`HTTP error! status: ${res.status}`);
      return null;
    }
    const responseData = await res.json();
    const { ok, result } = responseData;
    if (ok && result) {
      return result.file_path;
    } else {
      console.error("Error in response data:", responseData);
      return null;
    }
  } catch (error) {
    console.error("Error fetching file path:", error.message);
    return null;
  }
}
