'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  MoreHorizontal, Zap, Pencil, Lock, ArrowUp, FileSearch,
  ShieldAlert, ListChecks, Sparkles, Loader2, CheckCircle, XCircle, MessageSquare, ChevronRight,
} from 'lucide-react'
import TopNav from '@/components/TopNav'
import ScheduleModal from '@/components/ScheduleModal'
import { RunRecord } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const SUGGESTED_PROMPTS = [
  {
    icon: FileSearch,
    color: '#3D7D3F',
    title: 'Audit for contradictions',
    subtitle: 'Scan the full Q&A library for conflicting answers.',
  },
  {
    icon: ShieldAlert,
    color: '#D97706',
    title: 'Find high-severity conflicts',
    subtitle: 'Surface only the most critical contradictions.',
  },
  {
    icon: ListChecks,
    color: '#1A6BB5',
    title: 'Check library consistency',
    subtitle: 'Review the content library for inconsistent facts.',
  },
]

export default function AgentDetailPage() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<RunRecord[]>([])
  const [launching, setLaunching] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [notifTick, setNotifTick] = useState(0)

  const fetchHistory = useCallback(async () => {
    const d = await fetch('/api/schedule').then(r => r.json())
    setHistory(d.history || [])
  }, [])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const launchAgent = async () => {
    if (launching) return
    setLaunching(true)
    try {
      const res = await fetch('/api/run', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.runId) {
        router.push(`/results/${data.runId}`)
      } else {
        setLaunching(false)
      }
    } catch {
      setLaunching(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col" key={notifTick}>
      <TopNav title="Content Contradiction Auditor" />

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-6 pb-16">
        {/* Breadcrumb + actions row */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <span>Agents</span>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-gray-800 font-medium">Content Contradiction Auditor</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <MoreHorizontal size={18} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-1">
                    <button
                      onClick={() => { setMenuOpen(false); launchAgent() }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                    >
                      <Zap size={14} className="text-gray-500" />
                      Launch Agent
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); setShowSchedule(true) }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                    >
                      <Sparkles size={14} className="text-gray-500" />
                      Automations
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowSchedule(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Sparkles size={14} className="text-gray-500" />
              Automations
            </button>

            <button
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium text-white"
              style={{ background: '#3D7D3F' }}
            >
              <Pencil size={13} />
              Edit agent
            </button>
          </div>
        </div>

        {/* Agent header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#EBF5EC' }}>
            <FileSearch size={26} style={{ color: '#3D7D3F' }} />
          </div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-2xl font-semibold text-gray-900">Content Contradiction Auditor</h1>
            <span className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-full px-2 py-0.5">
              <Lock size={11} />
              Private to you
            </span>
          </div>
          <p className="text-sm text-gray-500">Audit Q&amp;A pairs for contradictions with a cited, structured report.</p>
        </div>

        {/* Prompt input */}
        <div className="border border-gray-200 rounded-2xl shadow-sm p-2 pl-4 flex items-center gap-2 mb-4">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && launchAgent()}
            disabled={launching}
            placeholder="Ask Content Contradiction Auditor"
            className="flex-1 text-sm text-gray-700 outline-none placeholder:text-gray-400 disabled:opacity-50"
          />
          <button
            onClick={launchAgent}
            disabled={launching}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-50 flex-shrink-0"
            style={{ background: '#3D7D3F' }}
          >
            {launching ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
          </button>
        </div>

        {launching && (
          <p className="text-center text-xs text-gray-400 mb-6 flex items-center justify-center gap-1.5">
            <Loader2 size={12} className="animate-spin" />
            Launching agent — analyzing your Q&amp;A library…
          </p>
        )}

        {/* Suggested prompts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
          {SUGGESTED_PROMPTS.map(p => {
            const Icon = p.icon
            return (
              <button
                key={p.title}
                onClick={launchAgent}
                disabled={launching}
                className="text-left border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all disabled:opacity-50"
              >
                <Icon size={18} style={{ color: p.color }} className="mb-2.5" />
                <p className="text-sm font-medium text-gray-800 leading-tight mb-1">{p.title}</p>
                <p className="text-xs text-gray-500 leading-snug">{p.subtitle}</p>
              </button>
            )
          })}
        </div>

        {/* Activity tab */}
        <div>
          <div className="flex items-center gap-6 border-b border-gray-100 mb-3">
            <button className="text-sm font-medium text-gray-900 pb-2.5 border-b-2" style={{ borderColor: '#3D7D3F' }}>
              Activity
            </button>
          </div>

          {history.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-400">No runs yet. Launch the agent to see activity here.</p>
            </div>
          ) : (
            <div>
              {history.map(run => (
                <button
                  key={run.id}
                  onClick={() => run.status === 'completed' && router.push(`/results/${run.id}`)}
                  disabled={run.status !== 'completed'}
                  className="w-full flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors text-left disabled:cursor-default disabled:hover:bg-transparent"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {run.status === 'completed' ? <MessageSquare size={14} className="text-gray-500" /> :
                     run.status === 'failed' ? <XCircle size={14} className="text-red-400" /> :
                     <Loader2 size={14} className="text-blue-400 animate-spin" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-tight truncate">
                      {run.status === 'completed'
                        ? (run.summary || 'Contradiction audit')
                        : run.status === 'failed' ? 'Run failed' : 'Audit running…'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {run.status === 'completed' ? 'Task completed' : run.status === 'failed' ? 'Task failed' : 'In progress'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(run.startedAt)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {showSchedule && (
        <ScheduleModal
          onClose={() => { setShowSchedule(false); fetchHistory() }}
          onRunComplete={() => { fetchHistory(); setNotifTick(t => t + 1) }}
        />
      )}
    </div>
  )
}
