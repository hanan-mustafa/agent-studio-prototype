import { NextResponse } from 'next/server'
import { redis, KEYS } from '@/lib/redis'
import { RunResult } from '@/lib/types'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await redis.get<RunResult>(KEYS.runResult(id))
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(result)
}
