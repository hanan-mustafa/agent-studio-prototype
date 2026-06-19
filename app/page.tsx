'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Rocket, CalendarClock, Copy, Trash2, LayoutGrid, List } from 'lucide-react'
import TopNav from '@/components/TopNav'
import ScheduleModal from '@/components/ScheduleModal'

export default function AgentHome() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [notifTick, setNotifTick] = useState(0)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopNav key={notifTick} />

      <main className="flex-1 flex flex-col items-center px-6 pt-16">
        {/* Hero */}
        <h1 className="text-3xl font-semibold text-gray-900">
          Welcome to <span style={{ color: '#1A6BB5' }} className="font-bold">Agent Studio</span>
        </h1>
        <p className="text-gray-500 mt-2 mb-8">Describe your goals, and we&apos;ll create a customizable agent.</p>

        <div className="w-full max-w-2xl border border-red-200 rounded-xl p-4 mb-12 relative shadow-sm">
          <textarea
            className="w-full resize-none text-gray-700 text-sm outline-none min-h-[60px] placeholder:text-gray-400"
            placeholder="I need an agent that reviews RFP requirements and ensures our proposals are compliant with all submission guidelines"
            rows={2}
          />
          <button className="absolute bottom-3 right-3 w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
            <svg viewBox="0 0 16 16" className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 12V4M4 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Agent list header */}
        <div className="w-full max-w-4xl flex items-center justify-between mb-4">
          <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 gap-2 w-64">
            <svg viewBox="0 0 16 16" className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="6.5" cy="6.5" r="4.5"/><path d="M11 11l2.5 2.5" strokeLinecap="round"/>
            </svg>
            <input className="text-sm outline-none text-gray-600 placeholder:text-gray-400 flex-1" placeholder="Search agents" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">· All Agents</span>
            <button className="p-1.5 rounded border border-gray-200" style={{ background: '#3D7D3F' }}>
              <LayoutGrid size={16} className="text-white" />
            </button>
            <button className="p-1.5 rounded border border-gray-200 text-gray-400">
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Agent card */}
        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            onClick={() => router.push('/agent')}
            className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm relative cursor-pointer hover:border-gray-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#6B7280' }}>
                  CC
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm leading-tight">Content Contradiction Auditor</p>
                  <p className="text-xs text-gray-500">Content Librarian</p>
                  <p className="text-xs text-gray-400">By hanan.mustafa@responsive.io</p>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v) }}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400"
                >
                  <MoreVertical size={16} />
                </button>
                {menuOpen && (
                  <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-1">
                    <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                      <Rocket size={14} className="text-gray-500" />
                      Launch Agent
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); setShowSchedule(true) }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 flex items-center gap-2.5"
                      style={{ color: '#3D7D3F' }}
                    >
                      <CalendarClock size={14} style={{ color: '#3D7D3F' }} />
                      <span className="font-medium">Schedule</span>
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-sm text-gray-300 flex items-center gap-2.5 cursor-not-allowed">
                      <Copy size={14} />
                      Clone
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-sm text-red-200 flex items-center gap-2.5 cursor-not-allowed">
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-white px-2 py-0.5 rounded-full" style={{ background: '#3D7D3F' }}>Active</span>
              <span className="text-xs text-gray-600 border border-gray-200 rounded-full px-2 py-0.5 flex items-center gap-1">
                <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 3L3 9M3 3l6 6" strokeLinecap="round"/>
                </svg>
                Private
              </span>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Audit Q&A pairs for contradictions/duplications with cited, structured report.
            </p>
          </div>
        </div>
      </main>

      {showSchedule && (
        <ScheduleModal
          onClose={() => setShowSchedule(false)}
          onRunComplete={() => setNotifTick(t => t + 1)}
        />
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
      )}
    </div>
  )
}
