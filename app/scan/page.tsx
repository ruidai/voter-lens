"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Camera, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Plus
} from "lucide-react";

interface ExtractedData {
  candidates?: Array<{ name: string; office: string; details?: string }>;
  propositions?: Array<{ number: string; title: string; summary?: string }>;
  rawOcrSummary?: string;
}

export default function ScanPage() {
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const resultStr = reader.result as string;
      setImagePreview(resultStr);
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
        throw new Error("Failed to parse ballot flyer.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during OCR analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidates = () => {
    if (!result?.candidates) return;
    
    const currentStr = localStorage.getItem("voter_lens_candidates");
    const current: string[] = currentStr ? JSON.parse(currentStr) : [];
    
    const newCandidates = [...current];
    result.candidates.forEach(c => {
      if (c.name && !newCandidates.includes(c.name)) {
        newCandidates.push(c.name);
      }
    });

    localStorage.setItem("voter_lens_candidates", JSON.stringify(newCandidates));
    router.push("/dashboard");
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F9F9F7] text-[#111111] p-6 space-y-6 overflow-y-auto pb-24">
      {/* Editorial Navigation Header */}
      <div className="flex items-center gap-3 border-b-2 border-[#111111] pb-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="w-10 h-10 bg-transparent border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-extrabold text-[#111111] font-display uppercase tracking-tight">Ballot Scanner</h1>
          <span className="text-[9px] font-mono uppercase tracking-widest text-news-neutral-500 font-bold">Import Section // DDL 202</span>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Camera Capture Panel */}
      {!imagePreview ? (
        <button
          onClick={triggerCamera}
          className="flex-1 min-h-[250px] bg-[#F9F9F7] border border-[#111111] hover:bg-news-neutral-100 transition-colors flex flex-col items-center justify-center p-6 gap-3 outline-none"
        >
          {/* Halftone patterned circular element */}
          <div className="w-16 h-16 border border-[#111111] relative flex items-center justify-center bg-[#F9F9F7] text-[#111111]">
            <div className="absolute inset-0 bg-[radial-gradient(#111_1px,transparent_1px)] opacity-20 [background-size:8px_8px]" />
            <UploadCloud className="w-7 h-7 z-10" />
          </div>
          <span className="font-bold text-[#111111] text-xs uppercase tracking-widest">CAPTURE BALLOT FLYER</span>
          <span className="text-[10px] text-news-neutral-600 text-center max-w-[200px] leading-relaxed">
            Scan using camera or upload screenshot to extract candidate fields.
          </span>
        </button>
      ) : (
        <div className="space-y-4">
          {/* Image Preview Card with Grayscale/Sepia effects */}
          <div className="border border-[#111111] p-2 bg-white relative aspect-[4/3] flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={imagePreview} 
              alt="Ballot snapshot" 
              className="max-h-full max-w-full object-contain grayscale hover:sepia-[40%] transition-all duration-300"
            />
            <button
              onClick={triggerCamera}
              className="absolute bottom-4 right-4 px-3.5 py-1.5 bg-[#111111] text-[#F9F9F7] text-[10px] font-bold uppercase tracking-wider hover:bg-[#CC0000] transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              Retake
            </button>
          </div>

          {!result && (
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-4 bg-[#111111] hover:bg-[#CC0000] disabled:opacity-50 text-[#F9F9F7] text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 outline-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#F9F9F7]" />
                  RUNNING OCR PARSER...
                </>
              ) : (
                <>
                  <Sparkles className="w-4.5 h-4.5 fill-current" />
                  ANALYZE BALLOT CONTENT
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="border border-[#111111] p-6 space-y-3 animate-pulse bg-white">
          <div className="h-4 bg-news-neutral-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-news-neutral-200 rounded"></div>
            <div className="h-3 bg-news-neutral-200 rounded w-5/6"></div>
          </div>
        </div>
      )}

      {/* Error Stencil */}
      {error && (
        <div className="border-2 border-[#CC0000] p-4 bg-[#F9F9F7] flex gap-3 text-[#CC0000]">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="text-xs">
            <h4 className="font-bold uppercase tracking-widest">Analysis Failed</h4>
            <p className="mt-1 leading-normal font-mono">{error}</p>
          </div>
        </div>
      )}

      {/* Results Deck */}
      {result && (
        <div className="space-y-4">
          <div className="border-2 border-[#111111] p-4 bg-[#F9F9F7] flex gap-3 text-[#111111]">
            <CheckCircle className="w-5 h-5 shrink-0 text-[#CC0000]" />
            <div className="text-xs font-bold">
              <h4 className="uppercase tracking-widest">Parse Completed</h4>
              <p className="mt-0.5 opacity-90 leading-normal font-body italic font-normal">
                Double columns mapped with public candidates listings.
              </p>
            </div>
          </div>

          <div className="border border-[#111111] p-5 space-y-4 bg-white">
            <h3 className="text-xs font-mono font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2 border-b border-[#111111] pb-3 mb-2">
              <FileText className="w-4.5 h-4.5 text-[#CC0000]" />
              EXTRACTED PROFILES
            </h3>

            {result.candidates && result.candidates.length > 0 ? (
              <div className="space-y-4 divide-y divide-[#111111]">
                {result.candidates.map((cand, idx) => (
                  <div key={idx} className="text-xs space-y-1 pt-3 first:pt-0">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-extrabold uppercase font-sans text-[10px] tracking-wide text-[#111111]">{cand.name}</span>
                      <span className="text-[9px] font-mono uppercase text-news-neutral-500 font-bold shrink-0">{cand.office}</span>
                    </div>
                    {cand.details && (
                      <p className="text-news-neutral-600 leading-relaxed font-body text-justify">{cand.details}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-news-neutral-500 italic">No candidates detected in this scan.</p>
            )}

            {result.candidates && result.candidates.length > 0 && (
              <button
                onClick={handleAddCandidates}
                className="w-full py-3.5 mt-2 bg-[#111111] hover:bg-[#CC0000] text-[#F9F9F7] font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                ADD TO BALLOT TRACKER
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
