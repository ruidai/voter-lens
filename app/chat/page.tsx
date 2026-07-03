"use client";

import { useState } from "react";
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Settings2,
  ThumbsUp,
  ThumbsDown,
  User,
  Lightbulb
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "assistant",
      text: "Hello! I am your AI Voter Guide Assistant. I can help compare local candidate platforms, examine proposition details, and align them with your personal policy priorities. \n\nWhat would you like to explore today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Custom voter priorities panel settings
  const [priorities, setPriorities] = useState({
    education: "medium",
    fiscal: "high",
    governance: "low",
  });
  const [showSettings, setShowSettings] = useState(false);

  const suggestedPrompts = [
    "Compare candidate views on charter school options",
    "List tax-related bond propositions on my ballot",
    "Who is running for local governance seats?",
  ];

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Mock Response from LLM reflecting voter alignment criteria
    setTimeout(() => {
      let aiResponseText = "";
      
      const textLower = text.toLowerCase();
      if (textLower.includes("school") || textLower.includes("education")) {
        aiResponseText = `Based on your Profile Zip Code and **Medium Education Priority** alignment:

1. **Candidate Jane Doe**: Advocates for increasing public funding for charter school options and local choice programs.
2. **Candidate Robert Smith**: Favors structural increases to core public education budgets and teacher salaries.

Both candidates match your general interest, but Candidate Jane Doe aligns closer on school choice options.`;
      } else if (textLower.includes("tax") || textLower.includes("bond") || textLower.includes("fiscal")) {
        aiResponseText = `Examining local bond propositions matching your **High Fiscal Priority**:

- **Proposition 401 (School Safety Bond)**: Requests $80M in capital borrowing, resulting in a estimated property tax increase of $0.05 per $100 assessed value.
- **Proposition 402 (Road Infrastructure Bond)**: Requests $50M in borrowing. Structured as a refunding bond, resulting in *no net increase* to existing tax rates.

Given your concern about fiscal management, Proposition 402 has a lower direct tax impact.`;
      } else {
        aiResponseText = `I've analyzed the platform profiles matching your preferences (Fiscal: ${priorities.fiscal.toUpperCase()}, Education: ${priorities.education.toUpperCase()}). 

Most voters in your district are currently comparing candidates on local fiscal accountability and municipal efficiency. Would you like me to compare candidate platforms on spending or local school bond initiatives?`;
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: aiResponseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);
    }, 1200);
  };

  const handlePriorityChange = (type: "education" | "fiscal" | "governance", val: string) => {
    setPriorities((prev) => ({
      ...prev,
      [type]: val,
    }));
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden h-[100vh]">
      {/* Chat header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-4 flex justify-between items-center shadow-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100">Alignment Assistant</h1>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Gemini 1.5 Flash Model Connected</span>
          </div>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-xl border transition-all ${
            showSettings 
              ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400" 
              : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Settings2 className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Priorities configuration sub-panel */}
      {showSettings && (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-inner shrink-0 transition-all">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adjust Voter Priorities</h3>
          <div className="grid grid-template-columns-1 gap-2.5">
            {Object.keys(priorities).map((key) => {
              const priorityKey = key as keyof typeof priorities;
              return (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">{key} Options</span>
                  <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-800">
                    {["low", "medium", "high"].map((level) => (
                      <button
                        key={level}
                        onClick={() => handlePriorityChange(priorityKey, level)}
                        className={`px-3 py-1 rounded-md font-medium uppercase tracking-wider text-[9px] transition-all ${
                          priorities[priorityKey] === level
                            ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                            : "text-slate-400 dark:text-slate-600"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Message Feed list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 max-w-[85%] ${
              msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
              msg.sender === "user" 
                ? "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400" 
                : "bg-blue-600 text-white"
            }`}>
              {msg.sender === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.sender === "user"
                ? "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/5"
                : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex items-start gap-2.5 max-w-[85%] mr-auto">
            <div className="w-8 h-8 rounded-full shrink-0 bg-blue-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Suggested prompts list & Send Bar */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 space-y-3 shrink-0">
        {/* Suggestion Chips */}
        {messages.length === 1 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Suggested Queries
            </span>
            <div className="flex flex-col gap-1.5">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="w-full text-left px-3 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 font-medium transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Send Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="Ask about candidates or props..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/10 active:scale-[0.95] disabled:opacity-50 transition-all shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
