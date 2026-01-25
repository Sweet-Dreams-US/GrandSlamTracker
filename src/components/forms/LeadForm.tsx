'use client'

import { useState } from 'react'
import type { Lead } from '@/lib/supabase/types'

interface LeadFormProps {
  clientId: string
  lead?: Partial<Lead>
  onSubmit: (data: Partial<Lead>) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export default function LeadForm({
  clientId,
  lead,
  onSubmit,
  onCancel,
  isLoading,
}: LeadFormProps) {
  const [formData, setFormData] = useState<Partial<Lead>>({
    client_id: clientId,
    contact_name: lead?.contact_name || '',
    contact_phone: lead?.contact_phone || '',
    contact_email: lead?.contact_email || '',
    source_type: lead?.source_type || 'unknown',
    confidence_level: lead?.confidence_level || 'unknown',
    status: lead?.status || 'new',
    estimated_value: lead?.estimated_value || null,
    final_value: lead?.final_value || null,
    notes: lead?.notes || '',
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="form-group">
          <label htmlFor="contact_name" className="label">
            Contact Name
          </label>
          <input
            type="text"
            id="contact_name"
            name="contact_name"
            value={formData.contact_name || ''}
            onChange={handleChange}
            className="input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="contact_phone" className="label">
            Phone
          </label>
          <input
            type="tel"
            id="contact_phone"
            name="contact_phone"
            value={formData.contact_phone || ''}
            onChange={handleChange}
            className="input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="contact_email" className="label">
            Email
          </label>
          <input
            type="email"
            id="contact_email"
            name="contact_email"
            value={formData.contact_email || ''}
            onChange={handleChange}
            className="input"
          />
        </div>
      </div>

      {/* Source & Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="form-group">
          <label htmlFor="source_type" className="label">
            Source Type
          </label>
          <select
            id="source_type"
            name="source_type"
            value={formData.source_type}
            onChange={handleChange}
            className="input"
          >
            <option value="sweetDreams">Sweet Dreams</option>
            <option value="organic">Organic</option>
            <option value="referral">Referral</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="confidence_level" className="label">
            Confidence Level
          </label>
          <select
            id="confidence_level"
            name="confidence_level"
            value={formData.confidence_level}
            onChange={handleChange}
            className="input"
          >
            <option value="confirmed">Confirmed</option>
            <option value="likely">Likely</option>
            <option value="assumed">Assumed</option>
            <option value="unknown">Unknown</option>
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
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="quoted">Quoted</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="estimated_value" className="label">
            Estimated Value
          </label>
          <input
            type="number"
            id="estimated_value"
            name="estimated_value"
            value={formData.estimated_value || ''}
            onChange={handleChange}
            className="input"
            min="0"
            step="0.01"
          />
        </div>
        <div className="form-group">
          <label htmlFor="final_value" className="label">
            Final Value (if won)
          </label>
          <input
            type="number"
            id="final_value"
            name="final_value"
            value={formData.final_value || ''}
            onChange={handleChange}
            className="input"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="form-group">
        <label htmlFor="notes" className="label">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          className="input min-h-[80px]"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Saving...' : lead?.id ? 'Update Lead' : 'Add Lead'}
        </button>
      </div>
    </form>
  )
}
