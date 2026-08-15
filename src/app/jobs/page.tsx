import { JobAggregator, ProviderFilter } from "@/lib/job-providers/aggregator";
import { JobCard } from "@/components/job-card";
import { Search } from "lucide-react";
import Link from "next/link";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const keyword = typeof params.keyword === 'string' ? params.keyword : undefined;
  const location = typeof params.location === 'string' ? params.location : undefined;
  const provider = (typeof params.provider === 'string' ? params.provider : 'Semua') as ProviderFilter;
  const page = typeof params.page === 'string' ? parseInt(params.page, 10) : 1;

  const jobAggregator = new JobAggregator();
  const jobs = await jobAggregator.searchJobs({ keyword, location }, provider, String(page));

  const providers: ProviderFilter[] = ['Semua', 'Glints', 'JobStreet', 'LinkedIn'];

  const getPaginationUrl = (newPage: number) => {
    return `/jobs?${new URLSearchParams({
      ...(keyword ? { keyword } : {}),
      ...(location ? { location } : {}),
      provider,
      page: String(newPage)
    }).toString()}`;
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Filter */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-md shadow-slate-100/50 sticky top-24">
            <h2 className="font-extrabold text-base text-slate-900 mb-5 tracking-tight">Filter Pencarian</h2>
            
            <form className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2.5 uppercase tracking-wider">Kata Kunci</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    name="keyword"
                    defaultValue={keyword}
                    placeholder="Posisi, skill..." 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/50 text-sm font-semibold transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2.5 uppercase tracking-wider">Lokasi</label>
                <input 
                  type="text" 
                  name="location"
                  defaultValue={location}
                  placeholder="Kota atau provinsi" 
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/50 text-sm font-semibold transition-all duration-200"
                />
              </div>

              <input type="hidden" name="provider" value={provider} />
              <input type="hidden" name="page" value="1" />

              <div className="pt-4 border-t border-slate-100">
                <button type="submit" className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-3.5 rounded-2xl font-bold transition-all text-sm shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 duration-200">
                  Terapkan Filter
                </button>
              </div>
            </form>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Lowongan Tersedia</h1>
            
            {/* Provider Filter Buttons */}
            <div className="flex flex-wrap gap-2.5 mb-5">
              {providers.map((p) => (
                <Link 
                  key={p} 
                  href={`/jobs?${new URLSearchParams({
                    ...(keyword ? { keyword } : {}),
                    ...(location ? { location } : {}),
                    provider: p,
                    page: '1'
                  }).toString()}`}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 border ${
                    provider === p 
                    ? 'bg-gradient-to-tr from-primary to-primary-dark text-white shadow-md shadow-primary/25 border-transparent' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-primary/45 hover:text-primary shadow-sm hover:shadow'
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>

            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
              Menampilkan {jobs.total} lowongan {keyword ? `untuk "${keyword}"` : ''} dari {provider} (Halaman {page})
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.data.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          {jobs.data.length === 0 && (
            <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm mt-6">
              <p className="text-slate-400 font-semibold text-base">Tidak ada lowongan yang sesuai dengan kriteria filter Anda.</p>
            </div>
          )}

          {/* Pagination Controls */}
          {jobs.data.length > 0 && (
            <div className="flex justify-center items-center gap-4 mt-12">
              {page > 1 ? (
                <Link 
                  href={getPaginationUrl(page - 1)}
                  className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-sm transition-all duration-200"
                >
                  &larr; Sebelumnya
                </Link>
              ) : (
                <button disabled className="px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-300 font-bold text-xs cursor-not-allowed">
                  &larr; Sebelumnya
                </button>
              )}
              
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50">
                Halaman {page}
              </span>

              {jobs.hasMore ? (
                <Link 
                  href={getPaginationUrl(page + 1)}
                  className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-sm transition-all duration-200"
                >
                  Selanjutnya &rarr;
                </Link>
              ) : (
                <button disabled className="px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-300 font-bold text-xs cursor-not-allowed">
                  Selanjutnya &rarr;
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
