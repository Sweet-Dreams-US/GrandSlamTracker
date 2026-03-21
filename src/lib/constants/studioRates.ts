// Studio room configurations
export const STUDIOS = {
  studio_a: {
    name: 'Studio A',
    hourlyRate: 70,
    blockRate: 180,
    blockHours: 3,
  },
  studio_b: {
    name: 'Studio B',
    hourlyRate: 50,
    blockRate: 120,
    blockHours: 3,
  },
} as const

export type StudioId = keyof typeof STUDIOS

// Revenue split percentages: [engineer%, studio%]
export const SPLITS = {
  session: { engineer: 0.60, studio: 0.40 },        // Recording session
  media_produced: { engineer: 0.65, studio: 0.35 },  // Media the engineer produced
  media_upsold: { engineer: 0.15, studio: 0.85 },    // Media upsold by the studio
} as const

// Engineer roster
export const ENGINEERS = [
  { id: 'prvrb', name: 'PRVRB' },
  { id: 'iszac_griner', name: 'Iszac Griner' },
  { id: 'zion_tinsley', name: 'Zion Tinsley' },
  { id: 'jay_val_leo', name: 'Jay Val Leo' },
] as const

export type EngineerId = (typeof ENGINEERS)[number]['id']

// Media service types
export const MEDIA_SERVICES = [
  { id: 'mixing', name: 'Mixing' },
  { id: 'mastering', name: 'Mastering' },
  { id: 'beat_production', name: 'Beat Production' },
  { id: 'vocal_tuning', name: 'Vocal Tuning' },
  { id: 'sound_design', name: 'Sound Design' },
  { id: 'podcast_editing', name: 'Podcast Editing' },
  { id: 'video_editing', name: 'Video Editing' },
  { id: 'photography', name: 'Photography' },
  { id: 'graphic_design', name: 'Graphic Design' },
  { id: 'other', name: 'Other' },
] as const

export type MediaServiceId = (typeof MEDIA_SERVICES)[number]['id']

export type MediaRole = 'produced' | 'upsold'

// Bank entities
export const BANK_ENTITIES = {
  sweet_dreams_music: 'Sweet Dreams Music',
  sweet_dreams_us: 'Sweet Dreams US',
} as const

export type BankEntity = keyof typeof BANK_ENTITIES

// Session statuses
export const SESSION_STATUSES = ['pending', 'approved', 'paid'] as const
export type SessionStatus = (typeof SESSION_STATUSES)[number]
