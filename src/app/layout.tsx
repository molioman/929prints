import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import { CartProvider } from '@/context/CartContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '929 Prints — Custom Printing',
  description: 'High-quality custom prints for every occasion.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <footer className="bg-gray-900 text-gray-400 text-center py-8 mt-16">
            <p className="text-sm">© {new Date().getFullYear()} 929 Prints. All rights reserved.</p>
          </footer>
        </CartProvider>
      </body>
    </html>
  )
}
