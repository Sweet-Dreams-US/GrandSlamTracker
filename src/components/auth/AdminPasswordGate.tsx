'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Lock, LogOut } from 'lucide-react'
import sweetDreamsLogo from '@/assets/SweetDreamsUSlogowide.png'

const ADMIN_PASSWORD = 'NeverPonYourA7'
const STORAGE_KEY = 'gs-admin-auth'

export default function AdminPasswordGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === ADMIN_PASSWORD) {
      setAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, password)
      setAuthenticated(true)
      setError('')
    } else {
      setError('Incorrect password.')
      setPassword('')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAuthenticated(false)
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="max-w-sm w-full mx-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="mb-4">
              <Image src={sweetDreamsLogo} alt="Sweet Dreams" height={48} className="w-auto mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Partnership Tracker</h1>
            <p className="text-sm text-gray-500 mb-6">Sweet Dreams Media</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="Password"
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            </form>
            <p className="mt-6 text-xs text-gray-400">Access restricted to authorized admins only</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={handleLogout}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors shadow-sm"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign Out
      </button>
      {children}
    </>
  )
}
