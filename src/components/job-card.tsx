import Link from "next/link";
import { Building2, MapPin, Briefcase, Clock, ArrowUpRight } from "lucide-react";
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

const PROVIDER_LABELS: Record<string, string> = {
  'JobStreet': 'JS',
  'Glints': 'G',
  'LinkedIn': 'in',
};

export function JobCard({ job }: { job: Job }) {
  const description = stripHtml(job.description);

  return (
    <div className="group relative card card-hover p-5 flex flex-col h-full animate-pop-in">
      {/* Header */}
      <div className="relative flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl bg-muted border border-border grid place-items-center overflow-hidden shrink-0">
          {job.companyLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.companyLogoUrl} alt={job.companyName} className="w-full h-full object-contain p-1.5" />
          ) : (
            <Building2 className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
            <Link href={`/jobs/${job.id}`} className="before:absolute before:inset-0">
              {job.title}
            </Link>
          </h3>
          <p className="text-muted-foreground text-xs truncate mt-0.5">{job.companyName}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="relative flex flex-wrap gap-1.5 mb-3">
        <span className="badge">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate max-w-[110px]">{job.location}</span>
        </span>
        <span className="badge">
          <Briefcase className="w-3 h-3 shrink-0" />
          {job.jobType}
        </span>
      </div>

      {/* Description */}
      <p className="relative text-xs text-muted-foreground line-clamp-3 mb-4 flex-1 leading-relaxed">
        {description}
      </p>

      {/* Footer */}
      <div className="relative flex justify-between items-center pt-3 border-t border-border mt-auto">
        {job.salary ? (
          <span className="text-xs font-semibold text-foreground tracking-tight">{job.salary}</span>
        ) : (
          <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Clock className="w-3.5 h-3.5" />
            {formatRelativeDate(new Date(job.postedAt))}
          </span>
        )}

        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground grid place-items-center text-[11px] font-bold">
            {PROVIDER_LABELS[job.provider] ?? job.provider.slice(0, 2)}
          </span>
          <span className="w-6 h-6 rounded-full bg-primary text-background grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
