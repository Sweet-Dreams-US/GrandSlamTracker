'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { LogOut } from 'lucide-react'
import sweetDreamsLogo from '@/assets/SweetDreamsUSlogowide.png'
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
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="max-w-sm w-full mx-4">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-8 text-center">
            <div className="mb-4">
              <Image src={sweetDreamsLogo} alt="Sweet Dreams" height={48} className="w-auto mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Grand Slam Tracker</h1>
            <p className="text-sm text-gray-500 mb-6">Sweet Dreams US</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError('') }}
                placeholder="Username"
                autoFocus
                className="w-full border border-[#262626] bg-[#0A0A0A] text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] placeholder:text-gray-500 caret-white"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="Password"
                className="w-full border border-[#262626] bg-[#0A0A0A] text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-[#F4C430] placeholder:text-gray-500 caret-white"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                className="w-full bg-[#F4C430] text-black rounded-lg px-4 py-3 text-sm font-bold hover:bg-[#E5B72B] transition-colors"
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
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-[#1A1A1A] text-gray-400 hover:bg-[#262626] hover:text-white transition-colors border border-[#262626]"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign Out
      </button>
      {children}
    </>
  )
}
