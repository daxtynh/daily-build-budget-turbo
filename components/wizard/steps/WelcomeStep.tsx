"use client"

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Shield, Clock, Sparkles } from 'lucide-react'

const features = [
  {
    icon: <Clock className="w-5 h-5" />,
    title: "5-Minute Setup",
    description: "Upload your bank statement and we'll do the heavy lifting"
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: "AI-Powered Analysis",
    description: "Smart categorization and personalized insights"
  },
  {
    icon: <CheckCircle className="w-5 h-5" />,
    title: "TurboTax-Style Flow",
    description: "Step-by-step guidance through every decision"
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Your Data Stays Yours",
    description: "We never store your bank credentials"
  },
]

export function WelcomeStep() {
  return (
    <div className="py-8">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-2xl mb-6">
          <span className="text-4xl">💰</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to BudgetTurbo
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          The easiest way to build a personalized budget. Upload your bank statement,
          answer a few questions, and get a custom spending plan in minutes.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-12">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 + 0.3 }}
          >
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center"
      >
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0 max-w-xl mx-auto">
          <CardContent className="p-8 text-white">
            <h3 className="text-xl font-bold mb-2">Here's what we'll do together:</h3>
            <ol className="text-left space-y-2 text-blue-100">
              <li className="flex items-start gap-2">
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium">1</span>
                <span>Upload your bank statement (CSV or OFX)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium">2</span>
                <span>Review and verify transaction categories</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium">3</span>
                <span>Tell us about your situation and goals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium">4</span>
                <span>Get your personalized budget with AI insights</span>
              </li>
            </ol>
          </CardContent>
        </Card>
        <p className="text-sm text-gray-500 mt-4">
          Click "Continue" to get started!
        </p>
      </motion.div>
    </div>
  )
}
