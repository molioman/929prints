'use client'

import Link from 'next/link'
import { ShoppingCartIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'

const navLinks = [
  { href: '/products', label: 'Shop' },
  { href: '/categories', label: 'Categories' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const { totalItems } = useCart()
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-gray-900 tracking-tight">
            929<span className="text-indigo-600">Prints</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/cart" className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors">
              <ShoppingCartIcon className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>
            <Link href="/auth/login" className="hidden md:block bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              Sign In
            </Link>
            <button className="md:hidden p-2 text-gray-600" onClick={() => setOpen(!open)}>
              {open ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} className="block text-gray-700 font-medium hover:text-indigo-600" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link href="/auth/login" className="block w-full text-center bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
            Sign In
          </Link>
        </div>
      )}
    </nav>
  )
}
