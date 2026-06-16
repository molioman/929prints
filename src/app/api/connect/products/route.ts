import { NextRequest, NextResponse } from 'next/server'
import { stripeClient } from '@/lib/stripe'

// ===========================================================================
// POST /api/connect/products
// Create a product at the PLATFORM level (not on the connected account).
//
// Because the product lives on the platform, we must remember which connected
// account should receive the funds when it sells. We store that link in the
// product's `metadata.connected_account_id` (no extra DB table needed).
// ===========================================================================
export async function POST(req: NextRequest) {
  try {
    const { name, description, priceInCents, currency, connectedAccountId } = await req.json()

    if (!name || !priceInCents || !connectedAccountId) {
      return NextResponse.json(
        { error: 'name, priceInCents and connectedAccountId are required' },
        { status: 400 }
      )
    }

    const product = await stripeClient.products.create({
      name,
      description: description || undefined,
      // Creating an inline default price keeps the demo simple.
      default_price_data: {
        unit_amount: priceInCents,
        currency: currency || 'usd',
      },
      // The mapping product -> connected account. The storefront reads this
      // to know where to route the destination charge.
      metadata: {
        connected_account_id: connectedAccountId,
      },
    })

    return NextResponse.json({ productId: product.id })
  } catch (err) {
    console.error('Create product error:', err)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

// ===========================================================================
// GET /api/connect/products
// List every platform product, expanding the default price so the storefront
// can show an amount. Only products tagged with a connected account are
// relevant to the marketplace.
// ===========================================================================
export async function GET() {
  try {
    const products = await stripeClient.products.list({
      active: true,
      limit: 100,
      expand: ['data.default_price'],
    })

    const items = products.data
      .filter((p) => p.metadata?.connected_account_id)
      .map((p) => {
        const price = p.default_price as { id: string; unit_amount: number | null; currency: string } | null
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          image: p.images?.[0] ?? null,
          priceId: price?.id ?? null,
          unitAmount: price?.unit_amount ?? null,
          currency: price?.currency ?? 'usd',
          connectedAccountId: p.metadata.connected_account_id,
        }
      })

    return NextResponse.json({ products: items })
  } catch (err) {
    console.error('List products error:', err)
    return NextResponse.json({ error: 'Failed to list products' }, { status: 500 })
  }
}
