'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ClientForm from '@/components/forms/ClientForm'
import type { Client } from '@/lib/supabase/types'

// Demo data - would come from Supabase
const DEMO_CLIENT: Client = {
  id: '1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  business_name: 'Acme Remodeling',
  display_name: 'Acme',
  status: 'active',
  industry: 'remodeling',
  business_age_years: 5,
  primary_contact_name: 'John Smith',
  primary_contact_email: 'john@acme.com',
  primary_contact_phone: '555-0100',
  website_url: 'https://acme-remodeling.com',
  notes: 'Premium client, great communication.',
}

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // In real app, fetch from Supabase
  const client = DEMO_CLIENT

  const handleSubmit = async (data: Partial<Client>) => {
    setIsLoading(true)
    try {
      // TODO: Update in Supabase
      console.log('Updating client:', params.id, data)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      router.push(`/clients/${params.id}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/clients/${params.id}`}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Client</h1>
          <p className="text-sm text-gray-500">
            {client.display_name || client.business_name}
          </p>
        </div>
      </div>

      <ClientForm client={client} onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
