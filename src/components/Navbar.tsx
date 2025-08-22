"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Palette,
  User,
  LogOut,
  Menu,
  X,
  CreditCard,
  Home,
  Settings,
  Shield,
} from "lucide-react";

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignIn = async () => {
    try {
      console.log("🔐 Starting Google OAuth sign-in...");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("❌ OAuth sign-in error:", error);
        alert(`Sign-in failed: ${error.message}`);
        return;
      }

      console.log("✅ OAuth sign-in initiated:", data);
    } catch (error) {
      console.error("❌ Unexpected sign-in error:", error);
      alert(`Unexpected error: ${error}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Palette className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">
              AI Room Styler
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>

                {profile?.is_admin && (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600 transition-colors"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}

                <div className="flex items-center space-x-1 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                  <CreditCard className="h-4 w-4" />
                  <span>{profile?.credits || 0} credits</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {profile?.display_name || user.email}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={handleSignIn}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Sign In with Google
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-indigo-600"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 px-4 py-2">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    {profile?.display_name || user.email}
                  </span>
                </div>

                <div className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 rounded-lg mx-4">
                  <CreditCard className="h-4 w-4 text-indigo-600" />
                  <span className="text-indigo-800 font-medium">
                    {profile?.credits || 0} credits
                  </span>
                </div>

                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-indigo-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>

                {profile?.is_admin && (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-indigo-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}

                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="px-4">
                <button
                  onClick={handleSignIn}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Sign In with Google
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
