'use client'

import { useEffect, useState, useCallback } from 'react'

interface AccountRow {
  accountId: string
  displayName: string | null
  contactEmail?: string
  readyToReceivePayments: boolean
  onboardingComplete: boolean
  requirementsStatus: string | null
}

export default function OnboardPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [displayName, setDisplayName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load all merchants + their live status from the API.
  const loadAccounts = useCallback(async () => {
    const res = await fetch('/api/connect/accounts')
    const data = await res.json()
    if (data.accounts) setAccounts(data.accounts)
  }, [])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  // Create a new connected account.
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/connect/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, contactEmail }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setDisplayName('')
        setContactEmail('')
        await loadAccounts()
      }
    } catch {
      setError('Could not create account')
    } finally {
      setCreating(false)
    }
  }

  // Kick off Stripe-hosted onboarding for an account.
  const handleOnboard = async (accountId: string) => {
    const res = await fetch('/api/connect/account-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setError(data.error ?? 'Could not create onboarding link')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Onboard Merchants</h1>

      {/* Create account form */}
      <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-2xl p-6 mb-10 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">New connected account</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Acme Print Co."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact email</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="owner@acme.com"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={creating}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60"
        >
          {creating ? 'Creating…' : 'Create account'}
        </button>
      </form>

      {/* Accounts list with live status */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">Connected accounts</h2>
      <div className="space-y-4">
        {accounts.length === 0 && (
          <p className="text-gray-500 text-sm">No connected accounts yet.</p>
        )}
        {accounts.map((a) => (
          <div key={a.accountId} className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900">{a.displayName ?? 'Unnamed'}</p>
                <p className="text-xs text-gray-400 font-mono">{a.accountId}</p>
                <div className="flex gap-2 mt-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${a.onboardingComplete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {a.onboardingComplete ? 'Onboarding complete' : 'Onboarding incomplete'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${a.readyToReceivePayments ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {a.readyToReceivePayments ? 'Can receive payments' : 'Cannot receive yet'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleOnboard(a.accountId)}
                className="shrink-0 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                {a.onboardingComplete ? 'Update details' : 'Onboard to collect payments'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
