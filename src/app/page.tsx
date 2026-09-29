import Link from "next/link";
import { Search, MapPin, ChevronRight } from "lucide-react";
import { JobAggregator } from "@/lib/job-providers/aggregator";
import { JobCard } from "@/components/job-card";
import { DashboardInsights } from "@/components/dashboard-insights";

const QUICK_FILTERS = [
  { label: "Software Engineer", href: "/jobs?keyword=Software+Engineer" },
  { label: "Digital Marketing", href: "/jobs?keyword=Digital+Marketing" },
  { label: "UI/UX Designer", href: "/jobs?keyword=UI%2FUX+Designer" },
  { label: "Data Analyst", href: "/jobs?keyword=Data+Analyst" },
];

export default async function Home() {
  const jobAggregator = new JobAggregator();
  const recentJobs = await jobAggregator.searchJobs({});

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl w-full mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-gothic text-lg lg:text-xl font-bold uppercase tracking-[0.12em] text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Ringkasan lamaran, skor kecocokan CV, dan lowongan terbaru dalam satu tampilan.
          </p>
        </div>
      </header>

      {/* Ringkasan + insight lamaran */}
      <DashboardInsights />

      {/* Pencarian */}
      <section className="card p-5">
        <form action="/jobs" method="GET" className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-border bg-transparent focus-within:border-border-strong focus-within:ring-2 focus-within: transition-all">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              name="keyword"
              aria-label="Kata kunci lowongan"
              placeholder="Posisi, skill, atau kata kunci..."
              className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-border bg-transparent focus-within:border-border-strong focus-within:ring-2 focus-within: transition-all">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              name="location"
              aria-label="Lokasi lowongan"
              placeholder="Kota atau provinsi..."
              className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <button type="submit" className="btn-primary md:w-auto w-full shrink-0">
            <Search className="w-4 h-4" />
            Cari Lowongan
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-xs text-muted-foreground mr-1">Populer:</span>
          {QUICK_FILTERS.map((filter) => (
            <Link
              key={filter.href}
              href={filter.href}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.05] border border-border text-muted-foreground hover:bg-white/[0.06] hover:text-foreground hover:border-border transition-colors"
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Lowongan terbaru */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="font-gothic text-sm font-bold uppercase tracking-[0.14em] text-foreground">Lowongan terbaru</h2>
            <p className="text-sm text-muted-foreground mt-1">Diambil dari beberapa platform terpercaya.</p>
          </div>
          <Link href="/jobs" className="btn-ghost text-xs shrink-0">
            Lihat semua
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentJobs.data.slice(0, 6).map((job, i) => (
            <div key={job.id} className="animate-pop-in" style={{ animationDelay: `${i * 50}ms` }}>
              <JobCard job={job} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
