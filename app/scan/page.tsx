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
    
    // Read current stashed list
    const currentStr = localStorage.getItem("voter_lens_candidates");
    const current: string[] = currentStr ? JSON.parse(currentStr) : [];
    
    // Add new ones
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
    <div className="flex-1 flex flex-col bg-[#E0E5EC] p-6 space-y-6 overflow-y-auto pb-24">
      {/* Top navigation header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard")}
          className="w-10 h-10 rounded-xl bg-[#E0E5EC] text-[#3D4852] flex items-center justify-center shadow-[4px_4px_8px_rgba(163,177,198,0.4),-4px_-4px_8px_rgba(255,255,255,0.5)] active:scale-[0.94] transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-[#3D4852] font-display">Baller Scanner</h1>
          <p className="text-[10px] text-[#6B7280]">Scan flyers to import candidates</p>
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
          className="flex-1 min-h-[280px] rounded-[32px] bg-[#E0E5EC] shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] hover:shadow-[12px_12px_20px_rgba(163,177,198,0.7),-12px_-12px_20px_rgba(255,255,255,0.6)] hover:translate-y-[-1px] transition-all flex flex-col items-center justify-center p-6 gap-4 outline-none border-none"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#E0E5EC] text-[#6C63FF] flex items-center justify-center shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.6)]">
            <UploadCloud className="w-8 h-8" />
          </div>
          <span className="font-bold text-[#3D4852] text-sm">Upload Ballot/Mailer Photo</span>
          <span className="text-xs text-[#6B7280] text-center max-w-[200px] leading-relaxed">
            Position document flat and take a photo from directly above.
          </span>
        </button>
      ) : (
        <div className="space-y-6">
          {/* Image preview frame */}
          <div className="rounded-[32px] p-3 bg-[#E0E5EC] shadow-[inset_6px_6px_12px_rgba(163,177,198,0.5),inset_-6px_-6px_12px_rgba(255,255,255,0.6)] relative aspect-[4/3] flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={imagePreview} 
              alt="Mailer scan preview" 
              className="max-h-full max-w-full object-contain rounded-2xl"
            />
            <button
              onClick={triggerCamera}
              className="absolute bottom-4 right-4 px-3.5 py-2 rounded-xl bg-[#E0E5EC] text-[#3D4852] text-xs font-bold shadow-[3px_3px_6px_rgba(163,177,198,0.4),-3px_-3px_6px_rgba(255,255,255,0.5)] active:scale-[0.96] transition-all flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-[#6C63FF]" />
              Retake
            </button>
          </div>

          {!result && (
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-[#E0E5EC] font-extrabold text-[#6C63FF] shadow-[6px_6px_12px_rgba(163,177,198,0.5),-6px_-6px_12px_rgba(255,255,255,0.6)] hover:shadow-[8px_8px_16px_rgba(163,177,198,0.6)] hover:text-[#8B84FF] active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.6)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 outline-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#6C63FF]" />
                  Extracting Ballot Data...
                </>
              ) : (
                <>
                  <Sparkles className="w-4.5 h-4.5 fill-current" />
                  Analyze Mailer Image
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Skeleton loading well */}
      {loading && (
        <div className="rounded-[32px] bg-[#E0E5EC] p-6 shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] space-y-3 animate-pulse">
          <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded"></div>
            <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-5/6"></div>
          </div>
        </div>
      )}

      {/* OCR Failure Alert */}
      {error && (
        <div className="rounded-[24px] bg-[#E0E5EC] p-4 shadow-[inset_4px_4px_8px_rgba(163,177,198,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] flex gap-3 text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="text-xs">
            <h4 className="font-bold uppercase tracking-wider">Analysis Failed</h4>
            <p className="mt-1 leading-normal font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* OCR Findings Result Card */}
      {result && (
        <div className="space-y-6">
          <div className="rounded-[24px] bg-[#E0E5EC] p-4 shadow-[inset_4px_4px_8px_rgba(163,177,198,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] flex gap-3 text-emerald-700">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <div className="text-xs font-semibold">
              <h4 className="uppercase tracking-wider">Scanned Successfully</h4>
              <p className="mt-0.5 opacity-90 leading-normal">Extracted candidate details from election document.</p>
            </div>
          </div>

          <div className="rounded-[32px] bg-[#E0E5EC] p-6 shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] space-y-4">
            <h3 className="text-xs font-bold text-[#3D4852] uppercase tracking-wider flex items-center gap-2 border-b border-slate-300 pb-3 mb-2">
              <FileText className="w-4.5 h-4.5 text-[#6C63FF]" />
              Extracted Candidates
            </h3>

            {result.candidates && result.candidates.length > 0 ? (
              <div className="space-y-4">
                {result.candidates.map((cand, idx) => (
                  <div key={idx} className="text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#3D4852]">{cand.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#E0E5EC] text-[#6B7280] font-bold text-[9px] shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5)] uppercase tracking-wider">{cand.office}</span>
                    </div>
                    {cand.details && (
                      <p className="text-[#6B7280] leading-relaxed italic">{cand.details}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#6B7280] italic">No candidates detected in this scan.</p>
            )}

            {result.candidates && result.candidates.length > 0 && (
              <button
                onClick={handleAddCandidates}
                className="w-full py-3.5 mt-2 rounded-2xl bg-[#E0E5EC] font-bold text-[#38B2AC] shadow-[4px_4px_8px_rgba(163,177,198,0.4),-4px_-4px_8px_rgba(255,255,255,0.5)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4.5 h-4.5" />
                Add to Candidate Stance List
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
