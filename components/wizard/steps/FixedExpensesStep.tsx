"use client"

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Plus, Trash2, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
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
import { TransactionCategory, CATEGORY_INFO } from '@/lib/types'
import { formatCurrency, cn } from '@/lib/utils'

interface FixedExpense {
  id: string
  name: string
  amount: number
  category: TransactionCategory
  dueDay?: number
  isDetected: boolean
}

const FIXED_CATEGORIES: TransactionCategory[] = [
  'housing',
  'utilities',
  'insurance',
  'debt',
  'subscriptions',
  'childcare',
]

export function FixedExpensesStep() {
  const { analysis, setQuestionnaireAnswer, questionnaire } = useBudgetStore()

  // Detect recurring expenses from transactions
  const detectedExpenses = useMemo(() => {
    if (!analysis) return []

    const recurringTxns = analysis.recurringExpenses.filter(
      txn => FIXED_CATEGORIES.includes(txn.category)
    )

    // Group by merchant/description
    const grouped = new Map<string, { amount: number; category: TransactionCategory; count: number }>()

    recurringTxns.forEach(txn => {
      const key = txn.merchant || txn.description.substring(0, 30)
      const existing = grouped.get(key)

      if (existing) {
        existing.amount = Math.max(existing.amount, Math.abs(txn.amount))
        existing.count++
      } else {
        grouped.set(key, {
          amount: Math.abs(txn.amount),
          category: txn.category,
          count: 1,
        })
      }
    })

    return Array.from(grouped.entries()).map(([name, data]) => ({
      id: Math.random().toString(36).substring(2, 9),
      name,
      amount: Math.round(data.amount),
      category: data.category,
      isDetected: true,
    }))
  }, [analysis])

  const [expenses, setExpenses] = useState<FixedExpense[]>(
    (questionnaire.fixedExpenses as unknown as FixedExpense[] | undefined) || detectedExpenses
  )

  useEffect(() => {
    if (detectedExpenses.length > 0 && expenses.length === 0) {
      setExpenses(detectedExpenses)
    }
  }, [detectedExpenses, expenses.length])

  const totalFixed = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0)
  }, [expenses])

  useEffect(() => {
    setQuestionnaireAnswer('fixedExpenses', expenses)
    setQuestionnaireAnswer('totalFixedExpenses', totalFixed)
  }, [expenses, totalFixed, setQuestionnaireAnswer])

  const addExpense = () => {
    setExpenses([
      ...expenses,
      {
        id: Math.random().toString(36).substring(2, 9),
        name: '',
        amount: 0,
        category: 'utilities',
        isDetected: false,
      },
    ])
  }

  const updateExpense = (id: string, updates: Partial<FixedExpense>) => {
    setExpenses(e => e.map(exp => (exp.id === id ? { ...exp, ...updates, isDetected: false } : exp)))
  }

  const removeExpense = (id: string) => {
    setExpenses(e => e.filter(exp => exp.id !== id))
  }

  // Group by category for display
  const byCategory = useMemo(() => {
    const grouped: Record<string, { expenses: FixedExpense[]; total: number }> = {}

    expenses.forEach(exp => {
      if (!grouped[exp.category]) {
        grouped[exp.category] = { expenses: [], total: 0 }
      }
      grouped[exp.category].expenses.push(exp)
      grouped[exp.category].total += exp.amount
    })

    return grouped
  }, [expenses])

  return (
    <div className="py-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Fixed Monthly Expenses
        </h2>
        <p className="text-gray-600">
          These are bills that stay roughly the same each month. We found some from your recurring transactions.
        </p>
      </div>

      {/* Total Summary */}
      <Card className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 border-0 text-white">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-blue-100 mb-1">Total Fixed Expenses</p>
            <p className="text-4xl font-bold">{formatCurrency(totalFixed)}</p>
            <p className="text-blue-200 text-sm mt-2">
              {expenses.length} monthly commitments
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {FIXED_CATEGORIES.map(cat => {
          const info = CATEGORY_INFO[cat]
          const data = byCategory[cat]
          return (
            <Card key={cat} className={cn(
              "transition-all",
              data ? "border-blue-200" : "opacity-50"
            )}>
              <CardContent className="p-4 text-center">
                <span className="text-2xl">{info.icon}</span>
                <p className="text-sm font-medium text-gray-700 mt-1">{info.label}</p>
                <p className="text-lg font-bold text-gray-900">
                  {data ? formatCurrency(data.total) : '$0'}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Expense List */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Your Fixed Bills</CardTitle>
          <CardDescription>Add, edit, or remove expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenses.map((expense, index) => {
              const catInfo = CATEGORY_INFO[expense.category]
              return (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex flex-wrap gap-3 p-4 rounded-lg border",
                    expense.isDetected ? "bg-blue-50 border-blue-200" : "bg-gray-50"
                  )}
                >
                  {expense.isDetected && (
                    <div className="w-full flex items-center gap-2 text-sm text-blue-600 mb-2">
                      <CheckCircle className="w-4 h-4" />
                      Detected recurring payment
                    </div>
                  )}

                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: catInfo.color + '20' }}>
                    <span className="text-lg">{catInfo.icon}</span>
                  </div>

                  <div className="flex-1 min-w-[150px]">
                    <Input
                      placeholder="e.g., Rent, Netflix, Car Payment"
                      value={expense.name}
                      onChange={(e) => updateExpense(expense.id, { name: e.target.value })}
                    />
                  </div>

                  <div className="w-28">
                    <Input
                      type="number"
                      placeholder="0"
                      value={expense.amount || ''}
                      onChange={(e) => updateExpense(expense.id, { amount: parseFloat(e.target.value) || 0 })}
                      icon={<DollarSign className="w-4 h-4" />}
                    />
                  </div>

                  <div className="w-36">
                    <Select
                      value={expense.category}
                      onValueChange={(v) => updateExpense(expense.id, { category: v as TransactionCategory })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIXED_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {CATEGORY_INFO[cat].icon} {CATEGORY_INFO[cat].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-20">
                    <Input
                      type="number"
                      placeholder="Day"
                      value={expense.dueDay || ''}
                      onChange={(e) => updateExpense(expense.id, { dueDay: parseInt(e.target.value) || undefined })}
                      icon={<Calendar className="w-4 h-4" />}
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExpense(expense.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              )
            })}

            <Button
              variant="outline"
              onClick={addExpense}
              className="w-full border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Fixed Expense
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Common expenses reminder */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Don't forget these common fixed expenses:</p>
              <div className="grid grid-cols-2 gap-1 text-amber-700">
                <span>• Rent/Mortgage</span>
                <span>• Car payment</span>
                <span>• Phone bill</span>
                <span>• Internet</span>
                <span>• Insurance (auto, health, renters)</span>
                <span>• Streaming services</span>
                <span>• Gym membership</span>
                <span>• Student loans</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
