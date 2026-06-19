'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Send, Plus, AlignLeft, Bot, Loader2, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { RunResult, Contradiction } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  High:   { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  Medium: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  Low:    { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [result, setResult] = useState<RunResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/results/${id}`)
      .then(r => r.json())
      .then(data => {
        setResult(data)
        setLoading(false)
        const count = data.contradictions?.length || 0
        const intro = count === 0
          ? `I've completed the contradiction audit of your Q&A library. Good news — I found no contradictions! Your content appears consistent.`
          : `I've completed the contradiction audit of your Q&A library. I found **${count} contradiction${count > 1 ? 's'  : ''}** that need your attention. The full report is on the right. Feel free to ask me about any specific issue.`
        setMessages([{ role: 'assistant', content: intro }])
      })
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    const userMsg = input.trim()
    setInput('')
    setMessages(m => [...m, { role: 'user', content: userMsg }])
    setSending(true)

    const context = result
      ? `Audit results: ${JSON.stringify({ summary: result.executiveSummary, contradictions: result.contradictions.map(c => ({ severity: c.severity, explanation: c.explanation, recommendation: c.recommendation })) })}`
      : ''

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg, context }),
    })
    const data = await res.json()
    setMessages(m => [...m, { role: 'assistant', content: data.response }])
    setSending(false)
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Top bar */}
      <div className="h-12 border-b border-gray-100 flex items-center px-4 gap-3 bg-white flex-shrink-0">
        <button onClick={() => router.push('/agent')} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={16} />
        </button>
        <div className="w-5 h-5">
          <svg viewBox="0 0 32 32"><path d="M8 4 C8 4 4 10 4 16 C4 22 8 28 16 28 C20 28 24 26 26 22 L20 18 C19 20 17.5 21 16 21 C12 21 9 18.5 9 16 C9 13.5 11 10 14 9 Z" fill="#3D7D3F"/><path d="M16 4 C20 4 24 6 26 10 L20 14 C19 12 17.5 11 16 11 C14 11 12 12 11 14 L5 10 C7 6 11 4 16 4 Z" fill="#6BBF6E"/></svg>
        </div>
        <span className="text-sm font-semibold text-gray-800 flex-1 truncate">
          {loading ? 'Loading...' : 'Content Contradiction Audit'}
        </span>
        <div className="flex items-center gap-2 text-gray-400">
          <button className="p-1.5 hover:bg-gray-100 rounded"><svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 3H5a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V5a2 2 0 00-2-2z"/></svg></button>
          <button className="p-1.5 hover:bg-gray-100 rounded"><svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10M8 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left pane - Chat */}
        <div className="w-[380px] flex-shrink-0 border-r border-gray-100 flex flex-col">
          {/* Sidebar icons */}
          <div className="absolute left-0 top-12 h-full w-10 flex flex-col items-center pt-3 gap-3 border-r border-gray-100">
            <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><Plus size={16} /></button>
            <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><AlignLeft size={16} /></button>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 ml-8 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-gray-400" />
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'user' ? (
                    <div className="bg-gray-100 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%]">
                      <p className="text-sm text-gray-800">{msg.content}</p>
                    </div>
                  ) : (
                    <div className="max-w-[90%]">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button className="p-1 hover:bg-gray-100 rounded text-gray-300"><svg viewBox="0 0 14 14" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="8" height="8" rx="1"/><path d="M2 10V2h8"/></svg></button>
                        <button className="p-1 hover:bg-gray-100 rounded text-gray-300"><AlignLeft size={12} /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            {sending && (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">Thinking...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 pb-4 ml-8">
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <input
                className="w-full px-4 py-3 text-sm text-gray-700 outline-none placeholder:text-gray-400"
                placeholder="Ask Responsive"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center gap-1">
                  <button className="p-1.5 rounded hover:bg-gray-200 text-gray-400"><AlignLeft size={14} /></button>
                  <button className="p-1.5 rounded hover:bg-gray-200 text-gray-400"><Plus size={14} /></button>
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white disabled:opacity-40"
                  style={{ background: '#3D7D3F' }}
                >
                  <Send size={12} />
                </button>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">AI can make mistakes. Double-check key details before using responses.</p>
          </div>
        </div>

        {/* Right pane - Results */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : result ? (
            <div className="max-w-2xl">
              {/* Meta */}
              <div className="mb-6">
                <p className="text-xs text-gray-400 mb-1">Generated {formatDate(result.generatedAt)}</p>
                <div className="w-full h-px bg-gray-100" />
              </div>

              {/* Executive Summary */}
              <section className="mb-8">
                <h2 className="text-lg font-semibold mb-3" style={{ color: '#1A6BB5' }}>Executive Summary</h2>
                <p className="text-sm text-gray-700 leading-relaxed">{result.executiveSummary}</p>
              </section>

              {/* Contradictions */}
              {result.contradictions.length > 0 ? (
                <section className="mb-8">
                  <h2 className="text-lg font-semibold mb-4" style={{ color: '#1A6BB5' }}>
                    Contradictions <span className="text-sm font-normal text-gray-400 ml-1">({result.contradictions.length} found)</span>
                  </h2>
                  <div className="space-y-4">
                    {result.contradictions.map((c: Contradiction) => {
                      const s = SEVERITY_STYLES[c.severity] || SEVERITY_STYLES.Low
                      return (
                        <div key={c.id} className="border rounded-xl overflow-hidden" style={{ borderColor: s.border }}>
                          {/* Severity header */}
                          <div className="flex items-center justify-between px-4 py-2.5" style={{ background: s.bg }}>
                            <div className="flex items-center gap-2">
                              <AlertTriangle size={14} style={{ color: s.text }} />
                              <span className="text-xs font-semibold" style={{ color: s.text }}>{c.severity} Severity</span>
                            </div>
                            <span className="text-xs font-mono text-gray-400">{c.id}</span>
                          </div>

                          <div className="p-4 space-y-3">
                            {/* Q&A 1 */}
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs font-semibold text-gray-500 mb-1">Q: {c.qa1.question}</p>
                              <p className="text-xs text-gray-700 leading-relaxed">&ldquo;{c.qa1.answer}&rdquo;</p>
                            </div>

                            {/* vs divider */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-px bg-gray-100" />
                              <span className="text-xs text-gray-400 font-medium">conflicts with</span>
                              <div className="flex-1 h-px bg-gray-100" />
                            </div>

                            {/* Q&A 2 */}
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs font-semibold text-gray-500 mb-1">Q: {c.qa2.question}</p>
                              <p className="text-xs text-gray-700 leading-relaxed">&ldquo;{c.qa2.answer}&rdquo;</p>
                            </div>

                            {/* Explanation */}
                            <div className="flex items-start gap-2 pt-1">
                              <Info size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-gray-600 leading-relaxed">{c.explanation}</p>
                            </div>

                            {/* Recommendation */}
                            <div className="border-t border-gray-100 pt-3 flex items-start gap-2">
                              <Bot size={13} style={{ color: '#3D7D3F' }} className="mt-0.5 flex-shrink-0" />
                              <p className="text-xs leading-relaxed" style={{ color: '#3D7D3F' }}>
                                <span className="font-semibold">Recommendation: </span>{c.recommendation}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              ) : (
                <section className="mb-8">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-100">
                    <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-800">No contradictions found</p>
                      <p className="text-xs text-green-600 mt-0.5">Your Q&A library is internally consistent.</p>
                    </div>
                  </div>
                </section>
              )}

              {/* Recommendations */}
              {result.recommendations?.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-3" style={{ color: '#1A6BB5' }}>Recommendations</h2>
                  <ul className="space-y-2">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 mt-0.5" style={{ background: '#1A6BB5' }}>{i + 1}</span>
                        <span className="leading-relaxed">{r}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p className="text-sm">Result not found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
