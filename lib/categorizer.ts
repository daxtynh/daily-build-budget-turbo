import { RawTransaction, CategorizedTransaction, TransactionCategory, CATEGORY_INFO } from './types'

// Merchant patterns for rule-based categorization (backup for AI)
const MERCHANT_PATTERNS: Record<string, { category: TransactionCategory; subcategory: string }> = {
  // Income
  'payroll': { category: 'income', subcategory: 'Salary' },
  'direct dep': { category: 'income', subcategory: 'Direct Deposit' },
  'salary': { category: 'income', subcategory: 'Salary' },
  'ach deposit': { category: 'income', subcategory: 'Direct Deposit' },

  // Housing
  'rent': { category: 'housing', subcategory: 'Rent' },
  'mortgage': { category: 'housing', subcategory: 'Mortgage' },
  'hoa': { category: 'housing', subcategory: 'HOA Fees' },
  'zillow': { category: 'housing', subcategory: 'Rent' },

  // Utilities
  'electric': { category: 'utilities', subcategory: 'Electric' },
  'power': { category: 'utilities', subcategory: 'Electric' },
  'gas bill': { category: 'utilities', subcategory: 'Gas' },
  'water bill': { category: 'utilities', subcategory: 'Water' },
  'comcast': { category: 'utilities', subcategory: 'Internet' },
  'xfinity': { category: 'utilities', subcategory: 'Internet' },
  'verizon': { category: 'utilities', subcategory: 'Phone/Internet' },
  'at&t': { category: 'utilities', subcategory: 'Phone/Internet' },
  't-mobile': { category: 'utilities', subcategory: 'Phone' },
  'sprint': { category: 'utilities', subcategory: 'Phone' },

  // Groceries
  'walmart': { category: 'groceries', subcategory: 'Supermarket' },
  'target': { category: 'groceries', subcategory: 'Supermarket' },
  'kroger': { category: 'groceries', subcategory: 'Supermarket' },
  'safeway': { category: 'groceries', subcategory: 'Supermarket' },
  'whole foods': { category: 'groceries', subcategory: 'Supermarket' },
  'trader joe': { category: 'groceries', subcategory: 'Supermarket' },
  'costco': { category: 'groceries', subcategory: 'Warehouse' },
  'sam\'s club': { category: 'groceries', subcategory: 'Warehouse' },
  'aldi': { category: 'groceries', subcategory: 'Supermarket' },
  'publix': { category: 'groceries', subcategory: 'Supermarket' },
  'h-e-b': { category: 'groceries', subcategory: 'Supermarket' },
  'wegmans': { category: 'groceries', subcategory: 'Supermarket' },

  // Dining
  'mcdonald': { category: 'dining', subcategory: 'Fast Food' },
  'burger king': { category: 'dining', subcategory: 'Fast Food' },
  'wendy': { category: 'dining', subcategory: 'Fast Food' },
  'taco bell': { category: 'dining', subcategory: 'Fast Food' },
  'chipotle': { category: 'dining', subcategory: 'Fast Casual' },
  'panera': { category: 'dining', subcategory: 'Fast Casual' },
  'starbucks': { category: 'dining', subcategory: 'Coffee' },
  'dunkin': { category: 'dining', subcategory: 'Coffee' },
  'doordash': { category: 'dining', subcategory: 'Delivery' },
  'uber eats': { category: 'dining', subcategory: 'Delivery' },
  'grubhub': { category: 'dining', subcategory: 'Delivery' },
  'postmates': { category: 'dining', subcategory: 'Delivery' },
  'restaurant': { category: 'dining', subcategory: 'Restaurant' },
  'pizza': { category: 'dining', subcategory: 'Restaurant' },

  // Transportation
  'shell': { category: 'transportation', subcategory: 'Gas' },
  'chevron': { category: 'transportation', subcategory: 'Gas' },
  'exxon': { category: 'transportation', subcategory: 'Gas' },
  'bp gas': { category: 'transportation', subcategory: 'Gas' },
  'uber ': { category: 'transportation', subcategory: 'Rideshare' },
  'lyft': { category: 'transportation', subcategory: 'Rideshare' },
  'parking': { category: 'transportation', subcategory: 'Parking' },
  'toll': { category: 'transportation', subcategory: 'Tolls' },
  'ez pass': { category: 'transportation', subcategory: 'Tolls' },
  'car wash': { category: 'transportation', subcategory: 'Car Care' },
  'autozone': { category: 'transportation', subcategory: 'Car Parts' },

  // Healthcare
  'cvs': { category: 'healthcare', subcategory: 'Pharmacy' },
  'walgreens': { category: 'healthcare', subcategory: 'Pharmacy' },
  'pharmacy': { category: 'healthcare', subcategory: 'Pharmacy' },
  'doctor': { category: 'healthcare', subcategory: 'Medical' },
  'hospital': { category: 'healthcare', subcategory: 'Medical' },
  'dental': { category: 'healthcare', subcategory: 'Dental' },
  'medical': { category: 'healthcare', subcategory: 'Medical' },

  // Insurance
  'geico': { category: 'insurance', subcategory: 'Auto Insurance' },
  'state farm': { category: 'insurance', subcategory: 'Insurance' },
  'allstate': { category: 'insurance', subcategory: 'Insurance' },
  'progressive': { category: 'insurance', subcategory: 'Auto Insurance' },
  'insurance': { category: 'insurance', subcategory: 'Insurance' },

  // Subscriptions
  'netflix': { category: 'subscriptions', subcategory: 'Streaming' },
  'hulu': { category: 'subscriptions', subcategory: 'Streaming' },
  'disney+': { category: 'subscriptions', subcategory: 'Streaming' },
  'disney plus': { category: 'subscriptions', subcategory: 'Streaming' },
  'hbo': { category: 'subscriptions', subcategory: 'Streaming' },
  'spotify': { category: 'subscriptions', subcategory: 'Music' },
  'apple music': { category: 'subscriptions', subcategory: 'Music' },
  'amazon prime': { category: 'subscriptions', subcategory: 'Amazon Prime' },
  'youtube premium': { category: 'subscriptions', subcategory: 'Streaming' },
  'gym': { category: 'subscriptions', subcategory: 'Fitness' },
  'planet fitness': { category: 'subscriptions', subcategory: 'Fitness' },
  'equinox': { category: 'subscriptions', subcategory: 'Fitness' },
  'peloton': { category: 'subscriptions', subcategory: 'Fitness' },

  // Shopping
  'amazon': { category: 'shopping', subcategory: 'Online Shopping' },
  'ebay': { category: 'shopping', subcategory: 'Online Shopping' },
  'best buy': { category: 'shopping', subcategory: 'Electronics' },
  'apple store': { category: 'shopping', subcategory: 'Electronics' },
  'home depot': { category: 'shopping', subcategory: 'Home Improvement' },
  'lowes': { category: 'shopping', subcategory: 'Home Improvement' },
  'ikea': { category: 'shopping', subcategory: 'Furniture' },
  'marshalls': { category: 'shopping', subcategory: 'Clothing' },
  'tj maxx': { category: 'shopping', subcategory: 'Clothing' },
  'nordstrom': { category: 'shopping', subcategory: 'Clothing' },
  'macy': { category: 'shopping', subcategory: 'Clothing' },
  'old navy': { category: 'shopping', subcategory: 'Clothing' },
  'gap': { category: 'shopping', subcategory: 'Clothing' },

  // Entertainment
  'amc': { category: 'entertainment', subcategory: 'Movies' },
  'regal': { category: 'entertainment', subcategory: 'Movies' },
  'cinemark': { category: 'entertainment', subcategory: 'Movies' },
  'steam': { category: 'entertainment', subcategory: 'Gaming' },
  'playstation': { category: 'entertainment', subcategory: 'Gaming' },
  'xbox': { category: 'entertainment', subcategory: 'Gaming' },
  'ticketmaster': { category: 'entertainment', subcategory: 'Events' },
  'stubhub': { category: 'entertainment', subcategory: 'Events' },

  // Personal Care
  'salon': { category: 'personal_care', subcategory: 'Hair' },
  'spa': { category: 'personal_care', subcategory: 'Spa' },
  'ulta': { category: 'personal_care', subcategory: 'Beauty' },
  'sephora': { category: 'personal_care', subcategory: 'Beauty' },

  // Travel
  'airline': { category: 'travel', subcategory: 'Flights' },
  'united air': { category: 'travel', subcategory: 'Flights' },
  'delta air': { category: 'travel', subcategory: 'Flights' },
  'american air': { category: 'travel', subcategory: 'Flights' },
  'southwest': { category: 'travel', subcategory: 'Flights' },
  'hotel': { category: 'travel', subcategory: 'Lodging' },
  'marriott': { category: 'travel', subcategory: 'Lodging' },
  'hilton': { category: 'travel', subcategory: 'Lodging' },
  'airbnb': { category: 'travel', subcategory: 'Lodging' },
  'vrbo': { category: 'travel', subcategory: 'Lodging' },
  'expedia': { category: 'travel', subcategory: 'Travel Booking' },
  'booking.com': { category: 'travel', subcategory: 'Travel Booking' },

  // Pets
  'petco': { category: 'pets', subcategory: 'Pet Supplies' },
  'petsmart': { category: 'pets', subcategory: 'Pet Supplies' },
  'chewy': { category: 'pets', subcategory: 'Pet Supplies' },
  'vet': { category: 'pets', subcategory: 'Veterinary' },

  // Transfers
  'transfer': { category: 'transfers', subcategory: 'Internal Transfer' },
  'zelle': { category: 'transfers', subcategory: 'Person to Person' },
  'venmo': { category: 'transfers', subcategory: 'Person to Person' },
  'cash app': { category: 'transfers', subcategory: 'Person to Person' },

  // Fees
  'overdraft': { category: 'fees', subcategory: 'Bank Fee' },
  'nsf fee': { category: 'fees', subcategory: 'Bank Fee' },
  'atm fee': { category: 'fees', subcategory: 'ATM Fee' },
  'monthly fee': { category: 'fees', subcategory: 'Bank Fee' },
  'service charge': { category: 'fees', subcategory: 'Bank Fee' },

  // Debt
  'credit card': { category: 'debt', subcategory: 'Credit Card Payment' },
  'loan payment': { category: 'debt', subcategory: 'Loan Payment' },
  'student loan': { category: 'debt', subcategory: 'Student Loan' },
  'navient': { category: 'debt', subcategory: 'Student Loan' },
  'nelnet': { category: 'debt', subcategory: 'Student Loan' },
  'mohela': { category: 'debt', subcategory: 'Student Loan' },
}

// Detect recurring transactions
const RECURRING_PATTERNS = [
  /monthly/i,
  /subscription/i,
  /membership/i,
  /recurring/i,
  /autopay/i,
  /auto pay/i,
]

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function categorizeByRules(transaction: RawTransaction): { category: TransactionCategory; subcategory: string; confidence: number } {
  const desc = transaction.description.toLowerCase()

  // Check merchant patterns
  for (const [pattern, info] of Object.entries(MERCHANT_PATTERNS)) {
    if (desc.includes(pattern.toLowerCase())) {
      return { ...info, confidence: 0.85 }
    }
  }

  // Check if it's income (positive amount with certain keywords)
  if (transaction.amount > 0 || transaction.type === 'credit') {
    if (desc.includes('deposit') || desc.includes('credit') || desc.includes('refund')) {
      return { category: 'income', subcategory: 'Other Income', confidence: 0.7 }
    }
    if (desc.includes('interest')) {
      return { category: 'income', subcategory: 'Interest', confidence: 0.9 }
    }
  }

  return { category: 'other', subcategory: 'Uncategorized', confidence: 0.3 }
}

export function detectRecurring(transactions: CategorizedTransaction[]): CategorizedTransaction[] {
  // Group transactions by normalized description
  const grouped = new Map<string, CategorizedTransaction[]>()

  for (const txn of transactions) {
    const normalizedDesc = txn.description.toLowerCase()
      .replace(/\d{2}\/\d{2}/g, '') // Remove dates
      .replace(/\d+/g, '') // Remove numbers
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 30)

    const existing = grouped.get(normalizedDesc) || []
    existing.push(txn)
    grouped.set(normalizedDesc, existing)
  }

  // Mark transactions as recurring if they appear multiple times
  const updatedTxns = [...transactions]

  for (const [, group] of grouped) {
    if (group.length >= 2) {
      // Calculate average days between transactions
      const dates = group.map(t => new Date(t.date).getTime()).sort((a, b) => a - b)
      const gaps: number[] = []

      for (let i = 1; i < dates.length; i++) {
        gaps.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24))
      }

      if (gaps.length > 0) {
        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length

        let frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | undefined

        if (avgGap >= 5 && avgGap <= 9) frequency = 'weekly'
        else if (avgGap >= 12 && avgGap <= 18) frequency = 'biweekly'
        else if (avgGap >= 26 && avgGap <= 35) frequency = 'monthly'
        else if (avgGap >= 85 && avgGap <= 100) frequency = 'quarterly'
        else if (avgGap >= 350 && avgGap <= 380) frequency = 'yearly'

        if (frequency) {
          for (const txn of group) {
            const idx = updatedTxns.findIndex(t => t.id === txn.id)
            if (idx !== -1) {
              updatedTxns[idx] = {
                ...updatedTxns[idx],
                isRecurring: true,
                recurringFrequency: frequency,
              }
            }
          }
        }
      }
    }
  }

  // Also check for recurring patterns in description
  for (let i = 0; i < updatedTxns.length; i++) {
    if (!updatedTxns[i].isRecurring) {
      for (const pattern of RECURRING_PATTERNS) {
        if (pattern.test(updatedTxns[i].description)) {
          updatedTxns[i] = {
            ...updatedTxns[i],
            isRecurring: true,
            recurringFrequency: 'monthly',
          }
          break
        }
      }
    }
  }

  return updatedTxns
}

export function extractMerchant(description: string): string | undefined {
  // Clean up common prefixes
  let cleaned = description
    .replace(/^(pos|ach|debit|credit|check|wire|online|recurring|payment|purchase)\s*/i, '')
    .replace(/\s*\d{2}\/\d{2}.*$/, '')
    .replace(/\s*#?\d+$/, '')
    .replace(/\s*(ca|ny|tx|fl|il|pa|oh|ga|nc|mi)$/i, '')
    .trim()

  // Take first few words as merchant name
  const words = cleaned.split(/\s+/).slice(0, 3)
  if (words.length > 0 && words[0].length > 2) {
    return words.join(' ')
  }

  return undefined
}

export function categorizeTransactions(
  rawTransactions: RawTransaction[]
): CategorizedTransaction[] {
  const categorized: CategorizedTransaction[] = rawTransactions.map((txn) => {
    const { category, subcategory, confidence } = categorizeByRules(txn)
    const merchant = extractMerchant(txn.description)

    return {
      ...txn,
      id: generateId(),
      category,
      subcategory,
      confidence,
      merchant,
      isRecurring: false,
    }
  })

  // Detect recurring transactions
  return detectRecurring(categorized)
}

export function updateTransactionCategory(
  transactions: CategorizedTransaction[],
  transactionId: string,
  category: TransactionCategory,
  subcategory: string
): CategorizedTransaction[] {
  return transactions.map((txn) => {
    if (txn.id === transactionId) {
      return {
        ...txn,
        category,
        subcategory,
        userOverride: true,
        confidence: 1.0,
      }
    }
    return txn
  })
}
