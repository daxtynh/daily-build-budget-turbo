"use client"

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, CheckCircle, AlertTriangle, Edit2, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { CategorizedTransaction, TransactionCategory, CATEGORY_INFO } from '@/lib/types'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

export function ReviewStep() {
  const { categorizedTransactions, updateTransaction, analysis } = useBudgetStore()
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortDesc, setSortDesc] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showLowConfidence, setShowLowConfidence] = useState(false)

  // Get low confidence transactions
  const lowConfidenceCount = categorizedTransactions.filter(t => t.confidence < 0.7 && !t.userOverride).length

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let result = [...categorizedTransactions]

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(t =>
        t.description.toLowerCase().includes(searchLower) ||
        t.merchant?.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower)
      )
    }

    // Category filter
    if (filterCategory !== 'all') {
      result = result.filter(t => t.category === filterCategory)
    }

    // Low confidence filter
    if (showLowConfidence) {
      result = result.filter(t => t.confidence < 0.7 && !t.userOverride)
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date') {
        return sortDesc
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime()
      } else {
        return sortDesc
          ? Math.abs(b.amount) - Math.abs(a.amount)
          : Math.abs(a.amount) - Math.abs(b.amount)
      }
    })

    return result
  }, [categorizedTransactions, search, filterCategory, sortBy, sortDesc, showLowConfidence])

  const handleCategoryChange = (txnId: string, newCategory: TransactionCategory) => {
    const info = CATEGORY_INFO[newCategory]
    updateTransaction(txnId, {
      category: newCategory,
      subcategory: info.label,
      confidence: 1.0,
      userOverride: true,
    })
    setEditingId(null)
  }

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Review Your Transactions
        </h2>
        <p className="text-gray-600">
          We've categorized your transactions. Review and fix any that look wrong.
        </p>
      </div>

      {/* Summary Cards */}
      {analysis && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-green-600">Income</p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(analysis.totalIncome)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-red-600">Expenses</p>
              <p className="text-2xl font-bold text-red-700">
                {formatCurrency(analysis.totalExpenses)}
              </p>
            </CardContent>
          </Card>
          <Card className={cn(
            "border",
            analysis.netCashflow >= 0 ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"
          )}>
            <CardContent className="p-4 text-center">
              <p className={cn("text-sm", analysis.netCashflow >= 0 ? "text-blue-600" : "text-amber-600")}>
                Net
              </p>
              <p className={cn("text-2xl font-bold", analysis.netCashflow >= 0 ? "text-blue-700" : "text-amber-700")}>
                {formatCurrency(analysis.netCashflow)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Low Confidence Alert */}
      {lowConfidenceCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-900">
                    {lowConfidenceCount} transaction{lowConfidenceCount > 1 ? 's' : ''} need review
                  </p>
                  <p className="text-sm text-amber-700">
                    We're not sure about these categories
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLowConfidence(!showLowConfidence)}
                className="border-amber-300 hover:bg-amber-100"
              >
                {showLowConfidence ? 'Show All' : 'Review Now'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    {info.icon} {info.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'date' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (sortBy === 'date') setSortDesc(!sortDesc)
                  else setSortBy('date')
                }}
              >
                Date {sortBy === 'date' && (sortDesc ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />)}
              </Button>
              <Button
                variant={sortBy === 'amount' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (sortBy === 'amount') setSortDesc(!sortDesc)
                  else setSortBy('amount')
                }}
              >
                Amount {sortBy === 'amount' && (sortDesc ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />)}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {filteredTransactions.length} Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredTransactions.map((txn) => (
              <TransactionRow
                key={txn.id}
                transaction={txn}
                isEditing={editingId === txn.id}
                onEdit={() => setEditingId(txn.id)}
                onCategoryChange={(cat) => handleCategoryChange(txn.id, cat)}
                onCancel={() => setEditingId(null)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TransactionRow({
  transaction,
  isEditing,
  onEdit,
  onCategoryChange,
  onCancel,
}: {
  transaction: CategorizedTransaction
  isEditing: boolean
  onEdit: () => void
  onCategoryChange: (cat: TransactionCategory) => void
  onCancel: () => void
}) {
  const info = CATEGORY_INFO[transaction.category]
  const isLowConfidence = transaction.confidence < 0.7 && !transaction.userOverride
  const isIncome = transaction.amount > 0

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg border transition-all",
        isLowConfidence && "border-amber-200 bg-amber-50",
        !isLowConfidence && "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
      )}
    >
      {/* Category Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: info.color + '20' }}
      >
        <span className="text-lg">{info.icon}</span>
      </div>

      {/* Description & Date */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {transaction.merchant || transaction.description.substring(0, 40)}
        </p>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">{formatDate(transaction.date)}</span>
          {transaction.isRecurring && (
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
              Recurring
            </span>
          )}
          {isLowConfidence && (
            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs">
              Review
            </span>
          )}
          {transaction.userOverride && (
            <CheckCircle className="w-4 h-4 text-green-500" />
          )}
        </div>
      </div>

      {/* Category */}
      <div className="flex items-center gap-2">
        {isEditing ? (
          <Select
            value={transaction.category}
            onValueChange={(v) => onCategoryChange(v as TransactionCategory)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_INFO).map(([key, catInfo]) => (
                <SelectItem key={key} value={key}>
                  {catInfo.icon} {catInfo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <span className="text-sm">{info.icon} {info.label}</span>
            <Edit2 className="w-3 h-3 text-gray-400" />
          </button>
        )}
      </div>

      {/* Amount */}
      <div className="text-right w-24 flex-shrink-0">
        <p className={cn(
          "font-semibold",
          isIncome ? "text-green-600" : "text-gray-900"
        )}>
          {isIncome ? '+' : ''}{formatCurrency(transaction.amount)}
        </p>
      </div>
    </div>
  )
}
