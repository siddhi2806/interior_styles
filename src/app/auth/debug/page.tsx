"use client";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function AuthDebug() {
  const { user, profile, loading } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("Current session:", session);
      console.log("Session error:", error);
      setSession(session);
      setSessionLoading(false);
    });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change:", event, session);
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Auth Debug Page</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Auth Context */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Auth Context</h2>
            <div className="space-y-2">
              <p>
                <strong>Loading:</strong> {loading ? "true" : "false"}
              </p>
              <p>
                <strong>User:</strong> {user ? "Yes" : "No"}
              </p>
              {user && (
                <div className="ml-4 space-y-1">
                  <p>
                    <strong>ID:</strong> {user.id}
                  </p>
                  <p>
                    <strong>Email:</strong> {user.email}
                  </p>
                  <p>
                    <strong>Provider:</strong> {user.app_metadata?.provider}
                  </p>
                </div>
              )}
              <p>
                <strong>Profile:</strong> {profile ? "Yes" : "No"}
              </p>
              {profile && (
                <div className="ml-4 space-y-1">
                  <p>
                    <strong>Display Name:</strong> {profile.display_name}
                  </p>
                  <p>
                    <strong>Credits:</strong> {profile.credits}
                  </p>
                  <p>
                    <strong>Admin:</strong> {profile.is_admin ? "Yes" : "No"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Session Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Supabase Session</h2>
            <div className="space-y-2">
              <p>
                <strong>Session Loading:</strong>{" "}
                {sessionLoading ? "true" : "false"}
              </p>
              <p>
                <strong>Session:</strong> {session ? "Yes" : "No"}
              </p>
              {session && (
                <div className="ml-4 space-y-1">
                  <p>
                    <strong>Access Token:</strong>{" "}
                    {session.access_token ? "Present" : "Missing"}
                  </p>
                  <p>
                    <strong>Refresh Token:</strong>{" "}
                    {session.refresh_token ? "Present" : "Missing"}
                  </p>
                  <p>
                    <strong>Expires At:</strong>{" "}
                    {session.expires_at
                      ? new Date(session.expires_at * 1000).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Environment Variables */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Environment</h2>
            <div className="space-y-2">
              <p>
                <strong>Supabase URL:</strong>{" "}
                {process.env.NEXT_PUBLIC_SUPABASE_URL}
              </p>
              <p>
                <strong>Site URL:</strong> {process.env.NEXT_PUBLIC_SITE_URL}
              </p>
              <p>
                <strong>Current Origin:</strong>{" "}
                {typeof window !== "undefined"
                  ? window.location.origin
                  : "Server"}
              </p>
            </div>
          </div>

          {/* Auth Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Auth Actions</h2>
            <div className="space-y-4">
              <button
                onClick={async () => {
                  console.log("Signing in with Google...");
                  await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                      redirectTo: `${window.location.origin}/auth/callback`,
                    },
                  });
                }}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Sign In with Google
              </button>

              <button
                onClick={async () => {
                  console.log("Signing in with GitHub...");
                  await supabase.auth.signInWithOAuth({
                    provider: "github",
                    options: {
                      redirectTo: `${window.location.origin}/auth/callback`,
                    },
                  });
                }}
                className="w-full bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
              >
                Sign In with GitHub
              </button>

              {user && (
                <button
                  onClick={async () => {
                    console.log("Signing out...");
                    await supabase.auth.signOut();
                  }}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
