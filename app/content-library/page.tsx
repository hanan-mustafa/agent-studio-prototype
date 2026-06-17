'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, BookOpen, X, Loader2 } from 'lucide-react'
import TopNav from '@/components/TopNav'
import { QAPair } from '@/lib/types'
import { formatDate } from '@/lib/utils'

export default function ContentLibrary() {
  const [pairs, setPairs] = useState<QAPair[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchPairs = async () => {
    const res = await fetch('/api/qa')
    const data = await res.json()
    setPairs(data)
    setLoading(false)
  }

  useEffect(() => { fetchPairs() }, [])

  const handleAdd = async () => {
    if (!question.trim() || !answer.trim()) return
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, answer }),
    })
    if (res.ok) {
      setQuestion('')
      setAnswer('')
      setShowAdd(false)
      fetchPairs()
    } else {
      const d = await res.json()
      setError(d.error || 'Failed to add pair')
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    await fetch('/api/qa', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchPairs()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopNav breadcrumb="Content Library" title="Q&A Pairs" />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EBF4FF' }}>
              <BookOpen size={20} style={{ color: '#1A6BB5' }} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Content Library</h1>
              <p className="text-sm text-gray-500">{pairs.length}/20 Q&A pairs</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            disabled={pairs.length >= 20}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40 transition-colors"
            style={{ background: '#3D7D3F' }}
          >
            <Plus size={16} />
            Add Q&A Pair
          </button>
        </div>

        {/* Count bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Capacity</span>
            <span>{pairs.length} / 20</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(pairs.length / 20) * 100}%`, background: '#3D7D3F' }}
            />
          </div>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 text-sm">New Q&A Pair</h3>
              <button onClick={() => { setShowAdd(false); setError('') }} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Question</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  placeholder="Enter your question..."
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Answer</label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none"
                  placeholder="Enter the answer..."
                  rows={3}
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowAdd(false); setError('') }} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={submitting || !question.trim() || !answer.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white rounded-lg disabled:opacity-50"
                  style={{ background: '#3D7D3F' }}
                >
                  {submitting ? <Loader2 size={12} className="animate-spin" /> : null}
                  Add Pair
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pairs list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : pairs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#EBF4FF' }}>
              <BookOpen size={28} style={{ color: '#1A6BB5' }} />
            </div>
            <p className="font-medium text-gray-700 mb-1">No Q&A pairs yet</p>
            <p className="text-sm text-gray-400">Add some Q&A pairs and the agent will check for contradictions.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pairs.map((pair, i) => (
              <div key={pair.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-gray-400">QA-{pairs.length - i}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{formatDate(pair.createdAt)}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mb-1.5">{pair.question}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{pair.answer}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(pair.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-all flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
