'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react'

interface IntegrationConfig {
  id: string
  name: string
  description: string
  icon: string
  connected: boolean
  externalId?: string
  lastSync?: string
  error?: string
}

const INTEGRATIONS: IntegrationConfig[] = [
  {
    id: 'metricool',
    name: 'Metricool',
    description: 'Social media analytics and scheduling',
    icon: 'M',
    connected: true,
    externalId: 'brand_123456',
    lastSync: '2024-12-15T10:30:00Z',
  },
  {
    id: 'google_analytics',
    name: 'Google Analytics (GA4)',
    description: 'Website traffic and user behavior',
    icon: 'GA',
    connected: true,
    externalId: 'properties/123456789',
    lastSync: '2024-12-15T06:00:00Z',
  },
  {
    id: 'search_console',
    name: 'Google Search Console',
    description: 'Search performance and rankings',
    icon: 'SC',
    connected: false,
  },
  {
    id: 'google_business',
    name: 'Google Business Profile',
    description: 'Local search and map visibility',
    icon: 'GB',
    connected: false,
    error: 'Authentication expired',
  },
]

export default function IntegrationsPage() {
  const params = useParams()
  const [integrations, setIntegrations] = useState(INTEGRATIONS)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)

  const handleConnect = async (integrationId: string) => {
    setConnecting(integrationId)
    try {
      // TODO: Initiate OAuth flow
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === integrationId
            ? {
                ...i,
                connected: true,
                externalId: 'new_connection',
                lastSync: new Date().toISOString(),
                error: undefined,
              }
            : i
        )
      )
    } finally {
      setConnecting(null)
    }
  }

  const handleDisconnect = async (integrationId: string) => {
    // TODO: Revoke OAuth tokens
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === integrationId
          ? { ...i, connected: false, externalId: undefined, lastSync: undefined }
          : i
      )
    )
  }

  const handleSync = async (integrationId: string) => {
    setSyncing(integrationId)
    try {
      // TODO: Trigger sync
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === integrationId
            ? { ...i, lastSync: new Date().toISOString(), error: undefined }
            : i
        )
      )
    } finally {
      setSyncing(null)
    }
  }

  const formatLastSync = (dateStr?: string) => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/clients/${params.id}`}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-sm text-gray-500">Connect external data sources</p>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="space-y-4">
        {integrations.map((integration) => (
          <div key={integration.id} className="card p-6">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600">
                {integration.icon}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{integration.name}</h3>
                  {integration.connected ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : integration.error ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : null}
                </div>
                <p className="text-sm text-gray-500 mt-1">{integration.description}</p>

                {integration.connected && (
                  <div className="mt-3 text-sm">
                    <p className="text-gray-500">
                      ID: <span className="font-mono text-gray-700">{integration.externalId}</span>
                    </p>
                    <p className="text-gray-500">
                      Last sync: {formatLastSync(integration.lastSync)}
                    </p>
                  </div>
                )}

                {integration.error && (
                  <p className="mt-2 text-sm text-red-600">{integration.error}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {integration.connected ? (
                  <>
                    <button
                      onClick={() => handleSync(integration.id)}
                      disabled={syncing === integration.id}
                      className="btn-secondary btn-sm"
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-1 ${
                          syncing === integration.id ? 'animate-spin' : ''
                        }`}
                      />
                      {syncing === integration.id ? 'Syncing...' : 'Sync'}
                    </button>
                    <button
                      onClick={() => handleDisconnect(integration.id)}
                      className="btn-secondary btn-sm text-red-600 hover:text-red-700"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleConnect(integration.id)}
                    disabled={connecting === integration.id}
                    className="btn-primary btn-sm"
                  >
                    {connecting === integration.id ? 'Connecting...' : 'Connect'}
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Help Text */}
      <div className="card p-6 bg-gray-50">
        <h3 className="font-semibold mb-2">Setting Up Integrations</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>
            <strong>Metricool:</strong> Enter the Brand ID from your Metricool dashboard.
          </li>
          <li>
            <strong>Google Analytics:</strong> Sign in with Google and select the GA4 property.
          </li>
          <li>
            <strong>Search Console:</strong> Sign in with Google and verify site ownership.
          </li>
          <li>
            <strong>Google Business:</strong> Connect to view local search performance.
          </li>
        </ul>
        <p className="text-sm text-gray-500 mt-4">
          Data syncs automatically every 24 hours. Use the Sync button to refresh manually.
        </p>
      </div>
    </div>
  )
}
