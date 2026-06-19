export interface QAPair {
  id: string
  question: string
  answer: string
  createdAt: string
}

export type ScheduleMode = 'minutes' | 'hours' | 'daily'

export interface ScheduleConfig {
  mode: ScheduleMode
  everyMinutes?: number
  everyHours?: number
  days?: number[] // 0=Sun .. 6=Sat, in the user's local timezone
  time?: string // "HH:MM" in the user's local timezone
  timezone?: string // IANA tz, e.g. "America/New_York"
  cronExpression: string // UTC cron registered with QStash
  label: string // human-readable summary
  nextRun: string
  qstashScheduleId?: string
  createdAt: string
}

export interface RunRecord {
  id: string
  status: 'running' | 'completed' | 'failed'
  startedAt: string
  completedAt?: string
  summary?: string
  contradictionCount?: number
}

export interface Contradiction {
  id: string
  severity: 'High' | 'Medium' | 'Low'
  qa1: { id: string; question: string; answer: string }
  qa2: { id: string; question: string; answer: string }
  explanation: string
  recommendation: string
}

export interface RunResult {
  runId: string
  executiveSummary: string
  contradictions: Contradiction[]
  recommendations: string[]
  generatedAt: string
}

export interface Notification {
  id: string
  runId: string
  message: string
  read: boolean
  createdAt: string
}

