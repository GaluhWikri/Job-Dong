"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListChecks, Loader2, Search, Sparkles, SquareKanban, User } from "lucide-react";
import { useBackgroundJobs } from "@/context/background-jobs-context";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Cari Lowongan", icon: Search },
  { href: "/custom-cv", label: "Custom CV AI", icon: Sparkles },
  { href: "/kanban", label: "Kanban Lamaran", icon: SquareKanban },
  { href: "/applications", label: "Riwayat Lamaran", icon: ListChecks },
  { href: "/profile", label: "Profil & CV", icon: User },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 min-w-0">
      <Image
        src="/favicon/android-chrome-192x192.png"
        alt=""
        width={40}
        height={40}
        className="w-10 h-10 shrink-0"
        priority
      />
      <span className="font-gothic font-extrabold text-foreground text-sm tracking-tight truncate">
        JobDong
      </span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { activeGenerations } = useBackgroundJobs();
  const loading = activeGenerations.filter((g) => g.status === "loading").length;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {/* Rail kiri — permukaan lebih terang dari kanvas, tanpa blur */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-card border-r border-border h-full">
        <div className="flex items-center px-5 h-16">
          <Brand />
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scroll-thin">
          {NAV.map(({ href, label, icon: Icon }, i) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  active
                    ? "bg-white text-[#0d0d0f] font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5 font-medium"
                }`}
              >
                <span className={`text-[11px] font-bold tabular-nums ${active ? "text-[#0d0d0f]/60" : "text-muted-foreground/70"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{label}</span>
                {href === "/applications" && loading > 0 && (
                  <span className={`ml-auto flex items-center gap-1 text-[11px] font-bold ${active ? "text-[#0d0d0f]" : "text-yellow"}`}>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {loading}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 text-xs font-medium text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-lime shrink-0" />
            <span className="truncate">AI &amp; Scraper aktif</span>
          </div>
        </div>
      </aside>

      {/* Mobile: bar atas + nav mendatar */}
      <div className="md:hidden shrink-0 z-40 bg-card border-b border-border">
        <div className="flex items-center gap-3 px-4 h-16">
          <Brand />
          {loading > 0 && (
            <span className="ml-auto flex items-center gap-1 text-[11px] font-bold text-yellow shrink-0">
              <Loader2 className="w-3 h-3 animate-spin" /> {loading}
            </span>
          )}
        </div>
        <nav className="flex gap-2 overflow-x-auto scroll-thin px-3 pb-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                  active
                    ? "bg-white text-[#0d0d0f] font-bold"
                    : "text-muted-foreground font-medium bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
