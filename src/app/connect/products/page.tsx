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
  unitAmount: number | null
  currency: string
  connectedAccountId: string
}

export default function CreateProductsPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [accountId, setAccountId] = useState('')
  const [saving, setSaving] = useState(false)
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      // Convert dollars (string) to integer cents for Stripe.
      const priceInCents = Math.round(parseFloat(price) * 100)
      const res = await fetch('/api/connect/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          priceInCents,
          currency: 'usd',
          connectedAccountId: accountId,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setName('')
        setDescription('')
        setPrice('')
        await load()
      }
    } catch {
      setError('Could not create product')
    } finally {
      setSaving(false)
    }
  }

  const accountName = (id: string) =>
    accounts.find((a) => a.accountId === id)?.displayName ?? id

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Products</h1>

      <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-2xl p-6 mb-10 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">New product</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sold by (connected account)</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Select an account…</option>
            {accounts.map((a) => (
              <option key={a.accountId} value={a.accountId}>
                {a.displayName ?? a.accountId} {a.readyToReceivePayments ? '✓' : '(not onboarded)'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Glossy Poster 18x24"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD)</label>
          <input
            type="number"
            step="0.01"
            min="0.50"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="24.99"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60"
        >
          {saving ? 'Creating…' : 'Create product'}
        </button>
      </form>

      <h2 className="text-lg font-bold text-gray-900 mb-4">Products</h2>
      <div className="space-y-3">
        {products.length === 0 && <p className="text-gray-500 text-sm">No products yet.</p>}
        {products.map((p) => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-900">{p.name}</p>
              <p className="text-xs text-gray-500">Sold by {accountName(p.connectedAccountId)}</p>
            </div>
            <p className="font-bold text-gray-900">
              {p.unitAmount != null ? `$${(p.unitAmount / 100).toFixed(2)}` : '—'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
