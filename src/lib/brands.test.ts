import { afterEach, describe, expect, it } from 'vitest'
import { BRANDS, brandFromHost } from './brands'

describe('brandFromHost', () => {
  const dachshund = BRANDS.find((b) => b.slug === 'dachshund')!
  const originalHosts = [...dachshund.hosts]
  afterEach(() => {
    dachshund.hosts = [...originalHosts]
  })

  it('matches a configured host, ignoring port and case', () => {
    dachshund.hosts = ['shop.example.com']
    expect(brandFromHost('Shop.Example.com:443')?.slug).toBe('dachshund')
  })

  it('selects a brand by <slug>.localhost in development', () => {
    expect(brandFromHost('929prints.localhost:3000')?.slug).toBe('929prints')
  })

  it('falls back to the default brand for unknown hosts', () => {
    expect(brandFromHost('preview-abc.vercel.app', 'dachshund')?.slug).toBe('dachshund')
    expect(brandFromHost('preview-abc.vercel.app')).toBeUndefined()
    expect(brandFromHost(null, 'not-a-brand')).toBeUndefined()
  })
})
