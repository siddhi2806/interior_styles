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

    // Start transaction - get user and check credits
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

    // Get signed URL for the before image
    const { data: signedUrlData } = await supabaseAdmin.storage
      .from("images")
      .createSignedUrl(beforePath, 300); // 5 minutes

    if (!signedUrlData?.signedUrl) {
      // Refund credits if we can't get the image
      await supabaseAdmin
        .from("users")
        .update({ credits: userData.credits })
        .eq("id", userId);

      return NextResponse.json(
        { error: "Could not access uploaded image" },
        { status: 500 }
      );
    }

    // Prepare prompt based on style
    const stylePrompts: { [key: string]: string } = {
      Industrial:
        "Transform this interior photo into an Industrial living space. Keep furniture positions and architecture unchanged. Emphasize: exposed brick walls, metal beams, concrete floors, warm Edison bulbs, raw textures, neutral color palette. Maintain realistic lighting and natural textures.",
      Minimalist:
        "Transform this interior photo into a Minimalist living space. Keep furniture positions and architecture unchanged. Emphasize: clean lines, neutral palette, minimal furnishings, light woods, clutter-free, muted tones. Maintain realistic lighting and natural textures.",
      Rustic:
        "Transform this interior photo into a Rustic living space. Keep furniture positions and architecture unchanged. Emphasize: natural wood beams, warm wooden textures, woven fabrics, cozy textiles, earthy tones. Maintain realistic lighting and natural textures.",
      Scandinavian:
        "Transform this interior photo into a Scandinavian living space. Keep furniture positions and architecture unchanged. Emphasize: bright, airy, light wood, cozy textiles, functional minimal pieces, white walls, pastel accents. Maintain realistic lighting and natural textures.",
      Bohemian:
        "Transform this interior photo into a Bohemian living space. Keep furniture positions and architecture unchanged. Emphasize: layered textiles, colorful patterns, lots of plants, rattan furniture, eclectic mix. Maintain realistic lighting and natural textures.",
      Modern:
        "Transform this interior photo into a Modern living space. Keep furniture positions and architecture unchanged. Emphasize: sleek furniture, glass and metal, bold accent pieces, open layouts, polished floors. Maintain realistic lighting and natural textures.",
    };

    const prompt =
      stylePrompts[styleData?.name || "Modern"] || stylePrompts["Modern"];

    // Call AI service based on configuration
    const aiService = process.env.NEXT_PUBLIC_AI_SERVICE || "huggingface";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    let imageBuffer: ArrayBuffer | null = null;

    try {
      if (aiService === "replicate") {
        // Use Replicate API (more reliable)
        const replicateResponse = await fetch(
          "https://api.replicate.com/v1/predictions",
          {
            method: "POST",
            headers: {
              Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              version:
                "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4", // Stable Diffusion v1.5
              input: {
                prompt: prompt,
                width: 512,
                height: 512,
                num_inference_steps: 15,
                guidance_scale: 7.5,
              },
            }),
            signal: controller.signal,
          }
        );

        if (!replicateResponse.ok) {
          throw new Error(`Replicate API error: ${replicateResponse.status}`);
        }

        const prediction = await replicateResponse.json();

        // Poll for completion
        let completed = false;
        let attempts = 0;
        while (!completed && attempts < 30) {
          // Max 30 attempts (60 seconds)
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

          const statusResponse = await fetch(
            `https://api.replicate.com/v1/predictions/${prediction.id}`,
            {
              headers: {
                Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
              },
            }
          );

          const status = await statusResponse.json();

          if (status.status === "succeeded") {
            completed = true;
            // Download the image
            const imageResponse = await fetch(status.output[0]);
            imageBuffer = await imageResponse.arrayBuffer();
          } else if (status.status === "failed") {
            throw new Error("Image generation failed");
          }

          attempts++;
        }

        if (!completed) {
          throw new Error("Image generation timed out");
        }
      } else if (aiService === "openai") {
        // Use OpenAI DALL-E
        const openaiResponse = await fetch(
          "https://api.openai.com/v1/images/generations",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "dall-e-3",
              prompt: prompt,
              n: 1,
              size: "1024x1024",
              quality: "standard",
            }),
            signal: controller.signal,
          }
        );

        if (!openaiResponse.ok) {
          throw new Error(`OpenAI API error: ${openaiResponse.status}`);
        }

        const result = await openaiResponse.json();
        const imageUrl = result.data[0].url;

        // Download the image
        const imageResponse = await fetch(imageUrl);
        imageBuffer = await imageResponse.arrayBuffer();
      } else {
        // Fallback to Hugging Face
        const hfResponse = await fetch(
          `https://api-inference.huggingface.co/models/${process.env.NEXT_PUBLIC_HF_MODEL}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputs: prompt,
              parameters: {
                num_inference_steps: 15,
                guidance_scale: 7.5,
                width: 512,
                height: 512,
              },
              options: {
                wait_for_model: true,
                use_cache: false,
              },
            }),
            signal: controller.signal,
          }
        );

        if (!hfResponse.ok) {
          const errorText = await hfResponse.text();
          console.error("HF API Error:", hfResponse.status, errorText);

          if (hfResponse.status === 503) {
            // Refund credits
            await supabaseAdmin
              .from("users")
              .update({ credits: userData.credits })
              .eq("id", userId);

            return NextResponse.json(
              {
                error:
                  "AI model is warming up. Please try again in 30 seconds.",
                retryAfter: 30,
              },
              { status: 503 }
            );
          }

          throw new Error(`AI service error: ${hfResponse.status}`);
        }

        imageBuffer = await hfResponse.arrayBuffer();
      }

      clearTimeout(timeoutId);

      if (!imageBuffer || imageBuffer.byteLength === 0) {
        throw new Error("Generated image is empty");
      }
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        // Refund credits on timeout
        await supabaseAdmin
          .from("users")
          .update({ credits: userData.credits })
          .eq("id", userId);

        return NextResponse.json(
          {
            error: "AI processing timed out. Please try again.",
            timeout: true,
          },
          { status: 408 }
        );
      }

      // Refund credits on API failure
      await supabaseAdmin
        .from("users")
        .update({ credits: userData.credits })
        .eq("id", userId);

      return NextResponse.json(
        { error: error.message || "AI service temporarily unavailable" },
        { status: 503 }
      );
    }

    // Check if we got a valid image
    if (!imageBuffer) {
      return NextResponse.json(
        { error: "Failed to generate image" },
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
    });
  } catch (error) {
    console.error("Render API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
