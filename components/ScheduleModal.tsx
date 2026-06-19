'use client'

import { useState, useEffect } from 'react'
import { X, Play, CheckCircle, XCircle, Loader2, CalendarClock, Timer, Hourglass, CalendarDays } from 'lucide-react'
import { ScheduleConfig, RunRecord, ScheduleMode } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { buildSchedule, detectTimezone, WEEKDAYS } from '@/lib/schedule'

interface ScheduleModalProps {
  onClose: () => void
  onRunComplete: () => void
}

export default function ScheduleModal({ onClose, onRunComplete }: ScheduleModalProps) {
  const [config, setConfig] = useState<ScheduleConfig | null>(null)
  const [history, setHistory] = useState<RunRecord[]>([])
  const [mode, setMode] = useState<ScheduleMode>('minutes')
  const [everyMinutes, setEveryMinutes] = useState(15)
  const [everyHours, setEveryHours] = useState(6)
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [time, setTime] = useState('09:00')
  const [timezone, setTimezone] = useState('UTC')
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setTimezone(detectTimezone())
    fetch('/api/schedule').then(r => r.json()).then(d => {
      setConfig(d.config)
      setHistory(d.history || [])
      if (d.config) {
        setMode(d.config.mode)
        if (d.config.everyMinutes) setEveryMinutes(d.config.everyMinutes)
        if (d.config.everyHours) setEveryHours(d.config.everyHours)
        if (d.config.days) setDays(d.config.days)
        if (d.config.time) setTime(d.config.time)
        if (d.config.timezone) setTimezone(d.config.timezone)
      }
    })
  }, [])

  const toggleDay = (d: number) => {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a, b) => a - b))
  }

  const handleSave = async () => {
    setError('')
    if (mode === 'daily' && days.length === 0) {
      setError('Select at least one day of the week.')
      return
    }
    setSaving(true)
    const built = buildSchedule({ mode, everyMinutes, everyHours, days, time, timezone })
    const payload = {
      mode, everyMinutes, everyHours, days, time, timezone,
      cronExpression: built.cronExpression,
      label: built.label,
      nextRun: built.nextRun,
    }
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      setConfig(await res.json())
    } else {
      setError('Failed to save schedule. Please try again.')
    }
    setSaving(false)
  }

  const handleRemove = async () => {
    setRemoving(true)
    await fetch('/api/schedule', { method: 'DELETE' })
    setConfig(null)
    setRemoving(false)
  }

  const handleRunNow = async () => {
    setRunning(true)
    setRunStatus('running')
    const res = await fetch('/api/run', { method: 'POST' })
    if (res.ok) {
      setRunStatus('done')
      const d = await fetch('/api/schedule').then(r => r.json())
      setHistory(d.history || [])
      onRunComplete()
    } else {
      setRunStatus('error')
    }
    setRunning(false)
  }

  const MODES: { value: ScheduleMode; label: string; icon: typeof Timer }[] = [
    { value: 'minutes', label: 'Every X minutes', icon: Timer },
    { value: 'hours', label: 'Every X hours', icon: Hourglass },
    { value: 'daily', label: 'Daily', icon: CalendarDays },
  ]

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#EBF5EC' }}>
              <CalendarClock size={16} style={{ color: '#3D7D3F' }} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Scheduling</h2>
              <p className="text-xs text-gray-500">Content Contradiction Auditor</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          {/* Mode selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Run frequency</label>
            <div className="space-y-2">
              {MODES.map(opt => {
                const Icon = opt.icon
                const selected = mode === opt.value
                return (
                  <div key={opt.value}>
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input
                        type="radio"
                        name="mode"
                        checked={selected}
                        onChange={() => setMode(opt.value)}
                        className="accent-green-600"
                      />
                      <Icon size={15} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{opt.label}</span>

                      {/* Inline number input for minutes / hours */}
                      {opt.value === 'minutes' && selected && (
                        <div className="ml-auto flex items-center gap-1.5">
                          <span className="text-xs text-gray-400">every</span>
                          <input
                            type="number" min={1} max={59} value={everyMinutes}
                            onChange={e => setEveryMinutes(Math.max(1, Math.min(59, +e.target.value || 1)))}
                            className="w-14 text-sm text-center border border-gray-200 rounded-md py-1 outline-none focus:border-green-400"
                          />
                          <span className="text-xs text-gray-400">min</span>
                        </div>
                      )}
                      {opt.value === 'hours' && selected && (
                        <div className="ml-auto flex items-center gap-1.5">
                          <span className="text-xs text-gray-400">every</span>
                          <input
                            type="number" min={1} max={23} value={everyHours}
                            onChange={e => setEveryHours(Math.max(1, Math.min(23, +e.target.value || 1)))}
                            className="w-14 text-sm text-center border border-gray-200 rounded-md py-1 outline-none focus:border-green-400"
                          />
                          <span className="text-xs text-gray-400">hr</span>
                        </div>
                      )}
                    </label>

                    {/* Daily expansion */}
                    {opt.value === 'daily' && selected && (
                      <div className="mt-2 ml-1 p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-4">
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-2">Days of the week</p>
                          <div className="flex gap-1.5">
                            {WEEKDAYS.map(w => {
                              const on = days.includes(w.value)
                              return (
                                <button
                                  key={w.value}
                                  type="button"
                                  onClick={() => toggleDay(w.value)}
                                  title={w.full}
                                  className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${on ? 'text-white' : 'text-gray-500 bg-white border border-gray-200 hover:border-gray-300'}`}
                                  style={on ? { background: '#3D7D3F' } : undefined}
                                >
                                  {w.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1.5">Time</p>
                            <input
                              type="time" value={time}
                              onChange={e => setTime(e.target.value)}
                              className="text-sm border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-green-400"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-600 mb-1.5">Timezone</p>
                            <div className="text-sm text-gray-700 border border-gray-200 rounded-md px-2 py-1.5 bg-white truncate" title={timezone}>
                              {timezone}
                            </div>
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
              <XCircle size={14} />
              {error}
            </div>
          )}

          {/* Current schedule status */}
          {config && (
            <div className="rounded-xl p-4 border border-green-200 bg-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Schedule active · {config.label}</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Next run: {formatDate(config.nextRun)}
                  </p>
                </div>
                <button onClick={handleRemove} disabled={removing} className="text-xs text-red-500 hover:text-red-700 font-medium">
                  {removing ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          )}

          {/* Run status feedback */}
          {runStatus === 'running' && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-xl px-4 py-3">
              <Loader2 size={14} className="animate-spin" />
              Agent is running...
            </div>
          )}
          {runStatus === 'done' && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
              <CheckCircle size={14} />
              Run completed — check your notifications for results.
            </div>
          )}
          {runStatus === 'error' && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
              <XCircle size={14} />
              Run failed. Please try again.
            </div>
          )}

          {/* Run history */}
          {history.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Recent runs</p>
              <div className="space-y-1.5">
                {history.slice(0, 5).map(run => (
                  <div key={run.id} className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2">
                      {run.status === 'completed' ? <CheckCircle size={12} className="text-green-500" /> :
                       run.status === 'failed' ? <XCircle size={12} className="text-red-500" /> :
                       <Loader2 size={12} className="text-blue-500 animate-spin" />}
                      <span className="text-gray-600">{run.summary || run.status}</span>
                    </div>
                    <span className="text-gray-400">{formatDate(run.startedAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button
            onClick={handleRunNow}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-white transition-colors disabled:opacity-50"
          >
            {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Run Now
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
              Cancel
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
        </div>
      </div>
    </div>
  )
}
