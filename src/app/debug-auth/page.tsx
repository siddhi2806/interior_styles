"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DebugAuth() {
  const [status, setStatus] = useState("");

  const testGoogleAuth = async () => {
    try {
      setStatus("🔄 Testing Google OAuth...");
      
      // Check if supabase is configured
      console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setStatus(`❌ Error: ${error.message}`);
        console.error("OAuth Error:", error);
      } else {
        setStatus("✅ OAuth initiated successfully");
        console.log("OAuth Data:", data);
      }
    } catch (error) {
      setStatus(`❌ Unexpected error: ${error}`);
      console.error("Unexpected error:", error);
    }
  };

  const checkSupabaseConfig = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log("Supabase URL:", url ? "✅ Set" : "❌ Missing");
    console.log("Supabase Anon Key:", key ? "✅ Set" : "❌ Missing");
    
    setStatus(`
      Supabase URL: ${url ? "✅ Set" : "❌ Missing"}
      Supabase Key: ${key ? "✅ Set" : "❌ Missing"}
    `);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔍 Auth Debug Page
        </h1>
        
        <div className="bg-white rounded-lg p-6 shadow-lg space-y-4">
          <button
            onClick={checkSupabaseConfig}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Check Supabase Configuration
          </button>
          
          <button
            onClick={testGoogleAuth}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Test Google OAuth
          </button>
          
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Status:</h3>
            <pre className="whitespace-pre-wrap text-sm">{status}</pre>
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>Debug info:</strong></p>
            <p>Current URL: {typeof window !== 'undefined' ? window.location.origin : 'Loading...'}</p>
            <p>Expected callback: {typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'Loading...'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
