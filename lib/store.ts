import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  WizardState,
  RawTransaction,
  CategorizedTransaction,
  SpendingAnalysis,
  UserProfile,
  Budget,
  QuestionnaireAnswers,
  TransactionCategory,
  WIZARD_STEPS,
} from './types'

interface BudgetStore extends WizardState {
  // Navigation
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  canProceed: () => boolean

  // File upload
  addFiles: (files: File[]) => void
  removeFile: (index: number) => void

  // Transactions
  setRawTransactions: (transactions: RawTransaction[]) => void
  setCategorizedTransactions: (transactions: CategorizedTransaction[]) => void
  updateTransaction: (id: string, updates: Partial<CategorizedTransaction>) => void

  // Analysis
  setAnalysis: (analysis: SpendingAnalysis) => void

  // User profile
  setUserProfile: (profile: UserProfile) => void
  updateUserProfile: (updates: Partial<UserProfile>) => void

  // Questionnaire
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setQuestionnaireAnswer: (key: string, value: any) => void

  // Budget
  setBudget: (budget: Budget) => void
  updateBudgetCategory: (category: TransactionCategory, updates: Partial<{ budgeted: number; isFixed: boolean; notes: string }>) => void

  // Reset
  reset: () => void
}

const initialState: WizardState = {
  currentStep: 0,
  uploadedFiles: [],
  rawTransactions: [],
  categorizedTransactions: [],
  analysis: null,
  userProfile: null,
  budget: null,
  questionnaire: {},
}

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const { currentStep } = get()
        if (currentStep < WIZARD_STEPS.length - 1) {
          set({ currentStep: currentStep + 1 })
        }
      },

      prevStep: () => {
        const { currentStep } = get()
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 })
        }
      },

      canProceed: () => {
        const state = get()
        const step = WIZARD_STEPS[state.currentStep]

        switch (step?.id) {
          case 'welcome':
            return true
          case 'upload':
            return state.rawTransactions.length > 0
          case 'review':
            return state.categorizedTransactions.length > 0
          case 'profile':
            return state.userProfile !== null
          case 'income':
            return state.analysis !== null && state.analysis.totalIncome > 0
          case 'fixed':
          case 'variable':
            return true
          case 'goals':
            return true
          case 'optimize':
            return true
          case 'budget':
            return state.budget !== null
          default:
            return true
        }
      },

      addFiles: (files) =>
        set((state) => ({
          uploadedFiles: [...state.uploadedFiles, ...files],
        })),

      removeFile: (index) =>
        set((state) => ({
          uploadedFiles: state.uploadedFiles.filter((_, i) => i !== index),
        })),

      setRawTransactions: (transactions) => set({ rawTransactions: transactions }),

      setCategorizedTransactions: (transactions) =>
        set({ categorizedTransactions: transactions }),

      updateTransaction: (id, updates) =>
        set((state) => ({
          categorizedTransactions: state.categorizedTransactions.map((txn) =>
            txn.id === id ? { ...txn, ...updates, userOverride: true } : txn
          ),
        })),

      setAnalysis: (analysis) => set({ analysis }),

      setUserProfile: (profile) => set({ userProfile: profile }),

      updateUserProfile: (updates) =>
        set((state) => ({
          userProfile: state.userProfile
            ? { ...state.userProfile, ...updates }
            : null,
        })),

      setQuestionnaireAnswer: (key, value) =>
        set((state) => ({
          questionnaire: { ...state.questionnaire, [key]: value },
        })),

      setBudget: (budget) => set({ budget }),

      updateBudgetCategory: (category, updates) =>
        set((state) => ({
          budget: state.budget
            ? {
                ...state.budget,
                categories: state.budget.categories.map((c) =>
                  c.category === category ? { ...c, ...updates } : c
                ),
              }
            : null,
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'budget-turbo-storage',
      partialize: (state) => ({
        currentStep: state.currentStep,
        rawTransactions: state.rawTransactions,
        categorizedTransactions: state.categorizedTransactions,
        analysis: state.analysis,
        userProfile: state.userProfile,
        budget: state.budget,
        questionnaire: state.questionnaire,
      }),
    }
  )
)
