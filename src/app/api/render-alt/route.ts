import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { userId, projectId, styleId, beforePath } = await request.json();

    if (!userId || !projectId || !styleId || !beforePath) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();

    // Get user and check credits
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userData.blocked) {
      return NextResponse.json({ error: "User is blocked" }, { status: 403 });
    }

    if (userData.credits < 5) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 }
      );
    }

    // Deduct credits
    const { error: deductError } = await supabaseAdmin
      .from("users")
      .update({ credits: userData.credits - 5 })
      .eq("id", userId);

    if (deductError) {
      return NextResponse.json(
        { error: "Failed to deduct credits" },
        { status: 500 }
      );
    }

    // Log the usage
    await supabaseAdmin.from("usage_logs").insert({
      user_id: userId,
      project_id: projectId,
      type: "render",
      amount: -5,
      detail: { style_id: styleId, before_path: beforePath },
    });

    // Get style information
    const { data: styleData } = await supabaseAdmin
      .from("styles")
      .select("*")
      .eq("id", styleId)
      .single();

    // Prepare prompt based on style
    const stylePrompts: { [key: string]: string } = {
      Industrial:
        "Transform this interior into an Industrial living space with exposed brick walls, metal beams, concrete floors, warm Edison bulbs, raw textures, neutral color palette",
      Minimalist:
        "Transform this interior into a Minimalist living space with clean lines, neutral palette, minimal furnishings, light woods, clutter-free design, muted tones",
      Rustic:
        "Transform this interior into a Rustic living space with natural wood beams, warm wooden textures, woven fabrics, cozy textiles, earthy tones",
      Scandinavian:
        "Transform this interior into a Scandinavian living space with bright, airy feel, light wood, cozy textiles, functional minimal pieces, white walls, pastel accents",
      Bohemian:
        "Transform this interior into a Bohemian living space with layered textiles, colorful patterns, lots of plants, rattan furniture, eclectic mix",
      Modern:
        "Transform this interior into a Modern living space with sleek furniture, glass and metal, bold accent pieces, open layouts, polished floors",
    };

    const prompt =
      stylePrompts[styleData?.name || "Modern"] || stylePrompts["Modern"];

    // Generate image using the most reliable method
    let imageBuffer: ArrayBuffer;

    try {
      // Try the free fallback service first (Pollinations AI)
      console.log("Using Pollinations AI for image generation...");

      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        prompt
      )}?width=512&height=512&model=flux&enhance=true`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(pollinationsUrl, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        imageBuffer = await response.arrayBuffer();
        console.log("Successfully generated image with Pollinations AI");
      } else {
        throw new Error(`Pollinations API returned status ${response.status}`);
      }
    } catch (error: any) {
      console.error("Image generation failed:", error);

      // Refund credits on failure
      await supabaseAdmin
        .from("users")
        .update({ credits: userData.credits })
        .eq("id", userId);

      return NextResponse.json(
        {
          error: "AI image generation failed. Please try again.",
          details: error.message,
        },
        { status: 503 }
      );
    }

    // Check if we got a valid image
    if (!imageBuffer || imageBuffer.byteLength === 0) {
      // Refund credits
      await supabaseAdmin
        .from("users")
        .update({ credits: userData.credits })
        .eq("id", userId);

      return NextResponse.json(
        { error: "Generated image is empty" },
        { status: 500 }
      );
    }

    // Upload the generated image to Supabase Storage
    const afterPath = `renders/${userId}/${projectId}/${Date.now()}_after.png`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("images")
      .upload(afterPath, imageBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);

      // Refund credits on upload failure
      await supabaseAdmin
        .from("users")
        .update({ credits: userData.credits })
        .eq("id", userId);

      return NextResponse.json(
        { error: "Failed to save generated image" },
        { status: 500 }
      );
    }

    // Create project image record
    const { data: imageRecord, error: recordError } = await supabaseAdmin
      .from("project_images")
      .insert({
        project_id: projectId,
        user_id: userId,
        before_path: beforePath,
        after_path: afterPath,
        style_id: styleId,
      })
      .select()
      .single();

    if (recordError) {
      console.error("Failed to create image record:", recordError);
    }

    return NextResponse.json({
      success: true,
      afterPath,
      imageRecord,
      creditsRemaining: userData.credits - 5,
      message: "Image generated successfully with Pollinations AI",
    });
  } catch (error) {
    console.error("Render API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
