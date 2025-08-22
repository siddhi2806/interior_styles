'use client'

import { useState, useEffect } from 'react'

export default function FastDashboard() {
  const [loadTime, setLoadTime] = useState(0)
  const [performanceData, setPerformanceData] = useState<any>(null)

  useEffect(() => {
    const startTime = performance.now()
    
    // Simulate dashboard load
    setTimeout(() => {
      const endTime = performance.now()
      setLoadTime(endTime - startTime)
    }, 100)

    // Test API performance
    fetch('/api/performance')
      .then(res => res.json())
      .then(data => setPerformanceData(data))
      .catch(err => console.error('Performance test failed:', err))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">⚡ Fast Dashboard (Performance Test)</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Page Load Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{loadTime.toFixed(0)}ms</div>
              <div className="text-sm text-gray-600">Page Load Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {performanceData?.responseTime || 'Testing...'}
              </div>
              <div className="text-sm text-gray-600">API Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {performanceData?.performance || 'Checking...'}
              </div>
              <div className="text-sm text-gray-600">Overall Performance</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <a 
              href="/debug-styles"
              className="block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center"
            >
              🎨 Test Styles Loading
            </a>
            <a 
              href="/dashboard"
              className="block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center"
            >
              🏠 Go to Full Dashboard
            </a>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              🔄 Reload Page
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Performance Tips</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              This page loads fast because it has minimal components
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              No heavy database queries on initial load
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              No complex animations or heavy libraries
            </li>
            <li className="flex items-center">
              <span className="text-yellow-500 mr-2">⚠</span>
              Main dashboard may be slow due to multiple API calls
            </li>
            <li className="flex items-center">
              <span className="text-yellow-500 mr-2">⚠</span>
              Check browser Network tab for slow requests
            </li>
          </ul>
        </div>

        {performanceData && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">System Status</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(performanceData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
