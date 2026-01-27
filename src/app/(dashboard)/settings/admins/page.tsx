'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { UserPlus, Trash2, Shield, ShieldCheck, Eye } from 'lucide-react'

interface Admin {
  id: string
  email: string
  role: 'super_admin' | 'admin' | 'viewer'
  is_active: boolean
  last_login_at: string | null
  created_at: string
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'viewer'>('admin')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadAdmins()
    checkCurrentUser()
  }, [])

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('admins')
        .select('role')
        .eq('email', user.email)
        .single()
      setCurrentUserRole(data?.role || null)
    }
  }

  const loadAdmins = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('admins')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      setError('Failed to load admins')
    } else {
      setAdmins(data || [])
    }
    setLoading(false)
  }

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    setError(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('admins')
      .insert({
        email: newEmail.toLowerCase().trim(),
        role: newRole,
      })

    if (error) {
      if (error.code === '23505') {
        setError('This email is already an admin')
      } else {
        setError('Failed to add admin')
      }
    } else {
      setNewEmail('')
      loadAdmins()
    }
    setAdding(false)
  }

  const toggleActive = async (admin: Admin) => {
    if (admin.role === 'super_admin') return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('admins')
      .update({ is_active: !admin.is_active })
      .eq('id', admin.id)

    if (!error) {
      loadAdmins()
    }
  }

  const removeAdmin = async (admin: Admin) => {
    if (admin.role === 'super_admin') return
    if (!confirm(`Remove ${admin.email} as admin?`)) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('admins')
      .delete()
      .eq('id', admin.id)

    if (!error) {
      loadAdmins()
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <ShieldCheck className="w-4 h-4 text-yellow-600" />
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-600" />
      default:
        return <Eye className="w-4 h-4 text-gray-600" />
    }
  }

  if (currentUserRole !== 'super_admin') {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Only super admins can manage admin users.
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
        <p className="text-gray-500">Manage who can access the Grand Slam Tracker</p>
      </div>

      {/* Add Admin Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Invite New Admin</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={addAdmin} className="flex flex-col sm:flex-row gap-4">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@example.com"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as 'admin' | 'viewer')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="admin">Admin (Full Access)</option>
            <option value="viewer">Viewer (Read Only)</option>
          </select>
          <button
            type="submit"
            disabled={adding}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <UserPlus className="w-4 h-4" />
            {adding ? 'Adding...' : 'Add Admin'}
          </button>
        </form>
      </div>

      {/* Admin List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No admins found
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-medium">
                          {admin.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {admin.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(admin.role)}
                      <span className="text-sm text-gray-700 capitalize">
                        {admin.role.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(admin)}
                      disabled={admin.role === 'super_admin'}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        admin.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      } ${admin.role === 'super_admin' ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                    >
                      {admin.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {admin.last_login_at
                      ? new Date(admin.last_login_at).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {admin.role !== 'super_admin' && (
                      <button
                        onClick={() => removeAdmin(admin)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Remove admin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
