import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, name } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Upsert user profile with initial credits
    const supabaseAdmin = createSupabaseAdminClient()
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert(
        { 
          id: userId, 
          display_name: name || null, 
          credits: 50,
          is_admin: false,
          blocked: false
        },
        { 
          onConflict: 'id',
          ignoreDuplicates: false
        }
      )

    if (error) {
      console.error('Profile creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
