import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { userId, name } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    // First, check if user already exists
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 means no rows returned (user doesn't exist), which is fine
      console.error("Error checking existing user:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (existingUser) {
      // User exists, only update the display name if provided, preserve credits
      const { data, error } = await supabaseAdmin
        .from("users")
        .update({
          display_name: name || existingUser.display_name,
        })
        .eq("id", userId)
        .select();

      if (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log(
        "Updated existing user profile, preserved credits:",
        existingUser.credits
      );
      return NextResponse.json({ success: true, data, existing: true });
    } else {
      // User doesn't exist, create new profile with initial credits
      const { data, error } = await supabaseAdmin
        .from("users")
        .insert({
          id: userId,
          display_name: name || null,
          credits: 50,
          is_admin: false,
          blocked: false,
        })
        .select();

      if (error) {
        console.error("Profile creation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log("Created new user profile with 50 credits");
      return NextResponse.json({ success: true, data, existing: false });
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
