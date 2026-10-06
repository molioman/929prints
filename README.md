# 929 Prints

One codebase for several storefront brands, each backed by its own Shopify
store. Orders are produced in-house or by outside providers, controlled by an
outsourcing switch.

- **Shopify**: one store per brand. Catalog, checkout, payments, tax, customer emails.
- **Vercel**: this Next.js app. Serves every brand, choosing the brand by domain.
- **Supabase**: fulfillment routing settings, the in-house production queue,
  and (later) bulk/custom quotes.

## Brands

Brands are listed in `src/lib/brands.ts` and seeded in the `brands` table.

| Slug | Brand | Purpose |
|---|---|---|
| `dachshund` | name TBD | Retail merch for dachshunds and their owners |
| `929prints` | 929 Prints | Bulk/custom orders and design services |

`src/proxy.ts` rewrites each request to `/<slug>/...` based on the host. To add a
brand: add it to `BRANDS`, insert it into `brands`, set its `SHOPIFY_<SLUG>_*`
env vars, and point its domain at the Vercel project.

## Fulfillment routing

Each Shopify product gets a row in `product_fulfillment` with one of three modes:

| Mode | Outsourcing on | Outsourcing off |
|---|---|---|
| `inhouse` | shown, made in-house | shown, made in-house |
| `outsourced` | shown, sent to its provider | **hidden**; orders that slip through are held |
| `both` | shown, uses `preferred_route` | shown, made in-house |

The global switch is `fulfillment_settings.outsourcing_enabled`. Each provider
(`fulfillment_providers`) can also be disabled on its own. Ordered products with
no `product_fulfillment` row are held instead of guessed.

Paid orders arrive at `POST /api/webhooks/shopify/<slug>` (Shopify topic
`orders/paid`). The webhook is verified, split into `fulfillment_jobs` (one per
in-house queue, provider, or hold reason) and saved in one transaction. A
redelivered order is ignored. The rules are in `src/lib/fulfillment/routing.ts`.

## Development

```bash
cp .env.example .env.local   # fill in Supabase + Shopify values
npm install
npm run dev                  # http://localhost:3000 serves DEFAULT_BRAND
                             # http://929prints.localhost:3000 serves 929prints
npm test
npm run typecheck
npm run lint
```

Apply database migrations with the Supabase CLI: `supabase db push`.

## Not built yet

- Storefront pages (Shopify Storefront API) and hiding products in Shopify when
  the switch changes
- Submitting outsourced jobs to Printful and sending tracking back to Shopify
- Admin pages: the switch, product modes, production queue
- Bulk/custom quote requests on the 929 Prints site
