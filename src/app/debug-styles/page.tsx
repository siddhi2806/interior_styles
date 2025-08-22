'use client'

import { useState, useEffect } from 'react'

interface Style {
  id: number
  name: string
  description: string
}

export default function DebugStyles() {
  const [styles, setStyles] = useState<Style[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStyles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/setup-styles', { method: 'GET' })
      const result = await response.json()
      console.log('Styles API result:', result)
      
      if (result.success) {
        setStyles(result.styles)
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error('Error fetching styles:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const setupStyles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/setup-styles', { method: 'POST' })
      const result = await response.json()
      console.log('Setup styles result:', result)
      
      if (result.success) {
        setStyles(result.styles)
        setError(null)
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error('Error setting up styles:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStyles()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Styles</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <button
              onClick={fetchStyles}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Fetch Styles
            </button>
            <button
              onClick={setupStyles}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Setup Styles
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2">Loading...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-red-700">Error: {error}</p>
            </div>
          )}

          <div className="space-y-4">
            <p><strong>Styles Count:</strong> {styles.length}</p>
            
            {styles.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Available Styles:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {styles.map((style, index) => (
                    <div key={style.id || index} className="border rounded p-3">
                      <h4 className="font-medium">{style.name}</h4>
                      <p className="text-sm text-gray-600">{style.description}</p>
                      <p className="text-xs text-gray-500">ID: {style.id}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
