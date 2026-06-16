import { NextRequest, NextResponse } from 'next/server'
import { stripeClient } from '@/lib/stripe'
import { getAccountStatus } from '@/lib/connect'
import { createClient } from '@/lib/supabase/server'

// ===========================================================================
// POST /api/connect/accounts
// Create a new CONNECTED ACCOUNT using the Stripe v2 Accounts API.
//
// This is a platform-centric setup: the PLATFORM is responsible for pricing
// and for collecting fees/losses. We therefore create a "recipient"
// configuration account (NOT type: 'express' / 'standard' / 'custom').
// ===========================================================================
export async function POST(req: NextRequest) {
  try {
    const { displayName, contactEmail } = await req.json()

    if (!displayName || !contactEmail) {
      return NextResponse.json(
        { error: 'displayName and contactEmail are required' },
        { status: 400 }
      )
    }

    // --- Create the connected account (v2.core.accounts) ------------------
    // IMPORTANT: never pass a top-level `type`. The shape below tells Stripe:
    //  - the platform ('application') collects fees and absorbs losses
    //  - the account is a 'recipient' that can receive transfers to its
    //    Stripe balance
    //  - surface an Express-style hosted dashboard to the connected user
    const account = await stripeClient.v2.core.accounts.create({
      display_name: displayName,
      contact_email: contactEmail,
      identity: {
        country: 'us',
      },
      dashboard: 'express',
      defaults: {
        responsibilities: {
          fees_collector: 'application',
          losses_collector: 'application',
        },
      },
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: {
                requested: true,
              },
            },
          },
        },
      },
    })

    // --- Persist the user -> account mapping ------------------------------
    // We have a DB (Supabase), so we store which merchant owns this account.
    // Account *status* is NOT stored — that always comes from the API.
    const supabase = await createClient()
    const { error: dbError } = await supabase.from('connect_merchants').insert({
      display_name: displayName,
      contact_email: contactEmail,
      stripe_account_id: account.id,
    })

    if (dbError) {
      // The account exists in Stripe even if our DB write failed; surface it.
      console.error('Failed to store merchant mapping:', dbError)
      return NextResponse.json(
        { error: 'Account created in Stripe but could not be saved locally' },
        { status: 500 }
      )
    }

    return NextResponse.json({ accountId: account.id })
  } catch (err) {
    console.error('Create connected account error:', err)
    return NextResponse.json({ error: 'Failed to create connected account' }, { status: 500 })
  }
}

// ===========================================================================
// GET /api/connect/accounts
// List all merchants we've onboarded, enriched with LIVE status from Stripe.
// ===========================================================================
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: merchants } = await supabase
      .from('connect_merchants')
      .select('*')
      .order('created_at', { ascending: false })

    // For each stored account, fetch its current status straight from Stripe.
    const accounts = await Promise.all(
      (merchants ?? []).map(async (m) => {
        try {
          const status = await getAccountStatus(m.stripe_account_id)
          return { ...status, displayName: m.display_name, contactEmail: m.contact_email }
        } catch {
          // If an account can't be retrieved, still show the row as not-ready.
          return {
            accountId: m.stripe_account_id,
            displayName: m.display_name,
            contactEmail: m.contact_email,
            readyToReceivePayments: false,
            onboardingComplete: false,
            requirementsStatus: 'unknown',
          }
        }
      })
    )

    return NextResponse.json({ accounts })
  } catch (err) {
    console.error('List connected accounts error:', err)
    return NextResponse.json({ error: 'Failed to list accounts' }, { status: 500 })
  }
}
