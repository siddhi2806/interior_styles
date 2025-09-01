"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Project, Style } from "@/types/database";
import { gsap } from "gsap";
import {
  Upload,
  Image as ImageIcon,
  Wand2,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
} from "lucide-react";

interface RenderPanelProps {
  project: Project;
  styles: Style[];
  onSuccess: () => void;
}

export function RenderPanel({ project, styles, onSuccess }: RenderPanelProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [renderResult, setRenderResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const getImageUrl = (afterPath: string) => {
  return supabase.storage.from("images").getPublicUrl(afterPath).data.publicUrl;
};

  useEffect(() => {
    if (panelRef.current) {
      gsap.fromTo(
        panelRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
      );
    }
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

const uploadImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${user?.id}/${project.id}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    setError("Upload failed: " + uploadError.message);
    setUploading(false);
    throw uploadError;
  }
  return fileName;
};

  const handleRender = async () => {
  if (!selectedFile || !selectedStyle || !user || !profile) {
    setError("Please select an image and style");
    return;
  }

  if (profile.credits < 5) {
    setError("Insufficient credits. You need at least 5 credits to render.");
    return;
  }

  setError(null);
  setUploading(true);
  setRenderProgress(0);

  try {
    // Upload the image first
    const imagePath = await uploadImage(selectedFile);
    setUploading(false);
    setRendering(true);
    setEstimatedTime(15);

    // Start progress animation
    const progressInterval = setInterval(() => {
      setRenderProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 1000);

    // Call the render API with required fields
    const startTime = Date.now();
    const response = await fetch("/api/render-alt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        projectId: project.id,
        styleId: selectedStyle,
        beforePath: imagePath,
      }),
    });

    clearInterval(progressInterval);
    setRenderProgress(100);

    const result = await response.json();
    console.log("Render API result:", result);

    if (!response.ok) {
      setError(result.error || "Rendering failed");
      return;
    }

    const actualTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`Render completed in ${actualTime} seconds`);

    setRenderResult({
      publicUrl: result.publicUrl,
      creditsRemaining: result.creditsRemaining,
    });
    await refreshProfile();
    onSuccess();

    gsap.fromTo(
      ".success-message",
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
    );
  } catch (error: any) {
    console.error("Render error:", error);
    setError(error.message || "Failed to render image");
  } finally {
    setUploading(false);
    setRendering(false);
    setRenderProgress(0);
  }
};

  const resetPanel = () => {
    setSelectedFile(null);
    setSelectedStyle(null);
    setRenderResult(null);
    setError(null);
    setRenderProgress(0);
    setEstimatedTime(0);
  };

  const selectedStyleData = styles.find((s) => s.id === selectedStyle);

  return (
    <div
      ref={panelRef}
      className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            AI Style Transformer
          </h3>
          <p className="text-gray-600">
            Upload an image and transform it with AI-powered styling
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Project:</p>
          <p className="font-semibold text-gray-900">{project.name}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {renderResult ? (
        <div className="success-message text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h4 className="text-xl font-semibold text-gray-900">
            Render Complete!
          </h4>
          <p className="text-gray-600">
            Your image has been successfully transformed with the{" "}
            {selectedStyleData?.name} style.
          </p>
          {renderResult?.publicUrl && (
  <img
    src={renderResult.publicUrl}
    alt="AI Styled Room"
    className="mx-auto rounded-lg shadow-lg border mt-4"
    style={{ maxWidth: "100%", maxHeight: 400 }}
  />
)}
          <p className="text-sm text-gray-500">
            Credits remaining: {renderResult.creditsRemaining}
          </p>
          <button
            onClick={resetPanel}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Create Another Render
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Room Image
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-indigo-400 bg-indigo-50"
                  : selectedFile
                  ? "border-green-400 bg-green-50"
                  : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50"
              }`}
            >
              <input {...getInputProps()} />
              {selectedFile ? (
                <div className="space-y-2">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                  <p className="text-green-700 font-medium">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-green-600">Ready to transform!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="text-gray-600">
                    {isDragActive
                      ? "Drop your image here"
                      : "Drag & drop an image or click to browse"}
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, WEBP up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Style Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Design Style
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                    selectedStyle === style.id
                      ? "border-indigo-500 bg-indigo-50 shadow-md"
                      : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <div className="font-medium text-gray-900">{style.name}</div>
                  {style.description && (
                    <div className="text-xs text-gray-600 mt-1">
                      {style.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Render Button */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <p>Cost: 5 credits per render</p>
              <p>Your credits: {profile?.credits || 0}</p>
              <p className="text-xs text-indigo-600 mt-1">
                ⚡ Processing time: ~15 seconds
              </p>
            </div>

            <button
              onClick={handleRender}
              disabled={
                !selectedFile ||
                !selectedStyle ||
                uploading ||
                rendering ||
                (profile?.credits || 0) < 5
              }
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg disabled:shadow-none"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : rendering ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <div className="flex flex-col items-center space-y-2">
                    <span>Transforming with AI...</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${renderProgress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">
                      ~{estimatedTime}s remaining
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Transform with AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
