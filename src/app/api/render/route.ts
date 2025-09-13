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
        "Transform this interior room photo into a sophisticated Industrial loft style. Emphasize exposed brick walls, raw concrete floors, and visible black metal ductwork on the ceiling. Incorporate furniture made of reclaimed wood and dark, matte steel. Lighting should come from Edison bulb pendants and oversized, black-framed factory-style windows that let in a lot of natural light. The color palette is charcoal, deep brown, and warm grays.",
      Minimalist:
        "Transform this interior room photo into a serene Minimalist style, focusing on 'less is more.' Emphasize clean, uninterrupted lines and a completely clutter-free space. Use a monochromatic neutral palette of soft whites, light grays, and beige. Introduce subtle texture with high-quality materials like light oak wood, linen curtains, and a soft wool rug. The space must be filled with abundant, soft natural light. All furniture should be functional with simple, elegant geometric forms. The final image must feel calm, airy, and impeccably clean.",
      Rustic:
        "Transform this interior room photo into a cozy modern Rustic aesthetic, like a chic mountain cabin. Use heavy, warm-toned wood beams on the ceiling and wide-plank hardwood floors. Feature a natural fieldstone accent wall or fireplace. Furnish with comfortable, oversized pieces upholstered in earthy textiles like genuine leather, wool, and flannel. The lighting should be warm and layered, creating a welcoming glow. Ensure all objects look solid, authentic, and handcrafted.",
      Scandinavian:
        "Transform this interior room photo into a Scandinavian (Scandi) design. The space must be bright, airy, and flooded with natural light. Use a palette of crisp white walls with soft gray and pastel accents. Flooring and furniture are made of light-colored woods like pale oak or ash. Incorporate cozy textures with sheepskin throws, wool blankets, and plush rugs. Add several live, green potted plants for a touch of nature. The final look should embody 'hygge'—a perfect balance of simple functionality and inviting warmth.",
      Bohemian:
        "Transform this interior room photo into a vibrant Bohemian (Boho) sanctuary. The style must be eclectic, layered, and relaxed. Use a base of warm, earthy tones and layer on rich, colorful textiles like a Moroccan rug, macrame wall hangings, and patterned throw pillows. Fill the room with an abundance of thriving houseplants, like a fiddle leaf fig and hanging pothos. Furniture should be a mix of vintage finds and natural rattan pieces. The atmosphere should be cozy with soft, ambient light from lanterns or string lights.",
      Modern:
        "Transform this interior room photo into a sleek Mid-Century Modern style. Furniture must have clean lines, organic curves, and a low profile, crafted from materials like warm walnut wood, polished chrome, and glass. Use a sophisticated color palette with a neutral base and bold accent colors like teal or burnt orange. Surfaces should be smooth and uncluttered. Include a single piece of large-scale abstract art as a focal point and ensure a strong connection to the outdoors with large windows. The result should feel intentional, sophisticated, and timeless.",
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
        // Download the before image from Supabase Storage
        const beforeImageResponse = await fetch(signedUrlData.signedUrl);
        const beforeImageBuffer = await beforeImageResponse.arrayBuffer();
        const beforeImageBase64 =
          Buffer.from(beforeImageBuffer).toString("base64");

        // Use Replicate Stable Diffusion img2img
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
                "a9758cb3b0d7e2c3c8e4e1c8e2e1c8e2e1c8e2e1c8e2e1c8e2e1c8e2e1c8e2e1", // Replicate SD img2img version
              input: {
                prompt: prompt,
                image: `data:image/png;base64,${beforeImageBase64}`,
                strength: 0.7,
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
        let outputUrl = null;
        while (!completed && attempts < 30) {
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
            outputUrl = status.output[0];
            // Download the image
            const imageResponse = await fetch(outputUrl);
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
