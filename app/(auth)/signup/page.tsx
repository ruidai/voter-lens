"use client";

import Link from "next/link";
import { useState } from "react";
import { Vote, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [zipCode, setZipCode] = useState("");
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
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-5">
        {/* Newspaper Header */}
        <div className="flex flex-col items-center border-b border-[#111111] pb-6 text-center space-y-2">
          <div className="w-12 h-12 border border-[#111111] flex items-center justify-center text-[#111111] bg-white">
            <Vote className="w-6 h-6 text-[#CC0000]" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-[#111111] font-display uppercase">
            ESTABLISH NEW ACCOUNT
          </h1>
          <p className="text-[10px] text-news-neutral-500 font-mono uppercase font-bold">
            Registration Log // Vol 1.06
          </p>
        </div>

        {/* Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="fullName"
              className="block text-[9px] font-mono font-bold uppercase tracking-widest text-[#111111]"
            >
              READER FULL NAME
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="JOHN DOE"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border-b-2 border-[#111111] bg-transparent px-3 py-2 font-mono text-xs text-[#111111] focus:bg-news-neutral-100 focus:outline-none uppercase"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-[9px] font-mono font-bold uppercase tracking-widest text-[#111111]"
            >
              EMAIL ADDRESS REGISTER
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
              htmlFor="zipCode"
              className="block text-[9px] font-mono font-bold uppercase tracking-widest text-[#111111]"
            >
              ELIGIBLE ZIP CODE
            </label>
            <input
              id="zipCode"
              type="text"
              placeholder="85001"
              required
              maxLength={5}
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ""))}
              className="w-full border-b-2 border-[#111111] bg-transparent px-3 py-2 font-mono text-xs text-[#111111] focus:bg-news-neutral-100 focus:outline-none uppercase"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-[9px] font-mono font-bold uppercase tracking-widest text-[#111111]"
            >
              NEW ACCESS KEY
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b-2 border-[#111111] bg-transparent px-3 py-2 font-mono text-xs text-[#111111] focus:bg-news-neutral-100 focus:outline-none uppercase"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#111111] hover:bg-[#CC0000] text-[#F9F9F7] text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 outline-none disabled:opacity-40"
          >
            {loading ? "CREATING RECORD..." : "CREATE ACCOUNT"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="mt-6 text-center text-xs">
        <span className="text-news-neutral-600 font-body">Existing subscriber? </span>
        <Link
          href="/login"
          className="font-bold text-[#111111] underline hover:text-[#CC0000] uppercase tracking-wider text-[10px] font-sans"
        >
          Sign In Here
        </Link>
      </div>
    </div>
  );
}
