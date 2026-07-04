"use client";

import Link from "next/link";
import { useState } from "react";
import { Vote, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/dashboard";
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-[#F9F9F7] text-[#111111]">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-6">
        {/* Newspaper styled Header */}
        <div className="flex flex-col items-center border-b border-[#111111] pb-6 text-center space-y-2">
          <div className="w-12 h-12 border border-[#111111] flex items-center justify-center text-[#111111] bg-white">
            <Vote className="w-6 h-6 text-[#CC0000]" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-[#111111] font-display uppercase">
            MEMBER SECURE SIGN IN
          </h1>
          <p className="text-[10px] text-news-neutral-500 font-mono uppercase font-bold">
            Edition Log // Vol 1.05
          </p>
        </div>

        {/* Input Fields */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-[9px] font-mono font-bold uppercase tracking-widest text-[#111111]"
            >
              EMAIL ADDRESS LOG
            </label>
            <input
              id="email"
              type="email"
              placeholder="NAME@DOMAIN.COM"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b-2 border-[#111111] bg-transparent px-3 py-2 font-mono text-xs text-[#111111] focus:bg-news-neutral-100 focus:outline-none uppercase"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-[9px] font-mono font-bold uppercase tracking-widest text-[#111111]"
            >
              SECRET ACCESS KEY
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-b-2 border-[#111111] bg-transparent px-3 py-2 pr-10 font-mono text-xs text-[#111111] focus:bg-news-neutral-100 focus:outline-none uppercase"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-news-neutral-500 hover:text-[#111111]"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="text-right">
            <Link
              href="#"
              className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#111111] underline hover:text-[#CC0000]"
            >
              RESET KEY?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#111111] hover:bg-[#CC0000] text-[#F9F9F7] text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 outline-none disabled:opacity-40"
          >
            {loading ? "AUTHENTICATING..." : "CONFIRM & LOG IN"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="mt-8 text-center text-xs">
        <span className="text-news-neutral-600 font-body">New reader? </span>
        <Link
          href="/signup"
          className="font-bold text-[#111111] underline hover:text-[#CC0000] uppercase tracking-wider text-[10px] font-sans"
        >
          Create Log Account
        </Link>
      </div>
    </div>
  );
}
