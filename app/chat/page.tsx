"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  ChevronRight, 
  HelpCircle, 
  TrendingUp, 
  Chrome,
  Apple,
  RotateCcw,
  BookOpen,
  ArrowLeft,
  Filter,
  Activity,
  Cpu,
  TerminalSquare
} from "lucide-react";

interface Question {
  id: string;
  category: string;
  text: string;
  options: string[];
  candidateStances: Record<string, string>;
}

interface EliminatedTopic {
  topic: string;
  reason: string;
}

interface CandidateAlignment {
  name: string;
  score: number;
  unlocked: boolean;
  reason: string;
}

const LOADING_STEPS = [
  "Analyzing voter alignment profile...",
  "Cross-referencing candidate platforms...",
  "Eliminating redundant topics based on user statement...",
  "Generating high-signal questions..."
];

export default function ChatPage() {
  const router = useRouter();

  const [candidates, setCandidates] = useState<string[]>([]);
  const [voterStance, setVoterStance] = useState("");
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [eliminatedTopics, setEliminatedTopics] = useState<EliminatedTopic[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [freeTextAnswer, setFreeTextAnswer] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState("Initializing alignment check...");
  const [aiSubject, setAiSubject] = useState("");
  const [aiText, setAiText] = useState("");
  
  const [showResults, setShowResults] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [portableProfile, setPortableProfile] = useState<string | null>(null);
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const [copied, setCopied] = useState(false);

  // No more fake intervals needed. We rely on stream events.

  useEffect(() => {
    const fetchQuestions = async () => {
      const stashedCandidates = localStorage.getItem("voter_lens_candidates");
      const stashedStance = localStorage.getItem("voter_lens_stance") || "";
      const stashedLocation = localStorage.getItem("voter_lens_location") || "";
      
      const candidatesList = stashedCandidates ? JSON.parse(stashedCandidates) : [];
      setCandidates(candidatesList);
      setVoterStance(stashedStance);

      if (candidatesList.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/align", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidates: candidatesList, stance: stashedStance, location: stashedLocation })
        });
        
        if (!res.ok) throw new Error("Failed to start alignment check");
        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        
        let done = false;
        let buffer = "";

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n");
            buffer = parts.pop() || "";
            for (const part of parts) {
              if (part.trim() === "") continue;
              try {
                const event = JSON.parse(part);
                if (event.type === "status") {
                  setLoadingProgress(event.progress);
                  setLoadingStep(event.message);
                } else if (event.type === "research_start") {
                  setAiSubject(event.candidate);
                  setAiText("");
                } else if (event.type === "research_chunk") {
                  setAiText(prev => prev + event.chunk);
                } else if (event.type === "result") {
                  setTimeout(() => {
                    setQuestions(event.data.questions || []);
                    setEliminatedTopics(event.data.eliminatedTopics || []);
                    setAnswers({});
                    
                    if (!event.data.questions || event.data.questions.length === 0) {
                      setShowResults(true);
                    } else {
                      setCurrentIdx(0);
                    }
                    setLoading(false);
                  }, 800);
                } else if (event.type === "error") {
                  throw new Error(event.message);
                }
              } catch (e) {
                console.error("Error parsing stream part", part, e);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching questions:", err);
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleSelectOption = (qId: string, optIdx: number) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: optIdx
    }));
  };

  const generatePortableProfile = async (currentQuestions: Question[], currentAnswers: Record<string, number>, currentEliminated: EliminatedTopic[]) => {
    setIsGeneratingProfile(true);
    try {
      const res = await fetch("/api/profile/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previousStance: voterStance,
          questions: currentQuestions,
          answers: currentAnswers,
          eliminatedTopics: currentEliminated
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPortableProfile(data.stance);
        
        // Auto-save for anonymous users on this device
        localStorage.setItem("voter_lens_stance", data.stance);

        // Attempt to auto-save if logged in
        await fetch("/api/profile/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stance: data.stance })
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingProfile(false);
    }
  };

  const handleNext = () => {
    setFreeTextAnswer("");
    setIsTransitioning(true);
    
    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(currentIdx + 1);
      } else {
        setShowResults(true);
        generatePortableProfile(questions, answers, eliminatedTopics);
      }
      setIsTransitioning(false);
    }, 300);
  };

  const resetQuiz = () => {
    setAnswers({});
    setCurrentIdx(0);
    setShowResults(false);
    setPortableProfile(null);
    setCopied(false);
    window.location.reload();
  };

  const getAlignments = (): CandidateAlignment[] => {
    const list: CandidateAlignment[] = [];
    
    candidates.forEach(name => {
      let matches = 0;
      let totalQuestionsAnswered = 0;
      
      questions.forEach(q => {
        const userChoiceIdx = answers[q.id];
        if (userChoiceIdx !== undefined) {
          totalQuestionsAnswered++;
          const userOptionText = q.options[userChoiceIdx];
          const candOptionText = q.candidateStances[name] || "";
          
          if (userOptionText === candOptionText) {
            matches++;
          }
        }
      });

      const score = totalQuestionsAnswered > 0 ? Math.round((matches / totalQuestionsAnswered) * 100) : 50;
      const unlocked = totalQuestionsAnswered >= 2 || score >= 80;

      list.push({ 
        name, 
        score, 
        unlocked, 
        reason: score >= 50 
          ? "Strong alignment on key issues selected." 
          : "Divergent views on the issues prioritized."
      });
    });

    return list.sort((a, b) => b.score - a.score);
  };

  const alignments = getAlignments();
  const currentQuestion = questions[currentIdx];

  const handleCopy = () => {
    if (portableProfile) {
      navigator.clipboard.writeText(portableProfile);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F9F9F7] text-[#111111] p-6 space-y-8 min-h-screen pb-32">
        <div className="w-16 h-16 border-2 border-[#111111] relative flex items-center justify-center bg-white text-[#CC0000] shadow-[4px_4px_0_0_rgba(17,17,17,1)] overflow-hidden">
          <Activity className="w-7 h-7 animate-pulse text-[#CC0000]" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CC0000]/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
        
        <div className="w-full max-w-sm space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#CC0000] animate-spin-slow" style={{ animationDuration: '3s' }} />
              COMPOSING ALIGNMENT CHECK
            </h2>
            <span className="text-[10px] font-mono font-bold text-news-neutral-500">
              {loadingProgress}%
            </span>
          </div>
          
          {/* Flat Editorial Progress Bar */}
          <div className="w-full h-3 border border-[#111111] bg-white overflow-hidden p-[1px]">
            <div 
              className="h-full bg-[#111111] transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>

          <div className="h-6 flex items-center justify-between border-b border-dashed border-news-neutral-300 pb-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-news-neutral-600 animate-pulse">
              {loadingStep}
            </p>
          </div>
          
          {/* Realtime AI output block */}
          {aiSubject && (
            <div className="bg-[#111111] border border-[#111111] text-[#F9F9F7] p-3 shadow-[4px_4px_0_0_rgba(204,0,0,1)] animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 mb-2 border-b border-[#F9F9F7]/20 pb-2">
                <TerminalSquare className="w-3.5 h-3.5 text-[#CC0000]" />
                <span className="text-[9px] font-mono font-bold text-[#CC0000] tracking-widest uppercase">
                  AGENT LOG: {aiSubject}
                </span>
              </div>
              <div className="font-mono text-[10px] text-news-neutral-300 h-24 overflow-y-auto whitespace-pre-wrap leading-relaxed custom-scrollbar break-words">
                {aiText}
                <span className="inline-block w-1.5 h-3 bg-[#CC0000] ml-1 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F9F9F7] text-[#111111] p-6 space-y-6 overflow-y-auto pb-24 min-h-screen">
      {/* Editorial Navigation Header */}
      <div className="flex justify-between items-center border-b-2 border-[#111111] pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-10 h-10 bg-transparent border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-extrabold text-[#111111] font-display uppercase tracking-tight">Alignment Check</h1>
            <span className="text-[9px] font-mono uppercase tracking-widest text-news-neutral-500 font-bold">Progress Report // LENS 302</span>
          </div>
        </div>
        <button
          onClick={resetQuiz}
          className="w-9 h-9 bg-transparent border border-[#111111] text-news-neutral-500 hover:text-[#CC0000] flex items-center justify-center transition-colors"
          title="Restart Alignment"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      {!showResults ? (
        <div className="space-y-6 flex-1 flex flex-col justify-between max-w-2xl mx-auto w-full">
          
          <div className="space-y-6">
            {/* Eliminated Topics Banner */}
            {eliminatedTopics.length > 0 && currentIdx === 0 && (
              <div className="border border-[#111111] bg-[#111111] text-[#F9F9F7] p-4 flex gap-3 animate-in fade-in slide-in-from-top-4 duration-500 shadow-[4px_4px_0_0_rgba(204,0,0,1)]">
                <Filter className="w-4 h-4 text-[#CC0000] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#CC0000]">
                    SMART FILTER APPLIED
                  </h3>
                  <p className="text-xs font-body leading-relaxed">
                    Based on your statement, we skipped <strong>{eliminatedTopics.length}</strong> topic{eliminatedTopics.length > 1 ? "s" : ""}:
                  </p>
                  <ul className="list-disc pl-4 text-[11px] text-news-neutral-300 font-body space-y-1">
                    {eliminatedTopics.map((et, i) => (
                      <li key={i}><strong>{et.topic}</strong>: {et.reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Question Card with Smooth Transition */}
            <div className={`transition-opacity duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
              {currentQuestion && (
                <div className="border-2 border-[#111111] bg-white p-6 space-y-5 shadow-[4px_4px_0_0_rgba(17,17,17,1)]">
                  <div className="flex justify-between items-center border-b border-dashed border-[#111111] pb-3 mb-4">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#CC0000]">
                      [ CATEGORY: {currentQuestion.category} ]
                    </span>
                    <span className="text-[9px] font-mono text-news-neutral-500 font-bold uppercase">
                      STANCE {currentIdx + 1} OF {questions.length}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-[#111111] leading-relaxed font-body">
                    {currentQuestion.text}
                  </h2>

                  {/* Flat Option Boxes */}
                  <div className="space-y-3.5 pt-2">
                    {currentQuestion.options.map((opt, idx) => {
                      const isSelected = answers[currentQuestion.id] === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectOption(currentQuestion.id, idx)}
                          className={`w-full text-left p-4 text-xs font-semibold leading-relaxed transition-all duration-150 border outline-none ${
                            isSelected
                              ? "bg-[#111111] text-[#F9F9F7] border-[#111111]"
                              : "bg-transparent text-[#111111] border-[#111111] hover:bg-news-neutral-100"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {/* Optional Free Text with bottom line style */}
                  <div className="space-y-2 pt-4 border-t border-[#111111]">
                    <label className="text-[9px] font-mono font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-[#CC0000]" />
                      CUSTOM WRITTEN ELABORATION
                    </label>
                    <input
                      type="text"
                      placeholder="TYPE ALTERNATIVE OPINION HERE..."
                      value={freeTextAnswer}
                      onChange={(e) => setFreeTextAnswer(e.target.value)}
                      className="w-full border-b-2 border-[#111111] bg-transparent px-3 py-2 font-mono text-xs text-[#111111] focus:bg-news-neutral-100 focus:outline-none uppercase"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={!currentQuestion || (answers[currentQuestion.id] === undefined && !freeTextAnswer.trim()) || isTransitioning}
            className="w-full py-4 bg-[#111111] hover:bg-[#CC0000] disabled:opacity-40 disabled:hover:bg-[#111111] text-[#F9F9F7] font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 outline-none shadow-[2px_2px_0_0_rgba(17,17,17,0.3)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            CONFIRM STANCE & CONTINUE
            <ChevronRight className="w-4.5 h-4.5" />
          </button>
        </div>
      ) : (
        /* Results Section */
        <div className="space-y-6 max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="border-2 border-[#111111] bg-white p-6 space-y-5 shadow-[4px_4px_0_0_rgba(17,17,17,1)]">
            <h2 className="text-xs font-mono font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2 border-b-2 border-[#111111] pb-4 mb-2">
              <TrendingUp className="w-5 h-5 text-[#CC0000]" />
              POLITICAL ALIGNMENT METRICS
            </h2>

            <div className="space-y-5">
              {alignments.map((align, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-extrabold font-display">
                    <span className="uppercase text-[#111111]">{align.name}</span>
                    <span className="font-mono text-[#CC0000]">{align.score}% MATCH</span>
                  </div>
                  
                  {/* Newspaper styled progress bar: flat borders, red fill */}
                  <div className="h-5 bg-[#F9F9F7] border border-[#111111] overflow-hidden">
                    <div 
                      className="h-full bg-[#CC0000] border-r border-[#111111] transition-all duration-1000 ease-out"
                      style={{ width: `${align.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons and Profile */}
          <div className="space-y-4 pt-4">
            
            {/* Portable Profile Section */}
            <div className="border-2 border-[#111111] bg-white p-5 shadow-[4px_4px_0_0_rgba(17,17,17,1)] relative">
              <div className="absolute top-0 right-0 bg-[#CC0000] text-[#F9F9F7] text-[8px] font-mono font-bold tracking-widest uppercase px-2 py-0.5">
                PORTABLE PROFILE
              </div>
              
              <h3 className="text-xs font-bold font-sans uppercase tracking-wider text-[#111111] mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#CC0000]" />
                YOUR COMPREHENSIVE CONTEXT
              </h3>
              
              {isGeneratingProfile ? (
                <div className="flex flex-col items-center justify-center p-6 space-y-3">
                  <div className="w-6 h-6 border border-[#111111] animate-spin-slow bg-news-neutral-100" />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-news-neutral-500 animate-pulse">
                    Synthesizing your stances...
                  </p>
                </div>
              ) : portableProfile ? (
                <div className="space-y-3">
                  <p className="text-[11px] text-news-neutral-600 leading-normal mb-2">
                    We've updated your political profile based on your answers. If you are not logged in, copy this text and paste it into the stance box next time to retain your full context.
                  </p>
                  <div className="bg-[#111111] text-news-neutral-200 p-3 font-mono text-[10px] leading-relaxed custom-scrollbar max-h-40 overflow-y-auto break-words">
                    {portableProfile}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="w-full py-3 bg-[#111111] hover:bg-[#CC0000] text-[#F9F9F7] font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 outline-none shadow-[2px_2px_0_0_rgba(17,17,17,0.3)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    {copied ? "COPIED SECURELY ✓" : "COPY PORTABLE PROFILE TO CLIPBOARD"}
                  </button>
                </div>
              ) : null}
            </div>

            <button
              onClick={resetQuiz}
              className="w-full py-4 bg-transparent border-2 border-[#111111] text-[#111111] hover:bg-news-neutral-100 text-xs font-bold uppercase tracking-widest transition-colors outline-none"
            >
              RESET ALIGNMENT CHECK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
