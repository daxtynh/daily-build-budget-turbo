import {
  CategorizedTransaction,
  SpendingAnalysis,
  SpendingInsight,
  TransactionCategory,
  CATEGORY_INFO,
} from './types'

export function analyzeSpending(
  transactions: CategorizedTransaction[]
): SpendingAnalysis {
  if (transactions.length === 0) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netCashflow: 0,
      byCategory: {} as Record<TransactionCategory, { total: number; count: number; transactions: CategorizedTransaction[] }>,
      recurringExpenses: [],
      topMerchants: [],
      dateRange: { start: new Date(), end: new Date() },
      insights: [],
    }
  }

  // Initialize category buckets
  const byCategory: Record<TransactionCategory, { total: number; count: number; transactions: CategorizedTransaction[] }> = {} as Record<TransactionCategory, { total: number; count: number; transactions: CategorizedTransaction[] }>
  for (const cat of Object.keys(CATEGORY_INFO) as TransactionCategory[]) {
    byCategory[cat] = { total: 0, count: 0, transactions: [] }
  }

  let totalIncome = 0
  let totalExpenses = 0

  // Aggregate by category
  for (const txn of transactions) {
    const amount = Math.abs(txn.amount)
    byCategory[txn.category].total += amount
    byCategory[txn.category].count++
    byCategory[txn.category].transactions.push(txn)

    if (txn.category === 'income' || txn.amount > 0) {
      totalIncome += amount
    } else {
      totalExpenses += amount
    }
  }

  // Get recurring expenses
  const recurringExpenses = transactions.filter((t) => t.isRecurring && t.amount < 0)

  // Get top merchants
  const merchantSpend = new Map<string, { total: number; count: number }>()
  for (const txn of transactions) {
    if (txn.merchant && txn.amount < 0) {
      const existing = merchantSpend.get(txn.merchant) || { total: 0, count: 0 }
      existing.total += Math.abs(txn.amount)
      existing.count++
      merchantSpend.set(txn.merchant, existing)
    }
  }

  const topMerchants = Array.from(merchantSpend.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // Date range
  const dates = transactions.map((t) => new Date(t.date).getTime())
  const dateRange = {
    start: new Date(Math.min(...dates)),
    end: new Date(Math.max(...dates)),
  }

  // Generate insights
  const insights = generateInsights(byCategory, totalIncome, totalExpenses, recurringExpenses, transactions)

  return {
    totalIncome,
    totalExpenses,
    netCashflow: totalIncome - totalExpenses,
    byCategory,
    recurringExpenses,
    topMerchants,
    dateRange,
    insights,
  }
}

function generateInsights(
  byCategory: Record<TransactionCategory, { total: number; count: number; transactions: CategorizedTransaction[] }>,
  totalIncome: number,
  totalExpenses: number,
  recurringExpenses: CategorizedTransaction[],
  allTransactions: CategorizedTransaction[]
): SpendingInsight[] {
  const insights: SpendingInsight[] = []

  // Calculate percentages
  const diningPct = totalExpenses > 0 ? (byCategory.dining.total / totalExpenses) * 100 : 0
  const groceryPct = totalExpenses > 0 ? (byCategory.groceries.total / totalExpenses) * 100 : 0
  const subscriptionTotal = byCategory.subscriptions.total
  const entertainmentPct = totalExpenses > 0 ? (byCategory.entertainment.total / totalExpenses) * 100 : 0

  // High dining out spending
  if (diningPct > 15) {
    insights.push({
      type: 'warning',
      title: 'High Dining Spending',
      description: `You're spending ${diningPct.toFixed(0)}% of expenses on dining out. The recommended max is 10-15%.`,
      category: 'dining',
      amount: byCategory.dining.total,
      action: 'Consider meal prepping or reducing takeout orders',
    })
  }

  // Subscription audit
  if (subscriptionTotal > 100) {
    insights.push({
      type: 'tip',
      title: 'Subscription Audit',
      description: `You have $${subscriptionTotal.toFixed(0)}/month in subscriptions. Consider reviewing which ones you actually use.`,
      category: 'subscriptions',
      amount: subscriptionTotal,
      action: 'Review and cancel unused subscriptions',
    })
  }

  // Good grocery habits
  if (groceryPct > 5 && groceryPct < 20) {
    insights.push({
      type: 'positive',
      title: 'Healthy Grocery Spending',
      description: `Your grocery spending is ${groceryPct.toFixed(0)}% of expenses - well within the healthy range.`,
      category: 'groceries',
    })
  }

  // Low grocery, high dining
  if (groceryPct < 5 && diningPct > 10) {
    insights.push({
      type: 'tip',
      title: 'Shift Dining to Groceries',
      description: 'You spend more on dining than groceries. Cooking at home could save $200-400/month.',
      action: 'Try meal planning and batch cooking',
    })
  }

  // No savings detected
  if (byCategory.savings.total === 0) {
    insights.push({
      type: 'warning',
      title: 'No Savings Detected',
      description: 'We didn\'t see any transfers to savings. Aim to save at least 10-20% of income.',
      category: 'savings',
      action: 'Set up automatic transfers to savings',
    })
  }

  // High fees
  if (byCategory.fees.total > 50) {
    insights.push({
      type: 'warning',
      title: 'Bank Fees Add Up',
      description: `You paid $${byCategory.fees.total.toFixed(0)} in fees. Consider switching to a fee-free bank.`,
      category: 'fees',
      amount: byCategory.fees.total,
      action: 'Look into online banks with no monthly fees',
    })
  }

  // Good cash flow
  if (totalIncome > totalExpenses * 1.2) {
    insights.push({
      type: 'positive',
      title: 'Positive Cash Flow',
      description: `You're spending less than you earn - great job! You have $${(totalIncome - totalExpenses).toFixed(0)} available for savings/investing.`,
    })
  }

  // Negative cash flow
  if (totalExpenses > totalIncome) {
    insights.push({
      type: 'warning',
      title: 'Spending More Than Earning',
      description: `You spent $${(totalExpenses - totalIncome).toFixed(0)} more than you earned. This is unsustainable.`,
      action: 'We\'ll help you find areas to cut back',
    })
  }

  // Recurring expense total
  const monthlyRecurring = recurringExpenses
    .filter((e) => e.recurringFrequency === 'monthly')
    .reduce((sum, e) => sum + Math.abs(e.amount), 0)

  if (monthlyRecurring > 0) {
    insights.push({
      type: 'tip',
      title: 'Monthly Commitments',
      description: `You have $${monthlyRecurring.toFixed(0)} in monthly recurring expenses. Knowing your fixed costs helps with budgeting.`,
      amount: monthlyRecurring,
    })
  }

  // High entertainment
  if (entertainmentPct > 10) {
    insights.push({
      type: 'question',
      title: 'Entertainment Spending',
      description: `${entertainmentPct.toFixed(0)}% of your spending is on entertainment. Is this aligned with your priorities?`,
      category: 'entertainment',
      amount: byCategory.entertainment.total,
    })
  }

  // 50/30/20 analysis
  const needs = ['housing', 'utilities', 'groceries', 'healthcare', 'transportation', 'insurance', 'childcare']
    .reduce((sum, cat) => sum + byCategory[cat as TransactionCategory].total, 0)
  const wants = ['dining', 'shopping', 'entertainment', 'subscriptions', 'personal_care', 'travel', 'pets']
    .reduce((sum, cat) => sum + byCategory[cat as TransactionCategory].total, 0)

  if (totalIncome > 0) {
    const needsPct = (needs / totalIncome) * 100
    const wantsPct = (wants / totalIncome) * 100

    if (needsPct > 55) {
      insights.push({
        type: 'warning',
        title: 'Needs Exceeding 50%',
        description: `Your essential expenses are ${needsPct.toFixed(0)}% of income (50/30/20 rule suggests 50%). High fixed costs limit flexibility.`,
        action: 'Look for ways to reduce housing or transportation costs',
      })
    }

    if (wantsPct > 35) {
      insights.push({
        type: 'tip',
        title: 'Wants Spending High',
        description: `Discretionary spending is ${wantsPct.toFixed(0)}% of income. Consider if each expense brings proportional value.`,
      })
    }
  }

  return insights
}

export function getMonthlyAverages(
  transactions: CategorizedTransaction[]
): Record<TransactionCategory, number> {
  const byCategory: Record<TransactionCategory, number> = {} as Record<TransactionCategory, number>
  for (const cat of Object.keys(CATEGORY_INFO) as TransactionCategory[]) {
    byCategory[cat] = 0
  }

  // Get date range
  if (transactions.length === 0) return byCategory

  const dates = transactions.map((t) => new Date(t.date).getTime())
  const startDate = new Date(Math.min(...dates))
  const endDate = new Date(Math.max(...dates))

  // Calculate months
  const monthDiff =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth()) +
    1

  // Aggregate
  for (const txn of transactions) {
    byCategory[txn.category] += Math.abs(txn.amount)
  }

  // Divide by months
  for (const cat of Object.keys(byCategory) as TransactionCategory[]) {
    byCategory[cat] = byCategory[cat] / Math.max(1, monthDiff)
  }

  return byCategory
}
