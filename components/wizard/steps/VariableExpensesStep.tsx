"use client"

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Info, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBudgetStore } from '@/lib/store'
import { TransactionCategory, CATEGORY_INFO } from '@/lib/types'
import { formatCurrency, cn } from '@/lib/utils'
import { getMonthlyAverages } from '@/lib/analyzer'

interface VariableBudget {
  category: TransactionCategory
  average: number
  budgeted: number
  change: 'increase' | 'decrease' | 'same'
}

const VARIABLE_CATEGORIES: TransactionCategory[] = [
  'groceries',
  'dining',
  'transportation',
  'shopping',
  'entertainment',
  'personal_care',
  'healthcare',
  'pets',
  'gifts_donations',
  'travel',
  'education',
  'other',
]

export function VariableExpensesStep() {
  const { analysis, categorizedTransactions, setQuestionnaireAnswer, questionnaire, userProfile } = useBudgetStore()

  // Get monthly averages
  const monthlyAverages = useMemo(() => {
    return getMonthlyAverages(categorizedTransactions)
  }, [categorizedTransactions])

  // Initialize budgets
  const [budgets, setBudgets] = useState<VariableBudget[]>(() => {
    const saved = questionnaire.variableBudgets as VariableBudget[] | undefined
    if (saved) return saved

    return VARIABLE_CATEGORIES.map(cat => ({
      category: cat,
      average: Math.round(monthlyAverages[cat]),
      budgeted: Math.round(monthlyAverages[cat]),
      change: 'same' as const,
    }))
  })

  useEffect(() => {
    // Update averages if we have new data
    setBudgets(prev =>
      prev.map(b => ({
        ...b,
        average: Math.round(monthlyAverages[b.category]),
        budgeted: b.change === 'same' ? Math.round(monthlyAverages[b.category]) : b.budgeted,
      }))
    )
  }, [monthlyAverages])

  const totalVariable = useMemo(() => {
    return budgets.reduce((sum, b) => sum + b.budgeted, 0)
  }, [budgets])

  const totalAverage = useMemo(() => {
    return budgets.reduce((sum, b) => sum + b.average, 0)
  }, [budgets])

  const difference = totalVariable - totalAverage

  useEffect(() => {
    setQuestionnaireAnswer('variableBudgets', budgets)
    setQuestionnaireAnswer('totalVariableExpenses', totalVariable)
  }, [budgets, totalVariable, setQuestionnaireAnswer])

  const updateBudget = (category: TransactionCategory, amount: number) => {
    setBudgets(prev =>
      prev.map(b => {
        if (b.category === category) {
          const change = amount > b.average ? 'increase' : amount < b.average ? 'decrease' : 'same'
          return { ...b, budgeted: amount, change }
        }
        return b
      })
    )
  }

  const applyPreset = (preset: 'aggressive' | 'moderate' | 'maintain') => {
    setBudgets(prev =>
      prev.map(b => {
        const info = CATEGORY_INFO[b.category]
        let multiplier = 1

        switch (preset) {
          case 'aggressive':
            multiplier = info.isEssential ? 0.95 : 0.7
            break
          case 'moderate':
            multiplier = info.isEssential ? 1 : 0.85
            break
          case 'maintain':
            multiplier = 1
            break
        }

        const newBudget = Math.round(b.average * multiplier)
        return {
          ...b,
          budgeted: newBudget,
          change: newBudget > b.average ? 'increase' : newBudget < b.average ? 'decrease' : 'same',
        }
      })
    )
  }

  return (
    <div className="py-8 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Variable Spending Budget
        </h2>
        <p className="text-gray-600">
          These expenses change month to month. Set limits based on your goals.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-gray-50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">Your Average</p>
            <p className="text-2xl font-bold text-gray-700">
              {formatCurrency(totalAverage)}
            </p>
          </CardContent>
        </Card>
        <Card className={cn(
          difference < 0 ? "bg-green-50 border-green-200" : difference > 0 ? "bg-amber-50 border-amber-200" : "bg-blue-50"
        )}>
          <CardContent className="p-4 text-center">
            <p className={cn(
              "text-sm",
              difference < 0 ? "text-green-600" : difference > 0 ? "text-amber-600" : "text-blue-600"
            )}>
              Your Budget
            </p>
            <p className={cn(
              "text-2xl font-bold",
              difference < 0 ? "text-green-700" : difference > 0 ? "text-amber-700" : "text-blue-700"
            )}>
              {formatCurrency(totalVariable)}
            </p>
          </CardContent>
        </Card>
        <Card className={cn(
          "border",
          difference < 0 ? "bg-green-50 border-green-200" : difference > 0 ? "bg-red-50 border-red-200" : "bg-gray-50"
        )}>
          <CardContent className="p-4 text-center">
            <p className={cn(
              "text-sm",
              difference < 0 ? "text-green-600" : difference > 0 ? "text-red-600" : "text-gray-600"
            )}>
              Difference
            </p>
            <p className={cn(
              "text-2xl font-bold flex items-center justify-center gap-1",
              difference < 0 ? "text-green-700" : difference > 0 ? "text-red-700" : "text-gray-700"
            )}>
              {difference < 0 && <TrendingDown className="w-5 h-5" />}
              {difference > 0 && <TrendingUp className="w-5 h-5" />}
              {formatCurrency(Math.abs(difference))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Presets */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Presets</CardTitle>
          <CardDescription>Apply a preset strategy to all categories</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => applyPreset('aggressive')}
            className="flex-1"
          >
            <TrendingDown className="w-4 h-4 mr-2 text-green-600" />
            Aggressive Savings
            <span className="ml-2 text-xs text-gray-500">-20% non-essentials</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => applyPreset('moderate')}
            className="flex-1"
          >
            <Minus className="w-4 h-4 mr-2 text-blue-600" />
            Moderate
            <span className="ml-2 text-xs text-gray-500">-15% non-essentials</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => applyPreset('maintain')}
            className="flex-1"
          >
            <TrendingUp className="w-4 h-4 mr-2 text-gray-600" />
            Maintain
            <span className="ml-2 text-xs text-gray-500">Keep current</span>
          </Button>
        </CardContent>
      </Card>

      {/* Category Budgets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Set Category Limits</CardTitle>
          <CardDescription>Adjust each category to match your goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgets.map((budget, index) => {
              const info = CATEGORY_INFO[budget.category]
              const percentChange = budget.average > 0
                ? Math.round(((budget.budgeted - budget.average) / budget.average) * 100)
                : 0

              return (
                <motion.div
                  key={budget.category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border transition-all",
                    budget.change === 'decrease' && "bg-green-50 border-green-200",
                    budget.change === 'increase' && "bg-amber-50 border-amber-200",
                    budget.change === 'same' && "bg-gray-50"
                  )}
                >
                  {/* Icon & Name */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: info.color + '20' }}
                  >
                    <span className="text-lg">{info.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{info.label}</p>
                      {info.isEssential && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                          Essential
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Avg: {formatCurrency(budget.average)}/mo
                    </p>
                  </div>

                  {/* Budget Input */}
                  <div className="flex items-center gap-3">
                    <div className="w-28">
                      <Input
                        type="number"
                        value={budget.budgeted || ''}
                        onChange={(e) => updateBudget(budget.category, parseFloat(e.target.value) || 0)}
                        className="text-right font-medium"
                      />
                    </div>

                    {/* Quick Adjust Buttons */}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateBudget(budget.category, Math.round(budget.budgeted * 0.9))}
                        className="w-10 text-green-600 hover:bg-green-100"
                      >
                        -10%
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateBudget(budget.category, Math.round(budget.average))}
                        className="w-12 text-gray-600 hover:bg-gray-100"
                      >
                        Reset
                      </Button>
                    </div>

                    {/* Change Indicator */}
                    <div className={cn(
                      "w-20 text-right text-sm font-medium",
                      percentChange < 0 && "text-green-600",
                      percentChange > 0 && "text-amber-600",
                      percentChange === 0 && "text-gray-400"
                    )}>
                      {percentChange > 0 && '+'}
                      {percentChange}%
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Goal-based tip */}
      {userProfile?.primaryGoal && (
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">
                  Tip based on your goal: {
                    userProfile.primaryGoal === 'save_more' ? 'Save More Money' :
                    userProfile.primaryGoal === 'pay_debt' ? 'Pay Off Debt' :
                    userProfile.primaryGoal === 'invest' ? 'Invest More' :
                    userProfile.primaryGoal === 'track_spending' ? 'Track Spending' :
                    'Build Emergency Fund'
                  }
                </p>
                <p className="text-blue-700">
                  {userProfile.primaryGoal === 'save_more' && 'Focus on reducing dining and entertainment by 20-30%. Those small daily expenses add up!'}
                  {userProfile.primaryGoal === 'pay_debt' && 'Cut non-essentials aggressively. Every dollar saved can go toward your debt snowball.'}
                  {userProfile.primaryGoal === 'invest' && 'Keep a lean variable budget so you can maximize investment contributions.'}
                  {userProfile.primaryGoal === 'track_spending' && 'Start with your current averages. The goal is awareness first, optimization later.'}
                  {userProfile.primaryGoal === 'prepare_emergency' && 'Reduce non-essentials by 15-20% and redirect that to your emergency fund.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
