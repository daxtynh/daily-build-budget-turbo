"use client"

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Plus, Trash2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBudgetStore } from '@/lib/store'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

interface IncomeSource {
  id: string
  name: string
  amount: number
  frequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'annually'
  isDetected: boolean
}

const FREQUENCY_MULTIPLIERS = {
  weekly: 52 / 12,
  biweekly: 26 / 12,
  semimonthly: 2,
  monthly: 1,
  annually: 1 / 12,
}

export function IncomeStep() {
  const { analysis, setQuestionnaireAnswer, questionnaire } = useBudgetStore()

  // Detect income sources from transactions
  const detectedIncome = useMemo(() => {
    if (!analysis) return []

    const incomeTransactions = analysis.byCategory.income?.transactions || []
    const grouped = new Map<string, { total: number; count: number; amounts: number[] }>()

    incomeTransactions.forEach(txn => {
      const key = txn.merchant || txn.description.substring(0, 30)
      const existing = grouped.get(key) || { total: 0, count: 0, amounts: [] }
      existing.total += txn.amount
      existing.count++
      existing.amounts.push(txn.amount)
      grouped.set(key, existing)
    })

    return Array.from(grouped.entries()).map(([name, data]) => {
      // Detect frequency based on count and amounts
      let frequency: IncomeSource['frequency'] = 'monthly'
      const avgAmount = data.total / data.count

      if (data.count >= 4) frequency = 'weekly'
      else if (data.count >= 2 && Math.abs(data.amounts[0] - data.amounts[1]) < 10) {
        frequency = 'biweekly'
      }

      return {
        id: Math.random().toString(36).substring(2, 9),
        name,
        amount: Math.round(avgAmount),
        frequency,
        isDetected: true,
      }
    })
  }, [analysis])

  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>(
    (questionnaire.incomeSources as IncomeSource[] | undefined) || detectedIncome
  )

  // Update when detected income changes
  useEffect(() => {
    if (detectedIncome.length > 0 && incomeSources.length === 0) {
      setIncomeSources(detectedIncome)
    }
  }, [detectedIncome, incomeSources.length])

  // Calculate monthly income
  const monthlyIncome = useMemo(() => {
    return incomeSources.reduce((total, source) => {
      return total + source.amount * FREQUENCY_MULTIPLIERS[source.frequency]
    }, 0)
  }, [incomeSources])

  // Save to questionnaire
  useEffect(() => {
    setQuestionnaireAnswer('incomeSources', incomeSources)
    setQuestionnaireAnswer('monthlyIncome', monthlyIncome)
  }, [incomeSources, monthlyIncome, setQuestionnaireAnswer])

  const addIncomeSource = () => {
    setIncomeSources([
      ...incomeSources,
      {
        id: Math.random().toString(36).substring(2, 9),
        name: '',
        amount: 0,
        frequency: 'monthly',
        isDetected: false,
      },
    ])
  }

  const updateIncomeSource = (id: string, updates: Partial<IncomeSource>) => {
    setIncomeSources(sources =>
      sources.map(s => (s.id === id ? { ...s, ...updates, isDetected: false } : s))
    )
  }

  const removeIncomeSource = (id: string) => {
    setIncomeSources(sources => sources.filter(s => s.id !== id))
  }

  const resetToDetected = () => {
    setIncomeSources(detectedIncome)
  }

  return (
    <div className="py-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Confirm Your Income
        </h2>
        <p className="text-gray-600">
          We detected these income sources from your transactions. Add, edit, or remove as needed.
        </p>
      </div>

      {/* Monthly Summary */}
      <Card className="mb-6 bg-gradient-to-r from-green-500 to-emerald-600 border-0 text-white">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-green-100 mb-1">Estimated Monthly Income</p>
            <p className="text-4xl font-bold">{formatCurrency(monthlyIncome)}</p>
            {analysis && monthlyIncome !== analysis.totalIncome && (
              <p className="text-green-200 text-sm mt-2">
                Based on transaction history: {formatCurrency(analysis.totalIncome)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Income Sources */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Income Sources</CardTitle>
            <CardDescription>All the ways money comes in</CardDescription>
          </div>
          {detectedIncome.length > 0 && (
            <Button variant="ghost" size="sm" onClick={resetToDetected}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Detected
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incomeSources.map((source, index) => (
              <motion.div
                key={source.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex flex-wrap gap-3 p-4 rounded-lg border",
                  source.isDetected ? "bg-green-50 border-green-200" : "bg-gray-50"
                )}
              >
                {source.isDetected && (
                  <div className="w-full flex items-center gap-2 text-sm text-green-600 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    Detected from your transactions
                  </div>
                )}

                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs text-gray-500 mb-1 block">Source Name</label>
                  <Input
                    placeholder="e.g., Salary, Freelance, Side Hustle"
                    value={source.name}
                    onChange={(e) => updateIncomeSource(source.id, { name: e.target.value })}
                  />
                </div>

                <div className="w-32">
                  <label className="text-xs text-gray-500 mb-1 block">Amount</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={source.amount || ''}
                    onChange={(e) => updateIncomeSource(source.id, { amount: parseFloat(e.target.value) || 0 })}
                    icon={<DollarSign className="w-4 h-4" />}
                  />
                </div>

                <div className="w-40">
                  <label className="text-xs text-gray-500 mb-1 block">Frequency</label>
                  <Select
                    value={source.frequency}
                    onValueChange={(v) => updateIncomeSource(source.id, { frequency: v as IncomeSource['frequency'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                      <SelectItem value="semimonthly">Twice a month</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeIncomeSource(source.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="w-full text-right text-sm text-gray-500">
                  = {formatCurrency(source.amount * FREQUENCY_MULTIPLIERS[source.frequency])}/month
                </div>
              </motion.div>
            ))}

            <Button
              variant="outline"
              onClick={addIncomeSource}
              className="w-full border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Income Source
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Tips for accurate budgeting:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Include all regular income sources (salary, freelance, rental, etc.)</li>
                <li>Use your take-home (after-tax) amount for salary</li>
                <li>For variable income, use a conservative average</li>
                <li>Don't include one-time bonuses or tax refunds</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
