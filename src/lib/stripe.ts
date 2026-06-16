import Stripe from 'stripe'

// ---------------------------------------------------------------------------
// Stripe Client
// ---------------------------------------------------------------------------
// We create ONE shared `stripeClient` and use it for every Stripe request
// (both the classic v1 APIs like products/checkout, and the new v2 Connect
// APIs like v2.core.accounts).
//
// NOTE: We intentionally do NOT pin `apiVersion` here. The installed SDK
// already targets the correct API version (the latest preview,
// 2026-05-27.dahlia, ships with this SDK), so it is applied automatically.
// ---------------------------------------------------------------------------

// PLACEHOLDER: set STRIPE_SECRET_KEY in `.env.local` (and in your Vercel
// project settings for production). Find it at
// https://dashboard.stripe.com/test/apikeys — it looks like `sk_test_...`.
const secretKey = process.env.STRIPE_SECRET_KEY

if (!secretKey) {
  // Fail loudly and early with an actionable message rather than letting a
  // cryptic "No API key provided" surface deep inside an API call.
  throw new Error(
    'Missing STRIPE_SECRET_KEY. Add it to your .env.local (and Vercel env vars). ' +
      'Get a test key from https://dashboard.stripe.com/test/apikeys'
  )
}

// The single client instance used across the whole app.
export const stripeClient = new Stripe(secretKey)

// Back-compat alias: earlier files import `stripe`. Keep both pointing at the
// same client so there is only ever one Stripe Client in the app.
export const stripe = stripeClient
