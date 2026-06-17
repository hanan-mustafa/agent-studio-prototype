import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { redis, KEYS } from '@/lib/redis'
import { QAPair, RunRecord, RunResult, Notification, Contradiction } from '@/lib/types'
import { generateId } from '@/lib/utils'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST() {
  const runId = generateId()
  const startedAt = new Date().toISOString()

  const runRecord: RunRecord = {
    id: runId,
    status: 'running',
    startedAt,
  }
  await redis.lpush(KEYS.runHistory, runRecord)
  await redis.ltrim(KEYS.runHistory, 0, 19)

  try {
    const pairs = await redis.lrange<QAPair>(KEYS.qaPairs, 0, -1)

    if (pairs.length < 2) {
      const result: RunResult = {
        runId,
        executiveSummary: 'Not enough Q&A pairs to analyze. Please add at least 2 pairs.',
        contradictions: [],
        recommendations: ['Add more Q&A pairs to the content library to enable contradiction detection.'],
        generatedAt: new Date().toISOString(),
      }
      await finalize(runId, startedAt, result, 0)
      return NextResponse.json({ runId })
    }

    const pairsText = pairs.map((p, i) =>
      `QA-${i + 1} (id: ${p.id})\nQ: ${p.question}\nA: ${p.answer}`
    ).join('\n\n')

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `You are a content auditor. Analyze the following Q&A pairs and identify ONLY contradictions (not duplicates).

A contradiction is when two answers make incompatible factual claims about the same topic — both cannot be true at the same time.

Q&A Pairs:
${pairsText}

Respond ONLY with valid JSON matching this exact structure:
{
  "executiveSummary": "string",
  "contradictions": [
    {
      "id": "C1",
      "severity": "High" | "Medium" | "Low",
      "qa1": { "id": "qa-id", "question": "...", "answer": "..." },
      "qa2": { "id": "qa-id", "question": "...", "answer": "..." },
      "explanation": "string explaining the contradiction",
      "recommendation": "string with suggested action"
    }
  ],
  "recommendations": ["string", "string"]
}

If no contradictions found, return empty array. Severity: High = direct factual incompatibility, Medium = likely conflict with missing qualifiers, Low = minor variance.`
      }]
    })

    const raw = (message.content[0] as { type: string; text: string }).text
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const parsed = JSON.parse(jsonMatch[0])

    const result: RunResult = {
      runId,
      executiveSummary: parsed.executiveSummary,
      contradictions: parsed.contradictions as Contradiction[],
      recommendations: parsed.recommendations,
      generatedAt: new Date().toISOString(),
    }

    await finalize(runId, startedAt, result, result.contradictions.length)
    return NextResponse.json({ runId })

  } catch (error) {
    const history = await redis.lrange<RunRecord>(KEYS.runHistory, 0, -1)
    const idx = history.findIndex(r => r.id === runId)
    if (idx !== -1) {
      history[idx] = { ...history[idx], status: 'failed', completedAt: new Date().toISOString() }
      await redis.lset(KEYS.runHistory, idx, history[idx])
    }
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

async function finalize(runId: string, startedAt: string, result: RunResult, count: number) {
  const completedAt = new Date().toISOString()

  await redis.set(KEYS.runResult(runId), result)

  const history = await redis.lrange<RunRecord>(KEYS.runHistory, 0, -1)
  const idx = history.findIndex(r => r.id === runId)
  if (idx !== -1) {
    const updated: RunRecord = {
      ...history[idx],
      status: 'completed',
      completedAt,
      summary: count === 0 ? 'No contradictions found' : `${count} contradiction${count > 1 ? 's' : ''} found`,
      contradictionCount: count,
    }
    await redis.lset(KEYS.runHistory, idx, updated)
  }

  const notification: Notification = {
    id: generateId(),
    runId,
    message: count === 0
      ? 'Content Contradiction Auditor: No contradictions found in your Q&A library.'
      : `Content Contradiction Auditor: ${count} contradiction${count > 1 ? 's' : ''} detected in your Q&A library.`,
    read: false,
    createdAt: completedAt,
  }
  await redis.lpush(KEYS.notifications, notification)
  await redis.ltrim(KEYS.notifications, 0, 19)
}
