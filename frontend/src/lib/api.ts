export async function api<T = any>(input: RequestInfo, init: RequestInit = {}): Promise<T> {
  const res = await fetch(input, { credentials: 'include', ...init })
  if (res.status === 401) throw new Error('Unauthorized')
  const ct = res.headers.get('Content-Type') || ''
  if (ct.includes('application/json')) return (await res.json()) as T
  const text = await res.text()
  try { return JSON.parse(text) as T } catch { throw new Error(text || '请求失败') }
}

export async function login(username: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || '登录失败')
  }
  return true
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
}

export type ListQuery = { limit?: number; cursor?: string }
export async function listFiles(q: ListQuery) {
  const qs = new URLSearchParams()
  if (q.limit) qs.set('limit', String(q.limit))
  if (q.cursor) qs.set('cursor', q.cursor)
  return api<{ keys: any[]; cursor?: string; list_complete?: boolean }>(`/api/files?${qs.toString()}`)
}

export async function del(id: string) {
  return api(`/api/files/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
export async function upload(files: File[]) {
  const fd = new FormData()
  files.forEach(f => fd.append('file', f))
  const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' })
  if (!res.ok) throw new Error((await res.text()) || '上传失败')
  return res.json().catch(() => ({}))
}

export type UploadProgress = { loaded: number; total: number; percent: number }
export function uploadWithProgress(files: File[], onProgress: (p: UploadProgress) => void): Promise<any> {
  return new Promise((resolve, reject) => {
    const fd = new FormData()
    files.forEach(f => fd.append('file', f))
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload')
    xhr.withCredentials = true
    xhr.upload.onprogress = (evt) => {
      if (!evt.lengthComputable) return
      const percent = evt.total ? Math.round((evt.loaded / evt.total) * 100) : 0
      onProgress({ loaded: evt.loaded, total: evt.total, percent })
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)) } catch { resolve({}) }
      } else {
        reject(new Error(xhr.responseText || '上传失败'))
      }
    }
    xhr.onerror = () => reject(new Error('网络错误'))
    xhr.send(fd)
  })
}
