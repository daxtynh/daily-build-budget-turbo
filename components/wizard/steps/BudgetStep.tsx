"use client"

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from 'recharts'
import { Download, Share2, CheckCircle, Calendar, Printer, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useBudgetStore } from '@/lib/store'
import { CATEGORY_INFO, Budget, BudgetCategory, TransactionCategory } from '@/lib/types'
import { formatCurrency, cn } from '@/lib/utils'

export function BudgetStep() {
  const { questionnaire, userProfile, analysis, setBudget, budget } = useBudgetStore()

  // Build the final budget
  const finalBudget = useMemo(() => {
    const monthlyIncome = (questionnaire.monthlyIncome as unknown as number) || 0
    const fixedExpenses = (questionnaire.fixedExpenses as unknown as Array<{ category: TransactionCategory; amount: number }>) || []
    const variableBudgets = (questionnaire.variableBudgets as unknown as Array<{ category: TransactionCategory; budgeted: number }>) || []
    const goals = (questionnaire.financialGoals as unknown as Array<{ monthlyContribution: number }>) || []

    const categories: BudgetCategory[] = []

    // Add fixed expenses
    fixedExpenses.forEach(exp => {
      const existing = categories.find(c => c.category === exp.category)
      if (existing) {
        existing.budgeted += exp.amount
        existing.actual += exp.amount
      } else {
        categories.push({
          category: exp.category,
          budgeted: exp.amount,
          actual: exp.amount,
          isFixed: true,
        })
      }
    })

    // Add variable budgets
    variableBudgets.forEach(vb => {
      const existing = categories.find(c => c.category === vb.category)
      if (existing) {
        existing.budgeted += vb.budgeted
      } else {
        categories.push({
          category: vb.category,
          budgeted: vb.budgeted,
          actual: analysis?.byCategory[vb.category]?.total || 0,
          isFixed: false,
        })
      }
    })

    const totalGoalContributions = goals.reduce((sum, g) => sum + g.monthlyContribution, 0)

    return {
      id: 'main',
      userId: 'user',
      name: 'Monthly Budget',
      monthlyIncome,
      categories,
      savingsGoal: totalGoalContributions,
      debtPaymentGoal: 0,
      emergencyFundTarget: monthlyIncome * 3,
      emergencyFundCurrent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Budget
  }, [questionnaire, analysis])

  useEffect(() => {
    setBudget(finalBudget)
  }, [finalBudget, setBudget])

  const totalBudgeted = finalBudget.categories.reduce((sum, c) => sum + c.budgeted, 0)
  const totalSavings = finalBudget.savingsGoal
  const leftover = finalBudget.monthlyIncome - totalBudgeted - totalSavings

  // Prepare chart data
  const pieData = useMemo(() => {
    const data: Array<{ name: string; value: number; color: string }> = []

    finalBudget.categories.forEach(cat => {
      if (cat.budgeted > 0) {
        const info = CATEGORY_INFO[cat.category]
        data.push({
          name: info.label,
          value: cat.budgeted,
          color: info.color,
        })
      }
    })

    if (totalSavings > 0) {
      data.push({
        name: 'Savings/Goals',
        value: totalSavings,
        color: '#22c55e',
      })
    }

    if (leftover > 0) {
      data.push({
        name: 'Unallocated',
        value: leftover,
        color: '#94a3b8',
      })
    }

    return data
  }, [finalBudget, totalSavings, leftover])

  const barData = useMemo(() => {
    return finalBudget.categories
      .filter(c => c.budgeted > 0)
      .map(cat => {
        const info = CATEGORY_INFO[cat.category]
        return {
          name: info.label,
          budgeted: cat.budgeted,
          actual: cat.actual,
          fill: info.color,
        }
      })
      .sort((a, b) => b.budgeted - a.budgeted)
      .slice(0, 8)
  }, [finalBudget])

  const handleExport = () => {
    // Generate CSV
    let csv = 'Category,Budgeted,Type\n'
    finalBudget.categories.forEach(cat => {
      const info = CATEGORY_INFO[cat.category]
      csv += `${info.label},${cat.budgeted},${cat.isFixed ? 'Fixed' : 'Variable'}\n`
    })
    csv += `Savings/Goals,${totalSavings},Savings\n`

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'budget-turbo-export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4"
        >
          <CheckCircle className="w-10 h-10 text-green-600" />
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Your Budget is Ready!
        </h2>
        <p className="text-gray-600">
          Here's your personalized spending plan based on your income, expenses, and goals.
        </p>
      </div>

      {/* Budget Summary */}
      <Card className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 border-0 text-white overflow-hidden">
        <CardContent className="p-6">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-blue-200 text-sm">Monthly Income</p>
              <p className="text-3xl font-bold">{formatCurrency(finalBudget.monthlyIncome)}</p>
            </div>
            <div>
              <p className="text-blue-200 text-sm">Total Budgeted</p>
              <p className="text-3xl font-bold">{formatCurrency(totalBudgeted)}</p>
            </div>
            <div>
              <p className="text-blue-200 text-sm">To Savings/Goals</p>
              <p className="text-3xl font-bold">{formatCurrency(totalSavings)}</p>
            </div>
            <div>
              <p className="text-blue-200 text-sm">{leftover >= 0 ? 'Buffer' : 'Over Budget'}</p>
              <p className={cn(
                "text-3xl font-bold",
                leftover < 0 && "text-red-300"
              )}>
                {formatCurrency(Math.abs(leftover))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budget Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Bar dataKey="budgeted" name="Budgeted" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Budget Details</CardTitle>
          <CardDescription>Your monthly spending limits by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {finalBudget.categories
              .filter(c => c.budgeted > 0)
              .sort((a, b) => b.budgeted - a.budgeted)
              .map((cat, index) => {
                const info = CATEGORY_INFO[cat.category]
                const percentOfIncome = (cat.budgeted / finalBudget.monthlyIncome) * 100

                return (
                  <motion.div
                    key={cat.category}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: info.color + '20' }}
                    >
                      <span className="text-lg">{info.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{info.label}</p>
                        {cat.isFixed && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Fixed</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {percentOfIncome.toFixed(1)}% of income
                      </p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(cat.budgeted)}
                    </p>
                  </motion.div>
                )
              })}

            {/* Savings Goal */}
            {totalSavings > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-lg border-2 border-green-200 bg-green-50"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-100">
                  <span className="text-lg">🎯</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-green-900">Savings & Goals</p>
                  <p className="text-sm text-green-700">
                    {((totalSavings / finalBudget.monthlyIncome) * 100).toFixed(1)}% of income
                  </p>
                </div>
                <p className="text-lg font-bold text-green-700">
                  {formatCurrency(totalSavings)}
                </p>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 50/30/20 Analysis */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">50/30/20 Rule Check</CardTitle>
          <CardDescription>How your budget compares to the recommended split</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const needs = ['housing', 'utilities', 'groceries', 'healthcare', 'transportation', 'insurance', 'childcare']
              .reduce((sum, cat) => sum + (finalBudget.categories.find(c => c.category === cat)?.budgeted || 0), 0)
            const wants = ['dining', 'shopping', 'entertainment', 'subscriptions', 'personal_care', 'travel', 'pets']
              .reduce((sum, cat) => sum + (finalBudget.categories.find(c => c.category === cat)?.budgeted || 0), 0)

            const needsPct = (needs / finalBudget.monthlyIncome) * 100
            const wantsPct = (wants / finalBudget.monthlyIncome) * 100
            const savingsPct = (totalSavings / finalBudget.monthlyIncome) * 100

            return (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Needs (Target: 50%)</span>
                    <span className={cn(
                      "font-medium",
                      needsPct <= 50 ? "text-green-600" : "text-amber-600"
                    )}>
                      {needsPct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        needsPct <= 50 ? "bg-green-500" : "bg-amber-500"
                      )}
                      style={{ width: `${Math.min(needsPct, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Wants (Target: 30%)</span>
                    <span className={cn(
                      "font-medium",
                      wantsPct <= 30 ? "text-green-600" : "text-amber-600"
                    )}>
                      {wantsPct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        wantsPct <= 30 ? "bg-green-500" : "bg-amber-500"
                      )}
                      style={{ width: `${Math.min(wantsPct, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Savings (Target: 20%)</span>
                    <span className={cn(
                      "font-medium",
                      savingsPct >= 20 ? "text-green-600" : "text-amber-600"
                    )}>
                      {savingsPct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        savingsPct >= 20 ? "bg-green-500" : "bg-amber-500"
                      )}
                      style={{ width: `${Math.min(savingsPct, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 justify-center">
            <Button onClick={handleExport} className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              Print Budget
            </Button>
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              Set Reminders
            </Button>
            <Button variant="outline" className="gap-2">
              <Mail className="w-4 h-4" />
              Email to Self
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-lg text-purple-900">What's Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📱</span>
              </div>
              <h4 className="font-medium text-purple-900 mb-1">Track Daily</h4>
              <p className="text-sm text-purple-700">Log expenses as they happen to stay on track</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📊</span>
              </div>
              <h4 className="font-medium text-purple-900 mb-1">Review Weekly</h4>
              <p className="text-sm text-purple-700">Check in each week to see how you're doing</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔄</span>
              </div>
              <h4 className="font-medium text-purple-900 mb-1">Adjust Monthly</h4>
              <p className="text-sm text-purple-700">Update your budget as life changes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
