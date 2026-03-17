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
  Music,
  Clock,
  Film,
  Lightbulb,
  Target,
} from 'lucide-react'
import UserMenu from '@/components/auth/UserMenu'
import sweetDreamsLogo from '@/assets/SweetDreamsUSlogowide.png'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Financials', href: '/financials', icon: DollarSign, children: [
    { name: 'Payouts', href: '/financials/payouts', icon: Banknote },
  ]},
  { name: 'Studio', href: '/studio', icon: Music, children: [
    { name: 'Sessions', href: '/studio/sessions', icon: Clock },
  ]},
  { name: 'Content', href: '/content', icon: Film, children: [
    { name: 'Ideas', href: '/content/ideas', icon: Lightbulb },
  ]},
  { name: 'Grand Slam', href: '/grand-slam', icon: Target },
  { name: 'Scenarios', href: '/scenarios', icon: Calculator },
  { name: 'Alerts', href: '/alerts', icon: Bell },
]

const testClients = [
  { name: 'Monster Remodeling', href: '/test-clients/monster' },
  { name: 'MC Racing', href: '/client/mcracing' },
  { name: "Bell's Skating Rink", href: '/client/bells' },
  { name: 'Miller Scaping', href: '/test-clients/miller' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[var(--border)]">
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
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'
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
                            ? 'text-[var(--accent)] bg-[var(--accent)]/10'
                            : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
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
        <div className="pt-4 mt-4 border-t border-[var(--border)]">
          <p className="px-3 mb-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
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
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'
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
      <div className="p-4 border-t border-[var(--border)]">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>

        {/* User Menu */}
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <UserMenu />
        </div>
      </div>
    </aside>
  )
}
