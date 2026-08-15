"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Loader2, Sparkles } from "lucide-react";
import { useBackgroundJobs } from "@/context/background-jobs-context";

export function Navbar() {
  const pathname = usePathname();
  const { activeGenerations } = useBackgroundJobs();
  const loadingJobs = activeGenerations.filter((g) => g.status === "loading");

  return (
    <nav className="sticky top-4 z-50 w-[calc(100%-2rem)] max-w-6xl mx-auto bg-white/75 backdrop-blur-xl border border-slate-200/50 rounded-full shadow-lg shadow-slate-150/40 px-6 transition-all duration-300">
      <div className="h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* Custom CSS geometric briefcase logo */}
          <div className="w-8 h-8 relative group-hover:scale-105 transition-all duration-300 shrink-0">
            {/* Briefcase Base */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-dark to-primary rounded-xl shadow-md shadow-primary/20 transform rotate-3 group-hover:rotate-6 transition-transform duration-300"></div>
            {/* Glass handle */}
            <div className="absolute top-[5px] left-[10px] right-[10px] h-[4.5px] rounded-t-md bg-white/40 border-t border-l border-white/20"></div>
            {/* Briefcase Overlay Body */}
            <div className="absolute top-[9px] bottom-[4.5px] left-[4.5px] right-[4.5px] rounded bg-white/15 border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-[0.5px]"></div>
            {/* Clasp/Lock */}
            <div className="absolute bottom-[8.5px] left-[13.5px] w-1 h-1 rounded-sm bg-accent shadow-sm animate-pulse"></div>
          </div>
          <span className="text-base font-extrabold tracking-tight text-slate-900">
            Job<span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent font-black">Dong</span>
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-1 font-bold text-xs">
          <Link 
            href="/jobs" 
            className={`px-4 py-2 rounded-full transition-all duration-200 ${
              pathname === "/jobs" 
                ? "bg-primary/5 text-primary" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-500/5"
            }`}
          >
            Cari Loker
          </Link>
          <Link 
            href="/custom-cv" 
            className={`px-4 py-2 rounded-full transition-all duration-200 ${
              pathname === "/custom-cv" 
                ? "bg-primary/5 text-primary" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-550/5"
            }`}
          >
            Custom CV AI
          </Link>
          <Link 
            href="/applications" 
            className={`px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-1.5 ${
              pathname === "/applications" 
                ? "bg-primary/5 text-primary" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-550/5"
            }`}
          >
            Riwayat Lamaran
            {loadingJobs.length > 0 && (
              <span className="flex items-center gap-1 bg-primary/15 text-primary text-[9px] px-2 py-0.5 rounded-full font-black animate-pulse border border-primary/20">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                AI
              </span>
            )}
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {/* Mobile active generation indicator */}
          {loadingJobs.length > 0 && (
            <div className="md:hidden flex items-center gap-1.5 text-[10px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full animate-pulse">
              <Sparkles className="w-3 h-3 text-primary animate-spin" />
              Proses AI...
            </div>
          )}

          <Link 
            href="/profile" 
            className={`flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-full border transition-all duration-200 text-xs font-bold group shrink-0 ${
              pathname === "/profile" 
                ? "border-primary/20 bg-primary/5 text-primary" 
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-sm"
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              pathname === "/profile" 
                ? "bg-primary text-white" 
                : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
            }`}>
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="hidden sm:inline-block">Profil</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
