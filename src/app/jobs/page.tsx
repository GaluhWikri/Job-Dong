import { JobAggregator, ProviderFilter } from "@/lib/job-providers/aggregator";
import { JobCard } from "@/components/job-card";
import { Search, FolderOpen } from "lucide-react";
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
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl w-full mx-auto">
      <header className="mb-6">
        <h1 className="font-gothic text-lg lg:text-xl font-bold uppercase tracking-[0.12em] text-foreground">Cari Lowongan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {jobs.total} lowongan ditemukan{keyword ? ` untuk "${keyword}"` : ''} · sumber {provider} · halaman {page}
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filter */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="card p-5 lg:sticky lg:top-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Filter</h2>

            <form className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kata kunci</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    name="keyword"
                    aria-label="Kata kunci lowongan"
                    defaultValue={keyword}
                    placeholder="Posisi, skill..."
                    className="input pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Lokasi</label>
                <input
                  type="text"
                  name="location"
                  aria-label="Lokasi lowongan"
                  defaultValue={location}
                  placeholder="Kota atau provinsi"
                  className="input"
                />
              </div>

              <input type="hidden" name="provider" value={provider} />
              <input type="hidden" name="page" value="1" />

              <button type="submit" className="btn-primary w-full">
                Terapkan Filter
              </button>
            </form>

            <div className="pt-4 mt-4 border-t border-border">
              <div className="text-xs font-medium text-muted-foreground mb-2">Sumber</div>
              <div className="flex flex-wrap gap-1.5">
                {providers.map((p) => (
                  <Link
                    key={p}
                    href={`/jobs?${new URLSearchParams({
                      ...(keyword ? { keyword } : {}),
                      ...(location ? { location } : {}),
                      provider: p,
                      page: '1'
                    }).toString()}`}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      provider === p
                        ? 'bg-primary text-background'
                        : 'bg-muted text-muted-foreground hover:bg-white/[0.06] hover:text-primary'
                    }`}
                  >
                    {p}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {jobs.data.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          {jobs.data.length === 0 && (
            <div className="card p-12 text-center animate-pop-in">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-muted text-muted-foreground grid place-items-center">
                <FolderOpen className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-foreground">Tidak ada lowongan ditemukan</p>
              <p className="text-xs text-muted-foreground mt-1">Coba ubah kata kunci atau filter pencarian.</p>
            </div>
          )}

          {jobs.data.length > 0 && (
            <div className="flex justify-center items-center gap-3 mt-8">
              {page > 1 ? (
                <Link href={getPaginationUrl(page - 1)} className="btn-ghost text-xs">
                  &larr; Sebelumnya
                </Link>
              ) : (
                <button disabled className="btn-ghost text-xs opacity-40 cursor-not-allowed">
                  &larr; Sebelumnya
                </button>
              )}

              <span className="badge">Halaman {page}</span>

              {jobs.hasMore ? (
                <Link href={getPaginationUrl(page + 1)} className="btn-ghost text-xs">
                  Selanjutnya &rarr;
                </Link>
              ) : (
                <button disabled className="btn-ghost text-xs opacity-40 cursor-not-allowed">
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
