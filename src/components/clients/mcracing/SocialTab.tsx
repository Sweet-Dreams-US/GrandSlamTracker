'use client'

import { useState, useEffect } from 'react'
import { Instagram, Facebook, Eye, Users, Heart, MessageCircle, Share2, ExternalLink } from 'lucide-react'

interface PlatformData {
  platform: string
  handle?: string
  followers?: number
  following?: number
  reach?: number
  views?: number
  engagements?: number
  pageViews?: number
  postImpressions?: number
  reactions?: number
  mediaViews?: number
  newFollows?: number
}

interface PostData {
  id: string
  platform: string
  type: string
  content: string
  url: string
  date: string
  likes: number
  comments: number
  shares: number
  reach: number
  views: number
  engagement: number
  imageUrl?: string
}

interface SocialData {
  brand: string
  period: string
  platforms: PlatformData[]
  posts: PostData[]
}

export default function SocialTab() {
  const [data, setData] = useState<SocialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    loadData()
  }, [period])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/metricool/mcracing?period=${period}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError('Could not load social analytics. Check API connection.')
      console.error(e)
    }
    setLoading(false)
  }

  const fmt = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mcracing-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button onClick={loadData} className="mt-3 text-sm text-red-700 font-medium hover:underline">
          Try Again
        </button>
      </div>
    )
  }

  if (!data) return null

  const ig = data.platforms.find(p => p.platform === 'instagram')
  const fb = data.platforms.find(p => p.platform === 'facebook')

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Social Media Analytics</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' },
          ].map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                period === p.value
                  ? 'bg-white text-mcracing-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Instagram Card */}
        {ig && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Instagram className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Instagram</h3>
                <p className="text-xs text-gray-400">{ig.handle}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox icon={<Users className="h-3.5 w-3.5" />} label="Followers" value={fmt(ig.followers || 0)} />
              <StatBox icon={<Eye className="h-3.5 w-3.5" />} label="Reach" value={fmt(ig.reach || 0)} />
              <StatBox icon={<Eye className="h-3.5 w-3.5" />} label="Views" value={fmt(ig.views || 0)} />
              <StatBox icon={<Heart className="h-3.5 w-3.5" />} label="Engaged" value={fmt(ig.engagements || 0)} />
            </div>
          </div>
        )}

        {/* Facebook Card */}
        {fb && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Facebook className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Facebook</h3>
                <p className="text-xs text-gray-400">{fb.handle}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox icon={<Users className="h-3.5 w-3.5" />} label="Followers" value={fmt(fb.followers || 0)} />
              <StatBox icon={<Eye className="h-3.5 w-3.5" />} label="Page Views" value={fmt(fb.pageViews || 0)} />
              <StatBox icon={<Eye className="h-3.5 w-3.5" />} label="Impressions" value={fmt(fb.postImpressions || 0)} />
              <StatBox icon={<Heart className="h-3.5 w-3.5" />} label="Reactions" value={fmt(fb.reactions || 0)} />
            </div>
          </div>
        )}
      </div>

      {/* Recent Posts */}
      {data.posts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Recent Posts</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {data.posts.map(post => (
              <div key={post.id} className="p-4 hover:bg-gray-50">
                <div className="flex gap-3">
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {post.likes}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {post.comments}</span>
                      {post.shares > 0 && <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> {post.shares}</span>}
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {fmt(post.views)}</span>
                      {post.url && (
                        <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-mcracing-600 hover:text-mcracing-700 flex items-center gap-0.5">
                          <ExternalLink className="h-3 w-3" /> View
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-medium text-green-600">{post.engagement.toFixed(1)}%</div>
                    <div className="text-xs text-gray-400">engagement</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Growth Target Context */}
      <div className="bg-mcracing-50 rounded-xl border border-mcracing-200 p-5">
        <h3 className="text-sm font-semibold text-mcracing-900 mb-2">Social Growth Targets</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs text-mcracing-600">IG Followers Target</div>
            <div className="text-lg font-bold text-mcracing-900">1,500</div>
            <div className="text-xs text-mcracing-500">by Feb 2027</div>
          </div>
          <div>
            <div className="text-xs text-mcracing-600">Current</div>
            <div className="text-lg font-bold text-mcracing-900">{ig ? fmt(ig.followers || 0) : '—'}</div>
            <div className="text-xs text-mcracing-500">{ig ? `${((ig.followers || 0) / 1500 * 100).toFixed(0)}% of goal` : ''}</div>
          </div>
          <div>
            <div className="text-xs text-mcracing-600">Google Reviews Target</div>
            <div className="text-lg font-bold text-mcracing-900">40</div>
            <div className="text-xs text-mcracing-500">by Feb 2027</div>
          </div>
          <div>
            <div className="text-xs text-mcracing-600">Avg Engagement</div>
            <div className="text-lg font-bold text-mcracing-900">
              {data.posts.length > 0
                ? `${(data.posts.reduce((s, p) => s + p.engagement, 0) / data.posts.length).toFixed(1)}%`
                : '—'
              }
            </div>
            <div className="text-xs text-mcracing-500">across posts</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
    </div>
  )
}
