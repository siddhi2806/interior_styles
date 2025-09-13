"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { AdminUserCard } from "@/components/AdminUserCard";
import { AdminStats } from "@/components/AdminStats";
import { StyleManagement } from "@/components/StyleManagement";
import { Reports } from "@/components/Reports";
import { User } from "@/types/database";
import {
  Shield,
  Users,
  CreditCard,
  TrendingUp,
  Search,
  Filter,
  Palette,
  BarChart3,
  Settings,
} from "lucide-react";

interface UserStats extends User {
  project_count: number;
  render_count: number;
  total_credits_used: number;
}

type TabType = "users" | "styles" | "reports" | "settings";

export default function AdminDashboard() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "blocked" | "low_credits">(
    "all"
  );

  useEffect(() => {
    if (profile?.is_admin) {
      fetchUsers();
    }
  }, [profile]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_user_stats")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateCredits = async (userId: string, newCredits: number) => {
    try {
      const response = await fetch("/api/admin/credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminUserId: user?.id,
          targetUserId: userId,
          credits: newCredits,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update credits");
      }

      // Refresh users list
      await fetchUsers();
    } catch (error) {
      console.error("Error updating credits:", error);
      alert("Failed to update credits");
    }
  };

  const handleBlockUser = async (
    userId: string,
    blocked: boolean,
    reason?: string
  ) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminUserId: user?.id,
          targetUserId: userId,
          blocked,
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user status");
      }

      // Refresh users list
      await fetchUsers();
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Failed to update user status");
    }
  };

  const filteredUsers = users.filter((user) => {
    // Search filter
    const matchesSearch =
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    let matchesFilter = true;
    switch (filter) {
      case "blocked":
        matchesFilter = user.blocked;
        break;
      case "low_credits":
        matchesFilter = user.credits < 10;
        break;
      default:
        matchesFilter = true;
    }

    return matchesSearch && matchesFilter;
  });

  const tabs = [
    { id: "users", name: "User Management", icon: Users },
    { id: "styles", name: "Style Management", icon: Palette },
    { id: "reports", name: "Analytics & Reports", icon: BarChart3 },
    { id: "settings", name: "Settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !profile?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="h-8 w-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
            </div>
            <p className="text-gray-600 mb-6">
              Manage users, styles, credits, and monitor platform usage.
            </p>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "bg-white/60 text-gray-700 hover:bg-white/80 hover:shadow-md"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats - Show on all tabs except settings */}
        {activeTab !== "settings" && <AdminStats users={users} />}

        {/* Tab Content */}
        {activeTab === "users" && (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                User Management
              </h2>

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
                  <div
                    key={i}
                    className="bg-gray-100 rounded-lg p-4 animate-pulse"
                  >
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
        )}

        {activeTab === "styles" && user?.id && (
          <StyleManagement adminUserId={user.id} />
        )}

        {activeTab === "reports" && user?.id && (
          <Reports adminUserId={user.id} />
        )}

        {activeTab === "settings" && (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-6">
              <Settings className="h-6 w-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Admin Settings
              </h2>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Platform Configuration
                </h3>
                <p className="text-blue-700 text-sm mb-4">
                  Manage global platform settings, API keys, and system
                  configuration.
                </p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Manage Settings
                </button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">
                  System Health
                </h3>
                <p className="text-green-700 text-sm mb-4">
                  Monitor system performance, API status, and database health.
                </p>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  View Health Dashboard
                </button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  Backup & Maintenance
                </h3>
                <p className="text-yellow-700 text-sm mb-4">
                  Schedule backups, run maintenance tasks, and manage data
                  retention.
                </p>
                <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                  Maintenance Panel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
