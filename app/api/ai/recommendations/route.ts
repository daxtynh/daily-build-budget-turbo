import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!

export async function POST(request: NextRequest) {
  try {
    const { analysis, userProfile, questionnaire } = await request.json()

    const prompt = `You are an expert financial advisor. Analyze this spending data and create personalized budget recommendations.

User's Financial Analysis:
${JSON.stringify(analysis, null, 2)}

User Profile:
${JSON.stringify(userProfile, null, 2)}

Budget Questionnaire Answers:
${JSON.stringify(questionnaire, null, 2)}

Provide actionable budget recommendations. Return a JSON object with this structure:
{
  "summary": "A 2-3 sentence summary of your overall assessment",
  "recommendations": [
    {
      "title": "Short title",
      "description": "Detailed description of the recommendation",
      "savings": 100,
      "difficulty": "easy|medium|hard",
      "category": "optional category name"
    }
  ]
}

Focus on:
1. Quick wins (easy changes with big impact)
2. Specific dollar amounts based on their data
3. Realistic, actionable advice
4. Their stated primary goal

Respond ONLY with valid JSON, no other text.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.content[0].text

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid response format')
    }

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch (error) {
    console.error('Recommendations API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}
