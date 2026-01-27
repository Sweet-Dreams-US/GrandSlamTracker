'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ClientForm from '@/components/forms/ClientForm'
import { getClientById, updateClient } from '@/lib/services'
import type { Client } from '@/lib/supabase/types'

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadClient = async () => {
      try {
        const data = await getClientById(params.id as string)
        if (data) {
          setClient(data)
        } else {
          setError('Client not found')
        }
      } catch (err) {
        console.error('Error loading client:', err)
        setError('Failed to load client')
      } finally {
        setIsFetching(false)
      }
    }

    loadClient()
  }, [params.id])

  const handleSubmit = async (data: Partial<Client>) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await updateClient(params.id as string, data)

      if (result.error) {
        setError(result.error)
        return
      }

      router.push(`/clients/${params.id}`)
    } catch (err) {
      console.error('Error updating client:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="p-8 text-center">
          <p className="text-gray-500 mb-4">{error || 'Client not found'}</p>
          <Link href="/clients" className="text-primary-600 hover:text-primary-700">
            Back to clients
          </Link>
        </div>
      </div>
    )
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

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <ClientForm client={client} onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
