'use client'

import { useState, useEffect } from 'react'
import { Lock, LogOut } from 'lucide-react'

interface ClientPasswordGateProps {
  clientName: string
  correctUsername: string
  correctPassword: string
  children: React.ReactNode
}

export default function ClientPasswordGate({ clientName, correctUsername, correctPassword, children }: ClientPasswordGateProps) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="w-full max-w-sm">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-hover)] flex items-center justify-center">
              <Lock className="h-8 w-8 text-[var(--accent)]" />
            </div>
            <h1 className="text-xl font-bold text-white mb-1">{clientName}</h1>
            <p className="text-sm text-[var(--muted)] mb-6">Enter your portal credentials to continue</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError('') }}
                placeholder="Username"
                autoFocus
                className="w-full border border-[var(--border)] bg-[var(--bg)] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] placeholder:text-[var(--muted)]"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="Password"
                className="w-full border border-[var(--border)] bg-[var(--bg)] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] placeholder:text-[var(--muted)]"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                className="w-full bg-[var(--accent)] text-black rounded-lg px-4 py-2.5 text-sm font-bold hover:bg-[var(--accent-hover)] transition-colors"
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
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors border border-[var(--border)]"
      >
        <LogOut className="h-3.5 w-3.5" />
        Lock Portal
      </button>
      {children}
    </div>
  )
}
