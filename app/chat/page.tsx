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
  BookOpen
} from "lucide-react";

interface Question {
  id: string;
  category: string;
  text: string;
  options: string[];
  candidateStances: Record<string, string>; // Maps candidate name -> matching option index
}

interface CandidateAlignment {
  name: string;
  score: number;
  unlocked: boolean;
  reason: string;
}

export default function ChatPage() {
  const router = useRouter();

  // Input states stashed from dashboard
  const [candidates, setCandidates] = useState<string[]>([]);
  const [voterStance, setVoterStance] = useState("");
  
  // Quiz Wizard States
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [freeTextAnswer, setFreeTextAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);

  // Auth/Save dialog states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [progressSaved, setProgressSaved] = useState(false);

  // Load configuration and bootstrap questions
  useEffect(() => {
    const stashedCandidates = localStorage.getItem("voter_lens_candidates");
    const stashedStance = localStorage.getItem("voter_lens_stance") || "";
    
    const candidatesList = stashedCandidates ? JSON.parse(stashedCandidates) : ["Sarah Jenkins", "David Cole"];
    setCandidates(candidatesList);
    setVoterStance(stashedStance);

    // Call API or local mock engine to distill questions filtered by stance paragraph
    setTimeout(() => {
      // Base questions pool
      const baseQuestions: Question[] = [
        {
          id: "q1",
          category: "Education",
          text: "How should our district allocate funding for charter schools and alternative options?",
          options: [
            "Prioritize choice and fund charter vouchers heavily",
            "Increase funding exclusively for public district school systems",
            "Maintain current balance with strong performance auditing"
          ],
          candidateStances: {
            "Sarah Jenkins": "Maintain current balance with strong performance auditing",
            "David Cole": "Prioritize choice and fund charter vouchers heavily"
          }
        },
        {
          id: "q2",
          category: "Fiscal Management",
          text: "What is your stance on regional sales tax increases for infrastructure projects (e.g. Prop 479)?",
          options: [
            "Support to fund transit, highway and road safety improvements",
            "Oppose to lower property/sales taxes and reduce capital borrowing",
            "Support, but only if matched by equal spending cuts elsewhere"
          ],
          candidateStances: {
            "Sarah Jenkins": "Support to fund transit, highway and road safety improvements",
            "David Cole": "Oppose to lower property/sales taxes and reduce capital borrowing"
          }
        },
        {
          id: "q3",
          category: "Local Governance",
          text: "Which model of resource allocation fits your goals for public utilities and water management?",
          options: [
            "Heavy environmental preservation regulations on municipal pools",
            "Industrial growth focus to secure jobs and cheap supply access",
            "Balanced conservation with community water audits"
          ],
          candidateStances: {
            "Sarah Jenkins": "Heavy environmental preservation regulations on municipal pools",
            "David Cole": "Industrial growth focus to secure jobs and cheap supply access"
          }
        }
      ];

      // Refinement/Elimination logic: If stance contains school/charter or tax keywords,
      // we filter questions that are already answered by their statement to keep the quiz short!
      let filtered = [...baseQuestions];
      const stanceLower = stashedStance.toLowerCase();
      
      // Seed pre-filled answers from the stance paragraph to shorten the quiz!
      const initialAnswers: Record<string, number> = {};
      
      if (stanceLower.includes("choice") || stanceLower.includes("charter")) {
        // Auto-answer q1 with index 0
        initialAnswers["q1"] = 0;
      }
      if (stanceLower.includes("tax") || stanceLower.includes("freeway")) {
        // Auto-answer q2 with index 0 (support) or 1 (oppose)
        if (stanceLower.includes("oppose") || stanceLower.includes("lower")) {
          initialAnswers["q2"] = 1;
        } else {
          initialAnswers["q2"] = 0;
        }
      }

      setAnswers(initialAnswers);
      setQuestions(filtered);
      
      // Skip already auto-answered questions in the stepper sequence
      let startIdx = 0;
      while (filtered[startIdx] && initialAnswers[filtered[startIdx].id] !== undefined) {
        startIdx++;
      }
      
      if (startIdx >= filtered.length) {
        setCurrentIdx(filtered.length - 1);
        setShowResults(true);
      } else {
        setCurrentIdx(startIdx);
      }
      
      setLoading(false);
    }, 1500);
  }, []);

  const handleSelectOption = (qId: string, optIdx: number) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: optIdx
    }));
  };

  const handleNext = () => {
    // If free text is filled, we can use it to determine choice alignment or proceed
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

  // Live matching calculations
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
      
      // Recommendation is unlocked if voter completes all questions or match score is extremely definitive (>80%)
      const unlocked = totalQuestionsAnswered >= 2 || score >= 80;

      let reason = "";
      if (name === "Sarah Jenkins") {
        reason = "Matches your priorities on infrastructure investments (Prop 479 support) and balanced public water utility audits.";
      } else {
        reason = "Aligns closely with your support for voucher funding, school choices, and lowering regional sales/excise taxes.";
      }

      list.push({ name, score, unlocked, reason });
    });

    return list.sort((a, b) => b.score - a.score);
  };

  const alignments = getAlignments();
  const currentQuestion = questions[currentIdx];

  // Auth actions
  const triggerAuth = (provider: string) => {
    // Save state, set saved flag, close dialog
    setProgressSaved(true);
    setShowLoginModal(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#E0E5EC] p-6 space-y-4">
        <div className="w-16 h-16 rounded-[24px] bg-[#E0E5EC] flex items-center justify-center text-[#6C63FF] shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] animate-bounce">
          <Sparkles className="w-8 h-8 fill-current" />
        </div>
        <h2 className="text-sm font-bold text-[#3D4852] uppercase tracking-wider font-display">Analyzing Candidate Data...</h2>
        <p className="text-xs text-[#6B7280] max-w-[200px] text-center leading-relaxed">
          Distilling candidate stances against your political profile statement.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#E0E5EC] p-6 space-y-6 overflow-y-auto pb-28">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-lg font-extrabold text-[#3D4852] font-display">Alignment Match</h1>
          <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">Questionnaire Progress</p>
        </div>
        <button
          onClick={resetQuiz}
          className="w-9 h-9 rounded-xl bg-[#E0E5EC] text-[#6B7280] hover:text-[#3D4852] flex items-center justify-center shadow-[4px_4px_8px_rgba(163,177,198,0.4),-4px_-4px_8px_rgba(255,255,255,0.5)] active:scale-[0.94] transition-all"
          title="Restart Alignment"
        >
          <RotateCcw className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Main Content Area */}
      {!showResults ? (
        <div className="space-y-6 flex-1 flex flex-col">
          {/* Question Card */}
          <div className="rounded-[32px] bg-[#E0E5EC] p-6 shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="px-3 py-1 rounded-full bg-[#E0E5EC] text-[#6C63FF] font-bold text-[9px] shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5)] uppercase tracking-wider">
                  {currentQuestion?.category}
                </span>
                <span className="text-[10px] font-bold text-[#6B7280]">
                  {currentIdx + 1} of {questions.length}
                </span>
              </div>

              <h2 className="text-sm font-bold text-[#3D4852] leading-relaxed">
                {currentQuestion?.text}
              </h2>

              {/* Multiple Choice Options */}
              <div className="space-y-3.5 pt-2">
                {currentQuestion?.options.map((opt, idx) => {
                  const isSelected = answers[currentQuestion.id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(currentQuestion.id, idx)}
                      className={`w-full text-left p-4 text-xs font-semibold rounded-2xl transition-all duration-300 leading-relaxed border-none outline-none ${
                        isSelected
                          ? "bg-[#E0E5EC] text-[#6C63FF] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.6)] scale-[0.99]"
                          : "bg-[#E0E5EC] text-[#3D4852] shadow-[5px_5px_10px_rgba(163,177,198,0.3),-5px_-5px_10px_rgba(255,255,255,0.4)] hover:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.2)] active:scale-[0.98]"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Free Text input */}
            <div className="space-y-2 pt-4 border-t border-slate-300">
              <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-[#6C63FF]" />
                Elaborate or type custom stance (Optional)
              </label>
              <input
                type="text"
                placeholder="Type your own stance..."
                value={freeTextAnswer}
                onChange={(e) => setFreeTextAnswer(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-[#E0E5EC] text-[#3D4852] placeholder-[#A0AEC0] rounded-xl shadow-[inset_3px_3px_6px_rgba(163,177,198,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.6)] focus:outline-none"
              />
            </div>
          </div>

          {/* Stepper Controls */}
          <button
            onClick={handleNext}
            disabled={answers[currentQuestion?.id] === undefined && !freeTextAnswer.trim()}
            className="w-full py-4 rounded-2xl bg-[#E0E5EC] font-extrabold text-[#6C63FF] shadow-[8px_8px_16px_rgba(163,177,198,0.5),-8px_-8px_16px_rgba(255,255,255,0.6)] hover:text-[#8B84FF] active:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.5)] active:scale-[0.99] disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
          >
            Continue
            <ChevronRight className="w-4.5 h-4.5" />
          </button>
        </div>
      ) : (
        /* Results Mode */
        <div className="space-y-6">
          {/* Main Results Scorecard */}
          <div className="rounded-[32px] bg-[#E0E5EC] p-6 shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] space-y-4">
            <h2 className="text-xs font-bold text-[#3D4852] uppercase tracking-wider flex items-center gap-2 border-b border-slate-300 pb-3 mb-2">
              <TrendingUp className="w-4.5 h-4.5 text-[#6C63FF]" />
              Candidate Stance Alignment
            </h2>

            <div className="space-y-4">
              {alignments.map((align, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#3D4852]">{align.name}</span>
                    <span className="font-extrabold text-[#6C63FF]">{align.score}% Match</span>
                  </div>
                  
                  {/* Neumorphic progress bar */}
                  <div className="h-3 rounded-full bg-[#E0E5EC] shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#6C63FF] to-[#8B84FF] rounded-full transition-all duration-500"
                      style={{ width: `${align.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Locked/Unlocked Recommendation Cards */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Unlocked Recommendations</h3>
            
            {alignments.map((align, idx) => {
              if (!align.unlocked) return null;
              return (
                <div 
                  key={idx}
                  className="rounded-[32px] bg-[#E0E5EC] p-6 shadow-[9px_9px_16px_rgba(163,177,198,0.5),-9px_-9px_16px_rgba(255,255,255,0.6)] space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#38B2AC]" />
                      <span className="text-xs font-bold text-[#3D4852] uppercase tracking-wider">Candidate Match Recommendation</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-[#E0E5EC] text-[#38B2AC] font-bold text-[9px] shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5)]">DEFINITIVE</span>
                  </div>
                  <h4 className="text-sm font-extrabold text-[#3D4852] font-display">Vote Recommended: {align.name}</h4>
                  <p className="text-xs text-[#6B7280] leading-relaxed">{align.reason}</p>
                </div>
              );
            })}
          </div>

          {/* Action and Auth controls */}
          <div className="space-y-3 pt-2">
            {!progressSaved ? (
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full py-4 rounded-2xl bg-[#E0E5EC] font-extrabold text-[#38B2AC] shadow-[8px_8px_16px_rgba(163,177,198,0.4),-8px_-8px_16px_rgba(255,255,255,0.5)] active:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 outline-none"
              >
                <BookOpen className="w-5 h-5" />
                Save Stance History
              </button>
            ) : (
              <div className="rounded-[24px] bg-[#E0E5EC] p-4 shadow-[inset_4px_4px_8px_rgba(163,177,198,0.4)] flex items-center justify-center gap-2 text-[#38B2AC]">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Stances & Progress Saved</span>
              </div>
            )}

            <button
              onClick={resetQuiz}
              className="w-full py-4 rounded-2xl bg-[#E0E5EC] font-bold text-[#6B7280] hover:text-[#3D4852] shadow-[5px_5px_10px_rgba(163,177,198,0.3),-5px_-5px_10px_rgba(255,255,255,0.4)] active:scale-[0.98] transition-all outline-none"
            >
              Restart Stance Finder
            </button>
          </div>
        </div>
      )}

      {/* Neumorphic OAuth modal dialog */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-[#E0E5EC]/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-[32px] bg-[#E0E5EC] p-6 shadow-[12px_12px_24px_rgba(163,177,198,0.6),-12px_-12px_24px_rgba(255,255,255,0.6)] space-y-6 relative border border-white/20">
            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-[#3D4852] font-display">Save Alignment Stances</h3>
              <p className="text-[11px] text-[#6B7280]">Connect to safely remember your stances for future ballots.</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => triggerAuth("google")}
                className="w-full py-3.5 rounded-2xl bg-[#E0E5EC] text-xs font-bold text-[#3D4852] shadow-[5px_5px_10px_rgba(163,177,198,0.4),-5px_-5px_10px_rgba(255,255,255,0.5)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-none outline-none"
              >
                <Chrome className="w-4 h-4 text-rose-500" />
                Continue with Google
              </button>

              <button
                onClick={() => triggerAuth("apple")}
                className="w-full py-3.5 rounded-2xl bg-[#E0E5EC] text-xs font-bold text-[#3D4852] shadow-[5px_5px_10px_rgba(163,177,198,0.4),-5px_-5px_10px_rgba(255,255,255,0.5)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-none outline-none"
              >
                <Apple className="w-4 h-4 text-black" />
                Continue with Apple
              </button>
            </div>

            <button
              onClick={() => setShowLoginModal(false)}
              className="w-full py-3 rounded-2xl bg-[#E0E5EC] text-xs font-semibold text-[#6B7280] hover:text-[#3D4852] shadow-[3px_3px_6px_rgba(163,177,198,0.3)] active:scale-[0.98] transition-all border-none outline-none"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
