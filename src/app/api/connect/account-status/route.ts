import { NextRequest, NextResponse } from 'next/server'
import { getAccountStatus } from '@/lib/connect'

// ===========================================================================
// GET /api/connect/account-status?accountId=acct_123
// Returns the LIVE onboarding/payments status for a single connected account,
// fetched directly from the Stripe API (never from our DB).
// ===========================================================================
export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get('accountId')
  if (!accountId) {
    return NextResponse.json({ error: 'accountId query param is required' }, { status: 400 })
  }

  try {
    const status = await getAccountStatus(accountId)
    return NextResponse.json(status)
  } catch (err) {
    console.error('Get account status error:', err)
    return NextResponse.json({ error: 'Failed to fetch account status' }, { status: 500 })
  }
}
