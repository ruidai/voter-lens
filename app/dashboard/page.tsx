"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  CheckCircle2, 
  Circle, 
  UserCheck, 
  MapPin, 
  Calendar, 
  FileText, 
  ChevronRight,
  TrendingUp,
  Inbox
} from "lucide-react";

export default function DashboardPage() {
  // Mock data mirroring Maricopa County BeBallotReady Portal
  const [voterInfo] = useState({
    name: "John Doe",
    status: "Active Voter",
    party: "Independent",
    zipCode: "85001",
    precinct: "AZ-PHX-12",
    nextElection: "November 3, 2026 - General Election"
  });

  const ballotSteps = [
    { name: "Voter Registration Verified", date: "Oct 5, 2026", status: "completed" },
    { name: "Ballot Prepared & Mailed", date: "Oct 12, 2026", status: "completed" },
    { name: "Ballot Received by County", date: "Oct 24, 2026", status: "completed" },
    { name: "Signature Verified", date: "Pending Review", status: "active" },
    { name: "Ballot Counted & Tallied", date: "Upcoming", status: "upcoming" },
  ];

  const checklistItems = [
    { id: 1, text: "Verify registration details", completed: true },
    { id: 2, text: "Update policy/voter preferences", completed: true, link: "/chat" },
    { id: 3, text: "Scan candidate flyers & mailers", completed: false, link: "/scan" },
    { id: 4, text: "Review LLM candidates alignment", completed: false, link: "/chat" },
  ];

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-blue-600 dark:bg-blue-800 text-white p-6 rounded-b-[2rem] shadow-lg shadow-blue-600/10">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs uppercase font-bold tracking-widest opacity-80">BeBallotReady Portal</span>
          <span className="bg-emerald-500 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full text-emerald-950">
            {voterInfo.status}
          </span>
        </div>
        <h1 className="text-2xl font-bold">{voterInfo.name}</h1>
        <div className="mt-4 flex flex-wrap gap-y-2 gap-x-4 text-sm opacity-90">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-blue-200" />
            <span>Zip: {voterInfo.zipCode}</span>
          </div>
          <div className="flex items-center gap-1">
            <UserCheck className="w-4 h-4 text-blue-200" />
            <span>Party: {voterInfo.party}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Next Election Announcement */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex gap-3 items-start shadow-sm">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Upcoming Election</h3>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">{voterInfo.nextElection}</p>
          </div>
        </div>

        {/* Ballot Tracking Steps */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
            <Inbox className="w-4 h-4 text-blue-500" />
            Ballot Tracker Status
          </h2>
          
          <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 ml-3 space-y-6 py-2">
            {ballotSteps.map((step, idx) => (
              <div key={idx} className="relative">
                {/* Status node */}
                <div className="absolute -left-[31px] top-0 bg-white dark:bg-slate-900 p-0.5 rounded-full">
                  {step.status === "completed" && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                  )}
                  {step.status === "active" && (
                    <div className="w-5 h-5 rounded-full border-4 border-blue-500 bg-white dark:bg-slate-900 animate-pulse" />
                  )}
                  {step.status === "upcoming" && (
                    <Circle className="w-5 h-5 text-slate-300 dark:text-slate-700" />
                  )}
                </div>

                <div className="pl-2">
                  <h4 className={`text-sm font-semibold ${
                    step.status === "completed" ? "text-slate-800 dark:text-slate-200" :
                    step.status === "active" ? "text-blue-600 dark:text-blue-400" :
                    "text-slate-400 dark:text-slate-600"
                  }`}>
                    {step.name}
                  </h4>
                  <span className="text-xs text-slate-400 dark:text-slate-500 block mt-0.5">{step.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Readiness Checklist */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Voter Readiness Checklist
          </h2>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {checklistItems.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 dark:text-slate-700" />
                  )}
                  <span className={`text-sm ${item.completed ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-300"}`}>
                    {item.text}
                  </span>
                </div>
                {item.link && !item.completed && (
                  <Link href={item.link} className="text-blue-500 hover:text-blue-600">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
