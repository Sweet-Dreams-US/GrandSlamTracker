'use client'

import { useState, useEffect } from 'react'
import { Lock, LogOut } from 'lucide-react'
import MillerContent from '@/components/clients/MillerContent'

// ─── Password Gate ──────────────────────────────────────────────────────────
function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const correctUsername = 'miller'
  const correctPassword = 'LawnAndOrder2026'
  const storageKey = 'client-portal-miller-scaping'

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored === correctPassword) {
      setAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.toLowerCase() === correctUsername.toLowerCase() && password === correctPassword) {
      localStorage.setItem(storageKey, password)
      setAuthenticated(true)
      setError('')
    } else {
      setError('Incorrect username or password.')
      setPassword('')
    }
  }

  const handleLock = () => {
    localStorage.removeItem(storageKey)
    setAuthenticated(false)
    setUsername('')
    setPassword('')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900">
        <div className="w-full max-w-sm mx-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-miller-100 flex items-center justify-center">
              <Lock className="h-8 w-8 text-miller-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Miller Scaping Solutions</h1>
            <p className="text-sm text-gray-500 mb-6">Enter your portal credentials to continue</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError('') }}
                placeholder="Username"
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-miller-500 focus:border-miller-500"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="Password"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-miller-500 focus:border-miller-500"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                className="w-full bg-miller-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-miller-800 transition-colors"
              >
                Enter Portal
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={handleLock}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-miller-100 text-miller-700 hover:bg-miller-200 transition-colors"
      >
        <LogOut className="h-3.5 w-3.5" />
        Lock Portal
      </button>
      {children}
    </div>
  )
}

// ─── Page Export ────────────────────────────────────────────────────
export default function MillerClientPage() {
  return (
    <PasswordGate>
      <MillerContent />
    </PasswordGate>
  )
}
