import { JobAggregator } from "@/lib/job-providers/aggregator";
import { notFound } from "next/navigation";
import { MapPin, Briefcase, Building2, Calendar, DollarSign, ExternalLink, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { ApplicationButton } from "@/components/application-button";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  const jobAggregator = new JobAggregator();
  const job = await jobAggregator.getJobDetail(id);

  if (!job) {
    notFound();
  }

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(job.postedAt));

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-5xl w-full mx-auto">
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali ke daftar lowongan
      </Link>

      <div className="card p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-border">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-muted border border-border grid place-items-center overflow-hidden shrink-0">
              {job.companyLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={job.companyLogoUrl} alt={job.companyName} className="w-full h-full object-contain p-1.5" />
              ) : (
                <Building2 className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-gothic text-lg lg:text-xl font-bold uppercase tracking-[0.12em] text-foreground">{job.title}</h1>
              <div className="text-sm text-muted-foreground mt-1">{job.companyName}</div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="badge"><MapPin className="w-3 h-3" /> {job.location}</span>
                <span className="badge"><Briefcase className="w-3 h-3" /> {job.jobType}</span>
                <span className="badge"><Calendar className="w-3 h-3" /> {formattedDate}</span>
                {job.salary && (
                  <span className="badge bg-white/[0.06] text-foreground border-border-strong">
                    <DollarSign className="w-3 h-3" /> {job.salary}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col gap-2 lg:w-52">
            <ApplicationButton jobId={job.id} jobTitle={job.title} companyName={job.companyName} location={job.location} jobDescription={job.description} />
            <Link
              href={`/custom-cv?title=${encodeURIComponent(job.title)}&desc=${encodeURIComponent(
                job.description.replace(/<[^>]*>?/gm, '').substring(0, 500) + '...'
              )}`}
              className="btn-ghost w-full"
            >
              <Sparkles className="w-4 h-4" />
              Buat CV Tailored
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="pt-6 space-y-8">
          <section>
            <h2 className="text-sm font-semibold text-foreground mb-3">Deskripsi pekerjaan</h2>
            <div
              className="job-description-html text-sm text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          </section>

          {job.qualifications.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-foreground mb-3">Kualifikasi</h2>
              <ul className="list-disc list-outside pl-5 text-sm text-muted-foreground space-y-2 leading-relaxed">
                {job.qualifications.map((qual, index) => (
                  <li key={index}>{qual}</li>
                ))}
              </ul>
            </section>
          )}

          {job.benefits.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-foreground mb-3">Benefit</h2>
              <ul className="list-disc list-outside pl-5 text-sm text-muted-foreground space-y-2 leading-relaxed">
                {job.benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </section>
          )}

          {job.originalUrl && (
            <section className="pt-6 border-t border-border flex flex-wrap items-center justify-between gap-3">
              <span className="badge">Sumber: {job.provider}</span>
              <a
                href={job.originalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Lihat di sumber asli <ExternalLink className="w-4 h-4" />
              </a>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
