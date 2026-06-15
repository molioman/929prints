'use client'

import Link from 'next/link'
import { Product } from '@/lib/types'
import { useCart } from '@/context/CartContext'

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const image = product.images?.[0]

  return (
    <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/products/${product.slug}`}>
        <div className="aspect-square bg-gray-100 overflow-hidden">
          {image ? (
            <img src={image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">🖨️</div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-2 mb-1">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
          {product.compare_at_price && (
            <span className="text-sm text-gray-400 line-through">${product.compare_at_price.toFixed(2)}</span>
          )}
        </div>
        <button
          onClick={() => addItem(product)}
          disabled={product.stock_quantity === 0}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
