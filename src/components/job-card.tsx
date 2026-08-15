import Link from "next/link";
import { Building2, MapPin, Briefcase, Clock } from "lucide-react";
import { Job } from "@/lib/job-providers/interface";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Hari ini';
  if (diff === 1) return 'Kemarin';
  if (diff < 7) return `${diff} hari lalu`;
  if (diff < 30) return `${Math.floor(diff / 7)} minggu lalu`;
  return `${Math.floor(diff / 30)} bulan lalu`;
}

const PROVIDER_COLORS: Record<string, string> = {
  'JobStreet': 'bg-purple-50 text-purple-600 border border-purple-100/80',
  'Glints': 'bg-orange-50 text-orange-600 border border-orange-100/80',
  'LinkedIn': 'bg-sky-50 text-sky-650 border border-sky-100/80',
  'Mock': 'bg-slate-50 text-slate-600 border border-slate-100',
};

export function JobCard({ job }: { job: Job }) {
  const description = stripHtml(job.description);

  return (
    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-100/50 hover:-translate-y-1.5 transition-all duration-300 group flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-start gap-4.5 mb-4.5">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100/80 overflow-hidden shrink-0 shadow-inner">
          {job.companyLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.companyLogoUrl} alt={job.companyName} className="w-full h-full object-contain p-1.5" />
          ) : (
            <Building2 className="w-5 h-5 text-slate-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-slate-900 leading-snug group-hover:text-primary transition-colors line-clamp-2">
            <Link href={`/jobs/${job.id}`} className="before:absolute before:inset-0">
              {job.title}
            </Link>
          </h3>
          <p className="text-slate-400 text-xs font-semibold truncate mt-0.5">{job.companyName}</p>
        </div>
      </div>

      {/* Meta badges */}
      <div className="flex flex-wrap gap-2 mb-4.5">
        <span className="flex items-center gap-1.5 text-slate-500 text-xs bg-slate-50/70 border border-slate-100/50 px-2.5 py-1 rounded-xl font-semibold">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[100px]">{job.location}</span>
        </span>
        <span className="flex items-center gap-1.5 text-slate-500 text-xs bg-slate-50/70 border border-slate-100/50 px-2.5 py-1 rounded-xl font-semibold">
          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {job.jobType}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-550 line-clamp-3 mb-5 flex-1 leading-relaxed font-medium">
        {description}
      </p>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-100/80 mt-auto">
        <div className="flex items-center gap-2">
          {job.salary ? (
            <span className="font-extrabold text-primary text-sm tracking-tight">{job.salary}</span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              {formatRelativeDate(new Date(job.postedAt))}
            </span>
          )}
        </div>
        <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-xl ${PROVIDER_COLORS[job.provider] ?? 'bg-slate-50 text-slate-650 border border-slate-100'}`}>
          {job.provider}
        </span>
      </div>
    </div>
  );
}
