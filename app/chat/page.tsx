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
  Filter
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
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [progressSaved, setProgressSaved] = useState(false);

  useEffect(() => {
    if (!loading) return;
    
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 95) return prev;
        return prev + 1;
      });
    }, 50);

    const stepInterval = setInterval(() => {
      setLoadingStepIdx(prev => Math.min(prev + 1, LOADING_STEPS.length - 1));
    }, 1500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [loading]);

  useEffect(() => {
    const stashedCandidates = localStorage.getItem("voter_lens_candidates");
    const stashedStance = localStorage.getItem("voter_lens_stance") || "";
    
    const candidatesList = stashedCandidates ? JSON.parse(stashedCandidates) : [];
    setCandidates(candidatesList);
    setVoterStance(stashedStance);

    const fetchQuestions = async () => {
      try {
        if (!candidatesList || candidatesList.length === 0) {
          setLoading(false);
          return;
        }

        const res = await fetch("/api/align", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidates: candidatesList, stance: stashedStance })
        });
        
        if (!res.ok) throw new Error("Failed to fetch questions");
        
        const data = await res.json();
        
        setLoadingProgress(100);
        
        setTimeout(() => {
          setQuestions(data.questions || []);
          setEliminatedTopics(data.eliminatedTopics || []);
          setAnswers({});
          
          if (!data.questions || data.questions.length === 0) {
            setShowResults(true);
          } else {
            setCurrentIdx(0);
          }
          setLoading(false);
        }, 500);
        
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

  const handleNext = () => {
    setFreeTextAnswer("");
    setIsTransitioning(true);
    
    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(currentIdx + 1);
      } else {
        setShowResults(true);
      }
      setIsTransitioning(false);
    }, 300);
  };

  const resetQuiz = () => {
    setAnswers({});
    setCurrentIdx(0);
    setShowResults(false);
    setProgressSaved(false);
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

  const triggerAuth = (provider: string) => {
    setProgressSaved(true);
    setShowLoginModal(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F9F9F7] text-[#111111] p-6 space-y-8 min-h-screen pb-32">
        <div className="w-16 h-16 border-2 border-[#111111] relative flex items-center justify-center bg-white text-[#CC0000] animate-pulse shadow-[4px_4px_0_0_rgba(17,17,17,1)]">
          <Sparkles className="w-7 h-7 fill-current" />
        </div>
        
        <div className="w-full max-w-sm space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">
              COMPOSING AUDIT
            </h2>
            <span className="text-[10px] font-mono font-bold text-news-neutral-500">
              {loadingProgress}%
            </span>
          </div>
          
          {/* Flat Editorial Progress Bar */}
          <div className="w-full h-3 border border-[#111111] bg-white overflow-hidden p-[1px]">
            <div 
              className="h-full bg-[#111111] transition-all duration-100 ease-linear"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>

          <div className="h-8 flex items-center justify-center">
            <p className="text-[10px] font-mono uppercase tracking-widest text-news-neutral-600 animate-in fade-in slide-in-from-bottom-2 duration-300" key={loadingStepIdx}>
              {LOADING_STEPS[loadingStepIdx]}
            </p>
          </div>
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
            <h1 className="text-sm font-extrabold text-[#111111] font-display uppercase tracking-tight">Alignment Audit</h1>
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

          {/* Action buttons */}
          <div className="space-y-3 pt-4">
            {!progressSaved ? (
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full py-4 bg-[#111111] hover:bg-[#CC0000] text-[#F9F9F7] font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 outline-none shadow-[2px_2px_0_0_rgba(17,17,17,0.3)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                <BookOpen className="w-4.5 h-4.5" />
                SECURE ALIGNMENT PROGRESS
              </button>
            ) : (
              <div className="border-2 border-[#111111] p-4 text-center text-emerald-800 bg-emerald-50 font-bold uppercase text-xs tracking-widest">
                ✓ STANCE HISTORIES RECORDED
              </div>
            )}

            <button
              onClick={resetQuiz}
              className="w-full py-4 bg-transparent border-2 border-[#111111] text-[#111111] hover:bg-news-neutral-100 text-xs font-bold uppercase tracking-widest transition-colors outline-none"
            >
              RESET ALIGNMENT AUDIT
            </button>
          </div>
        </div>
      )}

      {/* Editorial OAuth Dialog Sheet */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-[#111111]/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#F9F9F7] border-4 border-[#111111] p-6 space-y-6 relative shadow-[8px_8px_0_0_rgba(17,17,17,1)]">
            <div className="text-center space-y-2 border-b border-[#111111] pb-4">
              <h3 className="text-sm font-extrabold text-[#111111] font-display uppercase tracking-tight">SECURE DATABASE LOG</h3>
              <p className="text-[10px] text-news-neutral-600 font-body">Save stances securely. Prevents duplicate questions on subsequent ballots.</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => triggerAuth("google")}
                className="w-full py-3 bg-white border-2 border-[#111111] text-xs font-bold text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all flex items-center justify-center gap-2 outline-none"
              >
                <Chrome className="w-4 h-4 text-rose-600" />
                CONNECT WITH GOOGLE
              </button>

              <button
                onClick={() => triggerAuth("apple")}
                className="w-full py-3 bg-white border-2 border-[#111111] text-xs font-bold text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all flex items-center justify-center gap-2 outline-none"
              >
                <Apple className="w-4 h-4 text-[#111111]" />
                CONNECT WITH APPLE
              </button>
            </div>

            <button
              onClick={() => setShowLoginModal(false)}
              className="w-full py-3 bg-transparent border border-dashed border-[#111111] text-xs font-bold text-news-neutral-500 hover:text-[#111111] hover:bg-white transition-colors outline-none"
            >
              DISMISS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
