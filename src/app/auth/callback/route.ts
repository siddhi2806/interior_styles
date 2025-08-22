import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);

  try {
    const code = requestUrl.searchParams.get("code");
    const error = requestUrl.searchParams.get("error");
    const errorDescription = requestUrl.searchParams.get("error_description");

    // If there's an error, redirect to home with error
    if (error) {
      console.error("OAuth error:", error, errorDescription);
      return NextResponse.redirect(`${requestUrl.origin}/?error=${error}`);
    }

    // If there's a code, exchange it for a session
    if (code) {
      console.log("OAuth code received, exchanging for session...");
      
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error("Code exchange error:", exchangeError);
        return NextResponse.redirect(`${requestUrl.origin}/?error=exchange_failed`);
      }
      
      if (data.session) {
        console.log("Session created successfully, redirecting to dashboard");
        return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
      }
    }

    // Default redirect to home
    console.log("No code found, redirecting to home");
    return NextResponse.redirect(`${requestUrl.origin}/`);
  } catch (error) {
    console.error("Auth callback unexpected error:", error);
    return NextResponse.redirect(`${requestUrl.origin}/?error=callback_error`);
  }
}
