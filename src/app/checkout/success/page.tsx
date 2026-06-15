'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart()

  useEffect(() => {
    clearCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Thank you for your order!</h1>
      <p className="text-gray-600 mb-10">
        Your payment was successful. We&apos;ll start preparing your prints right away and send a confirmation email shortly.
      </p>
      <Link href="/products" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
        Continue Shopping
      </Link>
    </div>
  )
}
