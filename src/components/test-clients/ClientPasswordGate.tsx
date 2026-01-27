'use client'

import { useState, useEffect } from 'react'
import { Lock, LogOut } from 'lucide-react'

interface ClientPasswordGateProps {
  clientName: string
  correctPassword: string
  children: React.ReactNode
}

export default function ClientPasswordGate({ clientName, correctPassword, children }: ClientPasswordGateProps) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const storageKey = `client-portal-${clientName.toLowerCase().replace(/\s+/g, '-')}`

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored === correctPassword) {
      setAuthenticated(true)
    }
    setLoading(false)
  }, [storageKey, correctPassword])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === correctPassword) {
      localStorage.setItem(storageKey, password)
      setAuthenticated(true)
      setError('')
    } else {
      setError('Incorrect password. Please try again.')
      setPassword('')
    }
  }

  const handleLock = () => {
    localStorage.removeItem(storageKey)
    setAuthenticated(false)
    setPassword('')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-monster-100 flex items-center justify-center">
              <Lock className="h-8 w-8 text-monster-600" />
            </div>
            <h1 className="text-xl font-bold text-monster-900 mb-1">{clientName}</h1>
            <p className="text-sm text-gray-500 mb-6">Enter your portal password to continue</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="Password"
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-monster-500 focus:border-monster-500"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                className="w-full bg-monster-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-monster-800 transition-colors"
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
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-monster-100 text-monster-700 hover:bg-monster-200 transition-colors"
      >
        <LogOut className="h-3.5 w-3.5" />
        Lock Portal
      </button>
      {children}
    </div>
  )
}
