"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Home, Car, GraduationCap, Baby, Dog, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBudgetStore } from '@/lib/store'
import { UserProfile } from '@/lib/types'
import { cn } from '@/lib/utils'

interface OptionCardProps {
  icon: React.ReactNode
  label: string
  description?: string
  isSelected: boolean
  onClick: () => void
}

function OptionCard({ icon, label, description, isSelected, onClick }: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center p-4 rounded-xl border-2 transition-all text-center",
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center mb-2",
        isSelected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
      )}>
        {icon}
      </div>
      <span className={cn(
        "font-medium",
        isSelected ? "text-blue-700" : "text-gray-700"
      )}>
        {label}
      </span>
      {description && (
        <span className="text-xs text-gray-500 mt-1">{description}</span>
      )}
    </button>
  )
}

export function ProfileStep() {
  const { userProfile, setUserProfile, analysis } = useBudgetStore()

  const [profile, setProfile] = useState<Partial<UserProfile>>(userProfile || {
    householdSize: 1,
    hasChildren: false,
    hasPets: false,
    employmentStatus: 'employed',
    housingType: 'rent',
    hasVehicle: false,
    hasStudentLoans: false,
    hasCreditCardDebt: false,
    primaryGoal: 'save_more',
  })

  // Auto-detect some profile aspects from transactions
  useEffect(() => {
    if (analysis && !userProfile) {
      const updates: Partial<UserProfile> = {}

      // Check for pet-related spending
      if (analysis.byCategory.pets?.count > 0) {
        updates.hasPets = true
      }

      // Check for childcare spending
      if (analysis.byCategory.childcare?.count > 0) {
        updates.hasChildren = true
      }

      // Check for vehicle-related spending
      if (analysis.byCategory.transportation?.transactions.some(t =>
        t.description.toLowerCase().includes('gas') ||
        t.description.toLowerCase().includes('fuel') ||
        t.description.toLowerCase().includes('auto')
      )) {
        updates.hasVehicle = true
      }

      // Check for student loan payments
      if (analysis.byCategory.debt?.transactions.some(t =>
        t.description.toLowerCase().includes('student') ||
        t.description.toLowerCase().includes('navient') ||
        t.description.toLowerCase().includes('nelnet')
      )) {
        updates.hasStudentLoans = true
      }

      if (Object.keys(updates).length > 0) {
        setProfile(prev => ({ ...prev, ...updates }))
      }
    }
  }, [analysis, userProfile])

  // Update store when profile changes
  useEffect(() => {
    if (
      profile.householdSize &&
      profile.employmentStatus &&
      profile.housingType &&
      profile.primaryGoal
    ) {
      setUserProfile(profile as UserProfile)
    }
  }, [profile, setUserProfile])

  const updateProfile = (key: keyof UserProfile, value: UserProfile[keyof UserProfile]) => {
    setProfile(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="py-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Tell Us About Your Situation
        </h2>
        <p className="text-gray-600">
          This helps us create a budget tailored to your life. All questions are optional but help us give better advice.
        </p>
      </div>

      {/* Employment */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Employment Status
          </CardTitle>
          <CardDescription>What's your current work situation?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <OptionCard
              icon={<span className="text-xl">💼</span>}
              label="Employed"
              description="W-2 job"
              isSelected={profile.employmentStatus === 'employed'}
              onClick={() => updateProfile('employmentStatus', 'employed')}
            />
            <OptionCard
              icon={<span className="text-xl">🚀</span>}
              label="Self-Employed"
              description="Freelance/1099"
              isSelected={profile.employmentStatus === 'self_employed'}
              onClick={() => updateProfile('employmentStatus', 'self_employed')}
            />
            <OptionCard
              icon={<span className="text-xl">🔍</span>}
              label="Job Seeking"
              isSelected={profile.employmentStatus === 'unemployed'}
              onClick={() => updateProfile('employmentStatus', 'unemployed')}
            />
            <OptionCard
              icon={<span className="text-xl">🏖️</span>}
              label="Retired"
              isSelected={profile.employmentStatus === 'retired'}
              onClick={() => updateProfile('employmentStatus', 'retired')}
            />
            <OptionCard
              icon={<span className="text-xl">📚</span>}
              label="Student"
              isSelected={profile.employmentStatus === 'student'}
              onClick={() => updateProfile('employmentStatus', 'student')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Housing */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Home className="w-5 h-5" />
            Housing Situation
          </CardTitle>
          <CardDescription>How do you pay for housing?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <OptionCard
              icon={<span className="text-xl">🏢</span>}
              label="Renting"
              description="Pay monthly rent"
              isSelected={profile.housingType === 'rent'}
              onClick={() => updateProfile('housingType', 'rent')}
            />
            <OptionCard
              icon={<span className="text-xl">🏠</span>}
              label="Own (Mortgage)"
              description="Paying off home"
              isSelected={profile.housingType === 'own_mortgage'}
              onClick={() => updateProfile('housingType', 'own_mortgage')}
            />
            <OptionCard
              icon={<span className="text-xl">🔑</span>}
              label="Own (Paid Off)"
              description="No mortgage"
              isSelected={profile.housingType === 'own_no_mortgage'}
              onClick={() => updateProfile('housingType', 'own_no_mortgage')}
            />
            <OptionCard
              icon={<span className="text-xl">👨‍👩‍👧</span>}
              label="Living with Family"
              description="No/reduced housing cost"
              isSelected={profile.housingType === 'living_with_family'}
              onClick={() => updateProfile('housingType', 'living_with_family')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Household Size */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Household Size</CardTitle>
          <CardDescription>How many people live in your household?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map(size => (
              <Button
                key={size}
                variant={profile.householdSize === size ? 'default' : 'outline'}
                className="w-12 h-12"
                onClick={() => updateProfile('householdSize', size)}
              >
                {size}{size === 6 ? '+' : ''}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Toggles */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Your Situation</CardTitle>
          <CardDescription>Select all that apply</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <OptionCard
              icon={<Car className="w-5 h-5" />}
              label="Have a Vehicle"
              description="Car payments/maintenance"
              isSelected={profile.hasVehicle || false}
              onClick={() => updateProfile('hasVehicle', !profile.hasVehicle)}
            />
            <OptionCard
              icon={<Baby className="w-5 h-5" />}
              label="Have Children"
              description="Childcare expenses"
              isSelected={profile.hasChildren || false}
              onClick={() => updateProfile('hasChildren', !profile.hasChildren)}
            />
            <OptionCard
              icon={<Dog className="w-5 h-5" />}
              label="Have Pets"
              description="Pet expenses"
              isSelected={profile.hasPets || false}
              onClick={() => updateProfile('hasPets', !profile.hasPets)}
            />
            <OptionCard
              icon={<GraduationCap className="w-5 h-5" />}
              label="Student Loans"
              description="Education debt"
              isSelected={profile.hasStudentLoans || false}
              onClick={() => updateProfile('hasStudentLoans', !profile.hasStudentLoans)}
            />
            <OptionCard
              icon={<span className="text-xl">💳</span>}
              label="Credit Card Debt"
              description="Carrying a balance"
              isSelected={profile.hasCreditCardDebt || false}
              onClick={() => updateProfile('hasCreditCardDebt', !profile.hasCreditCardDebt)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Primary Goal */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5" />
            What's Your Primary Financial Goal?
          </CardTitle>
          <CardDescription>We'll optimize your budget around this</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <OptionCard
              icon={<span className="text-xl">💰</span>}
              label="Save More"
              description="Build savings"
              isSelected={profile.primaryGoal === 'save_more'}
              onClick={() => updateProfile('primaryGoal', 'save_more')}
            />
            <OptionCard
              icon={<span className="text-xl">🏦</span>}
              label="Pay Off Debt"
              description="Become debt-free"
              isSelected={profile.primaryGoal === 'pay_debt'}
              onClick={() => updateProfile('primaryGoal', 'pay_debt')}
            />
            <OptionCard
              icon={<span className="text-xl">📈</span>}
              label="Invest More"
              description="Grow wealth"
              isSelected={profile.primaryGoal === 'invest'}
              onClick={() => updateProfile('primaryGoal', 'invest')}
            />
            <OptionCard
              icon={<span className="text-xl">📊</span>}
              label="Track Spending"
              description="See where money goes"
              isSelected={profile.primaryGoal === 'track_spending'}
              onClick={() => updateProfile('primaryGoal', 'track_spending')}
            />
            <OptionCard
              icon={<span className="text-xl">🛡️</span>}
              label="Emergency Fund"
              description="Financial safety net"
              isSelected={profile.primaryGoal === 'prepare_emergency'}
              onClick={() => updateProfile('primaryGoal', 'prepare_emergency')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Auto-detected notice */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-gray-500"
        >
          <p>We pre-filled some answers based on your transaction history</p>
        </motion.div>
      )}
    </div>
  )
}
