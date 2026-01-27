export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {children}
      </div>
    </main>
  )
}
