'use client'

import { useState, useEffect } from 'react'
import {
  X, Play, Pause, Plus, Trash2, ArrowLeft, CheckCircle, XCircle, Loader2,
  CalendarClock, Timer, Hourglass, CalendarDays, ChevronLeft,
} from 'lucide-react'
import { ScheduleConfig, ScheduleMode, MAX_SCHEDULES } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { buildSchedule, detectTimezone, WEEKDAYS } from '@/lib/schedule'

interface ScheduleModalProps {
  onClose: () => void
  onRunComplete: () => void
  onSchedulesChange?: (schedules: ScheduleConfig[]) => void
}

export default function ScheduleModal({ onClose, onRunComplete, onSchedulesChange }: ScheduleModalProps) {
  const [view, setView] = useState<'list' | 'form'>('list')
  const [schedules, setSchedules] = useState<ScheduleConfig[]>([])
  const [loading, setLoading] = useState(true)

  // form state
  const [mode, setMode] = useState<ScheduleMode>('minutes')
  const [everyMinutes, setEveryMinutes] = useState(15)
  const [everyHours, setEveryHours] = useState(6)
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [time, setTime] = useState('09:00')
  const [timezone, setTimezone] = useState('UTC')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // list actions
  const [busyId, setBusyId] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')

  const sync = (next: ScheduleConfig[]) => {
    setSchedules(next)
    onSchedulesChange?.(next)
  }

  useEffect(() => {
    setTimezone(detectTimezone())
    fetch('/api/schedule').then(r => r.json()).then(d => {
      const list: ScheduleConfig[] = d.schedules || []
      setSchedules(list)
      setView(list.length > 0 ? 'list' : 'form')
      setLoading(false)
    })
  }, [])

  const toggleDay = (d: number) => {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a, b) => a - b))
  }

  const resetForm = () => {
    setMode('minutes'); setEveryMinutes(15); setEveryHours(6)
    setDays([1, 2, 3, 4, 5]); setTime('09:00'); setError('')
  }

  const handleSave = async () => {
    setError('')
    if (mode === 'daily' && days.length === 0) {
      setError('Select at least one day of the week.')
      return
    }
    setSaving(true)
    const built = buildSchedule({ mode, everyMinutes, everyHours, days, time, timezone })
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode, everyMinutes, everyHours, days, time, timezone,
        cronExpression: built.cronExpression, label: built.label, nextRun: built.nextRun,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      sync(data.schedules)
      resetForm()
      setView('list')
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Failed to save schedule. Please try again.')
    }
    setSaving(false)
  }

  const handleToggle = async (s: ScheduleConfig) => {
    setBusyId(s.id)
    const res = await fetch('/api/schedule', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, enabled: !s.enabled }),
    })
    if (res.ok) sync((await res.json()).schedules)
    setBusyId(null)
  }

  const handleDelete = async (s: ScheduleConfig) => {
    setBusyId(s.id)
    const res = await fetch(`/api/schedule?id=${encodeURIComponent(s.id)}`, { method: 'DELETE' })
    if (res.ok) {
      const next = (await res.json()).schedules as ScheduleConfig[]
      sync(next)
      if (next.length === 0) setView('form')
    }
    setBusyId(null)
  }

  const handleRunNow = async () => {
    setRunning(true)
    setRunStatus('running')
    const res = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trigger: 'manual' }),
    })
    setRunStatus(res.ok ? 'done' : 'error')
    if (res.ok) onRunComplete()
    setRunning(false)
  }

  const atCap = schedules.length >= MAX_SCHEDULES

  const MODES: { value: ScheduleMode; icon: typeof Timer }[] = [
    { value: 'minutes', icon: Timer },
    { value: 'hours', icon: Hourglass },
    { value: 'daily', icon: CalendarDays },
  ]

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            {view === 'form' && schedules.length > 0 && (
              <button onClick={() => { resetForm(); setView('list') }} className="p-1 -ml-1 rounded-lg hover:bg-gray-100 text-gray-500">
                <ChevronLeft size={18} />
              </button>
            )}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#EBF5EC' }}>
              <CalendarClock size={16} style={{ color: '#3D7D3F' }} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">{view === 'form' ? 'New schedule' : 'Scheduling'}</h2>
              <p className="text-xs text-gray-500">Content Contradiction Auditor</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        ) : view === 'list' ? (
          /* ---------- LIST VIEW ---------- */
          <>
            <div className="px-6 py-5 space-y-3 overflow-y-auto">
              <button
                onClick={() => { if (!atCap) { resetForm(); setView('form') } }}
                disabled={atCap}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm font-medium text-gray-700 hover:border-green-400 hover:bg-green-50/40 transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-gray-300"
              >
                <Plus size={16} style={{ color: '#3D7D3F' }} />
                Add schedule
              </button>

              {atCap && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  You&apos;ve reached the limit of {MAX_SCHEDULES} schedules. Delete one to add another.
                </p>
              )}

              <div className="space-y-2">
                {schedules.map(s => (
                  <div key={s.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${s.enabled ? 'border-gray-200' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: s.enabled ? '#EBF5EC' : '#F3F4F6' }}>
                      <CalendarClock size={15} style={{ color: s.enabled ? '#3D7D3F' : '#9CA3AF' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${s.enabled ? 'text-gray-800' : 'text-gray-400'}`}>{s.label}</p>
                      <p className="text-xs text-gray-400">
                        {s.enabled ? `Next run: ${formatDate(s.nextRun)}` : 'Paused'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle(s)}
                      disabled={busyId === s.id}
                      title={s.enabled ? 'Pause' : 'Resume'}
                      className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {busyId === s.id ? <Loader2 size={13} className="animate-spin" /> : s.enabled ? <Pause size={13} /> : <Play size={13} />}
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      disabled={busyId === s.id}
                      title="Delete"
                      className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Run status feedback */}
              {runStatus === 'running' && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-xl px-4 py-3">
                  <Loader2 size={14} className="animate-spin" /> Agent is running...
                </div>
              )}
              {runStatus === 'done' && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
                  <CheckCircle size={14} /> Run completed — check your notifications for results.
                </div>
              )}
              {runStatus === 'error' && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                  <XCircle size={14} /> Run failed. Please try again.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <button
                onClick={handleRunNow}
                disabled={running}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-white transition-colors disabled:opacity-50"
              >
                {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                Run Now
              </button>
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                Close
              </button>
            </div>
          </>
        ) : (
          /* ---------- FORM VIEW ---------- */
          <>
            <div className="px-6 py-5 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Run frequency</label>
                <div className="space-y-2">
                  {MODES.map(opt => {
                    const Icon = opt.icon
                    const selected = mode === opt.value
                    return (
                      <div key={opt.value}>
                        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <input type="radio" name="mode" checked={selected} onChange={() => setMode(opt.value)} className="accent-green-600" />
                          <Icon size={15} className="text-gray-400" />
                          {opt.value === 'minutes' ? (
                            <span className="text-sm text-gray-700 flex items-center gap-1.5">
                              Every
                              <input type="number" min={1} max={59} value={everyMinutes}
                                onFocus={() => setMode('minutes')}
                                onChange={e => { setMode('minutes'); setEveryMinutes(Math.max(1, Math.min(59, +e.target.value || 1))) }}
                                className="w-14 text-sm text-center border border-gray-200 rounded-md py-1 outline-none focus:border-green-400 bg-white" />
                              minutes
                            </span>
                          ) : opt.value === 'hours' ? (
                            <span className="text-sm text-gray-700 flex items-center gap-1.5">
                              Every
                              <input type="number" min={1} max={23} value={everyHours}
                                onFocus={() => setMode('hours')}
                                onChange={e => { setMode('hours'); setEveryHours(Math.max(1, Math.min(23, +e.target.value || 1))) }}
                                className="w-14 text-sm text-center border border-gray-200 rounded-md py-1 outline-none focus:border-green-400 bg-white" />
                              hours
                            </span>
                          ) : (
                            <span className="text-sm text-gray-700">Daily</span>
                          )}
                        </label>

                        {opt.value === 'daily' && selected && (
                          <div className="mt-2 ml-1 p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-4">
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-2">Days of the week</p>
                              <div className="flex gap-1.5">
                                {WEEKDAYS.map(w => {
                                  const on = days.includes(w.value)
                                  return (
                                    <button key={w.value} type="button" onClick={() => toggleDay(w.value)} title={w.full}
                                      className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${on ? 'text-white' : 'text-gray-500 bg-white border border-gray-200 hover:border-gray-300'}`}
                                      style={on ? { background: '#3D7D3F' } : undefined}>
                                      {w.label}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="text-xs font-medium text-gray-600 mb-1.5">Time</p>
                                <input type="time" value={time} onChange={e => setTime(e.target.value)}
                                  className="text-sm border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-green-400" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-gray-600 mb-1.5">Timezone</p>
                                <div className="text-sm text-gray-700 border border-gray-200 rounded-md px-2 py-1.5 bg-white truncate" title={timezone}>{timezone}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">
                  <XCircle size={14} /> {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <button
                onClick={() => { if (schedules.length > 0) { resetForm(); setView('list') } else onClose() }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
              >
                {schedules.length > 0 && <ArrowLeft size={14} />}
                {schedules.length > 0 ? 'Back' : 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{ background: '#3D7D3F' }}
              >
                {saving ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
