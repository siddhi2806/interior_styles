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

// GET - Fetch all styles
export async function GET() {
  try {
    const { data: styles, error } = await supabaseAdmin
      .from('styles')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching styles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch styles' },
        { status: 500 }
      )
    }

    return NextResponse.json({ styles: styles || [] })
  } catch (error) {
    console.error('Unexpected error fetching styles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new style
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Style name is required' },
        { status: 400 }
      )
    }

    // Check if style already exists
    const { data: existingStyle } = await supabaseAdmin
      .from('styles')
      .select('id')
      .eq('name', name.trim())
      .single()

    if (existingStyle) {
      return NextResponse.json(
        { error: 'Style with this name already exists' },
        { status: 409 }
      )
    }

    // Create new style
    const { data, error } = await supabaseAdmin
      .from('styles')
      .insert([{
        name: name.trim(),
        description: description?.trim() || null
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating style:', error)
      return NextResponse.json(
        { error: 'Failed to create style' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Style created successfully',
      style: data 
    })
  } catch (error) {
    console.error('Unexpected error creating style:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update existing style
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description } = body

    if (!id || !name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Style ID and name are required' },
        { status: 400 }
      )
    }

    // Check if another style with the same name exists
    const { data: existingStyle } = await supabaseAdmin
      .from('styles')
      .select('id')
      .eq('name', name.trim())
      .neq('id', id)
      .single()

    if (existingStyle) {
      return NextResponse.json(
        { error: 'Another style with this name already exists' },
        { status: 409 }
      )
    }

    // Update style
    const { data, error } = await supabaseAdmin
      .from('styles')
      .update({
        name: name.trim(),
        description: description?.trim() || null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating style:', error)
      return NextResponse.json(
        { error: 'Failed to update style' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Style not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      message: 'Style updated successfully',
      style: data 
    })
  } catch (error) {
    console.error('Unexpected error updating style:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove style
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Style ID is required' },
        { status: 400 }
      )
    }

    // Check if style is being used in any project_images
    const { data: usageCount } = await supabaseAdmin
      .from('project_images')
      .select('id', { count: 'exact' })
      .eq('style_id', id)

    if (usageCount && usageCount.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete style that is being used in projects' },
        { status: 409 }
      )
    }

    // Delete style
    const { error } = await supabaseAdmin
      .from('styles')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting style:', error)
      return NextResponse.json(
        { error: 'Failed to delete style' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Style deleted successfully' 
    })
  } catch (error) {
    console.error('Unexpected error deleting style:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
