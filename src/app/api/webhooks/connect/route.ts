import { NextRequest, NextResponse } from 'next/server'
import { stripeClient } from '@/lib/stripe'
import { getAccountStatus } from '@/lib/connect'

// ===========================================================================
// POST /api/webhooks/connect
// Receives "THIN" events for v2 connected accounts. Thin events carry only an
// id + type + a reference to the related object — we then fetch the full event
// (or related object) from the API to act on it.
//
// NOTE on SDK naming: in this SDK version the thin-event parser is called
// `parseEventNotification` (it was previously `parseThinEvent`). It returns a
// typed `EventNotification` with `.type`, `.related_object`, and helper
// methods `.fetchEvent()` / `.fetchRelatedObject()`.
//
// Register this endpoint in the Dashboard (Developers -> Webhooks) selecting
// "Connected accounts" + "Thin" payload style, and subscribe to:
//   - v2.core.account[requirements].updated
//   - v2.core.account[configuration.recipient].capability_status_updated
//
// Or run locally with the Stripe CLI:
//   stripe listen \
//     --thin-events 'v2.core.account[requirements].updated,v2.core.account[.recipient].capability_status_updated' \
//     --forward-thin-to localhost:3000/api/webhooks/connect
// ===========================================================================
export async function POST(req: NextRequest) {
  // Thin events must be verified against the RAW request body.
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  // PLACEHOLDER: set STRIPE_CONNECT_WEBHOOK_SECRET in `.env.local`.
  // The Dashboard shows it as the destination's "signing secret" (whsec_...).
  // The Stripe CLI prints it when you run `stripe listen`.
  const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET

  if (!webhookSecret || webhookSecret === 'whsec_REPLACE_ME') {
    console.error('Missing STRIPE_CONNECT_WEBHOOK_SECRET')
    return NextResponse.json(
      { error: 'Server missing STRIPE_CONNECT_WEBHOOK_SECRET' },
      { status: 500 }
    )
  }
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  // --- 1. Verify + parse the thin event notification --------------------
  let notification
  try {
    notification = stripeClient.parseEventNotification(body, signature, webhookSecret)
  } catch (err) {
    console.error('Thin event signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    // The connected account this notification relates to (when present).
    const accountId =
      'related_object' in notification ? notification.related_object?.id : undefined

    // --- 2. Handle each event type --------------------------------------
    switch (notification.type) {
      case 'v2.core.account[requirements].updated': {
        // Requirements changed (e.g. regulators now need more info). Re-pull
        // the live status so any dashboard/UI reflects what's outstanding.
        if (accountId) {
          const status = await getAccountStatus(accountId)
          console.log('[connect webhook] requirements.updated', status)
          // TODO: notify the merchant if status.onboardingComplete === false.
        }
        break
      }

      case 'v2.core.account[configuration.recipient].capability_status_updated': {
        // A capability (e.g. stripe_transfers) flipped active/inactive.
        if (accountId) {
          const status = await getAccountStatus(accountId)
          console.log('[connect webhook] recipient capability updated', status)
          // TODO: enable/disable this merchant's products based on
          // status.readyToReceivePayments.
        }
        break
      }

      default:
        // Acknowledge unhandled event types so Stripe doesn't keep retrying.
        // You can call `notification.fetchEvent()` here to inspect the full
        // event payload if you need more detail.
        console.log('[connect webhook] unhandled event type:', notification.type)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Connect webhook handling error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
