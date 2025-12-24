import { RawTransaction, CategorizedTransaction, TransactionCategory, CATEGORY_INFO } from './types'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!

interface AICategorizationResult {
  category: TransactionCategory
  subcategory: string
  confidence: number
  merchant?: string
  isRecurring: boolean
  notes?: string
}

export async function categorizeWithAI(
  transactions: RawTransaction[]
): Promise<AICategorizationResult[]> {
  // Batch transactions for efficiency (max 50 at a time)
  const batchSize = 50
  const results: AICategorizationResult[] = []

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize)
    const batchResults = await categorizeBatch(batch)
    results.push(...batchResults)
  }

  return results
}

async function categorizeBatch(
  transactions: RawTransaction[]
): Promise<AICategorizationResult[]> {
  const categories = Object.entries(CATEGORY_INFO)
    .map(([key, info]) => `- ${key}: ${info.label} (${info.description})`)
    .join('\n')

  const transactionList = transactions
    .map((t, i) => `${i + 1}. Date: ${t.date.split('T')[0]}, Amount: $${t.amount.toFixed(2)}, Description: "${t.description}"`)
    .join('\n')

  const prompt = `You are a financial transaction categorizer. Analyze these bank transactions and categorize each one.

Available categories:
${categories}

Transactions to categorize:
${transactionList}

For each transaction, respond with a JSON array where each element has:
- index: the transaction number (1-based)
- category: one of the category keys listed above
- subcategory: a specific subcategory (e.g., "Fast Food" for dining, "Gas" for transportation)
- confidence: 0.0-1.0 how confident you are
- merchant: the merchant name if identifiable (null if unclear)
- isRecurring: true/false if this appears to be a recurring payment
- notes: any relevant notes (null if none)

Important:
- Income transactions (positive amounts) should be categorized as "income"
- Look for subscription/recurring patterns
- Be specific with subcategories
- Use "other" only as a last resort

Respond ONLY with valid JSON array, no other text.`

  try {
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
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.content[0].text

    // Parse JSON response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No JSON array found in response')
    }

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      index: number
      category: TransactionCategory
      subcategory: string
      confidence: number
      merchant: string | null
      isRecurring: boolean
      notes: string | null
    }>

    // Map back to results
    return transactions.map((_, i) => {
      const result = parsed.find((p) => p.index === i + 1)
      if (result) {
        return {
          category: result.category,
          subcategory: result.subcategory,
          confidence: result.confidence,
          merchant: result.merchant || undefined,
          isRecurring: result.isRecurring,
          notes: result.notes || undefined,
        }
      }
      // Fallback
      return {
        category: 'other' as TransactionCategory,
        subcategory: 'Uncategorized',
        confidence: 0.3,
        isRecurring: false,
      }
    })
  } catch (error) {
    console.error('AI categorization error:', error)
    // Return fallback categorizations
    return transactions.map(() => ({
      category: 'other' as TransactionCategory,
      subcategory: 'Uncategorized',
      confidence: 0.3,
      isRecurring: false,
    }))
  }
}

export async function askBudgetQuestion(
  question: string,
  context: {
    analysis?: object
    userProfile?: object
    currentBudget?: object
  }
): Promise<string> {
  const prompt = `You are a friendly financial advisor helping someone build a budget using the TurboTax-style wizard called BudgetTurbo.

Context about the user's finances:
${JSON.stringify(context, null, 2)}

User's question: ${question}

Provide a helpful, concise response. Be specific with numbers when relevant. Keep the tone friendly and encouraging. If you need more information to give a good answer, ask a clarifying question.`

  try {
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
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return data.content[0].text
  } catch (error) {
    console.error('AI question error:', error)
    return 'I encountered an error processing your question. Please try again.'
  }
}

export async function generateBudgetRecommendations(context: {
  analysis: object
  userProfile: object
  goals: string[]
}): Promise<{
  recommendations: Array<{
    category: TransactionCategory
    currentSpend: number
    recommendedBudget: number
    reasoning: string
    priority: 'high' | 'medium' | 'low'
  }>
  insights: string[]
  warnings: string[]
  savingsOpportunities: Array<{
    description: string
    potentialSavings: number
    difficulty: 'easy' | 'medium' | 'hard'
  }>
}> {
  const prompt = `You are an expert financial advisor. Analyze this spending data and create personalized budget recommendations.

User's Financial Analysis:
${JSON.stringify(context.analysis, null, 2)}

User Profile:
${JSON.stringify(context.userProfile, null, 2)}

Financial Goals:
${context.goals.join(', ')}

Provide detailed budget recommendations in this exact JSON format:
{
  "recommendations": [
    {
      "category": "category_key",
      "currentSpend": 0,
      "recommendedBudget": 0,
      "reasoning": "explanation",
      "priority": "high|medium|low"
    }
  ],
  "insights": ["insight 1", "insight 2"],
  "warnings": ["warning 1"],
  "savingsOpportunities": [
    {
      "description": "what to do",
      "potentialSavings": 0,
      "difficulty": "easy|medium|hard"
    }
  ]
}

Be specific with numbers. Consider the user's goals and situation. Identify realistic savings opportunities.
Respond ONLY with valid JSON, no other text.`

  try {
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
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.content[0].text

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('AI recommendations error:', error)
    return {
      recommendations: [],
      insights: ['Unable to generate recommendations. Please try again.'],
      warnings: [],
      savingsOpportunities: [],
    }
  }
}
