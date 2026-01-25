'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ClientForm from '@/components/forms/ClientForm'
import type { Client } from '@/lib/supabase/types'

export default function NewClientPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: Partial<Client>) => {
    setIsLoading(true)
    try {
      // TODO: Save to Supabase
      console.log('Creating client:', data)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Redirect to clients list
      router.push('/clients')
    } catch (error) {
      console.error('Error creating client:', error)
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

      <ClientForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
