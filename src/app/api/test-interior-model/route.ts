import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    const model = process.env.NEXT_PUBLIC_HF_MODEL;

    console.log("Testing interior room style model...");
    console.log("API Key present:", apiKey ? "Yes" : "No");
    console.log("Model:", model);

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "HUGGINGFACE_API_KEY not found in environment variables",
      });
    }

    if (!model) {
      return NextResponse.json({
        success: false,
        error: "NEXT_PUBLIC_HF_MODEL not found in environment variables",
      });
    }

    // Test the interior room model
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: "modern living room with comfortable sofa",
          parameters: {
            num_inference_steps: 20,
            guidance_scale: 7.5,
          },
        }),
      }
    );

    console.log("Response status:", response.status);

    if (response.status === 200) {
      return NextResponse.json({
        success: true,
        message: "Interior Room Style Model is working perfectly!",
        model: model,
        status: "Connected",
        license: "MIT (No restrictions)",
        description: "Perfect for interior design and room styling",
      });
    } else if (response.status === 503) {
      return NextResponse.json({
        success: true,
        message: "Model is loading - this is normal for the first request",
        model: model,
        status: "Loading",
        hint: "Try again in 30-60 seconds",
      });
    } else if (response.status === 401) {
      return NextResponse.json({
        success: false,
        error: "Invalid API key - please check your HUGGINGFACE_API_KEY",
        status: response.status,
      });
    } else {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        error: `API returned status ${response.status}`,
        details: errorText,
        status: response.status,
      });
    }
  } catch (error) {
    console.error("Error testing interior room model:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to test interior room model",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
