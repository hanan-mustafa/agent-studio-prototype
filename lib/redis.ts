import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const KEYS = {
  qaPairs: 'qa_pairs',
  schedules: 'schedules',
  runHistory: 'run_history',
  runResult: (id: string) => `run_result:${id}`,
  notifications: 'notifications',
}
