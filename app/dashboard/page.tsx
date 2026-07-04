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
  Lock,
  ArrowRight,
  ChevronRight
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
    localStorage.setItem("voter_lens_candidates", JSON.stringify(candidates));
    localStorage.setItem("voter_lens_stance", stance);
    router.push("/chat");
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F9F9F7] text-[#111111] overflow-y-auto pb-24">
      
      {/* 1. Horizontal News Ticker / Marquee */}
      <div className="bg-[#111111] text-[#F9F9F7] py-2 border-b border-[#111111] ticker-wrap shrink-0">
        <div className="ticker-content text-[10px] font-mono font-bold tracking-widest uppercase flex items-center gap-8">
          <span>★ LIVE BALLOT TRACKER ACTIVE</span>
          <span className="text-[#CC0000]">● GENERAL ELECTION: NOV 3, 2026</span>
          <span>★ STUDY PLATFORMS DEBATE HEATS UP</span>
          <span className="text-[#CC0000]">● 12 DAYS TO REGISTER</span>
          <span>★ LIVE BALLOT TRACKER ACTIVE</span>
          <span className="text-[#CC0000]">● GENERAL ELECTION: NOV 3, 2026</span>
          <span>★ STUDY PLATFORMS DEBATE HEATS UP</span>
          <span className="text-[#CC0000]">● 12 DAYS TO REGISTER</span>
        </div>
      </div>

      {/* 2. Newspaper Edition Header Banner */}
      <div className="p-4 text-center border-b-4 border-[#111111] space-y-2 shrink-0">
        <span className="text-[10px] font-mono tracking-widest uppercase text-news-neutral-500 font-bold block">
          Volume I • Edition 1.0 • Printed in Arizona
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-[#111111] font-display uppercase leading-none border-y border-dashed border-[#111111] py-3.5">
          The Voter Lens
        </h1>
        <div className="flex justify-between items-center text-[9px] font-mono uppercase text-news-neutral-600 font-semibold px-1">
          <span>Friday, July 3, 2026</span>
          <span className="text-[#CC0000] font-bold">Price: FREE INSIGHT</span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Editorial Description with Drop Cap */}
        <div className="text-sm text-news-neutral-600 leading-relaxed font-body text-justify border-b border-[#111111] pb-5">
          <p className="drop-cap">
            As a voter, you have no time to study candidates. Do not rely on advertising campaigns. 
            We analyze candidates' public records and stances, matching them with your policy alignments 
            through context-tailored inquiries.
          </p>
        </div>

        {/* Auth incentive Box styled as an Editorial Ad */}
        {!isLoggedIn && (
          <div className="border-2 border-[#111111] p-4 bg-[#F9F9F7] space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#CC0000] text-[#F9F9F7] text-[8px] font-mono font-bold tracking-widest uppercase px-2 py-0.5">
              ADVERTISEMENT
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold font-sans uppercase tracking-wider text-[#111111]">
                🔒 Preserve Your Alignment Index
              </h3>
              <p className="text-[11px] text-news-neutral-600 leading-normal">
                An anonymous profile can lose match progress. Register to secure your stances safely.
              </p>
            </div>
            <Link 
              href="/login" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] text-[#F9F9F7] text-[10px] font-bold uppercase tracking-widest hover:bg-[#CC0000] transition-colors"
            >
              Sign Up Now
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Section 1: Candidates Input */}
        <div className="border border-[#111111] p-5 space-y-4">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111] border-b border-[#111111] pb-2 flex items-center justify-between">
            <span>[ SECTION A: TARGET CANDIDATES ]</span>
            <span className="text-news-neutral-500 font-medium">Vol 1.01</span>
          </h2>

          <button
            onClick={() => router.push("/scan")}
            className="w-full py-3 bg-transparent border border-[#111111] text-xs font-bold text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4 text-[#CC0000]" />
            SCAN VOTER BALLOT OR MAILER
          </button>

          <form onSubmit={addCandidate} className="flex gap-2">
            <input
              type="text"
              placeholder="TYPE CANDIDATE (E.G. JANE DOE)"
              value={candidateInput}
              onChange={(e) => setCandidateInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-transparent text-[#111111] border border-[#111111] text-xs font-mono focus:outline-none focus:bg-[#E5E5E0]/40 transition-all uppercase"
            />
            <button
              type="submit"
              className="w-10 h-10 bg-[#111111] text-[#F9F9F7] hover:bg-[#CC0000] flex items-center justify-center transition-colors"
            >
              <Plus className="w-4.5 h-4.5" />
            </button>
          </form>

          {/* Candidate list */}
          <div className="flex flex-wrap gap-2 pt-1.5">
            {candidates.map((name) => (
              <div 
                key={name}
                className="px-2.5 py-1.5 border border-[#111111] bg-white text-xs font-bold text-[#111111] flex items-center gap-1.5"
              >
                <span className="font-sans uppercase text-[10px] tracking-wider">{name}</span>
                <button 
                  onClick={() => removeCandidate(name)}
                  className="text-news-neutral-500 hover:text-[#CC0000] p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {candidates.length === 0 && (
              <p className="text-[11px] text-news-neutral-500 italic">No candidates selected. Type or scan a ballot.</p>
            )}
          </div>
        </div>

        {/* Section 2: Political Stance Description */}
        <div className="border border-[#111111] p-5 space-y-4">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111] border-b border-[#111111] pb-2 flex items-center justify-between">
            <span>[ SECTION B: VOTER STANCE ]</span>
            <span className="text-news-neutral-500 font-medium">Vol 1.02</span>
          </h2>
          <p className="text-[11px] text-news-neutral-600 leading-relaxed font-body">
            Describe your political alignment or policy views. Gemini will examine candidate records and filter questions matching these views.
          </p>

          <textarea
            rows={4}
            value={stance}
            onChange={(e) => setStance(e.target.value)}
            placeholder="E.G. I SUPPORT GREEN ENERGY AND LOWER LOCAL PROPERTY TAXES..."
            className="w-full p-3 bg-transparent text-[#111111] border border-[#111111] text-xs font-mono placeholder-news-neutral-400 focus:outline-none focus:bg-[#E5E5E0]/40 transition-all uppercase leading-relaxed resize-none"
          />
        </div>

        {/* CTA Button to Analyze */}
        <button
          onClick={handleStart}
          disabled={candidates.length === 0}
          className="w-full py-4 bg-[#111111] hover:bg-[#CC0000] text-[#F9F9F7] font-extrabold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <Sparkles className="w-4.5 h-4.5 fill-current" />
          START ALIGNMENT REPORT
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
