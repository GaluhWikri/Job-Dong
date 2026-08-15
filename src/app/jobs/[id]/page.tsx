import { JobAggregator } from "@/lib/job-providers/aggregator";
import { notFound } from "next/navigation";
import { MapPin, Briefcase, Building2, Calendar, DollarSign, ExternalLink } from "lucide-react";
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
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link href="/jobs" className="text-sm text-gray-500 hover:text-primary mb-6 inline-block">
        &larr; Kembali ke daftar lowongan
      </Link>

      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-gray-100">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shrink-0">
              {job.companyLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={job.companyLogoUrl} alt={job.companyName} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{job.title}</h1>
              <div className="text-lg text-gray-600 mb-4">{job.companyName}</div>
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4"/> {job.location}</span>
                <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4"/> {job.jobType}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/> Diposting {formattedDate}</span>
                {job.salary && (
                  <span className="flex items-center gap-1.5 text-primary font-medium"><DollarSign className="w-4 h-4"/> {job.salary}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="shrink-0 flex flex-col gap-3">
             <ApplicationButton jobId={job.id} jobTitle={job.title} companyName={job.companyName} location={job.location} jobDescription={job.description} />
             <Link 
               href={`/custom-cv?title=${encodeURIComponent(job.title)}&desc=${encodeURIComponent(
                 // Provide a text summary for the AI to parse instead of full raw HTML if possible, 
                 // but we'll just pass the description text (stripping html tags).
                 job.description.replace(/<[^>]*>?/gm, '').substring(0, 500) + '...'
               )}`}
               className="w-full text-center bg-white border-2 border-primary text-primary hover:bg-primary/5 px-6 py-2.5 rounded-xl font-semibold transition-colors shadow-sm"
             >
               ✨ Buat CV Tailored
             </Link>
          </div>
        </div>

        {/* Content */}
        <div className="py-8 space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-4 text-foreground">Deskripsi Pekerjaan</h2>
            <div 
              className="text-gray-600 leading-relaxed job-description-html space-y-4"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 text-foreground">Kualifikasi</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              {job.qualifications.map((qual, index) => (
                <li key={index}>{qual}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 text-foreground">Benefit</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              {job.benefits.map((benefit, index) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>
          </section>

          {job.originalUrl && (
             <section className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-500 block mb-1">Sumber Lowongan</span>
                  <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-sm font-medium">
                    {job.provider}
                  </span>
                </div>
                <a 
                  href={job.originalUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline text-sm font-medium"
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
