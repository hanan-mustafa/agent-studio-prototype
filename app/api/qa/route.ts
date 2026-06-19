import { NextResponse } from 'next/server'
import { redis, KEYS } from '@/lib/redis'
import { QAPair } from '@/lib/types'
import { generateId } from '@/lib/utils'

export async function GET() {
  const pairs = await redis.lrange<QAPair>(KEYS.qaPairs, 0, -1)
  return NextResponse.json(pairs)
}

export async function POST(req: Request) {
  const { question, answer } = await req.json()
  if (!question?.trim() || !answer?.trim()) {
    return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 })
  }

  const count = await redis.llen(KEYS.qaPairs)
  if (count >= 20) {
    return NextResponse.json({ error: 'Maximum of 20 Q&A pairs reached' }, { status: 400 })
  }

  const pair: QAPair = {
    id: generateId(),
    question: question.trim(),
    answer: answer.trim(),
    createdAt: new Date().toISOString(),
  }

  await redis.lpush(KEYS.qaPairs, pair)
  return NextResponse.json(pair, { status: 201 })
}

export async function PUT(req: Request) {
  const { id, question, answer } = await req.json()
  if (!question?.trim() || !answer?.trim()) {
    return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 })
  }

  const pairs = await redis.lrange<QAPair>(KEYS.qaPairs, 0, -1)
  const idx = pairs.findIndex(p => p.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated: QAPair = { ...pairs[idx], question: question.trim(), answer: answer.trim() }
  await redis.lset(KEYS.qaPairs, idx, updated)
  return NextResponse.json(updated)
}

export async function DELETE(req: Request) {
  const { id } = await req.json()
  const pairs = await redis.lrange<QAPair>(KEYS.qaPairs, 0, -1)
  const target = pairs.find(p => p.id === id)
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await redis.lrem(KEYS.qaPairs, 1, target)
  return NextResponse.json({ success: true })
}
