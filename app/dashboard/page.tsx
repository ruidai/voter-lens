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
  const [candidates, setCandidates] = useState<string[]>([]);
  const [location, setLocation] = useState("");

  // Auth banner state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in by making a request to the profile endpoint
    // This implicitly checks the secure http-only cookie rather than relying on local storage
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setIsLoggedIn(true);
          
          const profile = data.profile;
          if (profile) {
            setUserName(profile.full_name || profile.email || "Reader");
            if (profile.voter_stance) {
              setStance(profile.voter_stance);
            }
          }
        } else {
          setIsLoggedIn(false);
          const savedLocalStance = localStorage.getItem("voter_lens_stance");
          if (savedLocalStance) setStance(savedLocalStance);
        }
      } catch (e) {
        setIsLoggedIn(false);
        const savedLocalStance = localStorage.getItem("voter_lens_stance");
        if (savedLocalStance) setStance(savedLocalStance);
      }
      
      const savedLocalLocation = localStorage.getItem("voter_lens_location");
      if (savedLocalLocation) setLocation(savedLocalLocation);

      const savedLocalCandidates = localStorage.getItem("voter_lens_candidates");
      if (savedLocalCandidates) {
        try {
          const parsed = JSON.parse(savedLocalCandidates);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCandidates(parsed);
          }
        } catch (e) {}
      }
    };
    
    fetchProfile();
  }, []);

  const parseCandidatesText = (text: string): string[] => {
    const lines = text.split(/\r?\n/);
    const parsedNames: string[] = [];

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      // Remove leading bullets (•, -, *, +, ▪, ◦) and numbering (e.g. 1. or 2))
      line = line.replace(/^[•\-*+▪◦\d+[.)\s\-*+▪◦]+/g, '').trim();
      if (!line) continue;

      const commaParts = line.split(',');
      if (commaParts.length > 1) {
        // Check for Last, First format (e.g. exactly 2 parts, each part is a single word)
        const isLastFirst = commaParts.length === 2 && 
          commaParts[0].trim().split(/\s+/).length === 1 && 
          commaParts[1].trim().split(/\s+/).length === 1;

        if (isLastFirst) {
          const firstName = commaParts[1].trim();
          const lastName = commaParts[0].trim();
          parsedNames.push(`${firstName} ${lastName}`);
        } else {
          commaParts.forEach(part => {
            const name = part.trim();
            if (name) parsedNames.push(name);
          });
        }
      } else {
        parsedNames.push(line);
      }
    }

    return Array.from(new Set(parsedNames));
  };

  const addCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    const text = candidateInput.trim();
    if (!text) return;
    
    const parsed = parseCandidatesText(text);
    const updated = [...candidates];
    parsed.forEach(name => {
      if (!updated.includes(name)) {
        updated.push(name);
      }
    });
    setCandidates(updated);
    setCandidateInput("");
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    if (!pastedText) return;

    const parsed = parseCandidatesText(pastedText);
    const updated = [...candidates];
    parsed.forEach(name => {
      if (!updated.includes(name)) {
        updated.push(name);
      }
    });
    setCandidates(updated);
    setCandidateInput("");
  };

  const removeCandidate = (name: string) => {
    setCandidates(candidates.filter(c => c !== name));
  };

  const handleStart = () => {
    localStorage.setItem("voter_lens_candidates", JSON.stringify(candidates));
    localStorage.setItem("voter_lens_stance", stance);
    localStorage.setItem("voter_lens_location", location);
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
            No time to study candidate records? Don't rely on campaign advertisements. 
            We cross-reference public policy platforms with your core priorities to establish 
            your alignment rating in under two minutes.
          </p>
        </div>

        {/* Auth incentive Box styled as an Editorial Ad */}
        {!isLoggedIn ? (
          <div className="border-2 border-[#111111] p-4 bg-[#F9F9F7] space-y-3 relative overflow-hidden shadow-[4px_4px_0_0_rgba(17,17,17,1)]">
            <div className="absolute top-0 right-0 bg-[#CC0000] text-[#F9F9F7] text-[8px] font-mono font-bold tracking-widest uppercase px-2 py-0.5">
              ADVERTISEMENT
            </div>
            <div className="space-y-1 pr-12">
              <h3 className="text-xs font-bold font-sans uppercase tracking-wider text-[#111111]">
                🧠 A Smarter Political Profile
              </h3>
              <p className="text-[11px] text-news-neutral-600 leading-normal">
                Your political context grows smarter with every alignment check. <strong className="text-[#111111]">Log in</strong> to sync your profile automatically. 
                Don't want to log in? <strong className="text-[#111111]">No pressure.</strong> You can easily copy your portable profile at the end of each session and paste it below next time.
              </p>
            </div>
            <Link 
              href="/login" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] text-[#F9F9F7] text-[10px] font-bold uppercase tracking-widest hover:bg-[#CC0000] transition-colors shadow-[2px_2px_0_0_rgba(17,17,17,0.3)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              Save Your Profile
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="border border-[#111111] p-4 bg-[#E5E5E0]/40 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#111111] text-[#F9F9F7] flex items-center justify-center font-bold text-xs uppercase font-mono">
                ✓
              </div>
              <div>
                <h3 className="text-xs font-bold font-sans uppercase tracking-wider text-[#111111]">
                  Logged in as <span className="text-[#CC0000]">{userName}</span>
                </h3>
                <p className="text-[10px] text-news-neutral-600 leading-normal font-mono uppercase tracking-wide">
                  Your profile context is safely synced.
                </p>
              </div>
            </div>
            <button 
              onClick={async () => {
                await fetch("/auth/signout", { method: "POST" });
                setIsLoggedIn(false);
                setStance("");
              }}
              className="text-[9px] font-mono uppercase tracking-widest text-news-neutral-500 hover:text-[#CC0000] underline"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Section 1A: Location Input */}
        <div className="border border-[#111111] p-5 space-y-4">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111] border-b border-[#111111] pb-2">
            [ GEOGRAPHICAL CONTEXT ]
          </h2>
          <p className="text-[10px] text-news-neutral-500 font-mono">
            Enter zipcode, county, city, or state. This helps us find the right local candidates.
          </p>
          <input
            type="text"
            placeholder="E.G. 85001, MARICOPA COUNTY, PHOENIX, AZ"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            autoComplete="address-level2"
            className="w-full px-3 py-3 bg-transparent text-[#111111] border border-[#111111] text-xs font-mono focus:outline-none focus:bg-[#E5E5E0]/40 transition-all uppercase"
          />
        </div>

        {/* Section 1: Candidates Input */}
        <div className="border border-[#111111] p-5 space-y-4">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111] border-b border-[#111111] pb-2 flex items-center justify-between">
            <span>[ SECTION A: TARGET CANDIDATES ]</span>
            {candidates.length > 0 ? (
              <button
                type="button"
                onClick={() => setCandidates([])}
                className="text-[#CC0000] hover:underline font-bold text-[9px] tracking-widest uppercase outline-none"
              >
                [ Clear All ]
              </button>
            ) : (
              <span className="text-news-neutral-500 font-medium">Vol 1.01</span>
            )}
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
              onPaste={handlePaste}
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
            Describe your political alignment or policy views. <strong className="text-[#111111]">Paste your previously copied Portable Profile here</strong> to restore your full context, or just type a few issues you care about.
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
