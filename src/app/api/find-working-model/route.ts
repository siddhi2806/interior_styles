import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "HUGGINGFACE_API_KEY not found",
      });
    }

    console.log("Testing working Stable Diffusion models...");

    // These are verified working models that don't require license approval
    const modelsToTest = [
      "prompthero/openjourney-v4",
      "wavymulder/Analog-Diffusion",
      "Fictiverse/Stable_Diffusion_PaperCut_Model",
      "nitrosocke/Nitro-Diffusion",
      "dreamlike-art/dreamlike-diffusion-1.0",
      "gsdf/Counterfeit-V2.5",
    ];

    const results = [];

    for (const model of modelsToTest) {
      try {
        console.log(`Testing model: ${model}`);

        const response = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputs: "modern living room interior design",
              parameters: {
                num_inference_steps: 10,
                guidance_scale: 7.5,
              },
            }),
          }
        );

        let status = "Working";
        if (response.status === 503) status = "Loading (Normal)";
        else if (response.status === 401) status = "Invalid API Key";
        else if (response.status === 403) status = "License Required";
        else if (response.status === 404) status = "Not Found";
        else if (response.status !== 200) status = `Error ${response.status}`;

        results.push({
          model: model,
          status: response.status,
          available: response.status === 200 || response.status === 503,
          message: status,
          recommended: response.status === 200 || response.status === 503,
        });

        // Break early if we find a working model
        if (response.status === 200 || response.status === 503) {
          console.log(`Found working model: ${model}`);
        }
      } catch (error) {
        results.push({
          model: model,
          status: "error",
          available: false,
          message: error instanceof Error ? error.message : "Network error",
          recommended: false,
        });
      }
    }

    // Find the best working model
    const workingModels = results.filter((r) => r.recommended);
    const bestModel = workingModels[0];

    return NextResponse.json({
      success: true,
      message: "Model availability test complete",
      results: results,
      recommendation: bestModel
        ? {
            model: bestModel.model,
            status: bestModel.message,
            instructions: `Update your .env.local file with: NEXT_PUBLIC_HF_MODEL=${bestModel.model}`,
          }
        : {
            error: "No working models found",
            suggestion: "Check your HUGGINGFACE_API_KEY or try again later",
          },
      workingCount: workingModels.length,
    });
  } catch (error) {
    console.error("Error testing models:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to test models",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
