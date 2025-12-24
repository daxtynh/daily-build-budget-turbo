// Core transaction type from bank statement
export interface RawTransaction {
  date: string
  description: string
  amount: number
  balance?: number
  type?: 'credit' | 'debit'
}

// Categorized transaction after AI processing
export interface CategorizedTransaction extends RawTransaction {
  id: string
  category: TransactionCategory
  subcategory: string
  confidence: number
  merchant?: string
  isRecurring: boolean
  recurringFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
  userOverride?: boolean
  notes?: string
}

// Standard budget categories
export type TransactionCategory =
  | 'income'
  | 'housing'
  | 'utilities'
  | 'groceries'
  | 'dining'
  | 'transportation'
  | 'healthcare'
  | 'insurance'
  | 'debt'
  | 'savings'
  | 'investments'
  | 'shopping'
  | 'entertainment'
  | 'subscriptions'
  | 'personal_care'
  | 'education'
  | 'gifts_donations'
  | 'travel'
  | 'pets'
  | 'childcare'
  | 'business'
  | 'taxes'
  | 'fees'
  | 'transfers'
  | 'other'

export const CATEGORY_INFO: Record<TransactionCategory, {
  label: string
  icon: string
  color: string
  description: string
  isEssential: boolean
}> = {
  income: { label: 'Income', icon: '💰', color: '#22c55e', description: 'Salary, freelance, side hustles', isEssential: true },
  housing: { label: 'Housing', icon: '🏠', color: '#3b82f6', description: 'Rent, mortgage, HOA fees', isEssential: true },
  utilities: { label: 'Utilities', icon: '💡', color: '#f59e0b', description: 'Electric, gas, water, internet', isEssential: true },
  groceries: { label: 'Groceries', icon: '🛒', color: '#84cc16', description: 'Food and household essentials', isEssential: true },
  dining: { label: 'Dining Out', icon: '🍕', color: '#f97316', description: 'Restaurants, takeout, coffee', isEssential: false },
  transportation: { label: 'Transportation', icon: '🚗', color: '#6366f1', description: 'Gas, car payments, transit', isEssential: true },
  healthcare: { label: 'Healthcare', icon: '🏥', color: '#ec4899', description: 'Medical bills, prescriptions', isEssential: true },
  insurance: { label: 'Insurance', icon: '🛡️', color: '#8b5cf6', description: 'Health, auto, life, home', isEssential: true },
  debt: { label: 'Debt Payments', icon: '💳', color: '#ef4444', description: 'Credit cards, loans', isEssential: true },
  savings: { label: 'Savings', icon: '🏦', color: '#14b8a6', description: 'Emergency fund, goals', isEssential: true },
  investments: { label: 'Investments', icon: '📈', color: '#06b6d4', description: '401k, IRA, stocks', isEssential: false },
  shopping: { label: 'Shopping', icon: '🛍️', color: '#d946ef', description: 'Clothes, electronics, home', isEssential: false },
  entertainment: { label: 'Entertainment', icon: '🎬', color: '#a855f7', description: 'Movies, games, hobbies', isEssential: false },
  subscriptions: { label: 'Subscriptions', icon: '📱', color: '#0ea5e9', description: 'Streaming, software, memberships', isEssential: false },
  personal_care: { label: 'Personal Care', icon: '💇', color: '#f472b6', description: 'Haircuts, gym, self-care', isEssential: false },
  education: { label: 'Education', icon: '📚', color: '#4ade80', description: 'Courses, books, tuition', isEssential: false },
  gifts_donations: { label: 'Gifts & Donations', icon: '🎁', color: '#fb923c', description: 'Presents, charity', isEssential: false },
  travel: { label: 'Travel', icon: '✈️', color: '#38bdf8', description: 'Flights, hotels, vacation', isEssential: false },
  pets: { label: 'Pets', icon: '🐕', color: '#a3e635', description: 'Food, vet, supplies', isEssential: false },
  childcare: { label: 'Childcare', icon: '👶', color: '#fbbf24', description: 'Daycare, activities', isEssential: true },
  business: { label: 'Business', icon: '💼', color: '#64748b', description: 'Work expenses', isEssential: false },
  taxes: { label: 'Taxes', icon: '📋', color: '#78716c', description: 'Income, property taxes', isEssential: true },
  fees: { label: 'Fees & Charges', icon: '⚠️', color: '#f87171', description: 'Bank fees, penalties', isEssential: false },
  transfers: { label: 'Transfers', icon: '🔄', color: '#94a3b8', description: 'Account transfers', isEssential: false },
  other: { label: 'Other', icon: '📦', color: '#71717a', description: 'Uncategorized', isEssential: false },
}

// Analysis results
export interface SpendingAnalysis {
  totalIncome: number
  totalExpenses: number
  netCashflow: number
  byCategory: Record<TransactionCategory, {
    total: number
    count: number
    transactions: CategorizedTransaction[]
  }>
  recurringExpenses: CategorizedTransaction[]
  topMerchants: { name: string; total: number; count: number }[]
  dateRange: { start: Date; end: Date }
  insights: SpendingInsight[]
}

export interface SpendingInsight {
  type: 'warning' | 'tip' | 'positive' | 'question'
  title: string
  description: string
  category?: TransactionCategory
  amount?: number
  action?: string
}

// Budget types
export interface BudgetCategory {
  category: TransactionCategory
  budgeted: number
  actual: number
  isFixed: boolean
  notes?: string
}

export interface Budget {
  id: string
  userId: string
  name: string
  monthlyIncome: number
  categories: BudgetCategory[]
  savingsGoal: number
  debtPaymentGoal: number
  emergencyFundTarget: number
  emergencyFundCurrent: number
  createdAt: Date
  updatedAt: Date
}

// Wizard step data
export interface WizardState {
  currentStep: number
  uploadedFiles: File[]
  rawTransactions: RawTransaction[]
  categorizedTransactions: CategorizedTransaction[]
  analysis: SpendingAnalysis | null
  userProfile: UserProfile | null
  budget: Budget | null
  questionnaire: QuestionnaireAnswers
}

export interface UserProfile {
  name?: string
  email?: string
  householdSize: number
  hasChildren: boolean
  hasPets: boolean
  employmentStatus: 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student'
  housingType: 'rent' | 'own_mortgage' | 'own_no_mortgage' | 'living_with_family'
  hasVehicle: boolean
  hasStudentLoans: boolean
  hasCreditCardDebt: boolean
  primaryGoal: 'save_more' | 'pay_debt' | 'invest' | 'track_spending' | 'prepare_emergency'
}

export interface QuestionnaireAnswers {
  // Step-specific answers stored dynamically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

// Wizard step definition
export interface WizardStep {
  id: string
  title: string
  subtitle: string
  icon: string
  component: string
  isCompleted: boolean
  isActive: boolean
  canSkip: boolean
}

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    subtitle: 'Let\'s build your budget',
    icon: '👋',
    component: 'WelcomeStep',
    isCompleted: false,
    isActive: true,
    canSkip: false,
  },
  {
    id: 'upload',
    title: 'Upload Statements',
    subtitle: 'Import your bank data',
    icon: '📄',
    component: 'UploadStep',
    isCompleted: false,
    isActive: false,
    canSkip: false,
  },
  {
    id: 'review',
    title: 'Review Transactions',
    subtitle: 'Verify categorization',
    icon: '🔍',
    component: 'ReviewStep',
    isCompleted: false,
    isActive: false,
    canSkip: false,
  },
  {
    id: 'profile',
    title: 'Your Situation',
    subtitle: 'Tell us about yourself',
    icon: '👤',
    component: 'ProfileStep',
    isCompleted: false,
    isActive: false,
    canSkip: false,
  },
  {
    id: 'income',
    title: 'Income Setup',
    subtitle: 'Confirm your earnings',
    icon: '💵',
    component: 'IncomeStep',
    isCompleted: false,
    isActive: false,
    canSkip: false,
  },
  {
    id: 'fixed',
    title: 'Fixed Expenses',
    subtitle: 'Bills that don\'t change',
    icon: '🏠',
    component: 'FixedExpensesStep',
    isCompleted: false,
    isActive: false,
    canSkip: false,
  },
  {
    id: 'variable',
    title: 'Variable Spending',
    subtitle: 'Day-to-day expenses',
    icon: '🛒',
    component: 'VariableExpensesStep',
    isCompleted: false,
    isActive: false,
    canSkip: false,
  },
  {
    id: 'goals',
    title: 'Financial Goals',
    subtitle: 'Plan for the future',
    icon: '🎯',
    component: 'GoalsStep',
    isCompleted: false,
    isActive: false,
    canSkip: false,
  },
  {
    id: 'optimize',
    title: 'Optimization',
    subtitle: 'AI-powered suggestions',
    icon: '✨',
    component: 'OptimizeStep',
    isCompleted: false,
    isActive: false,
    canSkip: true,
  },
  {
    id: 'budget',
    title: 'Your Budget',
    subtitle: 'The final plan',
    icon: '📊',
    component: 'BudgetStep',
    isCompleted: false,
    isActive: false,
    canSkip: false,
  },
]
