// Fulfillment routing rules. Pure functions only (no I/O) so the rules that
// decide where an order is produced and what the storefront shows can be
// tested in isolation.
//
// Every product is set to one of three modes:
//   inhouse    - produced in-house only; always shown
//   outsourced - produced by an outside provider only; hidden whenever
//                outsourcing is switched off or its provider is disabled
//   both       - either; uses `preferredRoute` when possible, otherwise in-house

export type FulfillmentMode = 'inhouse' | 'outsourced' | 'both'
export type Route = 'inhouse' | 'outsourced'

export interface ProductFulfillment {
  mode: FulfillmentMode
  preferredRoute: Route
  // Required for `outsourced` and `both` (enforced by the database).
  provider: { id: string; enabled: boolean } | null
}

export interface FulfillmentSwitches {
  // The global outsourcing switch.
  outsourcingEnabled: boolean
}

export type RouteDecision =
  | { route: 'inhouse' }
  | { route: 'outsourced'; providerId: string }
  | { route: 'hold'; reason: string }

export const HOLD_NOT_CONFIGURED = 'Product has no fulfillment settings'
export const HOLD_OUTSOURCING_OFF = 'Outsourced-only product while outsourcing is off'

function canOutsource(product: ProductFulfillment, switches: FulfillmentSwitches): boolean {
  return switches.outsourcingEnabled && product.provider !== null && product.provider.enabled
}

// Whether the product should be listed on the storefront.
export function isVisible(product: ProductFulfillment, switches: FulfillmentSwitches): boolean {
  return product.mode !== 'outsourced' || canOutsource(product, switches)
}

// Where one line item of a paid order goes. Unknown products and
// outsourced-only products that cannot be outsourced right now (e.g. bought
// just before the switch flipped) are held for a human instead of guessed.
export function routeProduct(
  product: ProductFulfillment | undefined,
  switches: FulfillmentSwitches
): RouteDecision {
  if (!product) return { route: 'hold', reason: HOLD_NOT_CONFIGURED }

  const outsource = canOutsource(product, switches)
  switch (product.mode) {
    case 'inhouse':
      return { route: 'inhouse' }
    case 'outsourced':
      return outsource
        ? { route: 'outsourced', providerId: product.provider!.id }
        : { route: 'hold', reason: HOLD_OUTSOURCING_OFF }
    case 'both':
      return outsource && product.preferredRoute === 'outsourced'
        ? { route: 'outsourced', providerId: product.provider!.id }
        : { route: 'inhouse' }
  }
}

export interface OrderLineItem {
  shopifyLineItemId: string
  // Null for custom line items that are not tied to a product.
  shopifyProductId: string | null
  shopifyVariantId: string | null
  title: string
  sku: string | null
  quantity: number
}

export interface PlannedJob {
  route: RouteDecision['route']
  providerId: string | null
  holdReason: string | null
  items: OrderLineItem[]
}

// Splits an order into fulfillment jobs: one per in-house queue, outside
// provider, or hold reason.
export function planFulfillment(
  lineItems: OrderLineItem[],
  products: Map<string, ProductFulfillment>,
  switches: FulfillmentSwitches
): PlannedJob[] {
  const jobs = new Map<string, PlannedJob>()

  for (const item of lineItems) {
    const product = item.shopifyProductId ? products.get(item.shopifyProductId) : undefined
    const decision = routeProduct(product, switches)
    const providerId = decision.route === 'outsourced' ? decision.providerId : null
    const holdReason = decision.route === 'hold' ? decision.reason : null
    const key = `${decision.route}|${providerId ?? ''}|${holdReason ?? ''}`

    const job = jobs.get(key) ?? { route: decision.route, providerId, holdReason, items: [] }
    job.items.push(item)
    jobs.set(key, job)
  }

  return [...jobs.values()]
}
