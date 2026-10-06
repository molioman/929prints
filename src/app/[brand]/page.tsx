import { notFound } from 'next/navigation'
import { getBrand } from '@/lib/brands'

// Placeholder home page until the storefront is built on Shopify's
// Storefront API.
export default async function BrandHome({ params }: { params: Promise<{ brand: string }> }) {
  const brand = getBrand((await params).brand)
  if (!brand) notFound()

  return (
    <main className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="text-4xl font-bold">{brand.name}</h1>
      <p className="mt-4 text-gray-600">Coming soon.</p>
    </main>
  )
}
