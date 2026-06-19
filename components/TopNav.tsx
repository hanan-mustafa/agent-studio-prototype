'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, HelpCircle, Grid3X3, Sparkles } from 'lucide-react'
import { Notification } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import AppGrid from './AppGrid'

interface TopNavProps {
  breadcrumb?: string
  title?: string
}

export default function TopNav({ breadcrumb = 'Agent Studio', title = 'Agent Home' }: TopNavProps) {
  const router = useRouter()
  const [showGrid, setShowGrid] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notifRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    const res = await fetch('/api/notifications')
    const data = await res.json()
    setNotifications(data)
    setUnreadCount(data.filter((n: Notification) => !n.read).length)
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (gridRef.current && !gridRef.current.contains(e.target as Node)) {
        setShowGrid(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleNotificationClick = async (notif: Notification) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notif.id }),
    })
    setShowNotifications(false)
    router.push(`/results/${notif.runId}`)
  }

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-3 z-40 sticky top-0">
      {/* App Grid */}
      <div className="relative" ref={gridRef}>
        <button
          onClick={() => { setShowGrid(v => !v); setShowNotifications(false) }}
          className="p-2 rounded hover:bg-gray-100 text-gray-600"
        >
          <Grid3X3 size={20} />
        </button>
        {showGrid && <AppGrid onClose={() => setShowGrid(false)} />}
      </div>

      {/* Logo + Breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push('/')}
          className="w-7 h-7 flex items-center justify-center"
          aria-label="Go to Agent Home"
        >
          <svg viewBox="0 0 32 32" className="w-7 h-7">
            <path d="M8 4 C8 4 4 10 4 16 C4 22 8 28 16 28 C20 28 24 26 26 22 L20 18 C19 20 17.5 21 16 21 C12 21 9 18.5 9 16 C9 13.5 11 10 14 9 Z" fill="#3D7D3F"/>
            <path d="M16 4 C20 4 24 6 26 10 L20 14 C19 12 17.5 11 16 11 C14 11 12 12 11 14 L5 10 C7 6 11 4 16 4 Z" fill="#6BBF6E"/>
          </svg>
        </button>
        <div className="flex items-center gap-1 text-sm">
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700">{breadcrumb}</button>
          <span className="text-gray-400">/</span>
          <span className="font-semibold text-gray-800">{title}</span>
        </div>
      </div>

      <div className="flex-1" />

      {/* Ask button */}
      <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-white" style={{ background: '#3D7D3F' }}>
        <Sparkles size={14} />
        Ask
      </button>

      {/* Bell */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => { setShowNotifications(v => !v); setShowGrid(false) }}
          className="p-2 rounded hover:bg-gray-100 text-gray-600 relative"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center" style={{ background: '#E53E3E', fontSize: '10px' }}>
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 top-full mt-1 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
            </div>

            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 gap-3">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#EBF4FF' }}>
                    <Bell size={28} style={{ color: '#90CDF4' }} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-green-500">
                    <svg viewBox="0 0 12 12" className="w-3 h-3 text-white fill-white"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
                <p className="font-semibold text-gray-700 text-sm">No new notifications yet!</p>
                <p className="text-xs text-gray-500 text-center">Notifications for mentions, actions and events appear here.</p>
                <button onClick={fetchNotifications} className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 8A6 6 0 1 1 8 2M14 2v4h-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Refresh
                </button>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 ${!n.read ? 'bg-blue-50/40' : ''}`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(n.createdAt)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <button className="p-2 rounded hover:bg-gray-100 text-gray-600">
        <HelpCircle size={20} />
      </button>

      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ background: '#3D7D3F' }}>
        HA
      </div>
    </header>
  )
}
