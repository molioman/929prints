import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/ProductCard'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: featuredProducts } = await supabase
    .from('products')
    .select('*, categories(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(8)

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .limit(6)

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Print Your Vision
          </h1>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            High-quality custom prints for businesses, events, and personal projects.
            Fast turnaround, competitive pricing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products" className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-colors">
              Shop Now
            </Link>
            <Link href="/contact" className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-colors">
              Get a Quote
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(cat => (
              <Link key={cat.id} href={`/categories/${cat.slug}`}
                className="group bg-gray-50 border border-gray-200 rounded-xl p-4 text-center hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                {cat.image_url && (
                  <img src={cat.image_url} alt={cat.name} className="w-12 h-12 mx-auto mb-2 object-cover rounded" />
                )}
                <p className="font-medium text-gray-800 group-hover:text-indigo-600 text-sm">{cat.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
          <Link href="/products" className="text-indigo-600 font-medium hover:underline">View all →</Link>
        </div>

        {featuredProducts && featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">No products yet. Add your first product!</p>
            <Link href="/admin/products/new" className="mt-4 inline-block text-indigo-600 font-medium hover:underline">
              Add Product →
            </Link>
          </div>
        )}
      </section>

      {/* Value Props */}
      <section className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: '🚀', title: 'Fast Turnaround', desc: 'Most orders ready within 24–48 hours.' },
              { icon: '🎨', title: 'Premium Quality', desc: 'Vibrant colors, sharp details, lasting materials.' },
              { icon: '💬', title: 'Expert Support', desc: 'Our team helps you get the perfect print.' },
            ].map(v => (
              <div key={v.title} className="p-6">
                <div className="text-4xl mb-4">{v.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-gray-600">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
