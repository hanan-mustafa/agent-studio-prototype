'use client'

import { useState, useEffect } from 'react'
import { X, Play, Clock, CheckCircle, XCircle, Loader2, CalendarClock } from 'lucide-react'
import { ScheduleConfig, RunRecord, SCHEDULE_OPTIONS } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface ScheduleModalProps {
  onClose: () => void
  onRunComplete: () => void
}

export default function ScheduleModal({ onClose, onRunComplete }: ScheduleModalProps) {
  const [config, setConfig] = useState<ScheduleConfig | null>(null)
  const [history, setHistory] = useState<RunRecord[]>([])
  const [selectedInterval, setSelectedInterval] = useState('every_5_min')
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    fetch('/api/schedule').then(r => r.json()).then(d => {
      setConfig(d.config)
      setHistory(d.history || [])
      if (d.config) setSelectedInterval(d.config.interval)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const option = SCHEDULE_OPTIONS.find(o => o.value === selectedInterval)!
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval: option.value, cronExpression: option.cron }),
    })
    const data = await res.json()
    setConfig(data)
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

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#EBF5EC' }}>
              <CalendarClock size={16} style={{ color: '#3D7D3F' }} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Schedule Agent</h2>
              <p className="text-xs text-gray-500">Content Contradiction Auditor</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Schedule selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Run frequency</label>
            <div className="space-y-2">
              {SCHEDULE_OPTIONS.map(opt => (
                <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedInterval === opt.value ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    name="interval"
                    value={opt.value}
                    checked={selectedInterval === opt.value}
                    onChange={() => setSelectedInterval(opt.value)}
                    className="accent-green-600"
                  />
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </div>
                  <code className="ml-auto text-xs text-gray-400 font-mono">{opt.cron}</code>
                </label>
              ))}
            </div>
          </div>

          {/* Current schedule status */}
          {config && (
            <div className="rounded-xl p-4 border border-green-200 bg-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Schedule active</p>
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
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
