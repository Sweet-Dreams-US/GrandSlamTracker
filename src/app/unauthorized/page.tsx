'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function UnauthorizedPage() {
  const supabase = createSupabaseBrowserClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-red-900 to-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-6">
            Your account is not authorized to access the Partnership Tracker.
            Contact an administrator if you believe this is an error.
          </p>

          <div className="space-y-3">
            <a
              href="mailto:cole@sweetdreamsmusic.com"
              className="block w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              Contact Administrator
            </a>
            <button
              onClick={handleSignOut}
              className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
