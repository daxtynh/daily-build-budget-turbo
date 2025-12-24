# BudgetTurbo - Build Log

## What Was Built
**BudgetTurbo** - A TurboTax-style wizard for building a personalized budget from bank statements.

## Live URL
**https://budget-turbo.vercel.app**

## GitHub
**https://github.com/daxtynh/daily-build-budget-turbo**

## The Problem
People hate budgeting because:
- It's overwhelming to start from scratch
- Bank statements are data-rich but hard to parse
- No tool walks you through budget creation step-by-step
- TurboTax proved wizard-style UX works for complex financial tasks

## The Solution
A 10-step wizard that:
1. Imports bank statements (CSV/OFX)
2. Auto-categorizes transactions with AI
3. Lets users verify/fix categories
4. Gathers profile info (housing, employment, etc.)
5. Confirms income sources
6. Sets up fixed expenses
7. Creates variable spending budgets
8. Defines financial goals
9. Provides AI optimization recommendations
10. Generates a final budget with charts

## Target Customer
- 25-45 year olds who know they SHOULD budget but find it overwhelming
- People with bank statements but no budget
- Anyone who's tried and failed at budgeting apps

## Pricing Model
- **Free**: 1 month analysis, basic categorization
- **Pro ($9.99/mo)**: Unlimited accounts, AI insights, ongoing tracking
- **Lifetime ($29.99)**: Full year analysis + budget plan export

## Tech Stack
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS
- **State**: Zustand with persistence
- **Charts**: Recharts
- **AI**: Claude API for categorization and chat
- **Payments**: Stripe (ready to configure)
- **Analytics**: Vercel Analytics
- **Deploy**: Vercel

## Key Features
1. **Bank Statement Parser** - Handles CSV and OFX/QFX files from major banks
2. **AI Categorization** - Rule-based + Claude API backup for accurate categorization
3. **Recurring Detection** - Automatically identifies subscriptions and recurring payments
4. **Spending Analysis** - Insights, warnings, and tips based on spending patterns
5. **50/30/20 Rule** - Shows how budget compares to recommended needs/wants/savings split
6. **AI Chat** - Ask questions about your budget and get personalized advice
7. **Export** - Download budget as CSV, print-friendly view

## What's Next
1. Add Clerk authentication for user accounts
2. Set up Vercel Postgres to save budgets
3. Add monthly email reports
4. Build mobile-responsive improvements
5. Add bank connection via Plaid (if/when worthwhile)

## Environment Variables Needed
```
ANTHROPIC_API_KEY=sk-ant-xxx (already configured)
STRIPE_SECRET_KEY=sk_xxx (for payments)
STRIPE_WEBHOOK_SECRET=whsec_xxx (for payment confirmation)
```

## Revenue Potential
- Market: ~75M Americans who have tried budgeting apps
- If 0.1% convert at $10/mo avg = $75k MRR
- More realistically, targeting 100-1000 paying users = $1k-10k MRR

## Build Time
~2 hours from concept to deployed product
