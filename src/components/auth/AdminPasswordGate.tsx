'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { LogOut } from 'lucide-react'
import sweetDreamsLogo from '@/assets/SweetDreamsUSlogowide.png'
import MonsterScenario from '@/components/test-clients/MonsterScenario'

const BellsContent = dynamic(() => import('@/components/clients/BellsContent'), { ssr: false })
const MillerContent = dynamic(() => import('@/components/clients/MillerContent'), { ssr: false })
const MCRacingContent = dynamic(() => import('@/components/clients/MCRacingContent'), { ssr: false })

interface UserAccount {
  username: string
  password: string
  role: 'admin' | 'client'
  clientPortal?: string
}

const USERS: UserAccount[] = [
  { username: 'admin', password: 'NeverPonYourA7', role: 'admin' },
  { username: 'monster', password: 'RemodelingMonster', role: 'client', clientPortal: 'monster' },
  { username: 'bells', password: 'SkateOrDie100', role: 'client', clientPortal: 'bells' },
  { username: 'miller', password: 'LawnAndOrder2026', role: 'client', clientPortal: 'miller' },
  { username: 'mcracing', password: 'RacingDreams2025', role: 'client', clientPortal: 'mcracing' },
]

export default function AdminPasswordGate({ children }: { children: React.ReactNode }) {
  const [loggedInUser, setLoggedInUser] = useState<UserAccount | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const match = USERS.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    )
    if (match) {
      setLoggedInUser(match)
      setError('')
    } else {
      setError('Incorrect username or password.')
      setPassword('')
    }
  }

  const handleLogout = () => {
    setLoggedInUser(null)
    setUsername('')
    setPassword('')
    setError('')
  }

  // Not logged in — show unified login
  if (!loggedInUser) {
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
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError('') }}
                placeholder="Username"
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="Password"
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
          </div>
        </div>
      </div>
    )
  }

  // Logged in as a client — show their portal directly
  if (loggedInUser.role === 'client') {
    if (loggedInUser.clientPortal === 'monster') {
      return (
        <div className="relative">
          <button
            onClick={handleLogout}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-monster-100 text-monster-700 hover:bg-monster-200 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
          <MonsterScenario mode="client" />
        </div>
      )
    }
    if (loggedInUser.clientPortal === 'bells') {
      return (
        <div className="relative">
          <button
            onClick={handleLogout}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-bells-100 text-bells-700 hover:bg-bells-200 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
          <BellsContent />
        </div>
      )
    }
    if (loggedInUser.clientPortal === 'miller') {
      return (
        <div className="relative">
          <button
            onClick={handleLogout}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-miller-100 text-miller-700 hover:bg-miller-200 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
          <MillerContent />
        </div>
      )
    }
    if (loggedInUser.clientPortal === 'mcracing') {
      return (
        <div className="relative">
          <button
            onClick={handleLogout}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-mcracing-100 text-mcracing-700 hover:bg-mcracing-200 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
          <MCRacingContent />
        </div>
      )
    }
  }

  // Logged in as admin — show the admin dashboard
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
