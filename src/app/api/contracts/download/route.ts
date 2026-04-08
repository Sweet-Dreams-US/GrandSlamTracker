import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json({ success: false, error: 'path is required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Create a signed URL (valid for 1 hour)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.storage as any)
      .from('contracts')
      .createSignedUrl(filePath, 3600)

    if (error || !data?.signedUrl) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed to create download URL' }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: data.signedUrl })
  } catch (error) {
    console.error('Contract download error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Download failed' },
      { status: 500 }
    )
  }
}
