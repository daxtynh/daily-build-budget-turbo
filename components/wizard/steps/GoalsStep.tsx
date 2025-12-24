"use client"

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Target, Shield, CreditCard, PiggyBank, TrendingUp, Calculator, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useBudgetStore } from '@/lib/store'
import { formatCurrency, cn } from '@/lib/utils'

interface FinancialGoal {
  id: string
  type: 'emergency' | 'debt' | 'savings' | 'investment' | 'custom'
  name: string
  targetAmount: number
  currentAmount: number
  monthlyContribution: number
  priority: number
}

export function GoalsStep() {
  const { questionnaire, setQuestionnaireAnswer, userProfile, analysis } = useBudgetStore()

  // Calculate available money after expenses
  const monthlyIncome = (questionnaire.monthlyIncome as number) || 0
  const totalFixed = (questionnaire.totalFixedExpenses as number) || 0
  const totalVariable = (questionnaire.totalVariableExpenses as number) || 0
  const availableForGoals = monthlyIncome - totalFixed - totalVariable

  const [goals, setGoals] = useState<FinancialGoal[]>(() => {
    const saved = questionnaire.financialGoals as FinancialGoal[] | undefined
    if (saved) return saved

    // Default goals based on profile
    const defaults: FinancialGoal[] = []

    // Emergency fund goal (always recommended)
    const monthlyExpenses = totalFixed + totalVariable
    defaults.push({
      id: 'emergency',
      type: 'emergency',
      name: 'Emergency Fund',
      targetAmount: monthlyExpenses * 3, // 3 months expenses
      currentAmount: 0,
      monthlyContribution: Math.round(availableForGoals * 0.3),
      priority: 1,
    })

    // Debt payoff if they have debt
    if (userProfile?.hasCreditCardDebt || userProfile?.hasStudentLoans) {
      defaults.push({
        id: 'debt',
        type: 'debt',
        name: userProfile.hasCreditCardDebt ? 'Credit Card Debt' : 'Student Loans',
        targetAmount: 0, // User needs to fill in
        currentAmount: 0,
        monthlyContribution: Math.round(availableForGoals * 0.4),
        priority: 2,
      })
    }

    // Savings/investment goal
    defaults.push({
      id: 'savings',
      type: 'savings',
      name: 'General Savings',
      targetAmount: 10000,
      currentAmount: 0,
      monthlyContribution: Math.round(availableForGoals * 0.2),
      priority: 3,
    })

    return defaults
  })

  const totalMonthlyGoals = useMemo(() => {
    return goals.reduce((sum, g) => sum + g.monthlyContribution, 0)
  }, [goals])

  const remainingAfterGoals = availableForGoals - totalMonthlyGoals

  useEffect(() => {
    setQuestionnaireAnswer('financialGoals', goals)
    setQuestionnaireAnswer('totalGoalContributions', totalMonthlyGoals)
  }, [goals, totalMonthlyGoals, setQuestionnaireAnswer])

  const updateGoal = (id: string, updates: Partial<FinancialGoal>) => {
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, ...updates } : g)))
  }

  const removeGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  const addGoal = () => {
    setGoals([
      ...goals,
      {
        id: Math.random().toString(36).substring(2, 9),
        type: 'custom',
        name: '',
        targetAmount: 0,
        currentAmount: 0,
        monthlyContribution: 0,
        priority: goals.length + 1,
      },
    ])
  }

  const getGoalIcon = (type: FinancialGoal['type']) => {
    switch (type) {
      case 'emergency': return <Shield className="w-5 h-5" />
      case 'debt': return <CreditCard className="w-5 h-5" />
      case 'savings': return <PiggyBank className="w-5 h-5" />
      case 'investment': return <TrendingUp className="w-5 h-5" />
      default: return <Target className="w-5 h-5" />
    }
  }

  const getGoalColor = (type: FinancialGoal['type']) => {
    switch (type) {
      case 'emergency': return 'blue'
      case 'debt': return 'red'
      case 'savings': return 'green'
      case 'investment': return 'purple'
      default: return 'gray'
    }
  }

  return (
    <div className="py-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Set Your Financial Goals
        </h2>
        <p className="text-gray-600">
          Where do you want your extra money to go? Let's plan for the future.
        </p>
      </div>

      {/* Available Money Summary */}
      <Card className={cn(
        "mb-6",
        availableForGoals >= 0 ? "bg-gradient-to-r from-green-500 to-emerald-600" : "bg-gradient-to-r from-red-500 to-rose-600",
        "border-0 text-white"
      )}>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-white/80 text-sm">Monthly Income</p>
              <p className="text-2xl font-bold">{formatCurrency(monthlyIncome)}</p>
            </div>
            <div>
              <p className="text-white/80 text-sm">Total Expenses</p>
              <p className="text-2xl font-bold">{formatCurrency(totalFixed + totalVariable)}</p>
            </div>
            <div>
              <p className="text-white/80 text-sm">Available for Goals</p>
              <p className="text-2xl font-bold">{formatCurrency(availableForGoals)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning if overspending */}
      {availableForGoals < 0 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Your expenses exceed your income</p>
              <p className="text-sm text-red-700">
                You're spending {formatCurrency(Math.abs(availableForGoals))} more than you earn.
                Go back and reduce expenses before setting savings goals.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals */}
      {availableForGoals > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Your Financial Goals</CardTitle>
            <CardDescription>Allocate your extra {formatCurrency(availableForGoals)}/month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {goals.map((goal, index) => {
                const color = getGoalColor(goal.type)
                const progress = goal.targetAmount > 0
                  ? (goal.currentAmount / goal.targetAmount) * 100
                  : 0
                const monthsToGoal = goal.monthlyContribution > 0
                  ? Math.ceil((goal.targetAmount - goal.currentAmount) / goal.monthlyContribution)
                  : Infinity

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "p-4 rounded-lg border",
                      `bg-${color}-50 border-${color}-200`
                    )}
                    style={{
                      backgroundColor: `var(--${color}-50, #f0f9ff)`,
                      borderColor: `var(--${color}-200, #bae6fd)`,
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                        goal.type === 'emergency' && "bg-blue-100 text-blue-600",
                        goal.type === 'debt' && "bg-red-100 text-red-600",
                        goal.type === 'savings' && "bg-green-100 text-green-600",
                        goal.type === 'investment' && "bg-purple-100 text-purple-600",
                        goal.type === 'custom' && "bg-gray-100 text-gray-600"
                      )}>
                        {getGoalIcon(goal.type)}
                      </div>

                      <div className="flex-1 space-y-3">
                        {/* Goal Name */}
                        <div className="flex items-center justify-between">
                          <Input
                            value={goal.name}
                            onChange={(e) => updateGoal(goal.id, { name: e.target.value })}
                            placeholder="Goal name"
                            className="text-lg font-medium bg-transparent border-0 p-0 h-auto focus-visible:ring-0"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeGoal(goal.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            Remove
                          </Button>
                        </div>

                        {/* Amounts */}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Target Amount</label>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400">$</span>
                              <Input
                                type="number"
                                value={goal.targetAmount || ''}
                                onChange={(e) => updateGoal(goal.id, { targetAmount: parseFloat(e.target.value) || 0 })}
                                className="bg-white"
                                placeholder="10,000"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Current Amount</label>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400">$</span>
                              <Input
                                type="number"
                                value={goal.currentAmount || ''}
                                onChange={(e) => updateGoal(goal.id, { currentAmount: parseFloat(e.target.value) || 0 })}
                                className="bg-white"
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Monthly Contribution</label>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400">$</span>
                              <Input
                                type="number"
                                value={goal.monthlyContribution || ''}
                                onChange={(e) => updateGoal(goal.id, { monthlyContribution: parseFloat(e.target.value) || 0 })}
                                className="bg-white"
                                placeholder="500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Progress */}
                        {goal.targetAmount > 0 && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">
                                {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                              </span>
                              <span className="text-gray-500">
                                {monthsToGoal < Infinity ? `${monthsToGoal} months to go` : 'Set contribution'}
                              </span>
                            </div>
                            <Progress value={Math.min(progress, 100)} className="h-2" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}

              <Button
                variant="outline"
                onClick={addGoal}
                className="w-full border-dashed"
              >
                <Target className="w-4 h-4 mr-2" />
                Add Another Goal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Allocation Summary */}
      {goals.length > 0 && availableForGoals > 0 && (
        <Card className={cn(
          "mb-6",
          remainingAfterGoals >= 0 ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {remainingAfterGoals >= 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                )}
                <div>
                  <p className={cn(
                    "font-medium",
                    remainingAfterGoals >= 0 ? "text-green-900" : "text-amber-900"
                  )}>
                    {remainingAfterGoals >= 0 ? 'Great job!' : 'Over-allocated'}
                  </p>
                  <p className={cn(
                    "text-sm",
                    remainingAfterGoals >= 0 ? "text-green-700" : "text-amber-700"
                  )}>
                    {remainingAfterGoals >= 0
                      ? `You have ${formatCurrency(remainingAfterGoals)} buffer left`
                      : `You've allocated ${formatCurrency(Math.abs(remainingAfterGoals))} more than available`
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total to goals</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(totalMonthlyGoals)}/mo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended allocations tip */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Calculator className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Recommended Goal Priorities:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li><strong>Emergency Fund:</strong> 3-6 months of expenses (aim for $1,000 first)</li>
                <li><strong>High-Interest Debt:</strong> Pay off credit cards ASAP (above 15% interest)</li>
                <li><strong>Employer 401k Match:</strong> Get the free money first</li>
                <li><strong>Other Debt:</strong> Student loans, car loans</li>
                <li><strong>Additional Savings:</strong> Investments, house down payment, etc.</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
