"use client";

import { useState, useRef } from "react";
import { 
  Camera, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";

interface ExtractedData {
  candidates?: Array<{ name: string; office: string; details?: string }>;
  propositions?: Array<{ number: string; title: string; summary?: string }>;
  rawOcrSummary?: string;
}

export default function ScanPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show image preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const resultStr = reader.result as string;
      setImagePreview(resultStr);
      
      // Extract base64 without prefix for the API body
      const base64Data = resultStr.split(",")[1];
      setBase64Image(base64Data);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = async () => {
    if (!base64Image) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/process-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) {
        throw new Error("Failed to process document");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during document parsing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Camera className="text-blue-500 w-6 h-6" />
          Scan Election Mailer
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Take a photo of flyers, candidate mailers, or sample ballots to extract candidate profiles and local propositions.
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Camera Capture Card */}
      {!imagePreview ? (
        <button
          onClick={triggerCamera}
          className="flex-1 min-h-[250px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 hover:bg-slate-100/50 dark:hover:bg-slate-800/20 transition-all flex flex-col items-center justify-center p-6 gap-3 outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
            <UploadCloud className="w-8 h-8" />
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">Take Photo or Upload Image</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 text-center max-w-[200px]">
            Align mailer flat and capture in clear, bright lighting
          </span>
        </button>
      ) : (
        <div className="space-y-4">
          {/* Image Preview Container */}
          <div className="relative border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-900 aspect-[4/3] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={imagePreview} 
              alt="Mailer snapshot" 
              className="max-h-full max-w-full object-contain"
            />
            <button
              onClick={triggerCamera}
              className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/60 backdrop-blur text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 hover:bg-black/80"
            >
              <Camera className="w-3.5 h-3.5" />
              Retake
            </button>
          </div>

          {/* Action buttons */}
          {!result && (
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 active:scale-[0.98] transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Extracting Ballot Data...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 fill-white/10" />
                  Analyze Mailer Content
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-3 animate-pulse">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl p-4 flex gap-3 text-rose-800 dark:text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="text-sm">
            <h4 className="font-semibold">Analysis Failed</h4>
            <p className="mt-1 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Success Findings Results */}
      {result && (
        <div className="space-y-4">
          <div className="bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 flex gap-3 text-emerald-800 dark:text-emerald-400">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <div className="text-sm">
              <h4 className="font-semibold">Extraction Complete</h4>
              <p className="mt-0.5 opacity-90">Successfully extracted candidate list and propositions.</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Extracted Information
            </h3>

            {/* Candidates */}
            {result.candidates && result.candidates.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Candidates</h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {result.candidates.map((cand, idx) => (
                    <div key={idx} className="py-2 text-sm">
                      <span className="font-semibold text-slate-900 dark:text-white">{cand.name}</span>
                      <span className="text-slate-500 dark:text-slate-400 ml-1.5">runs for {cand.office}</span>
                      {cand.details && (
                        <p className="text-xs text-slate-400 mt-0.5">{cand.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Propositions */}
            {result.propositions && result.propositions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Propositions</h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {result.propositions.map((prop, idx) => (
                    <div key={idx} className="py-2 text-sm">
                      <span className="font-bold text-blue-600 dark:text-blue-400">{prop.number}</span>
                      <span className="font-semibold text-slate-900 dark:text-white ml-2">{prop.title}</span>
                      {prop.summary && (
                        <p className="text-xs text-slate-400 mt-1 leading-normal">{prop.summary}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw OCR Text Summary */}
            {result.rawOcrSummary && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">OCR Summary</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                  &ldquo;{result.rawOcrSummary}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
