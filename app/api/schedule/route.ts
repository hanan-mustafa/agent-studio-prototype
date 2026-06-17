import { NextResponse } from 'next/server'
import { Client } from '@upstash/qstash'
import { redis, KEYS } from '@/lib/redis'
import { ScheduleConfig, SCHEDULE_OPTIONS } from '@/lib/types'

const qstash = new Client({ token: process.env.QSTASH_TOKEN! })

function getNextRun(cron: string): string {
  // Simple approximation for display
  const now = new Date()
  const option = SCHEDULE_OPTIONS.find(o => o.cron === cron)
  if (!option) return now.toISOString()

  if (cron === '* * * * *') now.setMinutes(now.getMinutes() + 1)
  else if (cron === '*/5 * * * *') now.setMinutes(now.getMinutes() + 5)
  else if (cron === '*/15 * * * *') now.setMinutes(now.getMinutes() + 15)
  else if (cron === '0 * * * *') now.setHours(now.getHours() + 1, 0, 0, 0)
  else if (cron === '0 9 * * *') {
    now.setHours(9, 0, 0, 0)
    if (now < new Date()) now.setDate(now.getDate() + 1)
  }
  return now.toISOString()
}

export async function GET() {
  const config = await redis.get<ScheduleConfig>(KEYS.scheduleConfig)
  const history = await redis.lrange(KEYS.runHistory, 0, 9)
  return NextResponse.json({ config, history })
}

export async function POST(req: Request) {
  const { interval, cronExpression } = await req.json()

  const existing = await redis.get<ScheduleConfig>(KEYS.scheduleConfig)
  if (existing?.qstashScheduleId) {
    try {
      await qstash.schedules.delete(existing.qstashScheduleId)
    } catch {}
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  const schedule = await qstash.schedules.create({
    destination: `${baseUrl}/api/run`,
    cron: cronExpression,
  })

  const config: ScheduleConfig = {
    interval,
    cronExpression,
    nextRun: getNextRun(cronExpression),
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
