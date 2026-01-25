'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Calendar } from 'lucide-react'
import ActivityForm from '@/components/forms/ActivityForm'
import type { ActivityLogEntry } from '@/lib/supabase/types'

// Demo data
const DEMO_ACTIVITIES: ActivityLogEntry[] = [
  {
    id: '1',
    client_id: '1',
    date: '2024-12-15',
    activity_type: 'social_post',
    description: 'Holiday campaign posts - 5 carousel posts for Instagram and Facebook',
    quantity: 5,
    hours: 2,
    created_by: 'team',
    created_at: '2024-12-15T10:00:00Z',
  },
  {
    id: '2',
    client_id: '1',
    date: '2024-12-12',
    activity_type: 'content_creation',
    description: 'Blog article: Winter remodeling tips to boost your home value',
    quantity: 1,
    hours: 3.5,
    created_by: 'team',
    created_at: '2024-12-12T14:00:00Z',
  },
  {
    id: '3',
    client_id: '1',
    date: '2024-12-10',
    activity_type: 'meeting',
    description: 'Monthly strategy review call with John',
    quantity: 1,
    hours: 1,
    created_by: 'team',
    created_at: '2024-12-10T09:00:00Z',
  },
  {
    id: '4',
    client_id: '1',
    date: '2024-12-08',
    activity_type: 'email_campaign',
    description: 'December newsletter - Holiday promotions and tips',
    quantity: 1,
    hours: 1.5,
    created_by: 'team',
    created_at: '2024-12-08T11:00:00Z',
  },
]

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  content_creation: 'Content Creation',
  social_post: 'Social Post',
  blog_post: 'Blog Post',
  email_campaign: 'Email Campaign',
  meeting: 'Meeting',
  strategy_call: 'Strategy Call',
  ad_management: 'Ad Management',
  seo_work: 'SEO Work',
  website_update: 'Website Update',
  graphic_design: 'Graphic Design',
  video_production: 'Video Production',
  analytics_review: 'Analytics Review',
  other: 'Other',
}

export default function ActivityPage() {
  const params = useParams()
  const [activities, setActivities] = useState(DEMO_ACTIVITIES)
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Calculate monthly summary
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyActivities = activities.filter((a) => {
    const date = new Date(a.date)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })
  const totalHours = monthlyActivities.reduce((sum, a) => sum + (a.hours || 0), 0)
  const totalContent = monthlyActivities.filter((a) =>
    ['content_creation', 'blog_post', 'video_production'].includes(a.activity_type)
  ).length
  const totalPosts = monthlyActivities
    .filter((a) => a.activity_type === 'social_post')
    .reduce((sum, a) => sum + (a.quantity || 0), 0)

  const handleSubmit = async (data: Partial<ActivityLogEntry>) => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setActivities((prev) => [
        {
          ...data,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
        } as ActivityLogEntry,
        ...prev,
      ])
      setShowForm(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Group activities by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = activity.date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(activity)
    return groups
  }, {} as Record<string, ActivityLogEntry[]>)

  const sortedDates = Object.keys(groupedActivities).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/clients/${params.id}`}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Activity Log</h1>
            <p className="text-sm text-gray-500">Track work and deliverables</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Log Activity
        </button>
      </div>

      {/* Activity Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-auto p-6">
            <h2 className="text-lg font-semibold mb-4">Log New Activity</h2>
            <ActivityForm
              clientId={params.id as string}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      {/* Monthly Summary */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">This Month's Summary</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-600">{totalHours}</p>
            <p className="text-sm text-gray-500">Hours Logged</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-600">{totalContent}</p>
            <p className="text-sm text-gray-500">Content Pieces</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-600">{totalPosts}</p>
            <p className="text-sm text-gray-500">Social Posts</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-600">
              {monthlyActivities.filter((a) => a.activity_type === 'meeting').length}
            </p>
            <p className="text-sm text-gray-500">Meetings</p>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="card">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold">Activity Timeline</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {sortedDates.map((date) => (
            <div key={date} className="p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                <Calendar className="h-4 w-4" />
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              <div className="space-y-3 ml-6">
                {groupedActivities[date].map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-gray">
                          {ACTIVITY_TYPE_LABELS[activity.activity_type] || activity.activity_type}
                        </span>
                        {activity.quantity && activity.quantity > 1 && (
                          <span className="text-sm text-gray-500">
                            x{activity.quantity}
                          </span>
                        )}
                      </div>
                      {activity.description && (
                        <p className="text-sm text-gray-700 mt-1">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    {activity.hours && (
                      <div className="text-right">
                        <p className="text-sm font-medium">{activity.hours}h</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {sortedDates.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No activities logged yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
