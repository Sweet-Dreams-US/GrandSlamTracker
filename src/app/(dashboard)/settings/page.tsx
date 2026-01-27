'use client'

import { useState } from 'react'
import { Save, Key, Database, Bell, Palette, Link2, Users } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    companyName: 'Sweet Dreams Media',
    defaultGrowthFactor: 10,
    defaultMaturityBuffer: 5,
    businessSplit: 30,
    defaultSalesSplit: 35,
    defaultWorkerSplit: 35,
    emailNotifications: true,
    slackNotifications: false,
  })

  const handleSave = () => {
    // TODO: Save settings
    console.log('Saving settings:', settings)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-description">Configure system preferences</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'general', label: 'General', icon: Palette },
            { id: 'calculations', label: 'Calculations', icon: Database },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'api', label: 'API Keys', icon: Key },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'general' && (
          <div className="card p-6 space-y-6">
            <h3 className="section-title">Company Information</h3>
            <div className="form-group max-w-md">
              <label className="label">Company Name</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, companyName: e.target.value }))
                }
                className="input"
              />
            </div>
          </div>
        )}

        {activeTab === 'calculations' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="section-title">Default Calculation Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Default Industry Growth Factor (%)</label>
                  <input
                    type="number"
                    value={settings.defaultGrowthFactor}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        defaultGrowthFactor: Number(e.target.value),
                      }))
                    }
                    className="input"
                    min="0"
                    max="50"
                  />
                </div>
                <div className="form-group">
                  <label className="label">Default Maturity Buffer (%)</label>
                  <input
                    type="number"
                    value={settings.defaultMaturityBuffer}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        defaultMaturityBuffer: Number(e.target.value),
                      }))
                    }
                    className="input"
                    min="0"
                    max="30"
                  />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="section-title">Payout Splits</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="label">Business (%)</label>
                  <input
                    type="number"
                    value={settings.businessSplit}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        businessSplit: Number(e.target.value),
                      }))
                    }
                    className="input"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="form-group">
                  <label className="label">Sales (%)</label>
                  <input
                    type="number"
                    value={settings.defaultSalesSplit}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        defaultSalesSplit: Number(e.target.value),
                      }))
                    }
                    className="input"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="form-group">
                  <label className="label">Worker (%)</label>
                  <input
                    type="number"
                    value={settings.defaultWorkerSplit}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        defaultWorkerSplit: Number(e.target.value),
                      }))
                    }
                    className="input"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              {settings.businessSplit +
                settings.defaultSalesSplit +
                settings.defaultWorkerSplit !==
                100 && (
                <p className="text-sm text-red-600 mt-2">
                  Splits must total 100%
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="card p-6 space-y-6">
            <h3 className="section-title">Notification Preferences</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      emailNotifications: e.target.checked,
                    }))
                  }
                  className="h-5 w-5 rounded border-gray-300 text-primary-600"
                />
                <span>Email notifications for critical alerts</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.slackNotifications}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      slackNotifications: e.target.checked,
                    }))
                  }
                  className="h-5 w-5 rounded border-gray-300 text-primary-600"
                />
                <span>Slack notifications (requires integration)</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-6">
            {/* Quick Links to Other Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/settings/integrations"
                className="card p-6 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center">
                    <Link2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      Metricool Integration
                    </h3>
                    <p className="text-sm text-gray-500">
                      Connect brands and sync analytics
                    </p>
                  </div>
                </div>
              </Link>
              <Link
                href="/settings/admins"
                className="card p-6 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      Admin Users
                    </h3>
                    <p className="text-sm text-gray-500">
                      Manage who can access the platform
                    </p>
                  </div>
                </div>
              </Link>
            </div>

            <div className="card p-6">
              <h3 className="section-title">Supabase</h3>
              <div className="space-y-4">
                <div className="form-group">
                  <label className="label">Project URL</label>
                  <input
                    type="text"
                    placeholder="https://xxx.supabase.co"
                    className="input font-mono text-sm"
                    disabled
                    value={process.env.NEXT_PUBLIC_SUPABASE_URL || ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Set via NEXT_PUBLIC_SUPABASE_URL environment variable
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="section-title">Google OAuth</h3>
              <p className="text-sm text-gray-500 mb-4">
                Configure in Google Cloud Console and set environment variables.
              </p>
              <div className="space-y-4">
                <div className="form-group">
                  <label className="label">Client ID</label>
                  <input
                    type="text"
                    className="input font-mono text-sm"
                    disabled
                    value={process.env.GOOGLE_CLIENT_ID ? '***configured***' : 'Not configured'}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Client Secret</label>
                  <input
                    type="text"
                    className="input font-mono text-sm"
                    disabled
                    value={process.env.GOOGLE_CLIENT_SECRET ? '***configured***' : 'Not configured'}
                  />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="section-title">Metricool</h3>
              <div className="form-group">
                <label className="label">API Key</label>
                <input
                  type="text"
                  className="input font-mono text-sm"
                  disabled
                  value={process.env.METRICOOL_API_KEY ? '***configured***' : 'Not configured'}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-primary">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </button>
      </div>
    </div>
  )
}
