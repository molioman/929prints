import Link from 'next/link'

// Shown after a successful destination-charge checkout.
export default function ConnectSuccessPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="text-6xl mb-6">✅</div>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Payment complete!</h1>
      <p className="text-gray-600 mb-10">
        The seller received their funds and the platform kept its application fee.
      </p>
      <Link
        href="/connect/storefront"
        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
      >
        Back to Marketplace
      </Link>
    </div>
  )
}
