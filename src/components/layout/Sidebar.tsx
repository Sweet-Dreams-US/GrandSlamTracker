'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Calculator,
  Bell,
  Settings,
  FlaskConical,
  Banknote,
} from 'lucide-react'
import UserMenu from '@/components/auth/UserMenu'
import sweetDreamsLogo from '@/assets/SweetDreamsUSlogowide.png'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Financials', href: '/financials', icon: DollarSign, children: [
    { name: 'Payouts', href: '/financials/payouts', icon: Banknote },
  ]},
  { name: 'Scenarios', href: '/scenarios', icon: Calculator },
  { name: 'Alerts', href: '/alerts', icon: Bell },
]

const testClients = [
  { name: 'Monster Remodeling', href: '/test-clients/monster' },
  { name: 'MC Racing', href: '/test-clients/mc-racing' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href="/" className="flex items-center">
          <Image src={sweetDreamsLogo} alt="Sweet Dreams" height={36} className="w-auto" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <div key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
              {isActive && item.children && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.children.map((child) => {
                    const childActive = pathname === child.href
                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          childActive
                            ? 'text-blue-700 bg-blue-50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <child.icon className="h-3.5 w-3.5" />
                        {child.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Test Clients Divider */}
        <div className="pt-4 mt-4 border-t border-gray-200">
          <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Test Clients
          </p>
          {testClients.map((item) => {
            const isActive = pathname === item.href

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FlaskConical className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>

        {/* User Menu */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <UserMenu />
        </div>
      </div>
    </aside>
  )
}
