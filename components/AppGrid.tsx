'use client'

import { useRouter } from 'next/navigation'

interface AppGridProps {
  onClose: () => void
}

const apps = [
  { label: 'My Work', icon: '🏠', href: '#' },
  { label: 'Projects', icon: '📋', href: '#' },
  { label: 'Guided Projects', icon: '📘', href: '#' },
  { label: 'Content Library', icon: '📚', href: '/content-library', highlight: false },
  { label: 'Templates', icon: '📐', href: '#' },
  { label: 'Reports', icon: '📊', href: '#' },
  { label: 'Agent Studio', icon: '✨', href: '/', active: false },
  { label: 'Agent Studio', icon: '✨', href: '/', active: true, badge: 'NEW' },
]

export default function AppGrid({ onClose }: AppGridProps) {
  const router = useRouter()

  return (
    <div className="absolute left-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3">
      <div className="grid grid-cols-3 gap-1">
        {apps.map((app, i) => (
          <button
            key={i}
            onClick={() => { if (app.href !== '#') { router.push(app.href); onClose() } }}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-gray-50 transition-colors relative ${app.active ? 'border-2 border-blue-500' : ''}`}
          >
            {app.badge && (
              <span className="absolute top-1 right-1 text-xs bg-green-500 text-white px-1 rounded" style={{ fontSize: '9px' }}>
                {app.badge}
              </span>
            )}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
              app.label === 'Content Library' ? 'bg-purple-100' :
              app.label === 'My Work' ? 'bg-green-100' :
              app.label === 'Projects' ? 'bg-blue-100' :
              app.label === 'Guided Projects' ? 'bg-blue-800' :
              app.label === 'Templates' ? 'bg-green-700' :
              app.label === 'Reports' ? 'bg-blue-600' : 'bg-blue-100'
            }`}>
              {app.icon}
            </div>
            <span className="text-xs text-gray-600 text-center leading-tight">{app.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-center gap-1.5">
        <div className="w-4 h-4">
          <svg viewBox="0 0 32 32"><path d="M8 4 C8 4 4 10 4 16 C4 22 8 28 16 28 C20 28 24 26 26 22 L20 18 C19 20 17.5 21 16 21 C12 21 9 18.5 9 16 C9 13.5 11 10 14 9 Z" fill="#3D7D3F"/><path d="M16 4 C20 4 24 6 26 10 L20 14 C19 12 17.5 11 16 11 C14 11 12 12 11 14 L5 10 C7 6 11 4 16 4 Z" fill="#6BBF6E"/></svg>
        </div>
        <span className="text-xs text-gray-500">Powered by <span className="font-medium text-gray-700">responsive</span></span>
      </div>
    </div>
  )
}
