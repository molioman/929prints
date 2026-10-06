import type { SupabaseClient } from '@supabase/supabase-js'
import type { FulfillmentMode, FulfillmentSwitches, ProductFulfillment, Route } from './routing'

interface ProductFulfillmentRow {
  shopify_product_id: string
  mode: FulfillmentMode
  preferred_route: Route
  provider: { id: string; enabled: boolean } | null
}

// Loads the switches and the fulfillment settings of the given products.
// Products without a row are simply absent from the map.
export async function loadFulfillmentConfig(
  supabase: SupabaseClient,
  brandSlug: string,
  shopifyProductIds: string[]
): Promise<{ switches: FulfillmentSwitches; products: Map<string, ProductFulfillment> }> {
  const [settings, rows] = await Promise.all([
    supabase.from('fulfillment_settings').select('outsourcing_enabled').single(),
    supabase
      .from('product_fulfillment')
      .select('shopify_product_id, mode, preferred_route, provider:fulfillment_providers(id, enabled)')
      .eq('brand_slug', brandSlug)
      .in('shopify_product_id', shopifyProductIds)
      .overrideTypes<ProductFulfillmentRow[], { merge: false }>(),
  ])

  if (settings.error) throw settings.error
  if (rows.error) throw rows.error

  const products = new Map<string, ProductFulfillment>()
  for (const row of rows.data) {
    products.set(row.shopify_product_id, {
      mode: row.mode,
      preferredRoute: row.preferred_route,
      provider: row.provider,
    })
  }

  return { switches: { outsourcingEnabled: settings.data.outsourcing_enabled }, products }
}
