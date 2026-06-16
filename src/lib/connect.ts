import { stripeClient } from './stripe'

// The platform keeps this percentage of every sale as an application fee.
// (Destination charges with an application fee — see the checkout route.)
export const PLATFORM_FEE_PERCENT = 10

export interface ConnectAccountStatus {
  accountId: string
  displayName: string | null
  // True once the connected account can actually receive transfers/payouts.
  readyToReceivePayments: boolean
  // True once Stripe has no outstanding "currently due" / "past due" requirements.
  onboardingComplete: boolean
  // Raw requirement status string from the API, useful for debugging/UI.
  requirementsStatus: string | null
}

// ---------------------------------------------------------------------------
// Fetch a connected account's onboarding/payment status DIRECTLY from Stripe.
// Per the integration design, we never cache this in our DB — the API is the
// source of truth because requirements can change at any time (regulators,
// card networks, etc.).
// ---------------------------------------------------------------------------
export async function getAccountStatus(accountId: string): Promise<ConnectAccountStatus> {
  // `include` pulls in the recipient configuration (for the transfers
  // capability) and the requirements summary in a single round-trip.
  const account = await stripeClient.v2.core.accounts.retrieve(accountId, {
    include: ['configuration.recipient', 'requirements'],
  })

  // The connected account can receive money once the stripe_transfers
  // capability under the recipient configuration is "active".
  const readyToReceivePayments =
    account?.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers
      ?.status === 'active'

  // Onboarding is complete when nothing is currently/ past due.
  const requirementsStatus = account.requirements?.summary?.minimum_deadline?.status ?? null
  const onboardingComplete =
    requirementsStatus !== 'currently_due' && requirementsStatus !== 'past_due'

  return {
    accountId,
    displayName: account.display_name ?? null,
    readyToReceivePayments,
    onboardingComplete,
    requirementsStatus,
  }
}
