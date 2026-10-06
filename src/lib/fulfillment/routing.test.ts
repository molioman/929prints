import { describe, expect, it } from 'vitest'
import {
  HOLD_NOT_CONFIGURED,
  HOLD_OUTSOURCING_OFF,
  isVisible,
  planFulfillment,
  routeProduct,
  type OrderLineItem,
  type ProductFulfillment,
} from './routing'

const ON = { outsourcingEnabled: true }
const OFF = { outsourcingEnabled: false }
const printful = { id: 'printful', enabled: true }

const inhouse: ProductFulfillment = { mode: 'inhouse', preferredRoute: 'inhouse', provider: null }
const outsourced: ProductFulfillment = { mode: 'outsourced', preferredRoute: 'inhouse', provider: printful }
const bothPreferOut: ProductFulfillment = { mode: 'both', preferredRoute: 'outsourced', provider: printful }
const bothPreferIn: ProductFulfillment = { mode: 'both', preferredRoute: 'inhouse', provider: printful }

describe('isVisible', () => {
  it('always shows in-house and both products', () => {
    for (const p of [inhouse, bothPreferOut, bothPreferIn]) {
      expect(isVisible(p, ON)).toBe(true)
      expect(isVisible(p, OFF)).toBe(true)
    }
  })

  it('hides outsourced-only products when outsourcing is off', () => {
    expect(isVisible(outsourced, ON)).toBe(true)
    expect(isVisible(outsourced, OFF)).toBe(false)
  })

  it('hides outsourced-only products when their provider is disabled', () => {
    const disabled = { ...outsourced, provider: { id: 'printful', enabled: false } }
    expect(isVisible(disabled, ON)).toBe(false)
  })
})

describe('routeProduct', () => {
  it('holds products without settings', () => {
    expect(routeProduct(undefined, ON)).toEqual({ route: 'hold', reason: HOLD_NOT_CONFIGURED })
  })

  it('sends in-house products in-house regardless of the switch', () => {
    expect(routeProduct(inhouse, ON)).toEqual({ route: 'inhouse' })
    expect(routeProduct(inhouse, OFF)).toEqual({ route: 'inhouse' })
  })

  it('sends outsourced products to their provider, or holds them when off', () => {
    expect(routeProduct(outsourced, ON)).toEqual({ route: 'outsourced', providerId: 'printful' })
    expect(routeProduct(outsourced, OFF)).toEqual({ route: 'hold', reason: HOLD_OUTSOURCING_OFF })
  })

  it('follows the preferred route for both, falling back to in-house', () => {
    expect(routeProduct(bothPreferOut, ON)).toEqual({ route: 'outsourced', providerId: 'printful' })
    expect(routeProduct(bothPreferOut, OFF)).toEqual({ route: 'inhouse' })
    expect(routeProduct(bothPreferIn, ON)).toEqual({ route: 'inhouse' })
    const providerDisabled = { ...bothPreferOut, provider: { id: 'printful', enabled: false } }
    expect(routeProduct(providerDisabled, ON)).toEqual({ route: 'inhouse' })
  })
})

describe('planFulfillment', () => {
  const item = (id: string, productId: string | null): OrderLineItem => ({
    shopifyLineItemId: id,
    shopifyProductId: productId,
    shopifyVariantId: null,
    title: `Item ${id}`,
    sku: null,
    quantity: 1,
  })

  const products = new Map([
    ['p-in', inhouse],
    ['p-out', outsourced],
    ['p-both', bothPreferOut],
  ])

  it('groups line items into one job per destination', () => {
    const jobs = planFulfillment(
      [item('1', 'p-in'), item('2', 'p-out'), item('3', 'p-both'), item('4', 'p-in')],
      products,
      ON
    )
    expect(jobs.map((j) => [j.route, j.providerId, j.items.map((i) => i.shopifyLineItemId)])).toEqual([
      ['inhouse', null, ['1', '4']],
      ['outsourced', 'printful', ['2', '3']],
    ])
  })

  it('holds unknown and custom items, separated by reason', () => {
    const jobs = planFulfillment(
      [item('1', 'p-out'), item('2', null), item('3', 'p-unknown'), item('4', 'p-both')],
      products,
      OFF
    )
    expect(jobs.map((j) => [j.route, j.holdReason, j.items.map((i) => i.shopifyLineItemId)])).toEqual([
      ['hold', HOLD_OUTSOURCING_OFF, ['1']],
      ['hold', HOLD_NOT_CONFIGURED, ['2', '3']],
      ['inhouse', null, ['4']],
    ])
  })
})
