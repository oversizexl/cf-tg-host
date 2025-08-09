import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = React.useState<boolean | null>(null)
  const loc = useLocation()

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/auth/check', { credentials: 'include' })
        if (!mounted) return
        setOk(res.ok)
      } catch {
        if (!mounted) return
        setOk(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  if (ok === null) return null
  if (!ok) return <Navigate to="/login" replace />
  return <>{children}</>
}
