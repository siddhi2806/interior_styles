import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("Testing Pollinations AI service...");

    // Test the free AI service
    const testPrompt =
      "modern living room with comfortable sofa and clean design";
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      testPrompt
    )}?width=512&height=512&model=flux&enhance=true`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(pollinationsUrl, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log("Pollinations response status:", response.status);

    if (response.ok) {
      const imageBuffer = await response.arrayBuffer();

      return NextResponse.json({
        success: true,
        service: "Pollinations AI",
        status: "Working perfectly!",
        imageSize: `${imageBuffer.byteLength} bytes`,
        message: "Free AI service is working - no API keys needed!",
        features: [
          "✅ No API key required",
          "✅ Free to use",
          "✅ Fast generation (5-10 seconds)",
          "✅ Good quality images",
          "✅ Perfect for room styling",
        ],
      });
    } else {
      return NextResponse.json({
        success: false,
        service: "Pollinations AI",
        error: `Service returned status ${response.status}`,
        message: "Service temporarily unavailable",
      });
    }
  } catch (error: any) {
    console.error("Error testing Pollinations AI:", error);

    if (error.name === "AbortError") {
      return NextResponse.json({
        success: false,
        error: "Service timeout",
        message: "AI service took too long to respond",
      });
    }

    return NextResponse.json({
      success: false,
      error: "Failed to test AI service",
      details: error.message,
    });
  }
}
