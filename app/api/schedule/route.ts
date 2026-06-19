import { NextResponse } from 'next/server'
import { Client } from '@upstash/qstash'
import { redis, KEYS } from '@/lib/redis'
import { ScheduleConfig } from '@/lib/types'

const qstash = new Client({ token: process.env.QSTASH_TOKEN! })

export async function GET() {
  const config = await redis.get<ScheduleConfig>(KEYS.scheduleConfig)
  const history = await redis.lrange(KEYS.runHistory, 0, 9)
  return NextResponse.json({ config, history })
}

export async function POST(req: Request) {
  const body = await req.json() as Partial<ScheduleConfig>

  if (!body.cronExpression) {
    return NextResponse.json({ error: 'Missing cron expression' }, { status: 400 })
  }

  // Remove any existing schedule before creating a new one.
  const existing = await redis.get<ScheduleConfig>(KEYS.scheduleConfig)
  if (existing?.qstashScheduleId) {
    try {
      await qstash.schedules.delete(existing.qstashScheduleId)
    } catch {}
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const schedule = await qstash.schedules.create({
    destination: `${baseUrl}/api/run`,
    cron: body.cronExpression,
  })

  const config: ScheduleConfig = {
    mode: body.mode!,
    everyMinutes: body.everyMinutes,
    everyHours: body.everyHours,
    days: body.days,
    time: body.time,
    timezone: body.timezone,
    cronExpression: body.cronExpression,
    label: body.label || body.cronExpression,
    nextRun: body.nextRun || new Date().toISOString(),
    qstashScheduleId: schedule.scheduleId,
    createdAt: new Date().toISOString(),
  }

  await redis.set(KEYS.scheduleConfig, config)
  return NextResponse.json(config)
}

export async function DELETE() {
  const existing = await redis.get<ScheduleConfig>(KEYS.scheduleConfig)
  if (existing?.qstashScheduleId) {
    try {
      await qstash.schedules.delete(existing.qstashScheduleId)
    } catch {}
  }
  await redis.del(KEYS.scheduleConfig)
  return NextResponse.json({ success: true })
}
