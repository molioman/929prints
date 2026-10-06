import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyShopifyWebhook } from './webhooks'

const secret = 'test-secret'
const body = '{"id":1,"name":"#1001"}'
const sign = (b: string, s = secret) => createHmac('sha256', s).update(b, 'utf8').digest('base64')

describe('verifyShopifyWebhook', () => {
  it('accepts a correctly signed body', () => {
    expect(verifyShopifyWebhook(body, sign(body), secret)).toBe(true)
  })

  it('rejects a tampered body, wrong secret, or missing/garbage header', () => {
    expect(verifyShopifyWebhook(body + ' ', sign(body), secret)).toBe(false)
    expect(verifyShopifyWebhook(body, sign(body, 'other'), secret)).toBe(false)
    expect(verifyShopifyWebhook(body, null, secret)).toBe(false)
    expect(verifyShopifyWebhook(body, 'not-base64!!', secret)).toBe(false)
  })
})
