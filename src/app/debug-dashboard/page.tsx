"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Project, Style } from "@/types/database";
import {
  Plus,
  FolderOpen,
  CreditCard,
  Loader2,
} from "lucide-react";

export default function FastDashboard() {
  const { user, profile, loading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (user && !loading) {
      loadData();
    }
  }, [user, loading]);

  const loadData = async () => {
    setLoadingData(true);
    setError("");
    
    try {
      console.log("Loading dashboard data...");
      
      // Load projects and styles in parallel
      const [projectsResult, stylesResult] = await Promise.all([
        supabase
          .from("projects")
          .select("*")
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("styles")
          .select("*")
          .order("name")
      ]);

      if (projectsResult.error) {
        console.error("Projects error:", projectsResult.error);
        throw new Error(`Projects: ${projectsResult.error.message}`);
      }

      if (stylesResult.error) {
        console.error("Styles error:", stylesResult.error);
        throw new Error(`Styles: ${stylesResult.error.message}`);
      }

      setProjects(projectsResult.data || []);
      setStyles(stylesResult.data || []);
      
      console.log("Data loaded successfully:", {
        projects: projectsResult.data?.length || 0,
        styles: stylesResult.data?.length || 0
      });

    } catch (error: any) {
      console.error("Dashboard loading error:", error);
      setError(error.message || "Failed to load dashboard");
    } finally {
      setLoadingData(false);
    }
  };

  // Show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Show sign-in required
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <div className="text-center max-w-md mx-auto p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to AI Room Styler
          </h2>
          <p className="text-gray-600 mb-8">
            Please sign in to access your dashboard
          </p>

          <div className="space-y-4">
            <button
              onClick={async () => {
                await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                  },
                });
              }}
              className="w-full bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-3 shadow-sm"
            >
              <span>Continue with Google</span>
            </button>

            <button
              onClick={async () => {
                await supabase.auth.signInWithOAuth({
                  provider: "github",
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                  },
                });
              }}
              className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center space-x-3 shadow-sm"
            >
              <span>Continue with GitHub</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {profile?.display_name || user.email}!
              </h1>
              <p className="text-gray-600">
                Dashboard Status: {loadingData ? "Loading..." : "Ready"}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-semibold">
                    {profile?.credits || 0}
                  </span>
                  <span className="text-indigo-100">credits</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="text-red-800">
                <h3 className="font-medium">Dashboard Error</h3>
                <p className="text-sm mt-1">{error}</p>
                <button 
                  onClick={loadData}
                  className="mt-2 text-sm bg-red-100 hover:bg-red-200 px-3 py-1 rounded transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <FolderOpen className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {loadingData ? "..." : projects.length}
                </div>
                <div className="text-gray-600">Projects</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Plus className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {loadingData ? "..." : styles.length}
                </div>
                <div className="text-gray-600">Styles Available</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {profile?.credits || 0}
                </div>
                <div className="text-gray-600">Credits</div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loadingData && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your data...</p>
          </div>
        )}

        {/* Projects List */}
        {!loadingData && !error && (
          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Projects</h2>
            
            {projects.length > 0 ? (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No projects yet. Create your first project to get started!
              </p>
            )}
          </div>
        )}

        {/* Debug Info */}
        <div className="mt-8 bg-gray-100 rounded-lg p-4 text-sm">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <ul className="space-y-1 text-gray-600">
            <li>User: {user ? "✅ Logged in" : "❌ Not logged in"}</li>
            <li>Profile: {profile ? "✅ Loaded" : "❌ Missing"}</li>
            <li>Auth Loading: {loading ? "⏳ Loading" : "✅ Complete"}</li>
            <li>Data Loading: {loadingData ? "⏳ Loading" : "✅ Complete"}</li>
            <li>Projects: {projects.length}</li>
            <li>Styles: {styles.length}</li>
            <li>Error: {error || "None"}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
