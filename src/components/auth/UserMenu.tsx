'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { LogOut, User, Settings, ChevronDown } from 'lucide-react'

interface AdminUser {
  email: string
  role: 'super_admin' | 'admin' | 'viewer'
}

export default function UserMenu() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser?.email) {
        const { data: admin } = await supabase
          .from('admins')
          .select('email, role')
          .eq('email', authUser.email)
          .single()

        if (admin) {
          setUser(admin as AdminUser)
        }
      }
    }
    getUser()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#1A1A1A] transition"
      >
        <div className="w-8 h-8 bg-[#F4C430] rounded-full flex items-center justify-center">
          <span className="text-black text-sm font-bold">
            {user.email.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-300 truncate max-w-[150px]">
            {user.email}
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {user.role.replace('_', ' ')}
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-[#1A1A1A] rounded-lg shadow-lg border border-[#262626] py-1 z-20">
            <div className="px-4 py-2 border-b border-[#262626]">
              <div className="text-sm font-medium text-white truncate">
                {user.email}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {user.role.replace('_', ' ')}
              </div>
            </div>

            {user.role === 'super_admin' && (
              <a
                href="/settings/admins"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#262626] hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <User className="w-4 h-4" />
                Manage Admins
              </a>
            )}

            <a
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#262626] hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4" />
              Settings
            </a>

            <hr className="my-1 border-[#262626]" />

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
