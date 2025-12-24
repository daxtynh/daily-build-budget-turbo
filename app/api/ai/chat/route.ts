import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!

export async function POST(request: NextRequest) {
  try {
    const { message, context, history } = await request.json()

    const systemPrompt = `You are a friendly, knowledgeable financial advisor helping someone with their budget using BudgetTurbo. You have access to their financial data and should provide personalized, actionable advice.

User's Financial Context:
- Analysis: ${JSON.stringify(context.analysis || {}, null, 2)}
- Profile: ${JSON.stringify(context.userProfile || {}, null, 2)}
- Budget Answers: ${JSON.stringify(context.questionnaire || {}, null, 2)}

Guidelines:
1. Be conversational and friendly, not robotic
2. Reference specific numbers from their data when relevant
3. Provide concrete, actionable suggestions
4. If they ask "what if" scenarios, do the math for them
5. Keep responses concise (2-4 paragraphs max)
6. If you need more info to give good advice, ask clarifying questions
7. Be encouraging but honest - don't sugarcoat problems`

    const messages = [
      ...(history || []).map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ]

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json({ response: data.content[0].text })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to get response' },
      { status: 500 }
    )
  }
}
