"use client";

import { useEffect, useState } from "react";
import { Calendar, Briefcase, MapPin, FileText, ChevronRight, Inbox, Loader2, AlertCircle, X } from "lucide-react";
import Link from "next/link";
import { getApplications, ApplicationRecord } from "@/lib/applications-store";
import { useBackgroundJobs } from "@/context/background-jobs-context";

function StatusBadge({ status }: { status: ApplicationRecord['status'] }) {
  const styles: Record<ApplicationRecord['status'], string> = {
    'CV Dibuat': 'bg-blue-50 text-blue-700 border-blue-100',
    'Dikirim': 'bg-purple-50 text-purple-700 border-purple-100',
    'Dilihat': 'bg-amber-50 text-amber-700 border-amber-100',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${styles[status]}`}>
      {status}
    </span>
  );
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { activeGenerations, clearGeneration } = useBackgroundJobs();

  // Reload applications from localStorage whenever background tasks change (e.g. finishes)
  useEffect(() => {
    setApplications(getApplications());
    setLoaded(true);
  }, [activeGenerations]);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Memuat riwayat lamaran...</div>
      </div>
    );
  }

  // Filter active jobs in background that are loading or failed
  const pendingJobs = activeGenerations.filter(g => g.status === 'loading');
  const failedJobs = activeGenerations.filter(g => g.status === 'error');

  const hasItems = applications.length > 0 || pendingJobs.length > 0 || failedJobs.length > 0;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Riwayat Lamaran</h1>
          <p className="text-secondary">Pantau semua lamaran kerja yang telah Anda simpan.</p>
        </div>
      </div>

      {!hasItems ? (
        <div className="bg-white rounded-3xl p-16 border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
            <Inbox className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Belum ada lamaran</h2>
          <p className="text-gray-500 mb-6 max-w-sm">
            Anda belum melamar pekerjaan apa pun. Cari lowongan yang menarik dan klik "Buat CV Otomatis".
          </p>
          <Link
            href="/jobs"
            className="bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Cari Lowongan
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* 1. RENDER RUNNING JOBS (LOADING STATE) */}
          {pendingJobs.map(job => (
            <div
              key={job.jobId}
              className="bg-white rounded-2xl p-6 border border-primary/20 bg-primary/5 shadow-sm animate-pulse relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 h-1 w-full bg-primary/25 overflow-hidden">
                <div className="h-full bg-primary animate-infinite-loading"></div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-md border border-primary/20">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      AI Generating CV...
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-foreground">
                    {job.jobTitle}
                  </h3>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" /> {job.companyName}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0 items-center">
                  <span className="text-xs text-gray-400 font-medium">Jangan tutup tab ini...</span>
                  <div className="flex items-center justify-center bg-gray-50 text-gray-400 p-2.5 rounded-xl border border-gray-100">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* 2. RENDER FAILED JOBS */}
          {failedJobs.map(job => (
            <div
              key={job.jobId}
              className="bg-white rounded-2xl p-6 border border-red-100 bg-red-50/30 shadow-sm relative"
            >
              <button 
                onClick={() => clearGeneration(job.jobId)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-md border border-red-200">
                      <AlertCircle className="w-3.5 h-3.5" />
                      AI Gagal Membuat CV
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-foreground">
                    {job.jobTitle}
                  </h3>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" /> {job.companyName}
                    </span>
                  </div>
                  <p className="text-xs text-red-600 mt-2 font-medium bg-red-50 p-2 rounded-lg border border-red-100 max-w-xl">
                    Error: {job.error || "Terjadi kesalahan AI."}
                  </p>
                </div>

                <div className="flex gap-2 shrink-0 mt-4 md:mt-0">
                  <Link
                    href={`/jobs/${job.jobId}`}
                    className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-gray-200"
                  >
                    Coba Lagi
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* 3. RENDER COMPLETED APPLICATIONS */}
          {applications.map(app => {
            const formattedDate = new Intl.DateTimeFormat('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(app.appliedAt));

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <StatusBadge status={app.status} />
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {formattedDate}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-foreground hover:text-primary transition-colors">
                      <Link href={`/jobs/${app.jobId}`}>{app.jobTitle}</Link>
                    </h3>
                    <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" /> {app.companyName}
                      </span>
                      {app.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> {app.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/custom-cv?appId=${app.id}`}
                      className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                      <FileText className="w-4 h-4" /> Lihat CV
                    </Link>
                    <Link
                      href={`/jobs/${app.jobId}`}
                      className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-gray-200"
                    >
                      Lihat Loker <ChevronRight className="w-4 h-4" />
                    </Link>
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
