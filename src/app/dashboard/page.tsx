"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ProjectCard } from "@/components/ProjectCard";
import { CreateProjectModal } from "@/components/CreateProjectModal";
import { RenderPanel } from "@/components/RenderPanel";
import { Project, Style } from "@/types/database";
import { gsap } from "gsap";
import {
  Plus,
  FolderOpen,
  Palette,
  CreditCard,
  Sparkles,
  History,
} from "lucide-react";

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  
  // Debug environment variables
  useEffect(() => {
    console.log('Environment check:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing',
      currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'Server-side'
    });
  }, []);
  const [projects, setProjects] = useState<Project[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [projectCount, setProjectCount] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingStyles, setLoadingStyles] = useState(true);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      const startTime = performance.now();
      console.log("Dashboard: Starting ultra-fast data fetch...");

      // Start with immediate UI state, then load data
      setLoadingProjects(false); // Show UI immediately
      setLoadingStats(false);
      setLoadingStyles(true); // Keep styles loading until data arrives

      // Load data in background
      loadDashboardData().then(() => {
        const endTime = performance.now();
        console.log(`Dashboard: Data loaded in ${endTime - startTime}ms`);
      });
    }
  }, [user]);

  // Ultra-fast dashboard loading strategy
  const loadDashboardData = async () => {
    if (!user) return;

    try {
      console.log("Loading dashboard data with optimized strategy...");

      // Strategy 1: Load only the most essential data first
      const basicProjectsPromise = supabase
        .from("projects")
        .select("id, name, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6); // Even fewer for speed

      // Strategy 2: Use a simple count
      const projectCountPromise = supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Strategy 3: Cache styles or use defaults
      const stylesPromise = loadStylesOptimized();

      // Execute all in parallel
      const [projectsResult, countResult, stylesResult] = await Promise.all([
        basicProjectsPromise,
        projectCountPromise,
        stylesPromise,
      ]);

      // Update projects
      if (projectsResult.data) {
        setProjects(projectsResult.data as Project[]);
        console.log(`Loaded ${projectsResult.data.length} projects`);
      }

      // Update count
      if (countResult.count !== null) {
        setProjectCount(countResult.count);
        console.log(`Total projects: ${countResult.count}`);
      }

      // Update styles
      if (stylesResult) {
        setStyles(stylesResult);
        console.log(`Loaded ${stylesResult.length} styles`);
      }
      setLoadingStyles(false); // Mark styles as loaded
    } catch (error) {
      console.error("Error in ultra-fast loading:", error);
      // Set defaults for immediate UI
      setProjects([]);
      setProjectCount(0);
      setStyles([]);
      setLoadingStyles(false); // Mark styles loading as complete even on error
    }
  };

  // Optimized styles loading with caching
  const loadStylesOptimized = async () => {
    try {
      console.log("🎨 Starting styles fetch...");
      
      // Check if we have cached styles
      const cachedStyles = sessionStorage.getItem("styles_cache");
      if (cachedStyles) {
        console.log("📦 Using cached styles");
        return JSON.parse(cachedStyles);
      }

      console.log("🔍 Fetching styles from database...");
      
      // Load minimal styles data
      const { data, error } = await supabase
        .from("styles")
        .select("*")
        .limit(20); // Much smaller limit

      console.log("📊 Styles query result:", { data, error, count: data?.length });

      if (error && Object.keys(error).length > 0) {
        console.error("❌ Styles error:", error);
        return [];
      }

      // Cache for next time
      if (data) {
        sessionStorage.setItem("room_styles", JSON.stringify(data));
        console.log("💾 Cached styles for next time");
      }

      return data || [];
    } catch (error) {
      console.error("❌ Error loading styles:", error);
      return [];
    }
  };

  // Simplified animations for better performance
  useEffect(() => {
    if (!loading && !loadingProjects && !loadingStats) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".dashboard-header",
          { opacity: 0 },
          { opacity: 1, duration: 0.3 }
        );
      }, dashboardRef);

      return () => ctx.revert();
    }
  }, [loading, loadingProjects, loadingStats]);

  const handleCreateProject = async (name: string) => {
    try {
      console.log("Creating project with:", { name, userId: user?.id });

      // Use debug API temporarily
      const response = await fetch("/api/debug-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          userId: user?.id,
        }),
      });

      const result = await response.json();
      console.log("Project creation result:", result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to create project");
      }

      if (result.success && result.project) {
        setProjects([result.project, ...projects]);
        setProjectCount((prev) => prev + 1); // Update count
        setSelectedProject(result.project);
        setIsCreateModalOpen(false);
        console.log("Project created successfully:", result.project);
      }
    } catch (error) {
      console.error("Error creating project:", error);
      alert(`Error creating project: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <div className="text-center max-w-md mx-auto p-8">
          <Palette className="h-16 w-16 text-indigo-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to AI Room Styler
          </h2>
          <p className="text-gray-600 mb-8">
            Please sign in to access your dashboard and start transforming your
            spaces.
          </p>

          <div className="space-y-4">
            <button
              onClick={async () => {
                try {
                  console.log('Starting Google OAuth sign-in...');
                  const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                      redirectTo: `${window.location.origin}/auth/callback`,
                      queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                      }
                    },
                  });
                  
                  console.log('OAuth response:', { data, error });
                  
                  if (error) {
                    console.error('OAuth Error:', error);
                    alert(`Sign-in failed: ${error.message}`);
                    
                    // Fallback: Try direct Supabase auth URL
                    const fallbackUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin + '/auth/callback')}`;
                    console.log('Trying fallback URL:', fallbackUrl);
                    window.location.href = fallbackUrl;
                  }
                } catch (err) {
                  console.error('Unexpected error during sign-in:', err);
                  alert('Sign-in failed. Please try again.');
                }
              }}
              className="w-full bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-3 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
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
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>Continue with GitHub</span>
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dashboardRef}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="dashboard-header mb-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {profile?.display_name || "Designer"}!
                </h1>
                <p className="text-gray-600">
                  Ready to transform some spaces? You have amazing projects
                  waiting.
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

                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center space-x-2 shadow-lg"
                >
                  <Plus className="h-5 w-5" />
                  <span>New Project</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <FolderOpen className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {loadingStats ? (
                    <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    projectCount
                  )}
                </div>
                <div className="text-gray-600">Total Projects</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {loadingStyles ? (
                    <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    styles.length
                  )}
                </div>
                <div className="text-gray-600">Available Styles</div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <History className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">Recent</div>
                <div className="text-gray-600">Activity</div>
              </div>
            </div>
          </div>
        </div>

        {/* Render Panel */}
        {selectedProject && (
          <div className="mb-8">
            <RenderPanel
              project={selectedProject}
              styles={styles}
              onSuccess={() => {
                // Refresh projects or handle success
                console.log("Render successful");
              }}
            />
          </div>
        )}

        {/* Projects Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Projects</h2>
            {projects.length > 0 && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Create New</span>
              </button>
            )}
          </div>

          {loadingProjects ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/60 rounded-xl p-6 animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onSelect={() => setSelectedProject(project)}
                  isSelected={selectedProject?.id === project.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 border border-white/20 max-w-md mx-auto">
                <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Projects Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first project to start transforming spaces with
                  AI.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create Your First Project</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
}
