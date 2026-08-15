import Link from "next/link";
import { Search, MapPin, Briefcase, Building2, ChevronRight, Sparkles } from "lucide-react";
import { JobAggregator } from "@/lib/job-providers/aggregator";

export default async function Home() {
  const jobAggregator = new JobAggregator();
  const recentJobs = await jobAggregator.searchJobs({});

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] relative overflow-hidden bg-slate-50/30">
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

      {/* Personal Career Dashboard Cockpit */}
      <section className="relative pt-12 pb-2 px-4 z-10 max-w-6xl mx-auto w-full">
        <div className="bg-white/60 backdrop-blur-md border border-slate-200/50 rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/40">
          {/* Greeting and System Status */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-primary font-extrabold text-xs uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                Personal Career Command Center
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-905 tracking-tight">
                Halo Galuh, Siap Menyelaras Loker Hari Ini?
              </h1>
            </div>
            
            {/* System Status Indicator */}
            <div className="flex items-center gap-2.5 bg-slate-100/70 border border-slate-200/60 px-4 py-2 rounded-2xl text-xs font-bold text-slate-600 shadow-sm shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute"></span>
              AI & Scraper: Active
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/80 border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:-translate-y-0.5 transition-transform duration-200">
              <div className="bg-primary/5 text-primary p-3 rounded-xl border border-primary/10 shrink-0">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loker Terindeks</div>
                <div className="text-base font-extrabold text-slate-800">70+ Lowongan</div>
              </div>
            </div>

            <div className="bg-white/80 border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:-translate-y-0.5 transition-transform duration-200">
              <div className="bg-primary/5 text-primary p-3 rounded-xl border border-primary/10 shrink-0">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Engine Kustomisasi</div>
                <div className="text-base font-extrabold text-slate-800">Gemini 2.5 AI</div>
              </div>
            </div>

            <div className="bg-white/80 border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:-translate-y-0.5 transition-transform duration-200">
              <div className="bg-primary/5 text-primary p-3 rounded-xl border border-primary/10 shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sumber Agregasi</div>
                <div className="flex items-center gap-1.5 mt-1">
                  {/* Glints Micro Badge */}
                  <span className="w-5 h-5 bg-[#00b4d8] text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-sm select-none" title="Glints">G</span>
                  {/* JobStreet Micro Badge */}
                  <span className="w-5 h-5 bg-[#1c3f60] text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-sm select-none" title="JobStreet">JS</span>
                  {/* LinkedIn Micro Badge */}
                  <span className="w-5 h-5 bg-[#0077b5] text-white rounded-[4px] flex items-center justify-center text-[9px] font-black tracking-tighter shadow-sm select-none" title="LinkedIn">in</span>
                </div>
              </div>
            </div>
          </div>

          {/* Unified Airbnb-style Search Console */}
          <div className="bg-white border border-slate-200/80 rounded-[2rem] p-2 shadow-lg shadow-slate-100/50 mt-2 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all duration-200">
            <form action="/jobs" method="GET" className="flex flex-col md:flex-row items-center gap-2">
              
              {/* Keyword Input */}
              <div className="flex-1 w-full flex items-center gap-3 px-4 py-3 bg-transparent">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  name="keyword"
                  placeholder="Cari posisi pekerjaan, kualifikasi, skill..." 
                  className="bg-transparent border-none outline-none w-full text-slate-800 placeholder:text-slate-400 text-sm font-semibold focus:ring-0"
                />
              </div>

              {/* Vertical Divider */}
              <div className="hidden md:block w-px h-8 bg-slate-200 shrink-0"></div>

              {/* Location Input */}
              <div className="flex-1 w-full flex items-center gap-3 px-4 py-3 bg-transparent">
                <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  name="location"
                  placeholder="Provinsi atau kota target..." 
                  className="bg-transparent border-none outline-none w-full text-slate-800 placeholder:text-slate-400 text-sm font-semibold focus:ring-0"
                />
              </div>

              {/* Action Button */}
              <button 
                type="submit"
                className="w-full md:w-auto bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white px-8 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] duration-200 shrink-0"
              >
                <Search className="w-4 h-4 shrink-0" />
                Mulai Pencarian
              </button>
            </form>
          </div>

          {/* Quick Query Filters */}
          <div className="flex flex-wrap items-center gap-3.5 mt-5 text-[11px] font-bold text-slate-450 px-2">
            <span>Filter Cepat:</span>
            <Link href="/jobs?keyword=Software+Engineer" className="hover:text-primary transition-colors">#Software-Engineer</Link>
            <span className="text-slate-350">|</span>
            <Link href="/jobs?keyword=Digital+Marketing" className="hover:text-primary transition-colors">#Digital-Marketing</Link>
            <span className="text-slate-350">|</span>
            <Link href="/jobs?keyword=UI%2FUX+Designer" className="hover:text-primary transition-colors">#UI-UX-Designer</Link>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="pt-10 pb-20 px-4 bg-white/40 border-t border-slate-100 z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Lowongan Pekerjaan Terbaru</h2>
              <p className="text-slate-500 mt-2.5 text-sm font-medium">Temukan peluang terbaik dari berbagai platform terpercaya.</p>
            </div>
            <Link href="/jobs" className="text-primary font-bold hover:text-primary-dark transition-colors flex items-center gap-1 group text-sm">
              Lihat semua 
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentJobs.data.slice(0, 9).map(job => (
              <div key={job.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:shadow-slate-100/50 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between min-h-[320px] group">
                <div>
                  <div className="flex justify-between items-start mb-5">
                    <div className="bg-primary/5 text-primary p-3 rounded-2xl border border-primary/10">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-50 text-slate-500 px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                      {job.provider}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-primary transition-colors line-clamp-1">
                    <Link href={`/jobs/${job.id}`}>
                      {job.title}
                    </Link>
                  </h3>
                  <div className="flex flex-col gap-2 text-slate-450 text-xs font-semibold mb-5">
                    <span className="flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400 shrink-0"/> {job.companyName}</span>
                    <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400 shrink-0"/> {job.location}</span>
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {job.jobType && (
                      <span className="bg-primary-light/50 text-primary-dark px-2.5 py-1 rounded-xl text-xs font-bold border border-primary/10 inline-block">
                        {job.jobType}
                      </span>
                    )}
                    {job.salary && (
                      <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-xl text-xs font-bold border border-emerald-100/70 inline-block">
                        {job.salary}
                      </span>
                    )}
                  </div>
                  
                  <Link 
                    href={`/jobs/${job.id}`}
                    className="block w-full text-center bg-slate-50 hover:bg-gradient-to-r hover:from-primary hover:to-primary-dark hover:text-white hover:shadow-md hover:shadow-primary/20 text-slate-700 font-bold py-3 rounded-2xl transition-all duration-200 text-sm border border-slate-100"
                  >
                    Lihat Detail
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
