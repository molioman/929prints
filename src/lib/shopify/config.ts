// Per-brand Shopify credentials come from env vars named after the brand
// slug, e.g. SHOPIFY_DACHSHUND_STORE_DOMAIN for the `dachshund` brand.
function envKey(slug: string): string {
  return slug.toUpperCase().replace(/[^A-Z0-9]/g, '_')
}

export interface ShopifyConfig {
  // e.g. my-store.myshopify.com
  storeDomain: string | undefined
  // The app's client secret; also signs webhooks.
  clientSecret: string | undefined
}

export function shopifyConfig(brandSlug: string): ShopifyConfig {
  const key = envKey(brandSlug)
  return {
    storeDomain: process.env[`SHOPIFY_${key}_STORE_DOMAIN`],
    clientSecret: process.env[`SHOPIFY_${key}_CLIENT_SECRET`],
  }
}
