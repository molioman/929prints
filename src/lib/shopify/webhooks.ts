import { createHmac, timingSafeEqual } from 'node:crypto'

// Shopify signs each webhook with the app's client secret: the
// X-Shopify-Hmac-Sha256 header is the base64 HMAC-SHA256 of the raw body.
export function verifyShopifyWebhook(
  rawBody: string,
  hmacHeader: string | null,
  secret: string
): boolean {
  if (!hmacHeader) return false
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest()
  const received = Buffer.from(hmacHeader, 'base64')
  return received.length === expected.length && timingSafeEqual(received, expected)
}
