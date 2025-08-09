import React from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../lib/api'

export default function Login() {
  const nav = useNavigate()
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [msg, setMsg] = React.useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      await login(username, password)
      nav('/', { replace: true })
    } catch (err: any) {
      setMsg(err?.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-5 py-10">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-2xl font-semibold tracking-tight mb-4">登录</h2>
        <form onSubmit={onSubmit} className="grid gap-4">
          <label className="grid gap-1 text-sm text-gray-600">
            用户名
            <input className="h-10 px-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" value={username} onChange={e => setUsername(e.target.value)} required />
          </label>
          <label className="grid gap-1 text-sm text-gray-600">
            密码
            <input className="h-10 px-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </label>
          <button className="h-10 rounded-md bg-indigo-600 text-white disabled:opacity-60" disabled={loading} type="submit">{loading ? '登录中...' : '登录'}</button>
        </form>
        {msg && <p className="text-sm text-red-500 mt-3">{msg}</p>}
      </div>
    </div>
  )
}
