import { NextRequest, NextResponse } from 'next/server'
import { stripeClient } from '@/lib/stripe'

// ===========================================================================
// POST /api/connect/account-link
// Create a Stripe Account Link so a connected account can complete onboarding
// (identity verification, etc.) on Stripe-hosted pages.
//
// We use the v2 Account Links API with the 'recipient' configuration, matching
// how the account was created.
// ===========================================================================
export async function POST(req: NextRequest) {
  try {
    const { accountId } = await req.json()
    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 })
    }

    // Build absolute URLs from the request origin so this works in local dev
    // and in production without a hardcoded domain.
    const origin = req.headers.get('origin') ?? 'http://localhost:3000'

    const accountLink = await stripeClient.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: 'account_onboarding',
        account_onboarding: {
          configurations: ['recipient'],
          // Stripe sends the user here if the link expires before they finish.
          refresh_url: `${origin}/connect/onboard?accountId=${accountId}`,
          // Stripe returns the user here when they finish/leave onboarding.
          return_url: `${origin}/connect/onboard?accountId=${accountId}`,
        },
      },
    })

    // `accountLink.url` is the one-time hosted onboarding URL to redirect to.
    return NextResponse.json({ url: accountLink.url })
  } catch (err) {
    console.error('Create account link error:', err)
    return NextResponse.json({ error: 'Failed to create onboarding link' }, { status: 500 })
  }
}
