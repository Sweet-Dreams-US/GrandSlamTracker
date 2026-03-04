import {
  STUDIOS,
  SPLITS,
  type StudioId,
  type MediaRole,
  type BankEntity,
} from '@/lib/constants/studioRates'

export interface RecordingSessionInput {
  studio: StudioId
  hours: number
  isBlock: boolean
}

export interface RecordingSessionResult {
  totalCharge: number
  engineerPayout: number
  studioPayout: number
  bankEntity: BankEntity
}

export function calculateRecordingSession(input: RecordingSessionInput): RecordingSessionResult {
  const room = STUDIOS[input.studio]
  let totalCharge: number

  if (input.isBlock) {
    const fullBlocks = Math.floor(input.hours / room.blockHours)
    const remainderHours = input.hours % room.blockHours
    totalCharge = fullBlocks * room.blockRate + remainderHours * room.hourlyRate
  } else {
    totalCharge = input.hours * room.hourlyRate
  }

  const engineerPayout = Math.round(totalCharge * SPLITS.session.engineer * 100) / 100
  const studioPayout = Math.round(totalCharge * SPLITS.session.studio * 100) / 100

  return {
    totalCharge,
    engineerPayout,
    studioPayout,
    bankEntity: 'sweet_dreams_music',
  }
}

export interface MediaSessionInput {
  totalCharge: number
  mediaRole: MediaRole
}

export interface MediaSessionResult {
  totalCharge: number
  engineerPayout: number
  studioPayout: number
  bankEntity: BankEntity
}

export function calculateMediaSession(input: MediaSessionInput): MediaSessionResult {
  const split = input.mediaRole === 'produced' ? SPLITS.media_produced : SPLITS.media_upsold
  const engineerPayout = Math.round(input.totalCharge * split.engineer * 100) / 100
  const studioPayout = Math.round(input.totalCharge * split.studio * 100) / 100

  return {
    totalCharge: input.totalCharge,
    engineerPayout,
    studioPayout,
    bankEntity: 'sweet_dreams_us',
  }
}
