import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getBrand } from '@/lib/brands'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>
}): Promise<Metadata> {
  const brand = getBrand((await params).brand)
  return { title: brand?.name }
}

export default async function BrandLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ brand: string }>
}) {
  if (!getBrand((await params).brand)) notFound()
  return children
}
