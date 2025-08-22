import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "HUGGINGFACE_API_KEY not found in environment variables",
      });
    }

    console.log("Testing API key validity...");

    // Test with a simple API call to check if the key works
    const response = await fetch(
      "https://api-inference.huggingface.co/models",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    console.log("API Key test response status:", response.status);

    if (response.status === 401) {
      return NextResponse.json({
        success: false,
        error: "Invalid API key",
        message:
          "Your HUGGINGFACE_API_KEY is not valid. Please get a new one from https://huggingface.co/settings/tokens",
        status: 401,
      });
    }

    if (response.status === 200) {
      // Now test with the most basic Stable Diffusion model
      const sdResponse = await fetch(
        "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: "test image",
            parameters: {
              num_inference_steps: 1,
            },
          }),
        }
      );

      return NextResponse.json({
        success: true,
        apiKeyValid: true,
        sdModelStatus: sdResponse.status,
        message:
          sdResponse.status === 200
            ? "API key works! Stable Diffusion v1.5 is available"
            : sdResponse.status === 503
            ? "API key works! Model is loading (normal)"
            : sdResponse.status === 403
            ? "API key works but you need to accept the license for Stable Diffusion v1.5"
            : `API key works but model returned status ${sdResponse.status}`,
        recommendation:
          sdResponse.status === 200 || sdResponse.status === 503
            ? "Use runwayml/stable-diffusion-v1-5"
            : "Need to accept license or try different model",
      });
    }

    return NextResponse.json({
      success: false,
      error: `Unexpected response from Hugging Face API: ${response.status}`,
      message: "There might be an issue with the Hugging Face service",
    });
  } catch (error) {
    console.error("Error testing API key:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to test API key",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
