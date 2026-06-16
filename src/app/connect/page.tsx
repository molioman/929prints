import Link from 'next/link'

// Simple hub linking to the three Connect demo flows.
export default function ConnectHome() {
  const cards = [
    {
      href: '/connect/onboard',
      title: '1. Onboard Merchants',
      desc: 'Create a connected account and complete Stripe onboarding to collect payments.',
      emoji: '🧑‍💼',
    },
    {
      href: '/connect/products',
      title: '2. Create Products',
      desc: 'Add platform products and assign each one to a connected account.',
      emoji: '📦',
    },
    {
      href: '/connect/storefront',
      title: '3. Storefront',
      desc: 'Browse every product and buy — funds route to the seller via destination charges.',
      emoji: '🛍️',
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Stripe Connect Demo</h1>
      <p className="text-gray-600 mb-10">
        A marketplace where the platform sets pricing and collects an application fee.
        Follow the steps in order.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="block bg-white border border-gray-200 rounded-2xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all"
          >
            <div className="text-4xl mb-4">{c.emoji}</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{c.title}</h2>
            <p className="text-gray-600 text-sm">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
