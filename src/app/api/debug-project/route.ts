import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { name, userId } = await request.json();

    console.log("Debug: Creating project with:", { name, userId });

    if (!name || !userId) {
      return NextResponse.json(
        { error: "Missing name or userId", received: { name, userId } },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();

    // Test database connection first
    const { data: testData, error: testError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    console.log("Debug: User check result:", { testData, testError });

    if (testError) {
      return NextResponse.json(
        { error: "User not found or database error", details: testError },
        { status: 404 }
      );
    }

    // Try to create the project
    const { data, error } = await supabaseAdmin
      .from("projects")
      .insert({
        name: name.trim(),
        user_id: userId,
      })
      .select()
      .single();

    console.log("Debug: Project creation result:", { data, error });

    if (error) {
      return NextResponse.json(
        { error: "Failed to create project", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, project: data });
  } catch (error) {
    console.error("Debug: API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
}
