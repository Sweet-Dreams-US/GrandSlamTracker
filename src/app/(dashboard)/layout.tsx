import Sidebar from '@/components/layout/Sidebar'
import AdminPasswordGate from '@/components/auth/AdminPasswordGate'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminPasswordGate>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-[var(--bg)]">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </AdminPasswordGate>
  )
}
