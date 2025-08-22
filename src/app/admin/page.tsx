'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { AdminUserCard } from '@/components/AdminUserCard'
import { AdminStats } from '@/components/AdminStats'
import { User } from '@/types/database'
import { 
  Shield, 
  Users, 
  CreditCard, 
  TrendingUp,
  Search,
  Filter
} from 'lucide-react'

interface UserStats extends User {
  project_count: number
  render_count: number
  total_credits_used: number
}

export default function AdminDashboard() {
  const { user, profile, loading } = useAuth()
  const [users, setUsers] = useState<UserStats[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'blocked' | 'low_credits'>('all')

  useEffect(() => {
    if (profile?.is_admin) {
      fetchUsers()
    }
  }, [profile])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_user_stats')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleUpdateCredits = async (userId: string, newCredits: number) => {
    try {
      const response = await fetch('/api/admin/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminUserId: user?.id,
          targetUserId: userId,
          credits: newCredits
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update credits')
      }

      // Refresh users list
      await fetchUsers()
    } catch (error) {
      console.error('Error updating credits:', error)
      alert('Failed to update credits')
    }
  }

  const handleBlockUser = async (userId: string, blocked: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ blocked })
        .eq('id', userId)

      if (error) throw error
      
      // Refresh users list
      await fetchUsers()
    } catch (error) {
      console.error('Error updating user status:', error)
      alert('Failed to update user status')
    }
  }

  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.id.toLowerCase().includes(searchTerm.toLowerCase())

    // Status filter
    let matchesFilter = true
    switch (filter) {
      case 'blocked':
        matchesFilter = user.blocked
        break
      case 'low_credits':
        matchesFilter = user.credits < 10
        break
      default:
        matchesFilter = true
    }

    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user || !profile?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="h-8 w-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <p className="text-gray-600">
              Manage users, credits, and monitor platform usage.
            </p>
          </div>
        </div>

        {/* Stats */}
        <AdminStats users={users} />

        {/* User Management */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Users</option>
                <option value="blocked">Blocked Users</option>
                <option value="low_credits">Low Credits (&lt;10)</option>
              </select>
            </div>
          </div>

          {loadingUsers ? (
            <div className="grid gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((userData) => (
                <AdminUserCard
                  key={userData.id}
                  user={userData}
                  onUpdateCredits={handleUpdateCredits}
                  onBlockUser={handleBlockUser}
                />
              ))}
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No users found matching your criteria.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
