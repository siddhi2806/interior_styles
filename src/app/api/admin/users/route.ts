import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// POST - Block/unblock user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminUserId, targetUserId, blocked, reason } = body

    if (!adminUserId || !targetUserId || typeof blocked !== 'boolean') {
      return NextResponse.json(
        { error: 'Admin ID, target user ID, and blocked status are required' },
        { status: 400 }
      )
    }

    // Verify admin status
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', adminUserId)
      .single()

    if (adminError || !adminUser?.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized - admin access required' },
        { status: 403 }
      )
    }

    // Update user blocked status
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ blocked })
      .eq('id', targetUserId)

    if (updateError) {
      console.error('Error updating user blocked status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user status' },
        { status: 500 }
      )
    }

    // Log admin action
    const { error: logError } = await supabaseAdmin
      .from('admin_actions')
      .insert([{
        admin_id: adminUserId,
        action_type: blocked ? 'block_user' : 'unblock_user',
        target_user_id: targetUserId,
        details: { reason }
      }])

    if (logError) {
      console.error('Error logging admin action:', logError)
      // Don't fail the request for logging errors
    }

    return NextResponse.json({ 
      message: `User ${blocked ? 'blocked' : 'unblocked'} successfully` 
    })
  } catch (error) {
    console.error('Unexpected error in user management:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Fetch user details (for admin verification)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user details
    const { data: user, error } = await supabaseAdmin
      .from('admin_user_stats')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user details' },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Unexpected error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
