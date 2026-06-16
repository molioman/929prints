'use client'

import { useEffect, useState, useCallback } from 'react'

interface AccountRow {
  accountId: string
  displayName: string | null
  readyToReceivePayments: boolean
}

interface ProductRow {
  id: string
  name: string
  description: string | null
  priceId: string | null
  unitAmount: number | null
  currency: string
  connectedAccountId: string
}

export default function StorefrontPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [accRes, prodRes] = await Promise.all([
      fetch('/api/connect/accounts'),
      fetch('/api/connect/products'),
    ])
    const accData = await accRes.json()
    const prodData = await prodRes.json()
    if (accData.accounts) setAccounts(accData.accounts)
    if (prodData.products) setProducts(prodData.products)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Start a destination-charge checkout for one product.
  const handleBuy = async (p: ProductRow) => {
    setBuyingId(p.id)
    setError(null)
    try {
      const res = await fetch('/api/connect/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: p.priceId,
          unitAmount: p.unitAmount,
          connectedAccountId: p.connectedAccountId,
        }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else {
        setError(data.error ?? 'Checkout failed')
        setBuyingId(null)
      }
    } catch {
      setError('Checkout failed')
      setBuyingId(null)
    }
  }

  const account = (id: string) => accounts.find((a) => a.accountId === id)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Marketplace</h1>
      <p className="text-gray-600 mb-10">Every product from every connected seller.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Connected accounts (sellers) */}
      <h2 className="text-lg font-bold text-gray-900 mb-3">Sellers</h2>
      <div className="flex flex-wrap gap-3 mb-12">
        {accounts.length === 0 && <p className="text-gray-500 text-sm">No sellers yet.</p>}
        {accounts.map((a) => (
          <div key={a.accountId} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
            <p className="font-medium text-gray-900 text-sm">{a.displayName ?? a.accountId}</p>
            <p className={`text-xs ${a.readyToReceivePayments ? 'text-green-600' : 'text-amber-600'}`}>
              {a.readyToReceivePayments ? 'Accepting payments' : 'Not onboarded'}
            </p>
          </div>
        ))}
      </div>

      {/* Products */}
      <h2 className="text-lg font-bold text-gray-900 mb-3">Products</h2>
      {products.length === 0 ? (
        <p className="text-gray-500 text-sm">No products yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => {
            const seller = account(p.connectedAccountId)
            const canBuy = seller?.readyToReceivePayments && p.priceId
            return (
              <div key={p.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col">
                <div className="aspect-video bg-gray-100 flex items-center justify-center text-5xl">🖨️</div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-gray-900">{p.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">by {seller?.displayName ?? 'Unknown seller'}</p>
                  {p.description && <p className="text-sm text-gray-600 mb-4 line-clamp-2">{p.description}</p>}
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      {p.unitAmount != null ? `$${(p.unitAmount / 100).toFixed(2)}` : '—'}
                    </span>
                    <button
                      onClick={() => handleBuy(p)}
                      disabled={!canBuy || buyingId === p.id}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={canBuy ? '' : 'Seller has not finished onboarding'}
                    >
                      {buyingId === p.id ? 'Redirecting…' : canBuy ? 'Buy' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
