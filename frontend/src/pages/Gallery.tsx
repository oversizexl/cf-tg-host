import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listFiles, logout } from '../lib/api'
import Toast from '../components/Toast'

export default function Gallery() {
  const nav = useNavigate()
  const [items, setItems] = React.useState<string[]>([])
  const [cursor, setCursor] = React.useState<string>('')
  const [hasMore, setHasMore] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [initialized, setInitialized] = React.useState(false)
  const [msg, setMsg] = React.useState('')
  const [toast, setToast] = React.useState<{ message: string; type?: 'info' | 'success' | 'error' } | null>(null)
  const sentinelRef = React.useRef<HTMLDivElement | null>(null)

  // 监听删除事件，移除对应项并提示
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id?: string }
      if (!detail?.id) return
      setItems(prev => prev.filter(x => x !== detail.id))
      setToast({ message: '已删除并清理缓存', type: 'success' })
    }
    window.addEventListener('gallery:removed', handler as EventListener)
    return () => window.removeEventListener('gallery:removed', handler as EventListener)
  }, [])

  const load = React.useCallback(async () => {
    if (loading) return
    setLoading(true)
    setMsg('')
    try {
      const data = await listFiles({ limit: 10, cursor })
      const ids = (data.keys || []).map((k: any) => (typeof k === 'string' ? k : (k.name || k.id))).filter(Boolean)
      // 直接追加，由服务端 cursor 保证不重复
      setItems(prev => prev.concat(ids))
      // 更稳健的 hasMore 判定，要求存在有效 cursor 且服务端声明未完成
      setHasMore(Boolean(data.cursor) && data.list_complete === false)
      setCursor(data.cursor || '')
    } catch (err: any) {
      setMsg(err?.message || '加载失败')
    } finally {
      setInitialized(true)
      setLoading(false)
    }
  }, [cursor, loading])

  React.useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // IntersectionObserver: 自动加载更多
  React.useEffect(() => {
    if (!initialized || !hasMore || !sentinelRef.current) return
    const el = sentinelRef.current
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && !loading) {
        load()
      }
    }, { rootMargin: '200px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [initialized, hasMore, loading])

  const copyLink = async (id: string) => {
    const url = `${location.origin}/file/${id}`
    await navigator.clipboard.writeText(url)
    setToast({ message: '已复制链接', type: 'success' })
  }


  return (
    <div className="min-h-svh bg-gray-50 text-gray-900">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {/* 浮动操作区：上传 / 退出登录 */}
      <div className="fixed top-4 right-4 z-40">
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur border border-gray-200 rounded-full px-2 py-1 shadow-sm">
          <Link
            to="/"
            aria-label="上传"
            title="上传"
            className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-50 text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
              <path d="M12 16V4" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M4 20h16" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </Link>
          <button
            onClick={async () => { await logout(); nav('/login', { replace: true }) }}
            aria-label="退出登录"
            title="退出登录"
            className="inline-flex items-center justify-center h-8 w-8 rounded-full text-gray-700 hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
              <path d="M9 4h-3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M16 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M21 12H9" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </button>
        </div>
      </div>

      <main className="min-h-svh max-w-7xl mx-auto px-5 py-16">
        {msg && <div className="mb-3 text-sm text-red-500">{msg}</div>}

        {!initialized || loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="inline-flex items-center gap-2 text-gray-600">
              <div className="h-5 w-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" aria-label="loading" />
              <span>加载中…</span>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 p-4 rounded-full bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-gray-400">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无图片</h3>
            <p className="text-gray-500 mb-4 max-w-sm">还没有上传任何图片，点击右上角的上传按钮开始使用吧</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                <path d="M12 16V4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              上传图片
            </Link>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-5">
            {items.map(id => (
              <ImageItem
                key={id}
                id={id}
                onCopyLink={() => copyLink(id)}
              />
            ))}
          </div>
        )}

        <div className="mt-8">
          <div ref={sentinelRef} className="h-px w-full" />
        </div>
      </main>
    </div>
  )
}

function ImageItem({ id, onCopyLink }: { id: string; onCopyLink: () => void }) {
  const [loaded, setLoaded] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (deleting) return
    const ok = window.confirm('确定删除该文件吗？此操作不可恢复')
    if (!ok) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/files/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error('删除失败')
      // 触发外层移除：通过自定义事件广播
      window.dispatchEvent(new CustomEvent('gallery:removed', { detail: { id } }))
    } catch (err: any) {
      // 失败仅提示
      alert(err?.message || '删除失败')
    } finally {
      setDeleting(false)
    }
  }
  return (
    <div className="mb-5 break-inside-avoid">
      <div className={`relative isolate overflow-hidden rounded-lg group ${loaded ? '' : 'h-56 bg-gray-100 border border-gray-200'}`}>
        <a href={`/file/${id}`} target="_blank" rel="noreferrer" className="relative z-0 block">
          <img
            src={`/file/${id}`}
            alt=""
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={`w-full rounded-lg border border-gray-200 relative z-0 ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          />
        </a>
        {/* 加载中覆盖层 */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 text-gray-600">
              <div className="h-5 w-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" aria-label="loading" />
              <span className="text-xs">加载中…</span>
            </div>
          </div>
        )}
        {/* 悬浮遮罩层 - 直接覆盖整个容器 */}
        <div className={`absolute inset-0 rounded-lg transition-opacity duration-200 ${loaded ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'} pointer-events-none`} style={{zIndex: 100}}>
          {/* 背景暗化 */}
          <div className="absolute inset-0 bg-black/40 rounded-lg" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-lg" />
        </div>
        
        {/* 按钮层 - 独立于遮罩 */}
        <div className={`absolute inset-0 transition-opacity duration-200 ${loaded ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'} pointer-events-none`} style={{zIndex: 101}}>
          {/* 删除按钮 */}
          <div className="absolute top-2 right-2">
            <button onClick={handleDelete} disabled={deleting} className="pointer-events-auto h-8 px-2 text-xs rounded-md bg-rose-600 text-white shadow-sm hover:bg-rose-700 disabled:opacity-60">
              {deleting ? '删除中…' : '删除'}
            </button>
          </div>
          {/* 复制按钮 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button onClick={onCopyLink} className="pointer-events-auto h-8 px-3 text-xs rounded-full bg-white text-gray-900 shadow-md hover:bg-gray-50">
              复制链接
            </button>
          </div>
        </div>
      </div>
      {/* 移除长 ID 文本，避免加载前出现长字符串 */}
    </div>
  )
}
