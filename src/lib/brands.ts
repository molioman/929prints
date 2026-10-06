// Registry of storefront brands served by this one deployment.
//
// Each brand is its own Shopify store (own checkout, emails and payouts) and
// gets its own domain(s). The proxy picks the brand from the request host.
// The `slug` is a permanent internal id: it is also the primary key of the
// `brands` table in Supabase and part of each brand's env var names, so pick
// it once and never rename it, even if the brand's public name changes.

export type BrandKind = 'retail' | 'custom'

export interface Brand {
  slug: string
  name: string
  // retail: ready-made products. custom: bulk/custom orders and design services.
  kind: BrandKind
  // Production hostnames, lowercase, without port.
  hosts: string[]
}

export const BRANDS: Brand[] = [
  {
    slug: 'dachshund',
    name: 'Dachshund brand (name TBD)',
    kind: 'retail',
    hosts: [],
  },
  {
    slug: '929prints',
    name: '929 Prints',
    kind: 'custom',
    hosts: [],
  },
]

export function getBrand(slug: string): Brand | undefined {
  return BRANDS.find((b) => b.slug === slug)
}

// Resolves the brand for a request host. In development, `<slug>.localhost`
// selects a brand; any other unknown host falls back to `fallbackSlug`
// (DEFAULT_BRAND), which also covers Vercel preview URLs.
export function brandFromHost(host: string | null, fallbackSlug?: string): Brand | undefined {
  const hostname = (host ?? '').split(':')[0].toLowerCase()

  const byHost = BRANDS.find((b) => b.hosts.includes(hostname))
  if (byHost) return byHost

  if (hostname.endsWith('.localhost')) {
    const bySubdomain = getBrand(hostname.slice(0, -'.localhost'.length))
    if (bySubdomain) return bySubdomain
  }

  return fallbackSlug ? getBrand(fallbackSlug) : undefined
}
