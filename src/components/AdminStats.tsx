'use client'

import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Shield,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface UserStats {
  id: string
  display_name: string | null
  credits: number
  blocked: boolean
  created_at: string
  project_count: number
  render_count: number
  total_credits_used: number
}

interface AdminStatsProps {
  users: UserStats[]
}

export function AdminStats({ users }: AdminStatsProps) {
  const totalUsers = users.length
  const blockedUsers = users.filter(u => u.blocked).length
  const activeUsers = totalUsers - blockedUsers
  const totalProjects = users.reduce((sum, u) => sum + u.project_count, 0)
  const totalRenders = users.reduce((sum, u) => sum + u.render_count, 0)
  const totalCreditsUsed = users.reduce((sum, u) => sum + u.total_credits_used, 0)
  const totalCreditsRemaining = users.reduce((sum, u) => sum + u.credits, 0)
  const lowCreditUsers = users.filter(u => u.credits < 10 && !u.blocked).length

  const stats = [
    {
      icon: <Users className="h-8 w-8" />,
      title: "Total Users",
      value: totalUsers,
      subtext: `${activeUsers} active, ${blockedUsers} blocked`,
      color: "blue"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Total Renders",
      value: totalRenders,
      subtext: `From ${totalProjects} projects`,
      color: "green"
    },
    {
      icon: <CreditCard className="h-8 w-8" />,
      title: "Credits Used",
      value: totalCreditsUsed,
      subtext: `${totalCreditsRemaining} remaining`,
      color: "purple"
    },
    {
      icon: <AlertTriangle className="h-8 w-8" />,
      title: "Low Credits",
      value: lowCreditUsers,
      subtext: "Users with <10 credits",
      color: "yellow"
    }
  ]

  const colorClasses = {
    blue: {
      bg: "bg-blue-100",
      text: "text-blue-600",
      border: "border-blue-200"
    },
    green: {
      bg: "bg-green-100",
      text: "text-green-600",
      border: "border-green-200"
    },
    purple: {
      bg: "bg-purple-100",
      text: "text-purple-600",
      border: "border-purple-200"
    },
    yellow: {
      bg: "bg-yellow-100",
      text: "text-yellow-600",
      border: "border-yellow-200"
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const colors = colorClasses[stat.color as keyof typeof colorClasses]
        
        return (
          <div
            key={index}
            className={`bg-white/80 backdrop-blur-lg rounded-xl p-6 border ${colors.border} hover:shadow-lg transition-all duration-200`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${colors.bg}`}>
                <div className={colors.text}>
                  {stat.icon}
                </div>
              </div>
              {stat.color === 'yellow' && stat.value > 0 && (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value.toLocaleString()}
              </h3>
              <p className="text-sm font-medium text-gray-700 mb-1">
                {stat.title}
              </p>
              <p className="text-xs text-gray-500">
                {stat.subtext}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
