'use client'

import { useState } from 'react'
import type { ActivityLogEntry } from '@/lib/supabase/types'

interface ActivityFormProps {
  clientId: string
  onSubmit: (data: Partial<ActivityLogEntry>) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const ACTIVITY_TYPES = [
  { value: 'content_creation', label: 'Content Creation' },
  { value: 'social_post', label: 'Social Media Post' },
  { value: 'blog_post', label: 'Blog Post' },
  { value: 'email_campaign', label: 'Email Campaign' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'strategy_call', label: 'Strategy Call' },
  { value: 'ad_management', label: 'Ad Management' },
  { value: 'seo_work', label: 'SEO Work' },
  { value: 'website_update', label: 'Website Update' },
  { value: 'graphic_design', label: 'Graphic Design' },
  { value: 'video_production', label: 'Video Production' },
  { value: 'analytics_review', label: 'Analytics Review' },
  { value: 'other', label: 'Other' },
]

export default function ActivityForm({
  clientId,
  onSubmit,
  onCancel,
  isLoading,
}: ActivityFormProps) {
  const [formData, setFormData] = useState({
    client_id: clientId,
    date: new Date().toISOString().split('T')[0],
    activity_type: 'content_creation',
    description: '',
    quantity: 1,
    hours: 0,
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      client_id: formData.client_id,
      date: formData.date,
      activity_type: formData.activity_type,
      description: formData.description || null,
      quantity: formData.quantity || null,
      hours: formData.hours || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="date" className="label">
            Date *
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="input"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="activity_type" className="label">
            Activity Type *
          </label>
          <select
            id="activity_type"
            name="activity_type"
            value={formData.activity_type}
            onChange={handleChange}
            className="input"
            required
          >
            {ACTIVITY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="description" className="label">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="input min-h-[80px]"
          placeholder="What was done..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="quantity" className="label">
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            className="input"
            min="0"
          />
          <p className="text-xs text-gray-500 mt-1">
            Number of items (posts, emails, etc.)
          </p>
        </div>
        <div className="form-group">
          <label htmlFor="hours" className="label">
            Hours
          </label>
          <input
            type="number"
            id="hours"
            name="hours"
            value={formData.hours}
            onChange={handleChange}
            className="input"
            min="0"
            step="0.25"
          />
          <p className="text-xs text-gray-500 mt-1">
            Time spent on this activity
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Saving...' : 'Log Activity'}
        </button>
      </div>
    </form>
  )
}
