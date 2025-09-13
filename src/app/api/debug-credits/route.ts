import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    // Get user profile
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        display_name: user.display_name,
        credits: user.credits,
        is_admin: user.is_admin,
        blocked: user.blocked,
        created_at: user.created_at,
      },
    });
  } catch (error: any) {
    console.error("Debug credits error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, credits } = await request.json();

    if (!userId || credits === undefined) {
      return NextResponse.json(
        { error: "Missing userId or credits" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();

    // Update user credits
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ credits: credits })
      .eq("id", userId)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Credits updated to ${credits}`,
      data,
    });
  } catch (error: any) {
    console.error("Debug credits update error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
