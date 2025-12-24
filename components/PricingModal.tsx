"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Sparkles, Crown, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '',
    description: 'Try it out',
    icon: <Zap className="w-6 h-6" />,
    features: [
      '1 month of transactions',
      'Basic categorization',
      'Simple budget view',
      'Export to CSV',
    ],
    cta: 'Current Plan',
    ctaDisabled: true,
    popular: false,
  },
  {
    id: 'pro_monthly',
    name: 'Pro',
    price: '$9.99',
    period: '/month',
    description: 'For serious budgeters',
    icon: <Sparkles className="w-6 h-6" />,
    features: [
      'Unlimited bank accounts',
      'AI-powered insights',
      'Recurring expense detection',
      'Monthly email reports',
      'Goal tracking',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    ctaDisabled: false,
    popular: true,
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: '$29.99',
    period: 'one-time',
    description: 'Best value',
    icon: <Crown className="w-6 h-6" />,
    features: [
      'Everything in Pro',
      'Full year analysis',
      'Detailed PDF report',
      'No subscription needed',
      'Future updates included',
    ],
    cta: 'Get Lifetime Access',
    ctaDisabled: false,
    popular: false,
  },
]

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleCheckout = async (priceType: string) => {
    if (priceType === 'free') return

    setLoading(priceType)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-4xl md:w-full z-50 bg-white rounded-2xl shadow-2xl overflow-auto max-h-[90vh]"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
                  <p className="text-gray-600">Unlock powerful budgeting features</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Plans */}
              <div className="grid md:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={cn(
                      "relative overflow-hidden transition-all hover:shadow-lg",
                      plan.popular && "ring-2 ring-blue-500"
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
                        Most Popular
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          plan.id === 'free' && "bg-gray-100 text-gray-600",
                          plan.id === 'pro_monthly' && "bg-blue-100 text-blue-600",
                          plan.id === 'lifetime' && "bg-amber-100 text-amber-600"
                        )}>
                          {plan.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{plan.name}</h3>
                          <p className="text-sm text-gray-500">{plan.description}</p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <span className="text-3xl font-bold">{plan.price}</span>
                        <span className="text-gray-500">{plan.period}</span>
                      </div>

                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className="w-full"
                        variant={plan.popular ? 'default' : 'outline'}
                        disabled={plan.ctaDisabled || loading === plan.id}
                        onClick={() => handleCheckout(plan.id)}
                      >
                        {loading === plan.id ? 'Loading...' : plan.cta}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Trust Indicators */}
              <div className="mt-6 text-center text-sm text-gray-500">
                <p>🔒 Secure payment powered by Stripe</p>
                <p className="mt-1">Cancel anytime • No questions asked</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
