"use client"

import { WizardLayout } from '@/components/wizard/WizardLayout'
import { useBudgetStore } from '@/lib/store'
import { WIZARD_STEPS } from '@/lib/types'
import { WelcomeStep } from '@/components/wizard/steps/WelcomeStep'
import { UploadStep } from '@/components/wizard/steps/UploadStep'
import { ReviewStep } from '@/components/wizard/steps/ReviewStep'
import { ProfileStep } from '@/components/wizard/steps/ProfileStep'
import { IncomeStep } from '@/components/wizard/steps/IncomeStep'
import { FixedExpensesStep } from '@/components/wizard/steps/FixedExpensesStep'
import { VariableExpensesStep } from '@/components/wizard/steps/VariableExpensesStep'
import { GoalsStep } from '@/components/wizard/steps/GoalsStep'
import { OptimizeStep } from '@/components/wizard/steps/OptimizeStep'
import { BudgetStep } from '@/components/wizard/steps/BudgetStep'

const stepComponents: Record<string, React.ComponentType> = {
  WelcomeStep,
  UploadStep,
  ReviewStep,
  ProfileStep,
  IncomeStep,
  FixedExpensesStep,
  VariableExpensesStep,
  GoalsStep,
  OptimizeStep,
  BudgetStep,
}

export default function Home() {
  const { currentStep } = useBudgetStore()
  const step = WIZARD_STEPS[currentStep]
  const StepComponent = step ? stepComponents[step.component] : null

  return (
    <WizardLayout>
      {StepComponent ? <StepComponent /> : <div>Step not found</div>}
    </WizardLayout>
  )
}
