import { NextResponse } from 'next/server'
import { Client } from '@upstash/qstash'
import { redis, KEYS } from '@/lib/redis'
import { ScheduleConfig, MAX_SCHEDULES } from '@/lib/types'
import { generateId } from '@/lib/utils'

const qstash = new Client({ token: process.env.QSTASH_TOKEN! })

async function getSchedules(): Promise<ScheduleConfig[]> {
  return (await redis.get<ScheduleConfig[]>(KEYS.schedules)) || []
}

export async function GET() {
  const schedules = await getSchedules()
  const history = await redis.lrange(KEYS.runHistory, 0, 19)
  return NextResponse.json({ schedules, history })
}

export async function POST(req: Request) {
  const body = await req.json() as Partial<ScheduleConfig>

  if (!body.cronExpression) {
    return NextResponse.json({ error: 'Missing cron expression' }, { status: 400 })
  }

  const schedules = await getSchedules()
  if (schedules.length >= MAX_SCHEDULES) {
    return NextResponse.json({ error: `You can have at most ${MAX_SCHEDULES} schedules.` }, { status: 409 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const created = await qstash.schedules.create({
    destination: `${baseUrl}/api/run`,
    cron: body.cronExpression,
  })

  const schedule: ScheduleConfig = {
    id: generateId(),
    mode: body.mode!,
    everyMinutes: body.everyMinutes,
    everyHours: body.everyHours,
    days: body.days,
    time: body.time,
    timezone: body.timezone,
    cronExpression: body.cronExpression,
    label: body.label || body.cronExpression,
    nextRun: body.nextRun || new Date().toISOString(),
    qstashScheduleId: created.scheduleId,
    enabled: true,
    createdAt: new Date().toISOString(),
  }

  const updated = [...schedules, schedule]
  await redis.set(KEYS.schedules, updated)
  return NextResponse.json({ schedules: updated })
}

export async function PATCH(req: Request) {
  const { id, enabled } = await req.json() as { id: string; enabled: boolean }
  const schedules = await getSchedules()
  const target = schedules.find(s => s.id === id)
  if (!target) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })

  if (target.qstashScheduleId) {
    try {
      if (enabled) await qstash.schedules.resume({ schedule: target.qstashScheduleId })
      else await qstash.schedules.pause({ schedule: target.qstashScheduleId })
    } catch {}
  }

  const updated = schedules.map(s => s.id === id ? { ...s, enabled } : s)
  await redis.set(KEYS.schedules, updated)
  return NextResponse.json({ schedules: updated })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const schedules = await getSchedules()

  if (!id) {
    // Remove all (and their QStash schedules)
    for (const s of schedules) {
      if (s.qstashScheduleId) { try { await qstash.schedules.delete(s.qstashScheduleId) } catch {} }
    }
    await redis.del(KEYS.schedules)
    return NextResponse.json({ schedules: [] })
  }

  const target = schedules.find(s => s.id === id)
  if (target?.qstashScheduleId) {
    try { await qstash.schedules.delete(target.qstashScheduleId) } catch {}
  }
  const updated = schedules.filter(s => s.id !== id)
  await redis.set(KEYS.schedules, updated)
  return NextResponse.json({ schedules: updated })
}
