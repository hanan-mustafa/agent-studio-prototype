import { ScheduleConfig, ScheduleMode } from './types'

export const WEEKDAYS = [
  { label: 'S', full: 'Sun', value: 0 },
  { label: 'M', full: 'Mon', value: 1 },
  { label: 'T', full: 'Tue', value: 2 },
  { label: 'W', full: 'Wed', value: 3 },
  { label: 'T', full: 'Thu', value: 4 },
  { label: 'F', full: 'Fri', value: 5 },
  { label: 'S', full: 'Sat', value: 6 },
]

export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

// Minutes that `timeZone` is ahead of UTC at instant `at` (handles DST).
export function tzOffsetMinutes(timeZone: string, at: Date = new Date()): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const map: Record<string, string> = {}
  for (const p of dtf.formatToParts(at)) map[p.type] = p.value
  const asUTC = Date.UTC(
    +map.year, +map.month - 1, +map.day,
    +map.hour, +map.minute, +map.second,
  )
  return Math.round((asUTC - at.getTime()) / 60000)
}

// Convert a wall-clock time in a timezone to the corresponding UTC instant.
function zonedToInstant(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute)
  const offset = tzOffsetMinutes(timeZone, new Date(guess))
  return new Date(guess - offset * 60000)
}

export interface ScheduleInput {
  mode: ScheduleMode
  everyMinutes?: number
  everyHours?: number
  days?: number[]
  time?: string
  timezone?: string
}

export interface BuiltSchedule {
  cronExpression: string
  label: string
  nextRun: string
}

function tzAbbrev(timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }).formatToParts(new Date())
    return parts.find(p => p.type === 'timeZoneName')?.value || timeZone
  } catch {
    return timeZone
  }
}

export function buildSchedule(input: ScheduleInput): BuiltSchedule {
  const now = new Date()

  if (input.mode === 'minutes') {
    const x = Math.max(1, Math.min(59, input.everyMinutes || 1))
    return {
      cronExpression: `*/${x} * * * *`,
      label: x === 1 ? 'Every minute' : `Every ${x} minutes`,
      nextRun: new Date(now.getTime() + x * 60000).toISOString(),
    }
  }

  if (input.mode === 'hours') {
    const x = Math.max(1, Math.min(23, input.everyHours || 1))
    return {
      cronExpression: `0 */${x} * * *`,
      label: x === 1 ? 'Every hour' : `Every ${x} hours`,
      nextRun: new Date(now.getTime() + x * 3600000).toISOString(),
    }
  }

  // daily
  const tz = input.timezone || 'UTC'
  const days = (input.days && input.days.length ? input.days : [0, 1, 2, 3, 4, 5, 6]).slice().sort((a, b) => a - b)
  const [h, m] = (input.time || '09:00').split(':').map(Number)

  // Convert local time to a UTC cron, shifting the weekday if the offset crosses midnight.
  const offset = tzOffsetMinutes(tz, now)
  let total = h * 60 + m - offset
  let dayShift = 0
  if (total < 0) { total += 1440; dayShift = -1 }
  else if (total >= 1440) { total -= 1440; dayShift = 1 }
  const utcH = Math.floor(total / 60)
  const utcM = total % 60
  const utcDays = Array.from(new Set(days.map(d => ((d + dayShift) % 7 + 7) % 7))).sort((a, b) => a - b)
  const cronExpression = `${utcM} ${utcH} * * ${utcDays.join(',')}`

  // Label
  const timeLabel = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const dayLabel = days.length === 7
    ? 'every day'
    : days.map(d => WEEKDAYS[d].full).join(', ')
  const label = `${timeLabel} ${tzAbbrev(tz)} · ${dayLabel}`

  // Next run: scan the next 8 days for the earliest matching local weekday/time.
  let nextRun = ''
  for (let i = 0; i < 8; i++) {
    const probe = new Date(now.getTime() + i * 86400000)
    // local date parts in tz
    const parts: Record<string, string> = {}
    for (const p of new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', weekday: 'short',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(probe)) parts[p.type] = p.value
    const localDow = WEEKDAYS.find(w => w.full === parts.weekday)?.value
    if (localDow === undefined || !days.includes(localDow)) continue
    const instant = zonedToInstant(+parts.year, +parts.month, +parts.day, h, m, tz)
    if (instant.getTime() > now.getTime()) { nextRun = instant.toISOString(); break }
  }
  if (!nextRun) nextRun = new Date(now.getTime() + 86400000).toISOString()

  return { cronExpression, label, nextRun }
}

export function describeConfig(config: ScheduleConfig): string {
  return config.label
}
