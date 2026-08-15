import { TailoredCvData } from "@/lib/job-providers/interface";

export function CvPreview({ cvData }: { cvData: TailoredCvData }) {
  if (!cvData) return null;

  return (
    <div className="bg-white mx-auto shadow-md max-w-[210mm] min-h-[297mm] px-[12mm] py-[15mm] text-gray-800" style={{ fontFamily: 'sans-serif' }}>
      
      {/* Header */}
      <header className="border-b border-gray-800 pb-2 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-0.5 tracking-tight">{cvData.fullName || "Nama Lengkap"}</h1>
        {cvData.email && <p className="text-xs text-gray-600">{cvData.email}</p>}
      </header>

      {/* Professional Summary */}
      <section className="mb-4">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Ringkasan Profesional</h2>
        <p className="text-xs text-gray-700 leading-relaxed text-justify">
          {cvData.professionalSummary || "Ringkasan profesional belum tersedia."}
        </p>
      </section>

      {/* Experiences */}
      <section className="mb-4">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Pengalaman Kerja</h2>
        <div className="space-y-3">
          {cvData.experiences && cvData.experiences.length > 0 ? (
            cvData.experiences.map((exp, index) => (
              <div key={index}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-bold text-gray-900 text-sm">{exp.role}</h3>
                  <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap ml-4">{exp.duration}</span>
                </div>
                <div className="text-xs font-medium text-gray-700 mb-1">{exp.company}</div>
                <ul className="list-disc list-outside ml-4 text-xs text-gray-700 space-y-0.5">
                  {exp.highlights?.map((highlight, idx) => (
                    <li key={idx} className="leading-snug">{highlight}</li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500">Belum ada pengalaman kerja yang ditambahkan.</p>
          )}
        </div>
      </section>

      {/* Education */}
      <section className="mb-4">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Pendidikan</h2>
        <div className="space-y-2">
          {cvData.education && cvData.education.length > 0 ? (
            cvData.education.map((edu, index) => (
              <div key={index} className="flex justify-between items-baseline">
                <div>
                  <h3 className="font-bold text-gray-900 text-xs">{edu.institution}</h3>
                  <div className="text-xs text-gray-700">{edu.degree}</div>
                </div>
                <span className="text-[10px] font-medium text-gray-500">{edu.year}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500">Belum ada riwayat pendidikan yang ditambahkan.</p>
          )}
        </div>
      </section>

      {/* Projects */}
      <section className="mb-4">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Proyek</h2>
        <div className="space-y-3">
          {cvData.projects && cvData.projects.length > 0 ? (
            cvData.projects.map((proj, index) => (
              <div key={index}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-bold text-gray-900 text-sm">{proj.name}</h3>
                  <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap ml-4">{proj.duration}</span>
                </div>
                {proj.role && <div className="text-xs font-medium text-gray-700 mb-1">{proj.role}</div>}
                <ul className="list-disc list-outside ml-4 text-xs text-gray-700 space-y-0.5">
                  {proj.highlights?.map((highlight, idx) => (
                    <li key={idx} className="leading-snug">{highlight}</li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500">Belum ada proyek yang ditambahkan.</p>
          )}
        </div>
      </section>

      {/* Organization */}
      <section className="mb-4">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Organisasi</h2>
        <div className="space-y-3">
          {cvData.organizations && cvData.organizations.length > 0 ? (
            cvData.organizations.map((org, index) => (
              <div key={index}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-bold text-gray-900 text-sm">{org.name}</h3>
                  <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap ml-4">{org.duration}</span>
                </div>
                {org.role && <div className="text-xs font-medium text-gray-700 mb-1">{org.role}</div>}
                <ul className="list-disc list-outside ml-4 text-xs text-gray-700 space-y-0.5">
                  {org.highlights?.map((highlight, idx) => (
                    <li key={idx} className="leading-snug">{highlight}</li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500">Belum ada riwayat organisasi yang ditambahkan.</p>
          )}
        </div>
      </section>

      {/* Skills */}
      <section>
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Keahlian & Kompetensi Utama</h2>
        <div className="flex flex-wrap gap-1">
          {cvData.skills && cvData.skills.length > 0 ? (
            cvData.skills.map((skill, index) => (
              <span key={index} className="bg-gray-100 text-gray-800 px-2 py-0.5 text-[10px] font-medium rounded-md border border-gray-200">
                {skill}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-500">Belum ada keahlian yang ditambahkan.</span>
          )}
        </div>
      </section>

    </div>
  );
}
