import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { adminUserId, targetUserId, credits } = await request.json()
    
    const supabaseAdmin = createSupabaseAdminClient()
    
    // Verify admin status
    const { data: adminUser } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', adminUserId)
      .single()

    if (!adminUser?.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 403 }
      )
    }

    // Update target user credits
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ credits: credits })
      .eq('id', targetUserId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log the admin action
    await supabaseAdmin.from('usage_logs').insert({
      user_id: targetUserId,
      type: 'admin_credit',
      amount: credits,
      detail: { admin_id: adminUserId, action: 'credit_adjustment' }
    })

    return NextResponse.json({ success: true, user: data })
  } catch (error) {
    console.error('Admin credits error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
