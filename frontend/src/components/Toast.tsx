import React from 'react'

export type ToastType = 'info' | 'success' | 'error'

export default function Toast({ message, type = 'info', onClose, index }: { message: string, type?: ToastType, onClose?: () => void, index?: number }) {
  React.useEffect(() => {
    const t = setTimeout(() => onClose && onClose(), 2500)
    return () => clearTimeout(t)
  }, [onClose])

  const color = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-gray-800'

  const top = 16 + (index ?? 0) * 48 // 16px 间距 + 每条约 48px 高度
  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-50 w-full flex justify-center pointer-events-none" style={{ top }}>
      <div className={`pointer-events-auto text-white ${color} shadow-lg rounded-md px-4 py-2 text-sm max-w-[90vw]`}>{message}</div>
    </div>
  )
}
