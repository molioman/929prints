'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'

export default function CheckoutPage() {
  const { items, subtotal } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shipping = subtotal > 0 ? 9.99 : 0
  const total = subtotal + shipping

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Something went wrong')
        setLoading(false)
      }
    } catch {
      setError('Could not reach payment service')
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Nothing to check out</h1>
        <Link href="/products" className="text-indigo-600 font-medium hover:underline">Browse products →</Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
        <div className="space-y-3 mb-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex justify-between text-gray-700">
              <span>{product.name} × {quantity}</span>
              <span>${(product.price * quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 pt-4 space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Shipping</span><span>${shipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-lg pt-2">
            <span>Total</span><span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
      >
        {loading ? 'Redirecting to payment…' : 'Pay with Stripe'}
      </button>

      <p className="text-center text-sm text-gray-400 mt-4">
        Secure payment powered by Stripe. Test mode — use card 4242 4242 4242 4242.
      </p>
    </div>
  )
}
