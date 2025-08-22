import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdminClient();

    // Test database connection
    const checks = {
      database_connection: false,
      users_table: false,
      projects_table: false,
      styles_table: false,
      styles_data: false,
      storage_bucket: false,
      environment_vars: {
        supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hf_key: !!process.env.HUGGINGFACE_API_KEY,
      },
    };

    // Test database connection
    try {
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("count")
        .limit(1);

      checks.database_connection = !error;
      checks.users_table = !error;
    } catch (e) {
      console.log("Users table check failed:", e);
    }

    // Test projects table
    try {
      const { error } = await supabaseAdmin
        .from("projects")
        .select("count")
        .limit(1);

      checks.projects_table = !error;
    } catch (e) {
      console.log("Projects table check failed:", e);
    }

    // Test styles table
    try {
      const { data, error } = await supabaseAdmin.from("styles").select("*");

      checks.styles_table = !error;
      checks.styles_data = !!(data && data.length > 0);
    } catch (e) {
      console.log("Styles table check failed:", e);
    }

    // Test storage bucket
    try {
      const { data, error } = await supabaseAdmin.storage
        .from("images")
        .list("", { limit: 1 });

      checks.storage_bucket = !error;
    } catch (e) {
      console.log("Storage bucket check failed:", e);
    }

    const allGood =
      Object.values(checks)
        .filter((val) => typeof val === "boolean")
        .every(Boolean) &&
      Object.values(checks.environment_vars).every(Boolean);

    return NextResponse.json({
      status: allGood ? "healthy" : "issues_detected",
      checks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
