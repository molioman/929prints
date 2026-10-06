import { NextRequest, NextResponse } from 'next/server'
import { getBrand } from '@/lib/brands'
import { loadFulfillmentConfig } from '@/lib/fulfillment/config'
import { planFulfillment, type OrderLineItem } from '@/lib/fulfillment/routing'
import { shopifyConfig } from '@/lib/shopify/config'
import { verifyShopifyWebhook } from '@/lib/shopify/webhooks'
import { createAdminClient } from '@/lib/supabase/admin'

// The fields of Shopify's `orders/paid` webhook payload that we use.
interface ShopifyOrderWebhook {
  id: number
  name: string
  line_items: {
    id: number
    product_id: number | null
    variant_id: number | null
    title: string
    sku: string | null
    quantity: number
  }[]
}

// POST /api/webhooks/shopify/:brand
// Each brand's Shopify store sends `orders/paid` here. The order is split
// into fulfillment jobs (in-house queue, outside provider, or on hold) and
// saved. Shopify retries deliveries, so saving is idempotent per order.
export async function POST(req: NextRequest, { params }: { params: Promise<{ brand: string }> }) {
  const { brand: slug } = await params
  if (!getBrand(slug)) {
    return NextResponse.json({ error: 'Unknown brand' }, { status: 404 })
  }

  const { storeDomain, clientSecret } = shopifyConfig(slug)
  if (!clientSecret) {
    console.error(`Shopify client secret is not configured for brand "${slug}"`)
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const rawBody = await req.text()
  if (!verifyShopifyWebhook(rawBody, req.headers.get('x-shopify-hmac-sha256'), clientSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  if (storeDomain && req.headers.get('x-shopify-shop-domain') !== storeDomain) {
    return NextResponse.json({ error: 'Unexpected shop' }, { status: 401 })
  }

  if (req.headers.get('x-shopify-topic') !== 'orders/paid') {
    return NextResponse.json({ ignored: true })
  }

  const order = JSON.parse(rawBody) as ShopifyOrderWebhook
  const lineItems: OrderLineItem[] = order.line_items.map((li) => ({
    shopifyLineItemId: String(li.id),
    shopifyProductId: li.product_id === null ? null : String(li.product_id),
    shopifyVariantId: li.variant_id === null ? null : String(li.variant_id),
    title: li.title,
    sku: li.sku,
    quantity: li.quantity,
  }))

  const supabase = createAdminClient()
  const productIds = [
    ...new Set(lineItems.flatMap((li) => (li.shopifyProductId ? [li.shopifyProductId] : []))),
  ]
  const { switches, products } = await loadFulfillmentConfig(supabase, slug, productIds)
  const jobs = planFulfillment(lineItems, products, switches)

  // Order and jobs are written in one transaction; a repeated delivery of
  // the same order is a no-op.
  const { error } = await supabase.rpc('ingest_shopify_order', {
    p_brand_slug: slug,
    p_shopify_order_id: String(order.id),
    p_shopify_order_name: order.name,
    p_payload: order,
    p_jobs: jobs.map((j) => ({
      route: j.route,
      provider_id: j.providerId,
      hold_reason: j.holdReason,
      items: j.items,
    })),
  })
  if (error) {
    console.error('Failed to save Shopify order:', error)
    // A 5xx makes Shopify retry the delivery later.
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
