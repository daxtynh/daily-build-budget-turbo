import { NextRequest, NextResponse } from 'next/server'
import { CATEGORY_INFO, TransactionCategory } from '@/lib/types'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!

export async function POST(request: NextRequest) {
  try {
    const { transactions } = await request.json()

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ results: [] })
    }

    // Process in batches
    const batchSize = 50
    const allResults: Array<{
      index: number
      category: TransactionCategory
      subcategory: string
      confidence: number
      merchant: string | null
      isRecurring: boolean
    }> = []

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize)

      const categories = Object.entries(CATEGORY_INFO)
        .map(([key, info]) => `- ${key}: ${info.label} (${info.description})`)
        .join('\n')

      const transactionList = batch
        .map((t: { date: string; amount: number; description: string }, idx: number) =>
          `${idx + 1}. Date: ${t.date?.split('T')[0] || 'Unknown'}, Amount: $${t.amount?.toFixed(2) || 0}, Description: "${t.description || 'Unknown'}"`
        )
        .join('\n')

      const prompt = `Categorize these bank transactions. Available categories:
${categories}

Transactions:
${transactionList}

Return a JSON array with each element having:
- index: transaction number (1-based)
- category: category key from above
- subcategory: specific subcategory (e.g., "Fast Food" for dining)
- confidence: 0.0-1.0
- merchant: merchant name if identifiable, null otherwise
- isRecurring: true/false

Respond ONLY with valid JSON array.`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) {
        console.error(`API error: ${response.status}`)
        continue
      }

      const data = await response.json()
      const content = data.content[0].text

      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const batchResults = JSON.parse(jsonMatch[0])
          // Adjust indices for the full array
          batchResults.forEach((r: { index: number }) => {
            r.index = r.index + i
          })
          allResults.push(...batchResults)
        }
      } catch {
        console.error('Failed to parse batch results')
      }
    }

    return NextResponse.json({ results: allResults })
  } catch (error) {
    console.error('Categorize API error:', error)
    return NextResponse.json(
      { error: 'Failed to categorize transactions' },
      { status: 500 }
    )
  }
}
