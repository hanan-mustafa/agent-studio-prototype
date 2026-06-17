import { NextResponse } from 'next/server'
import { redis, KEYS } from '@/lib/redis'
import { Notification } from '@/lib/types'

export async function GET() {
  const notifications = await redis.lrange<Notification>(KEYS.notifications, 0, 19)
  return NextResponse.json(notifications)
}

export async function PATCH(req: Request) {
  const { id } = await req.json()
  const notifications = await redis.lrange<Notification>(KEYS.notifications, 0, -1)
  const idx = notifications.findIndex(n => n.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const updated = { ...notifications[idx], read: true }
  await redis.lset(KEYS.notifications, idx, updated)
  return NextResponse.json(updated)
}
