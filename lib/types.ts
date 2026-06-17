export interface QAPair {
  id: string
  question: string
  answer: string
  createdAt: string
}

export interface ScheduleConfig {
  interval: string
  cronExpression: string
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

export const SCHEDULE_OPTIONS = [
  { label: 'Every 1 minute', value: 'every_1_min', cron: '* * * * *' },
  { label: 'Every 5 minutes', value: 'every_5_min', cron: '*/5 * * * *' },
  { label: 'Every 15 minutes', value: 'every_15_min', cron: '*/15 * * * *' },
  { label: 'Every hour', value: 'every_hour', cron: '0 * * * *' },
  { label: 'Daily at 9:00 AM', value: 'daily_9am', cron: '0 9 * * *' },
]
