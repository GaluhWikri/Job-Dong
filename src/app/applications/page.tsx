"use client";

import { useEffect, useState } from "react";
import { Calendar, Briefcase, MapPin, FileText, ChevronRight, Inbox, Loader2, AlertCircle, X } from "lucide-react";
import Link from "next/link";
import { getApplications, ApplicationRecord, ApplicationStatus, normalizeSheetDate } from "@/lib/applications-store";
import { useBackgroundJobs } from "@/context/background-jobs-context";

/**
 * Tanggal bisa rusak (mis. angka serial dari spreadsheet) — jangan sampai satu
 * baris buruk menjatuhkan seluruh halaman.
 */
function formatDate(value: string): string {
  let d = new Date(value);
  // Angka serial dari spreadsheet → tanggal asli, baru diformat.
  if (Number.isNaN(d.getTime())) d = new Date(`${normalizeSheetDate(value)}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

// Warna selalu dibarengi nomor tahap + label, jadi status tidak pernah
// bergantung pada warna saja (tetap terbaca oleh buta warna).
const STATUS_STYLES: Record<ApplicationStatus, string> = {
  'CV Dibuat': 'text-muted-foreground border-border',
  'Dikirim': 'bg-yellow text-background border-yellow',
  'Dilihat': 'text-yellow border-yellow/40 bg-transparent',
  'Interview': 'text-coral border-coral/40 bg-coral/10',
  'Diterima': 'text-lime border-lime/40 bg-lime/10',
  'Ditolak': 'text-muted-foreground border-border border-dashed',
};

// Nomor tahap = urutan kolom Kanban, sekaligus penanda yang tidak bergantung warna.
const STATUS_GLYPH: Record<ApplicationStatus, string> = {
  'CV Dibuat': '1',
  'Dikirim': '2',
  'Dilihat': '3',
  'Interview': '4',
  'Diterima': '5',
  'Ditolak': '6',
};

function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border inline-flex items-center gap-2 ${STATUS_STYLES[status]}`}>
      <span aria-hidden="true" className="tabular-nums opacity-70">{STATUS_GLYPH[status]}</span>
      {status}
    </span>
  );
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { activeGenerations, clearGeneration } = useBackgroundJobs();

  useEffect(() => {
    setApplications(getApplications());
    setLoaded(true);
  }, [activeGenerations]);

  if (!loaded) {
    return (
      <div className="flex-1 grid place-items-center">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Memuat riwayat lamaran...
        </div>
      </div>
    );
  }

  const pendingJobs = activeGenerations.filter(g => g.status === 'loading');
  const failedJobs = activeGenerations.filter(g => g.status === 'error');
  const hasItems = applications.length > 0 || pendingJobs.length > 0 || failedJobs.length > 0;

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-5xl w-full mx-auto">
      <header className="mb-6">
        <h1 className="font-gothic text-lg lg:text-xl font-bold uppercase tracking-[0.12em] text-foreground">Riwayat Lamaran</h1>
        <p className="text-sm text-muted-foreground mt-1">Semua lamaran yang tersimpan, beserta status CV-nya.</p>
      </header>

      {!hasItems ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-muted text-muted-foreground grid place-items-center mb-4">
            <Inbox className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Belum ada lamaran</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-sm">
            Cari lowongan yang menarik lalu klik &quot;Buat CV Otomatis&quot;, atau nilai kecocokan CV di halaman Kanban.
          </p>
          <Link href="/jobs" className="btn-primary">Cari Lowongan</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Running */}
          {pendingJobs.map(job => (
            <div key={job.jobId} className="card p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 h-0.5 w-full bg-white/[0.08] overflow-hidden">
                <div className="h-full bg-primary animate-infinite-loading" />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
                <div className="min-w-0">
                  <span className="badge bg-white/[0.06] text-primary border-transparent">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    AI membuat CV...
                  </span>
                  <h3 className="font-semibold text-sm text-foreground mt-2">{job.jobTitle}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Briefcase className="w-3.5 h-3.5" /> {job.companyName}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">Proses berjalan di background</span>
              </div>
            </div>
          ))}

          {/* Failed */}
          {failedJobs.map(job => (
            <div key={job.jobId} className="card p-5 border-border-strong relative">
              <button
                onClick={() => clearGeneration(job.jobId)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>

              <span className="badge bg-white/[0.05] text-foreground border-border-strong">
                <AlertCircle className="w-3 h-3" />
                AI gagal membuat CV
              </span>
              <h3 className="font-semibold text-sm text-foreground mt-2">{job.jobTitle}</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <Briefcase className="w-3.5 h-3.5" /> {job.companyName}
              </div>
              <p className="text-xs text-foreground mt-2 bg-white/[0.05] p-2 rounded-lg border border-border-strong max-w-xl">
                {job.error || "Terjadi kesalahan AI."}
              </p>
              <Link href={`/jobs/${job.jobId}`} className="btn-ghost text-xs mt-3">
                Coba Lagi
              </Link>
            </div>
          ))}

          {/* Completed */}
          {applications.map(app => {
            const formattedDate = formatDate(app.appliedAt);
            const isPasted = app.jobId.startsWith('paste-');

            return (
              <div key={app.id} className="card card-hover p-5">
                <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <StatusBadge status={app.status} />
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" /> <span className="whitespace-nowrap">{formattedDate}</span>
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">
                      {isPasted ? app.jobTitle : <Link href={`/jobs/${app.jobId}`} className="hover:text-primary">{app.jobTitle}</Link>}
                    </h3>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      {app.companyName && (
                        <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> {app.companyName}</span>
                      )}
                      {app.location && (
                        <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {app.location}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {app.generatedCv && (
                      <Link href={`/custom-cv?appId=${app.id}`} className="btn-primary text-xs">
                        <FileText className="w-3.5 h-3.5" /> Lihat CV
                      </Link>
                    )}
                    {!isPasted && (
                      <Link href={`/jobs/${app.jobId}`} className="btn-ghost text-xs">
                        Lihat Loker <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
