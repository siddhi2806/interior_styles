"use client";

import { useState } from "react";
import {
  Zap,
  Clock,
  Image,
  Cpu,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function PerformanceTips() {
  const [tipCategory, setTipCategory] = useState("speed");

  const speedTips = [
    {
      icon: <Image className="h-5 w-5" />,
      title: "Optimize Image Size",
      description:
        "Use images between 512x512 and 1024x1024 pixels for best performance",
      impact: "High",
    },
    {
      icon: <Cpu className="h-5 w-5" />,
      title: "Choose Simpler Styles",
      description:
        "Minimalist and Modern styles process faster than complex ones like Bohemian",
      impact: "Medium",
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Peak Hours",
      description:
        "AI processing is faster during off-peak hours (late night/early morning)",
      impact: "Medium",
    },
  ];

  const qualityTips = [
    {
      icon: <Image className="h-5 w-5" />,
      title: "High Resolution Images",
      description: "Use clear, well-lit photos for best transformation results",
      impact: "High",
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Good Lighting",
      description:
        "Natural lighting produces more realistic AI transformations",
      impact: "High",
    },
    {
      icon: <CheckCircle className="h-5 w-5" />,
      title: "Clear Room Views",
      description:
        "Front-facing room shots work better than angled or partial views",
      impact: "Medium",
    },
  ];

  const currentTips = tipCategory === "speed" ? speedTips : qualityTips;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Performance & Quality Tips
          </h1>
          <p className="text-xl text-gray-600">
            Get the best results from your AI transformations
          </p>
        </div>

        {/* Current Performance Stats */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Current Optimizations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Faster Model</h3>
              <p className="text-sm text-gray-600">
                Using Stable Diffusion v1.5 for 3-5x speed improvement
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Reduced Steps</h3>
              <p className="text-sm text-gray-600">
                8 inference steps (vs 20) for faster processing
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <Cpu className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Smart Timeout</h3>
              <p className="text-sm text-gray-600">
                60-second timeout with credit refund on failure
              </p>
            </div>
          </div>
        </div>

        {/* Tip Categories */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setTipCategory("speed")}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              tipCategory === "speed"
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-white/60 text-gray-700 hover:bg-white/80"
            }`}
          >
            <Zap className="h-4 w-4 inline mr-2" />
            Speed Tips
          </button>
          <button
            onClick={() => setTipCategory("quality")}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              tipCategory === "quality"
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-white/60 text-gray-700 hover:bg-white/80"
            }`}
          >
            <CheckCircle className="h-4 w-4 inline mr-2" />
            Quality Tips
          </button>
        </div>

        {/* Tips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {currentTips.map((tip, index) => (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-lg"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-indigo-100 p-2 rounded-lg">{tip.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900">{tip.title}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      tip.impact === "High"
                        ? "bg-red-100 text-red-700"
                        : tip.impact === "Medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {tip.impact} Impact
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-sm">{tip.description}</p>
            </div>
          ))}
        </div>

        {/* Expected Processing Times */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">
            Expected Processing Times
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                ✅ Optimized (Current)
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>Small images (512x512):</span>{" "}
                  <span className="font-medium">8-15 seconds</span>
                </li>
                <li className="flex justify-between">
                  <span>Medium images (768x768):</span>{" "}
                  <span className="font-medium">12-20 seconds</span>
                </li>
                <li className="flex justify-between">
                  <span>Large images (1024x1024):</span>{" "}
                  <span className="font-medium">15-25 seconds</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                ⚠️ Previous (Slow)
              </h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex justify-between">
                  <span>Small images:</span> <span>30-60 seconds</span>
                </li>
                <li className="flex justify-between">
                  <span>Medium images:</span> <span>45-90 seconds</span>
                </li>
                <li className="flex justify-between">
                  <span>Large images:</span> <span>60-120 seconds</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mt-8">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-amber-800">
              Still Experiencing Slow Processing?
            </h3>
          </div>
          <ul className="text-amber-700 text-sm space-y-2">
            <li>• Try refreshing the page and attempting again</li>
            <li>• Check your internet connection speed</li>
            <li>• Use a smaller image size (resize to 512x512)</li>
            <li>• Try during off-peak hours for faster processing</li>
            <li>• If the model is "warming up", wait 30 seconds and retry</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
