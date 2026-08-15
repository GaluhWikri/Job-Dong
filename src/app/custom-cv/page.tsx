"use client";

import { useState, Suspense, useEffect } from "react";
import {
  UploadCloud, FileText, CheckCircle2, AlertCircle,
  RefreshCw, Briefcase, Download, ChevronDown, ChevronUp, X,
  Mail, Copy, Check, ExternalLink
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { TailoredCvData } from "@/lib/job-providers/interface";
import { getApplications } from "@/lib/applications-store";
import { AtsDocument } from "@/components/ats-document";
import { renderToStaticMarkup } from "react-dom/server";
import { createClient } from "@/lib/supabase/client";

function generateFallbackEmailBody(cv: TailoredCvData, jobTitle: string): string {
  const name = cv.fullName || "Candidate";
  const email = cv.email || "email@example.com";
  const phone = cv.phone || "+62 812 3456 7890";
  const role = jobTitle || cv.targetedRoles || "Software Developer";
  const portfolio = cv.portfolio || "LINK";
  
  // Try to extract skills to list in background
  const skillsList = cv.skills && cv.skills.length > 0
    ? cv.skills.slice(0, 3).map(s => {
        const colonIndex = s.indexOf(':');
        return colonIndex > -1 ? s.substring(colonIndex + 1).trim() : s;
      }).join(', ')
    : "software development";

  return `Dear Hiring Manager,

I am writing to express my strong interest in the ${role} at PT Company Name, as advertised on LinkedIn. With a background in ${skillsList}, I am eager to contribute my expertise to your dynamic team.

My name is ${name}. I am writing to express my interest in the ${role} position, as I have been following your organization's work and believe my technical background aligns perfectly with the responsibilities of the role.

Throughout my experience, I have developed solid capabilities in designing, building, and deploying software projects. I have worked on translating complex requirements into responsive layouts and scalable logic, utilizing my experience with relevant tools to build stable applications and optimize query flows.

I have been following PT Company Name's industry achievements and commitment to driving digital innovation. The collaborative and fast-paced culture at your company strongly resonates with my professional values, and I am excited about the prospect of contributing to your team's upcoming projects.

What sets me apart is my dedication to writing clean, maintainable code and my ability to quickly pick up new tools and frameworks. My combination of technical skills and team-oriented mindset allows me to bridge technical requirements with user needs, making me a valuable asset to your team.

I am highly enthusiastic about the opportunity to discuss my application further in an interview. I am available at your convenience and thank you for your time and consideration.

Sincerely,
${name}
${portfolio}`;
}

function CustomCvContent() {
  const searchParams = useSearchParams();
  const initialTitle = searchParams.get('title') || '';
  const initialDesc = searchParams.get('desc') || '';
  const appId = searchParams.get('appId');

  // CV Input State (local only - no DB)
  const [cvText, setCvText] = useState('');
  const [cvInputMode, setCvInputMode] = useState<'text' | 'file'>('text');
  const [cvFileName, setCvFileName] = useState('');
  const [cvExpanded, setCvExpanded] = useState(true);

  // Profile states to hold contact info
  const [profileFullName, setProfileFullName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');

  // Job Input State
  const [jobImage, setJobImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState(initialDesc);
  const [jobTitle, setJobTitle] = useState(initialTitle);

  // Job image preview generator
  useEffect(() => {
    if (!jobImage) {
      setImagePreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(jobImage);
    setImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [jobImage]);

  // Processing State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Result State
  const [generatedCv, setGeneratedCv] = useState<TailoredCvData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Email Draft States
  const [activeTab, setActiveTab] = useState<'cv' | 'email'>('cv');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Sync draft states when generatedCv is updated
  useEffect(() => {
    if (generatedCv) {
      setEmailTo(generatedCv.emailDraft?.to || 'recruiter@company.com');
      setEmailSubject(generatedCv.emailDraft?.subject || `Application for ${jobTitle || generatedCv.targetedRoles || 'Position'} - ${generatedCv.fullName || 'Candidate'}`);
      setEmailBody(generatedCv.emailDraft?.body || generateFallbackEmailBody(generatedCv, jobTitle));
      setActiveTab('cv'); // Reset to CV preview tab on new generation
    }
  }, [generatedCv, jobTitle]);

  const handleCopyText = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Gagal menyalin ke clipboard:", err);
    }
  };

  // Load from local storage if appId is present
  useEffect(() => {
    if (appId) {
      const apps = getApplications();
      const targetApp = apps.find(a => a.id === appId);
      if (targetApp && targetApp.generatedCv) {
        setGeneratedCv(targetApp.generatedCv);
        setCvExpanded(false);
      }
    }
  }, [appId]);

  // Load CV from Supabase profile on mount if no appId is specified
  const [isLoadingCv, setIsLoadingCv] = useState(false);
  useEffect(() => {
    if (!appId) {
      const fetchProfileCv = async () => {
        setIsLoadingCv(true);
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from('user_cvs')
            .select('cv_text, cv_name, full_name, email, phone')
            .eq('user_id', 'default_user')
            .single();

          if (data) {
            if (data.cv_text) {
              setCvText(data.cv_text);
            }
            if (data.cv_name) {
              setCvFileName(data.cv_name);
              setCvInputMode('file');
            }
            if (data.full_name) setProfileFullName(data.full_name);
            if (data.email) setProfileEmail(data.email);
            if (data.phone) setProfilePhone(data.phone);
          }
        } catch (err) {
          console.error("Gagal mengambil data CV profil:", err);
        } finally {
          setIsLoadingCv(false);
        }
      };
      fetchProfileCv();
    }
  }, [appId]);

  // Handle PDF/DOCX file upload - extract text using API
  const handleCvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setCvFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload-cv', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.text) {
        setCvText(data.text);
        setCvInputMode('file');
      } else {
        setError('Gagal membaca file CV. Coba paste teks CV secara manual.');
      }
    } catch {
      setError('Gagal upload file CV.');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setJobImage(e.target.files[0]);
    }
  };

  const handleAnalyzeAndGenerate = async () => {
    setError(null);

    if (!cvText.trim()) {
      setError("Silakan isi atau upload CV Anda terlebih dahulu.");
      return;
    }

    if (!jobImage && !jobDescription.trim()) {
      setError("Silakan unggah gambar lowongan atau isi teks deskripsi lowongan.");
      return;
    }

    try {
      let finalJobTitle = jobTitle;
      let finalJobDesc = jobDescription;

      // 1. Analyze Image if uploaded
      if (jobImage) {
        setIsAnalyzing(true);
        const formData = new FormData();
        formData.append("image", jobImage);
        if (jobDescription) formData.append("description", jobDescription);

        const analyzeRes = await fetch('/api/analyze-job-image', { method: 'POST', body: formData });
        if (!analyzeRes.ok) throw new Error("Gagal menganalisis gambar lowongan.");

        const analyzeData = await analyzeRes.json();
        if (analyzeData.error) throw new Error(analyzeData.error);

        finalJobTitle = analyzeData.jobTitle || "Posisi Tidak Diketahui";
        finalJobDesc = analyzeData.jobDescription || "";
        setJobTitle(finalJobTitle);
        setJobDescription(finalJobDesc);
        setIsAnalyzing(false);
      }

      // 2. Generate Tailored CV
      setIsGenerating(true);
      setCvExpanded(false); // collapse CV input to show result area
      const generateRes = await fetch('/api/generate-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvText: cvText,
          jobTitle: finalJobTitle || "Posisi Pekerjaan",
          jobDescription: finalJobDesc,
          fullName: profileFullName,
          email: profileEmail,
          phone: profilePhone,
        }),
      });

      if (!generateRes.ok) {
        const errData = await generateRes.json();
        throw new Error(errData.error || "Gagal membuat CV tailored.");
      }

      const generateData = await generateRes.json();
      if (generateData.error) throw new Error(generateData.error);

      setGeneratedCv(generateData.tailoredCv);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan yang tidak terduga.");
    } finally {
      setIsAnalyzing(false);
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!generatedCv) return;
    setIsDownloading(true);

    const cvHtml = renderToStaticMarkup(<AtsDocument cvData={generatedCv} />);
    const name = generatedCv?.fullName?.replace(/\s+/g, '_') || 'CV_ATS';

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.bottom = '0px';
    iframe.style.right = '0px';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      setError("Gagal memproses cetak PDF.");
      setIsDownloading(false);
      return;
    }

    doc.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>CV_ATS_${name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            background: white;
            width: 210mm;
            height: 297mm;
            overflow: hidden;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11.5pt;
            color: #1a1a1a;
            padding: 12mm 15mm;
            line-height: 1.45;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
          @media print {
            html, body {
              width: 210mm;
              height: 297mm;
              overflow: hidden;
            }
            body { padding: 12mm 15mm; }
            /* Scale down content to fit if it overflows */
            #ats-document {
              max-height: 273mm;
              overflow: hidden;
              transform-origin: top left;
            }
          }
        </style>
      </head>
      <body>
        <div id="ats-print-wrapper">${cvHtml}</div>
        <script>
          // Auto-scale content to fit exactly 1 A4 page
          window.addEventListener('load', function() {
            var wrapper = document.getElementById('ats-print-wrapper');
            if (!wrapper) return;
            var pageHeightPx = 297 * 3.7795; // 297mm in px at 96dpi
            var paddingPx = 24 * 3.7795;     // 24mm total v-padding in px
            var availableHeight = pageHeightPx - paddingPx;
            var contentHeight = wrapper.scrollHeight;
            if (contentHeight > availableHeight) {
              var scale = availableHeight / contentHeight;
              wrapper.style.transformOrigin = 'top left';
              wrapper.style.transform = 'scale(' + scale + ')';
              wrapper.style.width = (100 / scale) + '%';
            }
          });
        </script>
      </body>
      </html>
    `);
    doc.close();

    // Focus and print
    setTimeout(() => {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
      setIsDownloading(false);
      // Remove iframe from DOM after print dialog has opened
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1000);
    }, 600);
  };

  const isLoading = isAnalyzing || isGenerating;
  const canGenerate = cvText.trim().length > 0 && (!!jobImage || jobDescription.trim().length > 0);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Buat Custom CV AI</h1>
        <p className="text-slate-500 font-medium text-sm">Sesuaikan isi dan struktur CV Anda agar cocok dengan deskripsi lowongan kerja secara instan.</p>
      </div>

      <div className="space-y-6">

        {/* Step 1: CV Input */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-md shadow-slate-100/40 overflow-hidden">
          <button
            onClick={() => setCvExpanded(v => !v)}
            className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${cvText.trim() ? 'bg-emerald-50 text-emerald-600 border-emerald-250' : 'bg-primary/10 text-primary border-primary/20'}`}>
                {cvText.trim() ? <CheckCircle2 className="w-4.5 h-4.5" /> : '1'}
              </div>
              <div>
                <span className="font-bold text-slate-800">Data CV Utama Anda</span>
                {cvFileName && <span className="ml-2 text-xs font-semibold text-slate-400">({cvFileName})</span>}
                {cvText.trim() && !cvFileName && <span className="ml-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">✓ Data Tersedia</span>}
              </div>
            </div>
            {cvExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {cvExpanded && (
            <div className="px-6 pb-6 border-t border-slate-50/50">
              <p className="text-xs font-semibold text-slate-455 mt-4 mb-4 uppercase tracking-wider">
                Unggah dokumen CV Anda (PDF/Word), atau tempel teks CV secara manual.
              </p>

              {/* Upload option */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center mb-5 hover:bg-slate-50/40 transition-colors">
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleCvFileChange} className="hidden" id="cv-file-upload" />
                <label htmlFor="cv-file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <div className="bg-primary/5 text-primary p-3 rounded-2xl border border-primary/10 mb-1">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-primary hover:text-primary-dark transition-colors">Upload PDF / Word</span>
                  <span className="text-xs font-medium text-slate-400">AI akan mengekstrak isinya secara otomatis</span>
                </label>
                {cvFileName && (
                  <div className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4" /> {cvFileName} — Berhasil diekstrak!
                  </div>
                )}
              </div>

              {/* Manual text */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  Atau ketik / tempel teks CV di bawah ini:
                </label>
                <textarea
                  rows={10}
                  value={isLoadingCv ? "Memuat CV utama dari profil..." : cvText}
                  disabled={isLoadingCv}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder={`Contoh:\nNama: Budi Santoso\nEmail: budi@email.com\n\nPengalaman:\n- Frontend Developer di PT ABC (2021-2024)\n  • Membangun aplikasi React dengan 50k+ pengguna aktif\n  • Meningkatkan performa halaman hingga 40%\n\nSkill: React, TypeScript, Next.js, Tailwind\n\nPendidikan:\n- S1 Teknik Informatika - Universitas Budi Luhur (2021)`}
                  className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/50 text-sm resize-none font-mono font-medium transition-all duration-200"
                />
                <p className="text-xs text-slate-455 mt-2 font-medium">Tip: Semakin lengkap isi CV awal Anda, semakin akurat hasil optimasi AI.</p>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Job Input */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-md shadow-slate-100/40 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold border border-primary/20">2</div>
            <span className="font-bold text-slate-800">Informasi Lowongan Target</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image upload */}
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center hover:bg-slate-50/40 transition-colors flex flex-col items-center justify-center min-h-[180px] relative">
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="job-image-upload" />
              
              {!jobImage ? (
                <label htmlFor="job-image-upload" className="cursor-pointer flex flex-col items-center gap-2 w-full h-full justify-center">
                  <div className="bg-slate-100 text-slate-400 p-2.5 rounded-xl border border-slate-200/50 mb-1">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-slate-650">Unggah Screenshot Lowongan</span>
                  <span className="text-xs font-semibold text-slate-400">AI akan menganalisis teks secara otomatis</span>
                </label>
              ) : (
                <div className="w-full flex flex-col items-center space-y-3">
                  {imagePreviewUrl && (
                    <div className="relative group w-full max-w-[200px] aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50/60 flex items-center justify-center shadow-inner">
                      <img 
                        src={imagePreviewUrl} 
                        alt="Screenshot Lowongan" 
                        className="max-w-full max-h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setJobImage(null);
                          const input = document.getElementById('job-image-upload') as HTMLInputElement;
                          if (input) input.value = '';
                        }}
                        className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-md transition-colors"
                        title="Hapus Gambar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-green-100 max-w-full">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate max-w-[120px]">{jobImage.name}</span>
                  </div>
                  
                  {/* Option to change image */}
                  <label htmlFor="job-image-upload" className="cursor-pointer text-xs text-primary hover:underline font-bold">
                    Ganti Gambar
                  </label>
                </div>
              )}
            </div>

            {/* Manual input */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Nama Posisi Pekerjaan *</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Contoh: Frontend Developer"
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/50 text-sm font-semibold transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Kualifikasi / Deskripsi Pekerjaan *</label>
                <textarea
                  rows={4}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Tempel syarat, kualifikasi, atau deskripsi pekerjaan..."
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/50 text-sm resize-none font-medium transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleAnalyzeAndGenerate}
          disabled={isLoading || !canGenerate}
          className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-4 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 duration-200 text-base"
        >
          {isAnalyzing ? (
            <><RefreshCw className="w-5 h-5 animate-spin" /> Membaca gambar lowongan...</>
          ) : isGenerating ? (
            <><RefreshCw className="w-5 h-5 animate-spin" /> AI sedang menyesuaikan CV Anda...</>
          ) : (
            <><FileText className="w-5 h-5" /> Sesuaikan CV dengan AI</>
          )}
        </button>

        {/* Result Section */}
        {generatedCv && (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-md shadow-slate-100/40 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
            <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <CheckCircle2 className="w-4.5 h-4.5" />
                </div>
                <h2 className="font-extrabold text-base text-slate-800">Hasil AI Tailored</h2>
              </div>
              {activeTab === 'cv' && (
                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="bg-gradient-to-r from-primary to-primary-dark text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 duration-200"
                >
                  <Download className="w-4 h-4" />
                  {isDownloading ? 'Memproses...' : 'Download PDF'}
                </button>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-100 px-6 bg-slate-50/30">
              <button
                onClick={() => setActiveTab('cv')}
                className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'cv'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-400 hover:text-slate-650'
                }`}
              >
                <FileText className="w-4 h-4" />
                Dokumen CV (PDF)
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'email'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-400 hover:text-slate-650'
                }`}
              >
                <Mail className="w-4 h-4" />
                Draf Email Lamaran
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'cv' ? (
              /* Preview area - A4 paper simulation */
              <div className="p-8 md:p-12 bg-slate-100 flex justify-center border-t border-slate-100/50">
                <div
                  className="w-full max-w-[210mm] min-h-[297mm] bg-white p-[15mm] shadow-2xl shadow-slate-350 border border-slate-200/40 rounded-sm"
                  style={{
                    fontFamily: "Arial, Helvetica, sans-serif",
                  }}
                >
                  <AtsDocument cvData={generatedCv} />
                </div>
              </div>
            ) : (
              /* Email Composer Card */
              <div className="p-6 md:p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-6">
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-100/50 p-6 max-w-3xl mx-auto w-full">
                  {/* Email Header */}
                  <div className="space-y-4 mb-6">
                    {/* To Field */}
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <span className="text-xs font-bold text-slate-400 w-16 uppercase tracking-wider shrink-0">Kepada:</span>
                      <input
                        type="text"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        placeholder="recruiter@company.com"
                        className="flex-1 bg-transparent border-0 text-slate-800 focus:outline-none focus:ring-0 text-sm font-semibold px-1"
                      />
                      <button
                        onClick={() => handleCopyText(emailTo, 'to')}
                        className="text-slate-400 hover:text-primary p-1.5 rounded-lg hover:bg-slate-50 transition-all shrink-0"
                        title="Salin Alamat Email"
                      >
                        {copiedField === 'to' ? <Check className="w-4 h-4 text-emerald-650 animate-in fade-in" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Subject Field */}
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <span className="text-xs font-bold text-slate-400 w-16 uppercase tracking-wider shrink-0">Subjek:</span>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Subjek Email"
                        className="flex-1 bg-transparent border-0 text-slate-800 focus:outline-none focus:ring-0 text-sm font-semibold px-1"
                      />
                      <button
                        onClick={() => handleCopyText(emailSubject, 'subject')}
                        className="text-slate-400 hover:text-primary p-1.5 rounded-lg hover:bg-slate-50 transition-all shrink-0"
                        title="Salin Subjek Email"
                      >
                        {copiedField === 'subject' ? <Check className="w-4 h-4 text-emerald-650 animate-in fade-in" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Body Field */}
                  <div className="relative">
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <button
                        onClick={() => handleCopyText(emailBody, 'body')}
                        className="text-slate-400 hover:text-primary p-2 bg-white rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold border border-slate-200/50"
                        title="Salin Isi Email"
                      >
                        {copiedField === 'body' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-650" />
                            <span className="text-emerald-650 font-bold">Disalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin Isi</span>
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      rows={12}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Isi email lamaran..."
                      className="w-full p-4 pt-12 bg-slate-50/30 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 text-sm font-medium leading-relaxed resize-none transition-all"
                    />
                  </div>

                  {/* Footer Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-100">
                    <span className="text-xs text-slate-455 font-semibold text-center sm:text-left">
                      💡 Tip: Anda dapat menyesuaikan teks draf email di atas secara langsung.
                    </span>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          const combined = `To: ${emailTo}\nSubject: ${emailSubject}\n\n${emailBody}`;
                          handleCopyText(combined, 'all');
                        }}
                        className="flex-1 sm:flex-initial border border-slate-200 hover:border-slate-350 text-slate-700 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2"
                      >
                        {copiedField === 'all' ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-650" />
                            <span className="text-emerald-650">Berhasil Disalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Salin Draf</span>
                          </>
                        )}
                      </button>
                      <a
                        href={`mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                        className="flex-1 sm:flex-initial bg-gradient-to-r from-primary to-primary-dark text-white px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 duration-200"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Kirim Email</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomCvPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
      <CustomCvContent />
    </Suspense>
  );
}
