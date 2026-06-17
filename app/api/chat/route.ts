import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  const { message, context } = await req.json()

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: `You are a content audit assistant helping a Content Librarian understand contradiction audit results for their Q&A library. Be concise, helpful, and specific. ${context ? `Audit context: ${context}` : ''}`,
    messages: [{ role: 'user', content: message }],
  })

  return NextResponse.json({
    response: (response.content[0] as { type: string; text: string }).text,
  })
}
