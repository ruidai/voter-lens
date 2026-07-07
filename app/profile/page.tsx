"use client";

import { useEffect, useState } from "react";
import { User, FileText, ArrowRight, Bookmark } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const [stance, setStance] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("Anonymous Reader");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          const profile = data.profile;
          if (profile) {
            setIsLoggedIn(true);
            setDisplayName(profile.full_name || profile.email || "Valued Reader");
            if (profile.voter_stance) {
              setStance(profile.voter_stance);
            }
          } else {
            setIsLoggedIn(false);
            setStance(localStorage.getItem("voter_lens_stance"));
          }
        } else {
          setIsLoggedIn(false);
          setStance(localStorage.getItem("voter_lens_stance"));
        }
      } catch (e) {
        setIsLoggedIn(false);
        setStance(localStorage.getItem("voter_lens_stance"));
      }
    };
    
    fetchProfile();
  }, []);

  if (isLoggedIn === null) {
    return <div className="flex-1 flex bg-[#F9F9F7]" />;
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F9F9F7] text-[#111111] overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-[#111111] text-[#F9F9F7] p-6 text-center shrink-0 shadow-md">
        <div className="w-16 h-16 border-2 border-[#F9F9F7] bg-news-neutral-100/10 mx-auto mb-4 flex items-center justify-center">
          <User className="w-8 h-8 text-[#CC0000]" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight font-display uppercase">
          {displayName}
        </h1>
        <p className="text-[10px] text-news-neutral-400 font-mono uppercase tracking-widest mt-2 flex items-center justify-center gap-1">
          <Bookmark className="w-3.5 h-3.5 text-[#CC0000]" />
          {isLoggedIn ? "Synced Political Profile" : "Local Device Profile"}
        </p>
      </div>

      <div className="p-5 space-y-6">
        {/* Comprehensive Context */}
        <div className="border border-[#111111] bg-white p-5 shadow-[4px_4px_0_0_rgba(17,17,17,1)] relative">
          <div className="absolute top-0 right-0 bg-[#CC0000] text-[#F9F9F7] text-[8px] font-mono font-bold tracking-widest uppercase px-2 py-0.5">
            KNOWN CONTEXT
          </div>
          
          <h2 className="text-xs font-bold font-sans uppercase tracking-wider text-[#111111] mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#CC0000]" />
            YOUR POLITICAL STANCE
          </h2>
          
          <p className="text-[11px] text-news-neutral-600 leading-normal mb-3 font-body">
            This is how our system currently understands your political alignment based on your previous checks. We use this context to intelligently filter future candidate questions.
          </p>

          <div className="bg-[#111111] text-[#F9F9F7] p-4 font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap min-h-[100px]">
            {stance ? stance : "No political context recorded yet. Complete an Alignment Check to start building your profile."}
          </div>
        </div>

        {!isLoggedIn && (
          <div className="border border-[#111111] bg-news-neutral-100/50 p-4">
             <p className="text-[11px] font-mono text-[#111111] mb-3 leading-relaxed">
               Your profile is currently only saved on this device, and you can easily copy and paste it yourself! However, if you'd like to sync your stance across devices, you can sign in below.
             </p>
             <Link
               href="/login"
               className="w-full py-3 bg-[#111111] text-[#F9F9F7] text-[10px] font-bold uppercase tracking-widest hover:bg-[#CC0000] transition-colors flex items-center justify-center gap-2"
             >
               Sign In To Sync
               <ArrowRight className="w-3.5 h-3.5" />
             </Link>
          </div>
        )}

        <Link
          href="/dashboard"
          className="w-full py-4 bg-transparent border-2 border-[#111111] text-[#111111] hover:bg-news-neutral-100 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 outline-none"
        >
          START NEW ALIGNMENT CHECK
          <ArrowRight className="w-4 h-4" />
        </Link>
        
        {isLoggedIn && (
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full py-3 text-[10px] font-mono uppercase tracking-widest text-news-neutral-500 hover:text-[#CC0000] underline"
            >
              Sign Out
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
