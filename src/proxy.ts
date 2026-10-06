import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { brandFromHost } from '@/lib/brands'

// Serves each brand from its own domain: `/products` on a brand's host is
// rewritten to `/<brand-slug>/products`.
export function proxy(request: NextRequest) {
  const brand = brandFromHost(request.headers.get('host'), process.env.DEFAULT_BRAND)
  if (!brand) {
    return new NextResponse('Store not found', { status: 404 })
  }

  const url = request.nextUrl.clone()
  url.pathname = `/${brand.slug}${url.pathname === '/' ? '' : url.pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  // Skip API routes, Next.js internals and files with an extension.
  matcher: ['/((?!api/|_next/|.*\\..*).*)'],
}
