"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  ChevronRight, 
  HelpCircle, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Chrome,
  Apple,
  RotateCcw,
  BookOpen,
  ArrowLeft
} from "lucide-react";

interface Question {
  id: string;
  category: string;
  text: string;
  options: string[];
  candidateStances: Record<string, string>;
}

interface CandidateAlignment {
  name: string;
  score: number;
  unlocked: boolean;
  reason: string;
}

export default function ChatPage() {
  const router = useRouter();

  const [candidates, setCandidates] = useState<string[]>([]);
  const [voterStance, setVoterStance] = useState("");
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [freeTextAnswer, setFreeTextAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [progressSaved, setProgressSaved] = useState(false);

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
        setQuestions(data);
        setAnswers({});
        
        if (data.length === 0) {
          setShowResults(true);
        } else {
          setCurrentIdx(0);
        }
      } catch (err) {
        console.error("Error fetching questions:", err);
      } finally {
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
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setShowResults(true);
    }
  };

  const resetQuiz = () => {
    setAnswers({});
    setCurrentIdx(0);
    setShowResults(false);
    setProgressSaved(false);
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

      let reason = "";
      if (name === "Sarah Jenkins") {
        reason = "Aligns with your priorities on capital highway funding and community water management audits.";
      } else {
        reason = "Matches your support for expanding charter school vouchers and opposing transportation tax increases.";
      }

      list.push({ name, score, unlocked, reason });
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
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F9F9F7] text-[#111111] p-6 space-y-4">
        {/* Animated layout block */}
        <div className="w-16 h-16 border-2 border-[#111111] relative flex items-center justify-center bg-white text-[#CC0000] animate-pulse">
          <Sparkles className="w-7 h-7 fill-current" />
        </div>
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">PARSING ALIGNMENT MATRIX...</h2>
        <p className="text-xs text-news-neutral-600 max-w-[200px] text-center leading-normal font-body italic">
          Drafting policy matching reports against voter statement profiles.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F9F9F7] text-[#111111] p-6 space-y-6 overflow-y-auto pb-24">
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
        <div className="space-y-6 flex-1 flex flex-col justify-between">
          <div className="border border-[#111111] bg-white p-5 space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#CC0000]">
                [ CATEGORY: {currentQuestion?.category} ]
              </span>
              <span className="text-[9px] font-mono text-news-neutral-500 font-bold uppercase">
                STANCE {currentIdx + 1} OF {questions.length}
              </span>
            </div>

            <h2 className="text-sm font-bold text-[#111111] leading-relaxed font-body">
              {currentQuestion?.text}
            </h2>

            {/* Flat Option Boxes */}
            <div className="space-y-3.5 pt-2">
              {currentQuestion?.options.map((opt, idx) => {
                const isSelected = answers[currentQuestion.id] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(currentQuestion.id, idx)}
                    className={`w-full text-left p-4 text-xs font-semibold leading-relaxed transition-all duration-150 border outline-none ${
                      isSelected
                        ? "bg-[#111111] text-[#F9F9F7] border-transparent"
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
                SUBSECTION C: CUSTOM WRITTEN ELABORATION
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

          <button
            onClick={handleNext}
            disabled={answers[currentQuestion?.id] === undefined && !freeTextAnswer.trim()}
            className="w-full py-4 bg-[#111111] hover:bg-[#CC0000] disabled:opacity-40 text-[#F9F9F7] font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 outline-none"
          >
            CONFIRM STANCE & CONTINUE
            <ChevronRight className="w-4.5 h-4.5" />
          </button>
        </div>
      ) : (
        /* Results Section */
        <div className="space-y-6">
          <div className="border border-[#111111] bg-white p-5 space-y-4">
            <h2 className="text-xs font-mono font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2 border-b border-[#111111] pb-3 mb-2">
              <TrendingUp className="w-4.5 h-4.5 text-[#CC0000]" />
              POLITICAL ALIGNMENT METRICS
            </h2>

            <div className="space-y-4">
              {alignments.map((align, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold font-sans">
                    <span className="uppercase text-[#111111]">{align.name}</span>
                    <span className="font-mono text-[#CC0000]">{align.score}% MATCH</span>
                  </div>
                  
                  {/* Newspaper styled progress bar: flat borders, red fill */}
                  <div className="h-4 bg-[#F9F9F7] border border-[#111111] overflow-hidden">
                    <div 
                      className="h-full bg-[#CC0000] border-r border-[#111111] transition-all duration-500"
                      style={{ width: `${align.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Editorial Recommendations */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-mono font-bold text-news-neutral-500 uppercase tracking-widest">[ SECTION II: REVEALED GUIDES ]</h3>
            
            {alignments.map((align, idx) => {
              if (!align.unlocked) return null;
              return (
                <div 
                  key={idx}
                  className="border border-[#111111] bg-white p-5 space-y-3 relative"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-[#CC0000]" />
                      <span className="text-[9px] font-mono font-bold text-[#111111] uppercase tracking-widest">EDITORIAL MATCH RECOMMENDATION</span>
                    </div>
                  </div>
                  <h4 className="text-sm font-extrabold text-[#111111] font-display uppercase tracking-tight">RECOMMENDED: {align.name}</h4>
                  <p className="text-xs text-news-neutral-600 leading-relaxed font-body text-justify">{align.reason}</p>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {!progressSaved ? (
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full py-4 bg-[#111111] hover:bg-[#CC0000] text-[#F9F9F7] font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 outline-none"
              >
                <BookOpen className="w-4.5 h-4.5" />
                SECURE ALIGNMENT PROGRESS
              </button>
            ) : (
              <div className="border-2 border-[#111111] p-4 text-center text-emerald-800 font-bold uppercase text-xs tracking-widest">
                ✓ STANCE HISTORIES RECORDED
              </div>
            )}

            <button
              onClick={resetQuiz}
              className="w-full py-4 bg-transparent border border-[#111111] text-[#111111] hover:bg-news-neutral-100 text-xs font-bold uppercase tracking-widest transition-colors outline-none"
            >
              RESET ALIGNMENT AUDIT
            </button>
          </div>
        </div>
      )}

      {/* Editorial OAuth Dialog Sheet */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-[#111111]/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-[#F9F9F7] border-4 border-[#111111] p-6 space-y-6 relative">
            <div className="text-center space-y-2 border-b border-[#111111] pb-4">
              <h3 className="text-sm font-extrabold text-[#111111] font-display uppercase tracking-tight">SECURE DATABASE LOG</h3>
              <p className="text-[10px] text-news-neutral-600 font-body">Save stances securely. Prevents duplicate questions on subsequent ballots.</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => triggerAuth("google")}
                className="w-full py-3 bg-transparent border border-[#111111] text-xs font-bold text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all flex items-center justify-center gap-2 outline-none"
              >
                <Chrome className="w-4 h-4 text-rose-600" />
                CONNECT WITH GOOGLE
              </button>

              <button
                onClick={() => triggerAuth("apple")}
                className="w-full py-3 bg-transparent border border-[#111111] text-xs font-bold text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-all flex items-center justify-center gap-2 outline-none"
              >
                <Apple className="w-4 h-4 text-[#111111] hover:text-white" />
                CONNECT WITH APPLE
              </button>
            </div>

            <button
              onClick={() => setShowLoginModal(false)}
              className="w-full py-3 bg-transparent border border-dashed border-[#111111] text-xs font-bold text-news-neutral-500 hover:text-[#111111] transition-colors outline-none"
            >
              DISMISS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
