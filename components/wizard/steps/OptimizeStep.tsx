"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, MessageSquare, Send, Loader2, Lightbulb, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBudgetStore } from '@/lib/store'
import { formatCurrency, cn } from '@/lib/utils'

interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

interface Recommendation {
  title: string
  description: string
  savings: number
  difficulty: 'easy' | 'medium' | 'hard'
  category?: string
}

export function OptimizeStep() {
  const { analysis, userProfile, questionnaire, setQuestionnaireAnswer } = useBudgetStore()

  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState('')
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [hasAnalyzed, setHasAnalyzed] = useState(false)

  // Generate AI recommendations
  const generateRecommendations = useCallback(async () => {
    if (hasAnalyzed) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis,
          userProfile,
          questionnaire,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations || [])
        setMessages([
          {
            role: 'assistant',
            content: data.summary || 'I\'ve analyzed your spending patterns. Here are my recommendations to optimize your budget. Ask me anything about your finances!',
          },
        ])
        setHasAnalyzed(true)
      }
    } catch (error) {
      console.error('Failed to get recommendations:', error)
      // Use fallback recommendations based on analysis
      generateFallbackRecommendations()
    } finally {
      setIsLoading(false)
    }
  }, [analysis, userProfile, questionnaire, hasAnalyzed])

  const generateFallbackRecommendations = () => {
    const recs: Recommendation[] = []

    if (analysis) {
      // Dining recommendation
      if (analysis.byCategory.dining?.total > analysis.byCategory.groceries?.total * 0.5) {
        recs.push({
          title: 'Reduce Dining Out',
          description: 'Your dining expenses are high relative to groceries. Try meal prepping to save money.',
          savings: Math.round(analysis.byCategory.dining.total * 0.3),
          difficulty: 'medium',
          category: 'dining',
        })
      }

      // Subscription audit
      if (analysis.byCategory.subscriptions?.total > 100) {
        recs.push({
          title: 'Audit Subscriptions',
          description: 'Review your subscription services. Cancel ones you don\'t use regularly.',
          savings: Math.round(analysis.byCategory.subscriptions.total * 0.25),
          difficulty: 'easy',
          category: 'subscriptions',
        })
      }

      // Shopping recommendation
      if (analysis.byCategory.shopping?.total > analysis.totalIncome * 0.1) {
        recs.push({
          title: 'Implement Shopping Waiting Period',
          description: 'Wait 48 hours before non-essential purchases over $50. Many impulse buys can be avoided.',
          savings: Math.round(analysis.byCategory.shopping.total * 0.2),
          difficulty: 'easy',
          category: 'shopping',
        })
      }

      // Entertainment
      if (analysis.byCategory.entertainment?.total > 200) {
        recs.push({
          title: 'Find Free Entertainment',
          description: 'Look for free local events, library programs, and outdoor activities.',
          savings: Math.round(analysis.byCategory.entertainment.total * 0.3),
          difficulty: 'easy',
          category: 'entertainment',
        })
      }
    }

    setRecommendations(recs)
    setMessages([
      {
        role: 'assistant',
        content: 'I\'ve analyzed your spending patterns. Here are some quick wins to optimize your budget!',
      },
    ])
    setHasAnalyzed(true)
  }

  useEffect(() => {
    generateRecommendations()
  }, [generateRecommendations])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: { analysis, userProfile, questionnaire },
          history: messages,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      } else {
        throw new Error('Failed to get response')
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'I encountered an error. Please try asking your question again.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const totalPotentialSavings = recommendations.reduce((sum, r) => sum + r.savings, 0)

  return (
    <div className="py-8 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          AI Budget Optimization
        </h2>
        <p className="text-gray-600">
          Let our AI analyze your spending and suggest improvements
        </p>
      </div>

      {/* Loading State */}
      {isLoading && !hasAnalyzed && (
        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700">Analyzing your finances...</p>
            <p className="text-gray-500">This may take a moment</p>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {hasAnalyzed && recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Savings Summary */}
          <Card className="mb-6 bg-gradient-to-r from-green-500 to-emerald-600 border-0 text-white">
            <CardContent className="p-6 text-center">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-green-200" />
              <p className="text-green-100">Potential Monthly Savings</p>
              <p className="text-4xl font-bold">{formatCurrency(totalPotentialSavings)}</p>
              <p className="text-green-200 text-sm mt-1">
                That's {formatCurrency(totalPotentialSavings * 12)}/year!
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                Personalized Recommendations
              </CardTitle>
              <CardDescription>Based on your spending patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-gray-50"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      rec.difficulty === 'easy' && "bg-green-100 text-green-600",
                      rec.difficulty === 'medium' && "bg-amber-100 text-amber-600",
                      rec.difficulty === 'hard' && "bg-red-100 text-red-600"
                    )}>
                      <TrendingDown className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded",
                          rec.difficulty === 'easy' && "bg-green-100 text-green-700",
                          rec.difficulty === 'medium' && "bg-amber-100 text-amber-700",
                          rec.difficulty === 'hard' && "bg-red-100 text-red-700"
                        )}>
                          {rec.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                      <p className="text-sm font-medium text-green-600">
                        Potential savings: {formatCurrency(rec.savings)}/month
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Apply
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* AI Chat */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Ask Your AI Financial Advisor
          </CardTitle>
          <CardDescription>
            Ask questions about your budget, get clarification, or explore "what if" scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Messages */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-[300px] overflow-y-auto">
            {messages.length === 0 && !isLoading && (
              <p className="text-gray-500 text-center py-8">
                Ask me anything about your finances!
              </p>
            )}
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      msg.role === 'user'
                        ? "bg-blue-600 text-white"
                        : "bg-white border shadow-sm"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && hasAnalyzed && (
                <div className="flex justify-start">
                  <div className="bg-white border shadow-sm rounded-lg px-4 py-2">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your budget..."
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
            />
            <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Suggested Questions */}
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'How can I save more money?',
                'What if I cut dining by 30%?',
                'Am I spending too much on subscriptions?',
                'How long to save for emergency fund?',
              ].map((q) => (
                <Button
                  key={q}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setInput(q)
                    handleSendMessage()
                  }}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
