'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ClientForm from '@/components/forms/ClientForm'
import { createClient } from '@/lib/services'
import type { Client } from '@/lib/supabase/types'

export default function NewClientPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: Partial<Client>) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await createClient(data)

      if (result.error) {
        setError(result.error)
        return
      }

      // Redirect to the new client's page or clients list
      if (result.client) {
        router.push(`/clients/${result.client.id}`)
      } else {
        router.push('/clients')
      }
    } catch (err) {
      console.error('Error creating client:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="page-header mb-8">
        <h1 className="page-title">Add New Client</h1>
        <p className="page-description">
          Enter the client's business information to get started
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <ClientForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
