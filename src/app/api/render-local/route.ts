import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import { join } from "path";

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

    // Test admin client connection
    try {
      const { data: testData, error: testError } = await supabaseAdmin
        .from("users")
        .select("count")
        .limit(1);

      if (testError) {
        console.error("Admin client test failed:", testError);
        return NextResponse.json(
          { error: "Database connection failed", details: testError.message },
          { status: 500 }
        );
      }
    } catch (connError: any) {
      console.error("Admin client connection error:", connError);
      return NextResponse.json(
        { error: "Database connection error", details: connError.message },
        { status: 500 }
      );
    }

    // Start transaction - get user and check credits
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("User lookup error:", userError);
      return NextResponse.json(
        { error: `User lookup failed: ${userError.message}` },
        { status: 404 }
      );
    }

    if (!userData) {
      console.error("User not found for ID:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`User ${userId} has ${userData.credits} credits`);

    if (userData.blocked) {
      return NextResponse.json({ error: "User is blocked" }, { status: 403 });
    }

    if (userData.credits < 5) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 }
      );
    }

    // Get style information
    const { data: styleData } = await supabaseAdmin
      .from("styles")
      .select("*")
      .eq("id", styleId)
      .single();

    if (!styleData) {
      return NextResponse.json({ error: "Style not found" }, { status: 404 });
    }

    // Get signed URL for the before image
    const { data: signedUrlData } = await supabaseAdmin.storage
      .from("images")
      .createSignedUrl(beforePath, 300); // 5 minutes

    if (!signedUrlData?.signedUrl) {
      return NextResponse.json(
        { error: "Could not access uploaded image" },
        { status: 500 }
      );
    }

    // Download the image to a temporary file
    const beforeImageResponse = await fetch(signedUrlData.signedUrl);
    const beforeImageBuffer = await beforeImageResponse.arrayBuffer();

    const tempDir = join(process.cwd(), "tmp");
    const tempInputPath = join(tempDir, `${Date.now()}_input.png`);
    const tempOutputPath = join(tempDir, `${Date.now()}_output.png`);

    // Ensure tmp directory exists
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Save the input image
    await fs.writeFile(tempInputPath, Buffer.from(beforeImageBuffer));

    // Run the local Python AI pipeline
    const pythonExecutable = join(
      process.cwd(),
      ".venv",
      "Scripts",
      "python.exe"
    );
    const scriptPath = join(process.cwd(), "src", "python", "room_styler.py");

    console.log(`Running local AI pipeline: ${pythonExecutable} ${scriptPath}`);

    try {
      const result = await runPythonScript(
        pythonExecutable,
        scriptPath,
        tempInputPath,
        styleData.name,
        tempOutputPath
      );

      if (!result.success) {
        throw new Error(result.error || "AI processing failed");
      }

      // Read the generated image
      const generatedImageBuffer = await fs.readFile(tempOutputPath);

      // Deduct credits only after successful generation
      const { error: deductError } = await supabaseAdmin
        .from("users")
        .update({ credits: userData.credits - 5 })
        .eq("id", userId);

      if (deductError) {
        console.error("Credits deduction error:", deductError);
        throw new Error(
          `Failed to deduct credits: ${
            deductError.message || JSON.stringify(deductError)
          }`
        );
      }

      // Log the usage
      await supabaseAdmin.from("usage_logs").insert({
        user_id: userId,
        project_id: projectId,
        type: "render",
        amount: -5,
        detail: {
          style_id: styleId,
          before_path: beforePath,
          ai_service: "local_python",
        },
      });

      // Upload the generated image to Supabase Storage
      const afterPath = `renders/${userId}/${projectId}/${Date.now()}_after.png`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from("images")
        .upload(afterPath, generatedImageBuffer, {
          contentType: "image/png",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        // Refund credits on upload failure
        const { error: refundError } = await supabaseAdmin
          .from("users")
          .update({ credits: userData.credits })
          .eq("id", userId);

        if (refundError) {
          console.error(
            "Failed to refund credits after upload failure:",
            refundError
          );
        }

        throw new Error(
          `Failed to save generated image: ${
            uploadError.message || JSON.stringify(uploadError)
          }`
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

      // Clean up temporary files
      try {
        await fs.unlink(tempInputPath);
        await fs.unlink(tempOutputPath);
      } catch (error) {
        console.error("Error cleaning up temp files:", error);
      }

      return NextResponse.json({
        success: true,
        afterPath,
        imageRecord,
        creditsRemaining: userData.credits - 5,
        caption: result.caption,
        prompt: result.prompt,
        aiService: "local_python",
      });
    } catch (aiError: any) {
      console.error("AI processing error:", aiError);

      // Clean up temporary files
      try {
        await fs.unlink(tempInputPath);
        await fs.unlink(tempOutputPath);
      } catch (error) {
        // Ignore cleanup errors
      }

      return NextResponse.json(
        {
          error: "AI processing failed",
          details: aiError.message,
          suggestion:
            "Try again in a few moments or contact support if the issue persists",
        },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error("Render API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

function runPythonScript(
  pythonPath: string,
  scriptPath: string,
  inputImage: string,
  style: string,
  outputImage: string
): Promise<{
  success: boolean;
  caption?: string;
  prompt?: string;
  error?: string;
}> {
  return new Promise((resolve, reject) => {
    const process = spawn(pythonPath, [
      scriptPath,
      inputImage,
      style,
      outputImage,
    ]);

    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    // Set a timeout for the process (15 minutes)
    const timeout = setTimeout(() => {
      process.kill();
      reject(new Error("Python script timed out after 15 minutes"));
    }, 15 * 60 * 1000);

    process.on("close", (code) => {
      clearTimeout(timeout);

      if (code === 0) {
        try {
          // Parse the JSON output from stdout
          const result = JSON.parse(stdout.trim());
          resolve({
            success: true,
            caption: result.caption,
            prompt: result.prompt,
          });
        } catch (parseError) {
          console.error("Failed to parse Python script output:", stdout);
          console.error("Stderr:", stderr);
          resolve({
            success: false,
            error: "Failed to parse AI script output",
          });
        }
      } else {
        console.error("Python script failed with code:", code);
        console.error("Stderr:", stderr);
        resolve({
          success: false,
          error: `Python script failed with exit code ${code}`,
        });
      }
    });

    process.on("error", (error) => {
      clearTimeout(timeout);
      console.error("Failed to start Python script:", error);
      resolve({
        success: false,
        error: `Failed to start AI processing: ${error.message}`,
      });
    });
  });
}
