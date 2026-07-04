"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Vote, 
  Sparkles, 
  Camera, 
  Plus, 
  X, 
  UserCheck, 
  Lock,
  ArrowRight
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  
  // Stance inputs
  const [stance, setStance] = useState("");
  const [candidateInput, setCandidateInput] = useState("");
  const [candidates, setCandidates] = useState<string[]>([
    "Sarah Jenkins",
    "David Cole"
  ]);

  // Auth banner state
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user has saved credentials locally
    const savedUrl = localStorage.getItem("supabase_url");
    if (savedUrl) {
      setIsLoggedIn(true);
    }
  }, []);

  const addCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = candidateInput.trim();
    if (name && !candidates.includes(name)) {
      setCandidates([...candidates, name]);
      setCandidateInput("");
    }
  };

  const removeCandidate = (name: string) => {
    setCandidates(candidates.filter(c => c !== name));
  };

  const handleStart = () => {
    // Stash parameters in localStorage for the Chat page to read and analyze
    localStorage.setItem("voter_lens_candidates", JSON.stringify(candidates));
    localStorage.setItem("voter_lens_stance", stance);
    
    // Redirect to alignment chat wizard
    router.push("/chat");
  };

  return (
    <div className="flex-1 flex flex-col bg-[#E0E5EC] p-6 space-y-6 overflow-y-auto pb-24">
      {/* Top Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#3D4852] font-display flex items-center gap-2">
            <Vote className="w-7 h-7 text-[#6C63FF]" />
            Voter Lens
          </h1>
          <p className="text-xs text-[#6B7280] font-medium tracking-wide uppercase mt-1">AI Stance & Alignment Finder</p>
        </div>
      </div>

      {/* Login Incentive Well */}
      {!isLoggedIn && (
        <div className="rounded-[24px] bg-[#E0E5EC] p-4 shadow-[inset_6px_6px_12px_rgba(163,177,198,0.5),inset_-6px_-6px_12px_rgba(255,255,255,0.6)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E0E5EC] flex items-center justify-center text-[#6C63FF] shadow-[3px_3px_6px_rgba(163,177,198,0.3),-3px_-3px_6px_rgba(255,255,255,0.4)]">
              <Lock className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-[11px] font-bold text-[#3D4852] block">Save Your Alignment</span>
              <span className="text-[9px] text-[#6B7280]">Log in to remember your political stances safely.</span>
            </div>
          </div>
          <Link 
            href="/login" 
            className="px-3 py-1.5 rounded-xl bg-[#E0E5EC] text-xs font-bold text-[#6C63FF] shadow-[4px_4px_8px_rgba(163,177,198,0.4),-4px_-4px_8px_rgba(255,255,255,0.5)] active:scale-[0.96] transition-all"
          >
            Sign In
          </Link>
        </div>
      )}

      {/* Step 1: Input Candidates or Scan Ballot */}
      <div className="rounded-[32px] bg-[#E0E5EC] p-6 shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] space-y-4">
        <h2 className="text-sm font-bold text-[#3D4852] tracking-tight uppercase flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[#E0E5EC] text-[#6C63FF] text-[10px] font-extrabold flex items-center justify-center shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.5)]">1</span>
          Target Candidates
        </h2>

        {/* Scan ballot redirect button */}
        <button
          onClick={() => router.push("/scan")}
          className="w-full py-3.5 rounded-2xl bg-[#E0E5EC] text-xs font-bold text-[#3D4852] hover:text-[#6C63FF] shadow-[5px_5px_10px_rgba(163,177,198,0.4),-5px_-5px_10px_rgba(255,255,255,0.5)] hover:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.4)] hover:translate-y-[0.5px] transition-all flex items-center justify-center gap-2"
        >
          <Camera className="w-4 h-4 text-[#6C63FF]" />
          Scan Voter Ballot or Mailer
        </button>

        {/* Input Manual candidates form */}
        <form onSubmit={addCandidate} className="flex gap-2">
          <input
            type="text"
            placeholder="Add candidate (e.g. Jane Doe)"
            value={candidateInput}
            onChange={(e) => setCandidateInput(e.target.value)}
            className="flex-1 px-4 py-3 text-sm bg-[#E0E5EC] text-[#3D4852] placeholder-[#A0AEC0] rounded-2xl shadow-[inset_5px_5px_10px_rgba(163,177,198,0.5),inset_-5px_-5px_10px_rgba(255,255,255,0.6)] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 transition-all"
          />
          <button
            type="submit"
            className="w-11 h-11 rounded-2xl bg-[#E0E5EC] text-[#6C63FF] flex items-center justify-center shadow-[5px_5px_10px_rgba(163,177,198,0.4),-5px_-5px_10px_rgba(255,255,255,0.5)] active:scale-[0.94] transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </form>

        {/* Candidate chips list */}
        <div className="flex flex-wrap gap-2 pt-2">
          {candidates.map((name) => (
            <div 
              key={name}
              className="px-3.5 py-2 rounded-xl bg-[#E0E5EC] text-xs font-semibold text-[#3D4852] shadow-[3px_3px_6px_rgba(163,177,198,0.3),-3px_-3px_6px_rgba(255,255,255,0.4)] flex items-center gap-1.5"
            >
              <span>{name}</span>
              <button 
                onClick={() => removeCandidate(name)}
                className="text-[#6B7280] hover:text-rose-500 rounded-full p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {candidates.length === 0 && (
            <p className="text-xs text-[#6B7280] italic">No candidates added. Scan a ballot or type a name.</p>
          )}
        </div>
      </div>

      {/* Step 2: User Stance Paragraph */}
      <div className="rounded-[32px] bg-[#E0E5EC] p-6 shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] space-y-4">
        <h2 className="text-sm font-bold text-[#3D4852] tracking-tight uppercase flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[#E0E5EC] text-[#6C63FF] text-[10px] font-extrabold flex items-center justify-center shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.5)]">2</span>
          Your Political Stance
        </h2>
        <p className="text-[11px] text-[#6B7280] mt-1">
          (Optional) Write a few sentences about how you view policy issues to refine the questionnaire automatically.
        </p>

        <div className="relative">
          <textarea
            rows={4}
            value={stance}
            onChange={(e) => setStance(e.target.value)}
            placeholder="I support green energy development and increasing choice in public education. I prefer moderate fiscal spending but want strong accountability in local governance..."
            className="w-full p-4 text-xs bg-[#E0E5EC] text-[#3D4852] placeholder-[#A0AEC0] rounded-2xl shadow-[inset_5px_5px_10px_rgba(163,177,198,0.5),inset_-5px_-5px_10px_rgba(255,255,255,0.6)] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 transition-all resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* CTA Button to Trigger Alignment questionnaire */}
      <button
        onClick={handleStart}
        disabled={candidates.length === 0}
        className="w-full py-4.5 rounded-2xl bg-[#E0E5EC] font-extrabold text-[#6C63FF] shadow-[9px_9px_16px_rgba(163,177,198,0.5),-9px_-9px_16px_rgba(255,255,255,0.6)] hover:shadow-[12px_12px_20px_rgba(163,177,198,0.6),-12px_-12px_20px_rgba(255,255,255,0.5)] hover:text-[#8B84FF] active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.6)] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 outline-none focus:ring-2 focus:ring-[#6C63FF] disabled:opacity-40"
      >
        <Sparkles className="w-5 h-5 fill-current" />
        Analyze Alignment Stance
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
