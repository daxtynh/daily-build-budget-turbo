"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useBudgetStore } from '@/lib/store'
import { WIZARD_STEPS } from '@/lib/types'
import { cn } from '@/lib/utils'

interface WizardLayoutProps {
  children: React.ReactNode
}

export function WizardLayout({ children }: WizardLayoutProps) {
  const { currentStep, nextStep, prevStep, canProceed } = useBudgetStore()
  const step = WIZARD_STEPS[currentStep]
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">BudgetTurbo</h1>
                <p className="text-xs text-gray-500">Step {currentStep + 1} of {WIZARD_STEPS.length}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">{step?.title}</p>
              <p className="text-xs text-gray-500">{step?.subtitle}</p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </header>

      {/* Step Indicators */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex justify-between overflow-x-auto pb-2 gap-2">
          {WIZARD_STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => i <= currentStep && useBudgetStore.getState().setStep(i)}
              disabled={i > currentStep}
              className={cn(
                "flex flex-col items-center min-w-[70px] p-2 rounded-lg transition-all",
                i === currentStep && "bg-blue-100",
                i < currentStep && "opacity-100 cursor-pointer hover:bg-gray-100",
                i > currentStep && "opacity-40 cursor-not-allowed"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-lg mb-1",
                  i === currentStep && "bg-blue-600 text-white",
                  i < currentStep && "bg-green-500 text-white",
                  i > currentStep && "bg-gray-200"
                )}
              >
                {i < currentStep ? <Check className="w-4 h-4" /> : s.icon}
              </div>
              <span className={cn(
                "text-xs text-center whitespace-nowrap",
                i === currentStep ? "font-medium text-blue-700" : "text-gray-500"
              )}>
                {s.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t py-4 px-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {WIZARD_STEPS[currentStep]?.canSkip && (
              <Button variant="ghost" onClick={nextStep}>
                Skip this step
              </Button>
            )}
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="gap-2"
              size="lg"
            >
              {currentStep === WIZARD_STEPS.length - 1 ? 'Finish' : 'Continue'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
