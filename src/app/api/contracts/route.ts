import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

// Upload a contract file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const payoutRecordId = formData.get('payout_record_id') as string | null
    const notes = formData.get('notes') as string | null

    if (!file || !payoutRecordId) {
      return NextResponse.json({ success: false, error: 'file and payout_record_id are required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Upload to storage
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${payoutRecordId}/${timestamp}_${safeName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: uploadError } = await (supabase.storage as any)
      .from('contracts')
      .upload(filePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 })
    }

    // Save metadata
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: dbError } = await (supabase.from('contract_files') as any)
      .insert({
        payout_record_id: payoutRecordId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB insert error:', dbError)
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, file: data })
  } catch (error) {
    console.error('Contract upload error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

// List contract files for a payout record
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const payoutRecordId = searchParams.get('payout_record_id')

    if (!payoutRecordId) {
      return NextResponse.json({ success: false, error: 'payout_record_id is required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('contract_files') as any)
      .select('*')
      .eq('payout_record_id', payoutRecordId)
      .order('uploaded_at', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, files: data || [] })
  } catch (error) {
    console.error('Contract list error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to list files' },
      { status: 500 }
    )
  }
}

// Delete a contract file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('id')

    if (!fileId) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get file path first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: file, error: fetchError } = await (supabase.from('contract_files') as any)
      .select('file_path')
      .eq('id', fileId)
      .single()

    if (fetchError || !file) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 })
    }

    // Delete from storage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.storage as any).from('contracts').remove([file.file_path])

    // Delete metadata
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase.from('contract_files') as any)
      .delete()
      .eq('id', fileId)

    if (deleteError) {
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contract delete error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    )
  }
}
