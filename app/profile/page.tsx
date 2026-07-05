import { redirect } from "next/navigation";
import { createServer } from "@/utils/supabase/server";
import { User, ShieldCheck, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function ProfilePage() {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, voter_stance, alignment_history")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name || profile?.email || "Valued Reader";

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
          <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
          Verified Voter Log
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
            YOUR POLITICAL PROFILE
          </h2>
          
          <p className="text-[11px] text-news-neutral-600 leading-normal mb-3 font-body">
            This is how our system currently understands your political alignment. It combines your stated views with your answers from previous checks. We use this context to intelligently filter future candidate questions.
          </p>

          <div className="bg-[#111111] text-[#F9F9F7] p-4 font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap min-h-[100px]">
            {profile?.voter_stance ? profile.voter_stance : "No political context recorded yet. Complete an Alignment Check to start building your profile."}
          </div>
        </div>

        <Link
          href="/dashboard"
          className="w-full py-4 bg-transparent border-2 border-[#111111] text-[#111111] hover:bg-news-neutral-100 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 outline-none"
        >
          START NEW ALIGNMENT CHECK
          <ArrowRight className="w-4 h-4" />
        </Link>
        
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="w-full py-3 text-[10px] font-mono uppercase tracking-widest text-news-neutral-500 hover:text-[#CC0000] underline"
          >
            Sign Out of Secure Log
          </button>
        </form>
      </div>
    </div>
  );
}
