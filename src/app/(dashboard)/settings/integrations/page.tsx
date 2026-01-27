'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  RefreshCw,
  Link2,
  Check,
  AlertCircle,
  ExternalLink,
  Unlink,
} from 'lucide-react'

interface MetricoolBrand {
  id: number
  name: string
  timezone: string
  networks: {
    id: string
    network: string
    name: string
    profileUrl: string
  }[]
}

interface Client {
  id: string
  business_name: string
  display_name: string | null
  status: string
  metricool_brand_id: number | null
  metricool_brand_name: string | null
}

export default function IntegrationsPage() {
  const [brands, setBrands] = useState<MetricoolBrand[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [linkingBrand, setLinkingBrand] = useState<number | null>(null)
  const [selectedClient, setSelectedClient] = useState<string>('')

  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch Metricool brands
      const brandsRes = await fetch('/api/metricool/brands')
      const brandsData = await brandsRes.json()

      if (!brandsData.success) {
        throw new Error(brandsData.error || 'Failed to fetch brands')
      }

      setBrands(brandsData.brands || [])

      // Fetch clients
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: clientsData, error: clientsError } = await (supabase as any)
        .from('clients')
        .select('id, business_name, display_name, status, metricool_brand_id, metricool_brand_name')
        .order('business_name')

      if (clientsError) throw clientsError
      setClients(clientsData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const linkBrandToClient = async (brandId: number, brandName: string, clientId: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('clients')
        .update({
          metricool_brand_id: brandId,
          metricool_brand_name: brandName,
        })
        .eq('id', clientId)

      if (error) throw error

      // Trigger initial sync
      await syncClient(clientId, brandId)

      setLinkingBrand(null)
      setSelectedClient('')
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link brand')
    }
  }

  const unlinkBrand = async (clientId: string) => {
    if (!confirm('Remove Metricool connection from this client?')) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('clients')
        .update({
          metricool_brand_id: null,
          metricool_brand_name: null,
        })
        .eq('id', clientId)

      if (error) throw error
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink brand')
    }
  }

  const syncClient = async (clientId: string, brandId: number) => {
    setSyncing(clientId)
    try {
      const res = await fetch('/api/metricool/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, brandId }),
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      alert(`Synced ${data.synced.platforms.length} platforms successfully!`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(null)
    }
  }

  const getLinkedClient = (brandId: number) => {
    return clients.find((c) => c.metricool_brand_id === brandId)
  }

  const getUnlinkedClients = () => {
    return clients.filter((c) => !c.metricool_brand_id)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'trial':
        return 'bg-blue-100 text-blue-800'
      case 'negotiation':
        return 'bg-yellow-100 text-yellow-800'
      case 'management':
        return 'bg-purple-100 text-purple-800'
      case 'paused':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-500">Connect and manage external data sources</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metricool Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Metricool</h2>
              <p className="text-sm text-gray-500">
                Social media analytics and scheduling
              </p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading brands...</div>
        ) : brands.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No brands found. Check your Metricool API token.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {brands.map((brand) => {
              const linkedClient = getLinkedClient(brand.id)
              const isLinking = linkingBrand === brand.id

              return (
                <div key={brand.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">
                          {brand.name}
                        </h3>
                        {linkedClient && (
                          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            <Check className="w-3 h-3" />
                            Linked
                          </span>
                        )}
                      </div>

                      {/* Networks/Platforms */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {brand.networks?.map((network) => (
                          <a
                            key={network.id}
                            href={network.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                          >
                            {network.network}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>

                      {/* Linked Client Info */}
                      {linkedClient && (
                        <div className="mt-3 flex items-center gap-3">
                          <span className="text-sm text-gray-500">
                            Linked to:
                          </span>
                          <span className="font-medium text-gray-900">
                            {linkedClient.display_name || linkedClient.business_name}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(linkedClient.status)}`}
                          >
                            {linkedClient.status}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {linkedClient ? (
                        <>
                          <button
                            onClick={() =>
                              syncClient(linkedClient.id, brand.id)
                            }
                            disabled={syncing === linkedClient.id}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                          >
                            <RefreshCw
                              className={`w-4 h-4 ${syncing === linkedClient.id ? 'animate-spin' : ''}`}
                            />
                            Sync Now
                          </button>
                          <button
                            onClick={() => unlinkBrand(linkedClient.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Unlink"
                          >
                            <Unlink className="w-4 h-4" />
                          </button>
                        </>
                      ) : isLinking ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select a client...</option>
                            {getUnlinkedClients().map((client) => (
                              <option key={client.id} value={client.id}>
                                {client.display_name || client.business_name} (
                                {client.status})
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() =>
                              selectedClient &&
                              linkBrandToClient(
                                brand.id,
                                brand.name,
                                selectedClient
                              )
                            }
                            disabled={!selectedClient}
                            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            Link
                          </button>
                          <button
                            onClick={() => {
                              setLinkingBrand(null)
                              setSelectedClient('')
                            }}
                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setLinkingBrand(brand.id)}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                          <Link2 className="w-4 h-4" />
                          Link to Client
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-3xl font-bold text-gray-900">{brands.length}</div>
          <div className="text-sm text-gray-500">Metricool Brands</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-3xl font-bold text-green-600">
            {clients.filter((c) => c.metricool_brand_id).length}
          </div>
          <div className="text-sm text-gray-500">Linked Clients</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-3xl font-bold text-gray-400">
            {clients.filter((c) => !c.metricool_brand_id).length}
          </div>
          <div className="text-sm text-gray-500">Unlinked Clients</div>
        </div>
      </div>
    </div>
  )
}
