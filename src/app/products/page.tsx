import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/ProductCard'

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*, categories(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const { data: categories } = await supabase.from('categories').select('*')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">All Products</h1>

      {categories && categories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-8">
          <a href="/products" className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-medium">All</a>
          {categories.map(c => (
            <a key={c.id} href={`/categories/${c.slug}`} className="px-4 py-2 rounded-full border border-gray-300 text-gray-600 text-sm font-medium hover:border-indigo-400 hover:text-indigo-600 transition-colors">
              {c.name}
            </a>
          ))}
        </div>
      )}

      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">No products available yet.</div>
      )}
    </div>
  )
}
