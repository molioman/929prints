'use client'

import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { TrashIcon } from '@heroicons/react/24/outline'

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCart()
  const shipping = subtotal > 0 ? 9.99 : 0
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">🛒</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
        <p className="text-gray-500 mb-8">Add some products to get started.</p>
        <Link href="/products" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
          Shop Now
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-10">Your Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4">
              <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">🖨️</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                <p className="text-indigo-600 font-bold">${product.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button onClick={() => updateQuantity(product.id, quantity - 1)} className="px-3 py-1 text-gray-600 hover:text-gray-900">−</button>
                <span className="px-3 py-1 font-medium">{quantity}</span>
                <button onClick={() => updateQuantity(product.id, quantity + 1)} className="px-3 py-1 text-gray-600 hover:text-gray-900">+</button>
              </div>
              <p className="font-bold text-gray-900 w-20 text-right">${(product.price * quantity).toFixed(2)}</p>
              <button onClick={() => removeItem(product.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 h-fit">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span><span>${shipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (8%)</span><span>${tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-gray-900 text-lg">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>
          <Link href="/checkout" className="block w-full bg-indigo-600 text-white text-center py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
            Proceed to Checkout
          </Link>
          <Link href="/products" className="block w-full text-center text-gray-500 text-sm mt-3 hover:text-indigo-600">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
