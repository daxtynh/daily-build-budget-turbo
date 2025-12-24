import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to enable payments.' },
      { status: 503 }
    )
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  try {
    const { priceType, email } = await request.json()

    let priceData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData

    switch (priceType) {
      case 'pro_monthly':
        priceData = {
          currency: 'usd',
          product_data: {
            name: 'BudgetTurbo Pro',
            description: 'Unlimited bank accounts, AI insights, ongoing tracking',
          },
          unit_amount: 999, // $9.99
          recurring: {
            interval: 'month',
          },
        }
        break
      case 'lifetime':
        priceData = {
          currency: 'usd',
          product_data: {
            name: 'BudgetTurbo Lifetime',
            description: 'Full year analysis + budget plan export - one-time purchase',
          },
          unit_amount: 2999, // $29.99
        }
        break
      default:
        return NextResponse.json({ error: 'Invalid price type' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: priceData,
          quantity: 1,
        },
      ],
      mode: priceType === 'pro_monthly' ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?canceled=true`,
      customer_email: email,
      metadata: {
        priceType,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
