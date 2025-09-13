"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  Calendar,
  Download,
  RefreshCw,
} from "lucide-react";

interface ReportData {
  userRegistrations: { date: string; count: number }[];
  dailyUsage: { date: string; credits: number; renders: number }[];
  topUsers: { userId: string; renders: number; credits: number }[];
  stylePopularity: { name: string; count: number }[];
  summary: {
    totalUsers: number;
    blockedUsers: number;
    totalProjects: number;
    totalRenders: number;
    totalCreditsUsed: number;
    averageRendersPerUser: number;
    averageProjectsPerUser: number;
  };
}

interface ReportsProps {
  adminUserId: string;
}

export function Reports({ adminUserId }: ReportsProps) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    fetchReports();
  }, [period]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/reports?adminUserId=${adminUserId}&period=${period}`
      );
      const reportData = await response.json();

      if (response.ok) {
        setData(reportData);
      } else {
        console.error("Error fetching reports:", reportData.error);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!data) return;

    const csvContent = generateCSV(data);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `room_styler_report_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCSV = (data: ReportData) => {
    const lines = [
      "Room Styler Analytics Report",
      `Generated: ${new Date().toLocaleString()}`,
      `Period: Last ${period} days`,
      "",
      "SUMMARY",
      `Total Users,${data.summary.totalUsers}`,
      `Blocked Users,${data.summary.blockedUsers}`,
      `Total Projects,${data.summary.totalProjects}`,
      `Total Renders,${data.summary.totalRenders}`,
      `Total Credits Used,${data.summary.totalCreditsUsed}`,
      `Average Renders per User,${data.summary.averageRendersPerUser.toFixed(
        2
      )}`,
      `Average Projects per User,${data.summary.averageProjectsPerUser.toFixed(
        2
      )}`,
      "",
      "DAILY USAGE",
      "Date,Renders,Credits Used",
      ...data.dailyUsage.map((d) => `${d.date},${d.renders},${d.credits}`),
      "",
      "USER REGISTRATIONS",
      "Date,New Users",
      ...data.userRegistrations.map((d) => `${d.date},${d.count}`),
      "",
      "TOP USERS BY ACTIVITY",
      "User ID,Renders,Credits Used",
      ...data.topUsers.map((u) => `${u.userId},${u.renders},${u.credits}`),
      "",
      "STYLE POPULARITY",
      "Style Name,Usage Count",
      ...data.stylePopularity.map((s) => `${s.name},${s.count}`),
    ];

    return lines.join("\n");
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">
            Failed to load reports. Please try again.
          </p>
          <button
            onClick={fetchReports}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Analytics & Reports
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>

            <button
              onClick={fetchReports}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>

            <button
              onClick={exportData}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {data.summary.totalUsers.toLocaleString()}
            </h3>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Total Users
            </p>
            <p className="text-xs text-gray-500">
              {data.summary.blockedUsers} blocked
            </p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {data.summary.totalRenders.toLocaleString()}
            </h3>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Total Renders
            </p>
            <p className="text-xs text-gray-500">
              {data.summary.averageRendersPerUser.toFixed(1)} avg per user
            </p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {data.summary.totalCreditsUsed.toLocaleString()}
            </h3>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Credits Used
            </p>
            <p className="text-xs text-gray-500">
              From {data.summary.totalProjects} projects
            </p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-yellow-100">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {data.summary.totalProjects.toLocaleString()}
            </h3>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Total Projects
            </p>
            <p className="text-xs text-gray-500">
              {data.summary.averageProjectsPerUser.toFixed(1)} avg per user
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Activity
          </h3>
          <div className="h-64 flex items-end space-x-2">
            {data.dailyUsage.map((day, index) => {
              const maxValue = Math.max(
                ...data.dailyUsage.map((d) =>
                  Math.max(d.renders, d.credits / 5)
                )
              );
              const renderHeight =
                maxValue > 0 ? (day.renders / maxValue) * 240 : 0;
              const creditHeight =
                maxValue > 0 ? (day.credits / 5 / maxValue) * 240 : 0;

              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col justify-end h-60 space-y-1">
                    <div
                      className="bg-blue-500 rounded-t"
                      style={{ height: `${renderHeight}px` }}
                      title={`${day.renders} renders`}
                    ></div>
                    <div
                      className="bg-green-500 rounded-t"
                      style={{ height: `${creditHeight}px` }}
                      title={`${day.credits} credits`}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Renders</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Credits (÷5)</span>
            </div>
          </div>
        </div>

        {/* User Registrations */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            User Registrations
          </h3>
          <div className="h-64 flex items-end space-x-2">
            {data.userRegistrations.map((day, index) => {
              const maxValue = Math.max(
                ...data.userRegistrations.map((d) => d.count),
                1
              );
              const height = (day.count / maxValue) * 240;

              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex justify-end h-60">
                    <div
                      className="bg-indigo-500 rounded-t w-full"
                      style={{ height: `${height}px` }}
                      title={`${day.count} new users`}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Active Users
          </h3>
          <div className="space-y-3">
            {data.topUsers.slice(0, 10).map((user, index) => (
              <div
                key={user.userId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500">
                    #{index + 1}
                  </span>
                  <span
                    className="text-sm text-gray-900 truncate"
                    title={user.userId}
                  >
                    {user.userId.substring(0, 8)}...
                  </span>
                </div>
                <div className="flex space-x-4 text-sm">
                  <span className="text-blue-600">{user.renders} renders</span>
                  <span className="text-green-600">{user.credits} credits</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Style Popularity */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Style Popularity
          </h3>
          <div className="space-y-3">
            {data.stylePopularity.map((style, index) => {
              const maxCount = data.stylePopularity[0]?.count || 1;
              const percentage = (style.count / maxCount) * 100;

              return (
                <div key={style.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">
                      {style.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {style.count} uses
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
