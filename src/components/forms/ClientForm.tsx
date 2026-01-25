'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { INDUSTRY_LABELS } from '@/lib/constants/industries'
import type { Client } from '@/lib/supabase/types'

interface ClientFormProps {
  client?: Partial<Client>
  onSubmit: (data: Partial<Client>) => Promise<void>
  isLoading?: boolean
}

export default function ClientForm({ client, onSubmit, isLoading }: ClientFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<Partial<Client>>({
    business_name: client?.business_name || '',
    display_name: client?.display_name || '',
    status: client?.status || 'prospect',
    industry: client?.industry || 'other',
    business_age_years: client?.business_age_years || null,
    primary_contact_name: client?.primary_contact_name || '',
    primary_contact_email: client?.primary_contact_email || '',
    primary_contact_phone: client?.primary_contact_phone || '',
    website_url: client?.website_url || '',
    notes: client?.notes || '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : null) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Information */}
      <div className="card p-6">
        <h3 className="section-title">Business Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="business_name" className="label">
              Business Name *
            </label>
            <input
              type="text"
              id="business_name"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="display_name" className="label">
              Display Name (optional)
            </label>
            <input
              type="text"
              id="display_name"
              name="display_name"
              value={formData.display_name || ''}
              onChange={handleChange}
              className="input"
              placeholder="Short name for dashboards"
            />
          </div>
          <div className="form-group">
            <label htmlFor="industry" className="label">
              Industry *
            </label>
            <select
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className="input"
              required
            >
              {Object.entries(INDUSTRY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="status" className="label">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input"
            >
              <option value="prospect">Prospect</option>
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="business_age_years" className="label">
              Business Age (years)
            </label>
            <input
              type="number"
              id="business_age_years"
              name="business_age_years"
              value={formData.business_age_years || ''}
              onChange={handleChange}
              className="input"
              min="0"
              step="1"
            />
          </div>
          <div className="form-group">
            <label htmlFor="website_url" className="label">
              Website URL
            </label>
            <input
              type="url"
              id="website_url"
              name="website_url"
              value={formData.website_url || ''}
              onChange={handleChange}
              className="input"
              placeholder="https://"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="card p-6">
        <h3 className="section-title">Primary Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-group">
            <label htmlFor="primary_contact_name" className="label">
              Contact Name
            </label>
            <input
              type="text"
              id="primary_contact_name"
              name="primary_contact_name"
              value={formData.primary_contact_name || ''}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="primary_contact_email" className="label">
              Email
            </label>
            <input
              type="email"
              id="primary_contact_email"
              name="primary_contact_email"
              value={formData.primary_contact_email || ''}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="primary_contact_phone" className="label">
              Phone
            </label>
            <input
              type="tel"
              id="primary_contact_phone"
              name="primary_contact_phone"
              value={formData.primary_contact_phone || ''}
              onChange={handleChange}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card p-6">
        <h3 className="section-title">Notes</h3>
        <div className="form-group">
          <textarea
            id="notes"
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            className="input min-h-[120px]"
            placeholder="Internal notes about this client..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? 'Saving...' : client?.id ? 'Update Client' : 'Create Client'}
        </button>
      </div>
    </form>
  )
}
