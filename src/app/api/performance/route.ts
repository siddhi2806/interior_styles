import { NextResponse } from 'next/server'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Simple health check
    const checks = {
      server: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      env_check: {
        supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabase_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hf_key: !!process.env.HUGGINGFACE_API_KEY
      }
    }
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'healthy',
      checks,
      responseTime: `${responseTime}ms`,
      performance: responseTime < 100 ? 'excellent' : 
                  responseTime < 500 ? 'good' : 
                  responseTime < 1000 ? 'fair' : 'slow'
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 500 })
  }
}
