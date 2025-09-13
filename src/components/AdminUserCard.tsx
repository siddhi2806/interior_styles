"use client";

import { useState } from "react";
import {
  User,
  CreditCard,
  Calendar,
  Shield,
  Edit3,
  Ban,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { User as UserType } from "@/types/database";

interface UserStats extends UserType {
  project_count: number;
  render_count: number;
  total_credits_used: number;
}

interface AdminUserCardProps {
  user: UserStats;
  onUpdateCredits: (userId: string, newCredits: number) => void;
  onBlockUser: (userId: string, blocked: boolean) => void;
}

export function AdminUserCard({
  user,
  onUpdateCredits,
  onBlockUser,
}: AdminUserCardProps) {
  const [isEditingCredits, setIsEditingCredits] = useState(false);
  const [creditInput, setCreditInput] = useState(user.credits.toString());
  const [loading, setLoading] = useState(false);

  const handleSaveCredits = async () => {
    const newCredits = parseInt(creditInput);
    if (isNaN(newCredits) || newCredits < 0) {
      alert("Please enter a valid number of credits");
      return;
    }

    setLoading(true);
    try {
      await onUpdateCredits(user.id, newCredits);
      setIsEditingCredits(false);
    } catch (error) {
      console.error("Error updating credits:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async () => {
    setLoading(true);
    try {
      await onBlockUser(user.id, !user.blocked);
    } catch (error) {
      console.error("Error toggling user block:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      className={`bg-white rounded-lg p-6 border-2 transition-all duration-200 ${
        user.blocked
          ? "border-red-200 bg-red-50"
          : "border-gray-200 hover:border-indigo-200 hover:shadow-md"
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* User Info */}
        <div className="flex items-center space-x-4 flex-1">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              user.blocked ? "bg-red-100" : "bg-indigo-100"
            }`}
          >
            <User
              className={`h-6 w-6 ${
                user.blocked ? "text-red-600" : "text-indigo-600"
              }`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {user.display_name || "Unknown User"}
              </h3>
              {user.blocked && (
                <div className="flex items-center space-x-1 text-red-600">
                  <Ban className="h-4 w-4" />
                  <span className="text-xs font-medium">BLOCKED</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 truncate">{user.id}</p>
            <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
              <Calendar className="h-3 w-3" />
              <span>Joined {formatDate(user.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 lg:gap-6">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {user.project_count}
            </div>
            <div className="text-xs text-gray-500">Projects</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {user.render_count}
            </div>
            <div className="text-xs text-gray-500">Renders</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {user.total_credits_used}
            </div>
            <div className="text-xs text-gray-500">Credits Used</div>
          </div>
        </div>

        {/* Credits Management */}
        <div className="flex items-center space-x-3">
          <div className="text-center">
            <div className="text-sm text-gray-500">Credits</div>
            {isEditingCredits ? (
              <div className="flex items-center space-x-2 mt-1">
                <input
                  type="number"
                  value={creditInput}
                  onChange={(e) => setCreditInput(e.target.value)}
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                />
                <button
                  onClick={handleSaveCredits}
                  disabled={loading}
                  className="text-green-600 hover:text-green-800 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setIsEditingCredits(false);
                    setCreditInput(user.credits.toString());
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className={`text-lg font-bold ${
                    user.credits < 10 ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {user.credits}
                </span>
                <button
                  onClick={() => setIsEditingCredits(true)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleBlock}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${
              user.blocked
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-red-100 text-red-700 hover:bg-red-200"
            }`}
          >
            {user.blocked ? "Unblock" : "Block"}
          </button>
        </div>
      </div>

      {/* Warning for low credits */}
      {user.credits < 10 && !user.blocked && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-700">
            User has low credits and may not be able to create renders.
          </span>
        </div>
      )}
    </div>
  );
}
