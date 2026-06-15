'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Product } from '@/lib/types'
import { useCart } from '@/context/CartContext'

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const { addItem } = useCart()

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('products')
      .select('*, categories(*)')
      .eq('slug', slug)
      .single()
      .then(({ data }) => {
        setProduct(data)
        setLoading(false)
      })
  }, [slug])

  if (loading) return <div className="flex items-center justify-center min-h-[50vh] text-gray-500">Loading...</div>
  if (!product) return <div className="flex items-center justify-center min-h-[50vh] text-gray-500">Product not found.</div>

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4">
            {product.images?.[activeImage] ? (
              <img src={product.images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-8xl">🖨️</div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${i === activeImage ? 'border-indigo-600' : 'border-gray-200'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="mb-2 text-sm text-indigo-600 font-medium">{(product as any).categories?.name}</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
            {product.compare_at_price && (
              <span className="text-xl text-gray-400 line-through">${product.compare_at_price.toFixed(2)}</span>
            )}
          </div>
          {product.description && (
            <p className="text-gray-600 mb-8 leading-relaxed">{product.description}</p>
          )}

          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm font-medium text-gray-700">Quantity</label>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 text-gray-600 hover:text-gray-900">−</button>
              <span className="px-4 py-2 font-medium">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="px-3 py-2 text-gray-600 hover:text-gray-900">+</button>
            </div>
          </div>

          <button
            onClick={() => addItem(product, qty)}
            disabled={product.stock_quantity === 0}
            className="bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>

          <p className="text-sm text-gray-500 text-center">
            {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Currently unavailable'}
          </p>
        </div>
      </div>
    </div>
  )
}
