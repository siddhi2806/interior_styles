import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

async function runPython(imagePath: string, styleName: string, outputPath: string) {
  return new Promise<{ caption: string; prompt: string; output_path: string; error?: string }>((resolve) => {
    const scriptPath = path.resolve(process.cwd(), "src/python/room_styler.py");
    const py = spawn("python", [scriptPath, imagePath, styleName, outputPath]);
    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (chunk) => (stdout += chunk));
    py.stderr.on("data", (chunk) => (stderr += chunk));
    py.on("error", (err) => {
      resolve({ caption: "", prompt: "", output_path: "", error: "Python process error: " + err.message });
    });
    py.on("close", () => {
      // Find the last valid JSON line in stdout
      const lines = stdout.trim().split("\n");
      let lastJson = null;
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          lastJson = JSON.parse(lines[i]);
          break;
        } catch {}
      }
      if (lastJson) {
        resolve(lastJson);
      } else {
        resolve({ caption: "", prompt: "", output_path: "", error: "Python script failed: " + stdout + "\n" + stderr });
      }
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, projectId, styleId, beforePath } = body;

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

    // Download the before image from Supabase Storage
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from("images")
      .createSignedUrl(beforePath, 60);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      // Refund credits
      await supabaseAdmin
        .from("users")
        .update({ credits: userData.credits })
        .eq("id", userId);
      return NextResponse.json(
        { error: "Could not get signed URL for before image" },
        { status: 500 }
      );
    }

    // Save image to temp file
    const tmpDir = path.resolve(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }
    const tempImagePath = path.join(tmpDir, `${Date.now()}_room.png`);
    const tempOutputPath = path.join(tmpDir, `${Date.now()}_styled.png`);
    const beforeImageResponse = await fetch(signedUrlData.signedUrl);
    const beforeImageBuffer = await beforeImageResponse.arrayBuffer();
    fs.writeFileSync(tempImagePath, Buffer.from(beforeImageBuffer));

    // Get style name from DB
    const styleName = styleData?.name || "Modern";

    // Call Python script (BLIP + Stable Diffusion)
    const pyResult = await runPython(tempImagePath, styleName, tempOutputPath);

    if (pyResult.error) {
      console.error("Python script error:", pyResult.error);

      // Refund credits
      await supabaseAdmin
        .from("users")
        .update({ credits: userData.credits })
        .eq("id", userId);

      // Clean up temp files if they exist
      try {
        if (fs.existsSync(tempImagePath)) fs.unlinkSync(tempImagePath);
        if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
      } catch (cleanupError) {
        console.warn("Failed to clean up temp files:", cleanupError);
      }

      return NextResponse.json(
        { error: "Image rendering failed", details: pyResult.error },
        { status: 503 }
      );
    }

    // Upload generated image to Supabase Storage
    const afterPath = `renders/${userId}/${projectId}/${Date.now()}_after.png`;
    const styledImageBuffer = fs.readFileSync(tempOutputPath);
    const { error: uploadError } = await supabaseAdmin.storage
      .from("images")
      .upload(afterPath, styledImageBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    // Clean up temp files after upload
    try {
      if (fs.existsSync(tempImagePath)) fs.unlinkSync(tempImagePath);
      if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
    } catch (cleanupError) {
      console.warn("Failed to clean up temp files:", cleanupError);
    }

    if (uploadError) {
      await supabaseAdmin
        .from("users")
        .update({ credits: userData.credits })
        .eq("id", userId);
      return NextResponse.json(
        { error: "Failed to save generated image" },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("images")
      .getPublicUrl(afterPath);

    const publicUrl = publicUrlData?.publicUrl;

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
      publicUrl,
      imageRecord,
      creditsRemaining: userData.credits - 5,
      message: "Image generated successfully with BLIP & Stable Diffusion",
      caption: pyResult.caption,
      prompt: pyResult.prompt,
    });
  } catch (error) {
    console.error("Render API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}