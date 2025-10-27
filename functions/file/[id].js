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
    allowedReferer = allowed.has(origin);
  } else {
    allowedReferer = true; // 允许直接访问
  }
  
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
    
    // ✅ 重新构建响应头
    const headers = new Headers();
    const filename = fullFileName || "file";
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    // MIME 类型映射表
    const getMimeType = (extension) => {
      const types = {
        // 图片
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon',
        'tiff': 'image/tiff',
        'tif': 'image/tiff',
        // 视频
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'ogg': 'video/ogg',
        'mov': 'video/quicktime',
        'avi': 'video/x-msvideo',
        // 音频
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'm4a': 'audio/mp4',
        // 文档
        'pdf': 'application/pdf',
        'txt': 'text/plain',
        'html': 'text/html',
        'json': 'application/json'
      };
      return types[extension] || 'image/png'; // 默认作为图片处理
    };
    
    // 设置正确的 Content-Type
    headers.set("Content-Type", getMimeType(ext));
    
    // 设置为内联预览模式
    headers.set("Content-Disposition", `inline; filename="${filename}"`);
    
    // 复制必要的头部
    const contentLength = response.headers.get("Content-Length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }
    
    // 设置缓存
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    
    // 安全头部
    headers.set("X-Content-Type-Options", "nosniff");
    
    // 跨域设置（如果需要）
    headers.set("Access-Control-Allow-Origin", "*");
    
    return new Response(response.body, {
      status: 200,
      statusText: "OK",
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
