"use client";

import { useState, Suspense, useEffect } from "react";
import {
  UploadCloud, FileText, CheckCircle2, AlertCircle,
  RefreshCw, Briefcase, Download, ChevronDown, ChevronUp, X,
  Mail, Copy, Check, ExternalLink
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { TailoredCvData } from "@/lib/job-providers/interface";
import { getApplications, markApplicationSent } from "@/lib/applications-store";
import { AtsDocument } from "@/components/ats-document";
import { renderToStaticMarkup } from "react-dom/server";
import { createClient } from "@/lib/supabase/client";
import { getLocalCvText, getLocalProfile } from "@/lib/local-profile";

function generateFallbackEmailBody(cv: TailoredCvData, jobTitle: string, companyName?: string): string {
  const name = cv.fullName || "Candidate";
  const role = jobTitle || cv.targetedRoles || "the advertised position";
  const company = companyName?.trim() || "your company";

  // Hanya memakai fakta dari CV: skill yang benar-benar ada + highlight pengalaman asli.
  const skillsList = cv.skills?.length
    ? cv.skills.slice(0, 3).map(s => s.split(':').pop()!.trim()).join(', ')
    : '';
  const proof = cv.experiences?.[0]?.highlights?.[0] || cv.projects?.[0]?.highlights?.[0] || '';

  // Bangun blok kontak di signature
  const contactLines: string[] = [];
  if (cv.phone) contactLines.push(`Phone: ${cv.phone}`);
  if (cv.portfolio) contactLines.push(`Portfolio: ${cv.portfolio}`);
  if (cv.email) contactLines.push(`Email: ${cv.email}`);
  const contactBlock = contactLines.length ? `\n${contactLines.join('\n')}` : '';

  return `Dear Hiring Manager,

I am writing to apply for the ${role} position at ${company}. ${skillsList ? `My background covers ${skillsList}.` : ''}${proof ? ` ${proof}` : ''}

I would welcome the chance to discuss how my experience matches the requirements of this role. I am available for an interview at your convenience.

Thank you for your time and consideration.

Sincerely,
${name}${contactBlock}`;
}

/** Pastikan signature di akhir email body selalu mengandung kontak (phone + portfolio). */
function ensureContactInSignature(body: string, cv: TailoredCvData): string {
  const contactLines: string[] = [];
  if (cv.phone && !body.includes(cv.phone)) contactLines.push(`Phone: ${cv.phone}`);
  if (cv.portfolio && !body.includes(cv.portfolio)) contactLines.push(`Portfolio: ${cv.portfolio}`);
  if (cv.email && !body.includes(cv.email)) contactLines.push(`Email: ${cv.email}`);
  if (contactLines.length === 0) return body;
  return `${body.trimEnd()}\n${contactLines.join('\n')}`;
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
  const [jobCompany, setJobCompany] = useState('');
  const [jobEmail, setJobEmail] = useState('');

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
  // Kartu kanban yang baru ditandai terkirim (untuk konfirmasi di UI).
  const [sentCard, setSentCard] = useState<{ title: string; company: string } | null>(null);

  // Sync draft states when generatedCv is updated
  useEffect(() => {
    if (generatedCv) {
      setEmailTo(generatedCv.emailDraft?.to || jobEmail || '');
      setEmailSubject(generatedCv.emailDraft?.subject || `Application for ${jobTitle || generatedCv.targetedRoles || 'Position'} - ${generatedCv.fullName || 'Candidate'}`);
      const rawBody = generatedCv.emailDraft?.body || generateFallbackEmailBody(generatedCv, jobTitle, jobCompany);
      // Pastikan nomor HP dan link porto selalu ada di signature, bahkan kalau AI lupa.
      setEmailBody(ensureContactInSignature(rawBody, generatedCv));
      setActiveTab('cv'); // Reset to CV preview tab on new generation
    }
  }, [generatedCv, jobTitle, jobEmail, jobCompany]);

  // Simpan ke kanban sebagai "Dikirim" — status berikutnya mengikuti spreadsheet.
  const handleMarkSent = () => {
    const card = markApplicationSent({
      jobTitle: jobTitle || generatedCv?.targetedRoles || 'Posisi Pekerjaan',
      companyName: jobCompany.trim() || '(tanpa perusahaan)',
      jobDescription,
      generatedCv: generatedCv ?? undefined,
    });
    setSentCard({ title: card.jobTitle, company: card.companyName });
  };

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
      if (targetApp) {
        // Pulihkan identitas lamaran supaya kartu yang sama yang di-update, bukan bikin baru.
        if (targetApp.jobTitle) setJobTitle(targetApp.jobTitle);
        if (targetApp.companyName) setJobCompany(targetApp.companyName);
        if (targetApp.jobDescription) setJobDescription(targetApp.jobDescription);
      }
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
      // Profil & CV dari browser dipakai lebih dulu — tidak butuh jaringan.
      const local = getLocalProfile();
      const localCv = getLocalCvText();
      if (localCv.trim()) {
        setCvText(localCv);
        setCvFileName(local.cvName || 'CV tersimpan (browser)');
        setCvInputMode('file');
      }
      if (local.fullName) setProfileFullName(local.fullName);
      if (local.email) setProfileEmail(local.email);
      if (local.phone) setProfilePhone(local.phone);

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
            if (data.cv_text && !localCv.trim()) {
              setCvText(data.cv_text);
            }
            if (data.cv_name && !localCv.trim()) {
              setCvFileName(data.cv_name);
              setCvInputMode('file');
            }
            if (data.full_name && !local.fullName) setProfileFullName(data.full_name);
            if (data.email && !local.email) setProfileEmail(data.email);
            if (data.phone && !local.phone) setProfilePhone(data.phone);
          }
        } catch (err) {
          console.warn("Cloud profil tidak tersedia, memakai data browser:", err);
        } finally {
          setIsLoadingCv(false);
        }
      };
      fetchProfileCv();
    }
  }, [appId]);

  // Handle PDF/DOCX file upload - extract text using API
  const [isExtractingCv, setIsExtractingCv] = useState(false);
  const handleCvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setCvFileName(file.name);
    setError(null);
    setIsExtractingCv(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload-cv', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.text) {
        setCvText(data.text);
        setCvInputMode('file');
      } else {
        setCvFileName('');
        setError(data.error || 'Gagal membaca file CV. Coba paste teks CV secara manual.');
      }
    } catch {
      setCvFileName('');
      setError('Gagal upload file CV. Periksa koneksi lalu coba lagi.');
    } finally {
      setIsExtractingCv(false);
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
      let finalCompany = jobCompany;

      // 1. Analyze Image if uploaded
      if (jobImage) {
        setIsAnalyzing(true);
        const formData = new FormData();
        formData.append("image", jobImage);
        if (jobDescription) formData.append("description", jobDescription);

        const analyzeRes = await fetch('/api/analyze-job-image', { method: 'POST', body: formData });
        const analyzeData = await analyzeRes.json();
        if (!analyzeRes.ok || analyzeData.error) {
          throw new Error(analyzeData.error || "Gagal menganalisis gambar lowongan.");
        }

        finalJobTitle = analyzeData.jobTitle || jobTitle || "Posisi Pekerjaan";
        finalJobDesc = analyzeData.jobDescription || jobDescription;
        finalCompany = analyzeData.companyName || jobCompany;
        setJobTitle(finalJobTitle);
        setJobDescription(finalJobDesc);
        setJobCompany(finalCompany);
        if (analyzeData.applicationEmail) setJobEmail(analyzeData.applicationEmail);
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
          companyName: finalCompany,
          applicationEmail: jobEmail,
          fullName: profileFullName,
          email: profileEmail,
          phone: profilePhone,
        }),
      });

      const generateData = await generateRes.json();
      if (!generateRes.ok || generateData.error) {
        throw new Error(generateData.error || "Gagal membuat CV tailored.");
      }

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
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11.5pt;
            color: #1a1a1a;
            padding: 14mm 18mm;
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
            }
            body { padding: 14mm 18mm; }
          }
          /* Ensure contact row wraps properly */
          #ats-document > div:first-child > div {
            flex-wrap: wrap !important;
            white-space: normal !important;
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
            var paddingPx = 28 * 3.7795;     // 28mm total v-padding in px
            var availableHeight = pageHeightPx - paddingPx;
            var contentHeight = wrapper.scrollHeight;
            if (contentHeight > availableHeight) {
              var scale = availableHeight / contentHeight;
              wrapper.style.transformOrigin = 'top left';
              wrapper.style.transform = 'scale(' + scale + ')';
              wrapper.style.width = (100 / scale) + '%';
            }
          });
        <\/script>
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
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-5xl w-full mx-auto">
      <header className="mb-6">
        <h1 className="font-gothic text-lg lg:text-xl font-bold uppercase tracking-[0.12em] text-foreground">Custom CV AI</h1>
        <p className="text-sm text-muted-foreground mt-1">Sesuaikan isi dan struktur CV Anda agar cocok dengan deskripsi lowongan.</p>
      </header>

      <div className="space-y-6">

        {/* Step 1: CV Input */}
        <div className="card overflow-hidden">
          <button
            onClick={() => setCvExpanded(v => !v)}
            className="w-full p-6 flex items-center justify-between text-left hover:bg-white/[0.035] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold transition-all ${cvText.trim() ? 'bg-primary text-background' : 'bg-muted text-muted-foreground border border-border'}`}>
                {cvText.trim() ? <CheckCircle2 className="w-4.5 h-4.5" /> : '1'}
              </div>
              <div>
                <span className="font-bold text-foreground">Data CV Utama Anda</span>
                {cvFileName && <span className="ml-2 text-xs font-semibold text-muted-foreground">({cvFileName})</span>}
                {cvText.trim() && !cvFileName && <span className="ml-2 text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">✓ Data Tersedia</span>}
              </div>
            </div>
            {cvExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>

          {cvExpanded && (
            <div className="px-6 pb-6 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground mt-4 mb-4 uppercase tracking-wide">
                Unggah dokumen CV Anda (PDF/Word), atau tempel teks CV secara manual.
              </p>

              {/* Upload option */}
              <div className="border-2 border-dashed border-border-strong rounded-xl p-5 text-center mb-5 hover:border-primary hover:bg-white/[0.06] transition-colors">
                <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleCvFileChange} className="hidden" id="cv-file-upload" />
                <label htmlFor="cv-file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-primary text-background grid place-items-center mb-2">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-primary hover:underline transition-colors">Upload PDF / Word / TXT</span>
                  <span className="text-xs font-medium text-muted-foreground">Isi CV diekstrak otomatis (PDF/DOCX bertekstur tanpa perlu AI)</span>
                </label>
                {isExtractingCv && (
                  <div className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-primary">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Mengekstrak isi CV...
                  </div>
                )}
                {cvFileName && !isExtractingCv && (
                  <div className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted px-3 py-1.5 rounded-full border border-border">
                    <CheckCircle2 className="w-4 h-4" /> {cvFileName} — Berhasil diekstrak!
                  </div>
                )}
              </div>

              {/* Manual text */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
                  Atau ketik / tempel teks CV di bawah ini:
                </label>
                <textarea
                  rows={10}
                  value={isLoadingCv ? "Memuat CV utama dari profil..." : cvText}
                  disabled={isLoadingCv}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder={`Contoh:\nNama: Budi Santoso\nEmail: budi@email.com\n\nPengalaman:\n- Frontend Developer di PT ABC (2021-2024)\n  • Membangun aplikasi React dengan 50k+ pengguna aktif\n  • Meningkatkan performa halaman hingga 40%\n\nSkill: React, TypeScript, Next.js, Tailwind\n\nPendidikan:\n- S1 Teknik Informatika - Universitas Budi Luhur (2021)`}
                  className="w-full px-4 py-3.5 bg-card border border-border rounded-xl focus:outline-none focus:border-primary text-sm resize-none font-mono font-medium text-foreground placeholder:text-muted-foreground transition-all duration-200"
                />
                <p className="text-xs text-muted-foreground mt-2 font-medium">Tip: Semakin lengkap isi CV awal Anda, semakin akurat hasil optimasi AI.</p>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Job Input */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary text-background grid place-items-center text-sm font-semibold">2</div>
            <span className="font-bold text-foreground">Informasi Lowongan Target</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image upload */}
            <div className="border-2 border-dashed border-border-strong rounded-xl p-5 text-center hover:border-primary hover:bg-white/[0.06] transition-colors flex flex-col items-center justify-center min-h-[180px] relative">
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="job-image-upload" />

              {!jobImage ? (
                <label htmlFor="job-image-upload" className="cursor-pointer flex flex-col items-center gap-2 w-full h-full justify-center">
                  <div className="w-11 h-11 rounded-xl bg-muted text-muted-foreground border border-border grid place-items-center mb-2">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Unggah Screenshot Lowongan</span>
                  <span className="text-xs font-semibold text-muted-foreground">AI akan menganalisis teks secara otomatis</span>
                </label>
              ) : (
                <div className="w-full flex flex-col items-center space-y-3">
                  {imagePreviewUrl && (
                    <div className="relative group w-full max-w-[200px] aspect-video rounded-xl overflow-hidden border border-border bg-card flex items-center justify-center">
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
                        className="absolute top-1.5 right-1.5 bg-foreground text-background hover:opacity-80 p-1 rounded-full transition-colors"
                        title="Hapus Gambar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border max-w-full">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate max-w-[120px]">{jobImage.name}</span>
                  </div>

                  <label htmlFor="job-image-upload" className="cursor-pointer text-xs text-primary hover:underline font-semibold">
                    Ganti Gambar
                  </label>
                </div>
              )}
            </div>

            {/* Manual input */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Nama Posisi Pekerjaan *</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Contoh: Frontend Developer"
                  className="w-full px-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:border-primary text-sm font-semibold text-foreground placeholder:text-muted-foreground transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Kualifikasi / Deskripsi Pekerjaan *</label>
                <textarea
                  rows={4}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Tempel syarat, kualifikasi, atau deskripsi pekerjaan..."
                  className="w-full px-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:border-primary text-sm resize-none font-medium text-foreground placeholder:text-muted-foreground transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-white/[0.05] text-foreground rounded-xl border border-border-strong text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleAnalyzeAndGenerate}
          disabled={isLoading || !canGenerate}
          className="w-full bg-primary text-background hover:opacity-80 py-4 rounded-2xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.005] duration-200 text-base"
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
          <div className="card overflow-hidden animate-pop-in">
            <div className="p-5 border-b border-border bg-white/[0.03] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary text-background grid place-items-center">
                  <CheckCircle2 className="w-4.5 h-4.5" />
                </div>
                <h2 className="font-bold text-base text-foreground">Hasil AI Tailored</h2>
              </div>
              {activeTab === 'cv' && (
                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="bg-primary text-background hover:opacity-80 px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 duration-200"
                >
                  <Download className="w-4 h-4" />
                  {isDownloading ? 'Memproses...' : 'Download PDF'}
                </button>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border px-6">
              <button
                onClick={() => setActiveTab('cv')}
                className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'cv'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-primary'
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
                    : 'border-transparent text-muted-foreground hover:text-primary'
                }`}
              >
                <Mail className="w-4 h-4" />
                Draf Email Lamaran
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'cv' ? (
              /* Preview area - A4 paper simulation */
              <div className="p-8 md:p-12 bg-white/[0.035] flex justify-center border-t border-border">
                <div
                  className="w-full max-w-[210mm] min-h-[297mm] bg-white p-[15mm] border border-gray-300 text-gray-800"
                  style={{
                    fontFamily: "Arial, Helvetica, sans-serif",
                  }}
                >
                  <AtsDocument cvData={generatedCv} />
                </div>
              </div>
            ) : (
              /* Email Composer Card */
              <div className="p-6 md:p-8 bg-white/[0.035] border-t border-border flex flex-col gap-6">
                <div className="card p-6 max-w-3xl mx-auto w-full">
                  {/* Email Header */}
                  <div className="space-y-4 mb-6">
                    {/* To Field */}
                    <div className="flex items-center gap-3 border-b border-border pb-3">
                      <span className="text-xs font-bold text-muted-foreground w-16 uppercase tracking-wide shrink-0">Kepada:</span>
                      <input
                        type="text"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        placeholder="recruiter@company.com"
                        className="flex-1 bg-transparent border-0 text-foreground focus:outline-none focus:ring-0 text-sm font-semibold px-1"
                      />
                      <button
                        onClick={() => handleCopyText(emailTo, 'to')}
                        className="text-muted-foreground hover:text-primary p-1.5 hover:bg-muted rounded-lg transition-all shrink-0"
                        title="Salin Alamat Email"
                      >
                        {copiedField === 'to' ? <Check className="w-4 h-4 text-foreground" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Subject Field */}
                    <div className="flex items-center gap-3 border-b border-border pb-3">
                      <span className="text-xs font-bold text-muted-foreground w-16 uppercase tracking-wide shrink-0">Subjek:</span>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Subjek Email"
                        className="flex-1 bg-transparent border-0 text-foreground focus:outline-none focus:ring-0 text-sm font-semibold px-1"
                      />
                      <button
                        onClick={() => handleCopyText(emailSubject, 'subject')}
                        className="text-muted-foreground hover:text-primary p-1.5 hover:bg-muted rounded-lg transition-all shrink-0"
                        title="Salin Subjek Email"
                      >
                        {copiedField === 'subject' ? <Check className="w-4 h-4 text-foreground" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Body Field */}
                  <div className="relative">
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <button
                        onClick={() => handleCopyText(emailBody, 'body')}
                        className="text-muted-foreground hover:text-primary p-2 bg-card rounded-xl hover:bg-muted transition-all flex items-center gap-1.5 text-xs font-semibold border border-border"
                        title="Salin Isi Email"
                      >
                        {copiedField === 'body' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-foreground" />
                            <span className="text-foreground font-semibold">Disalin!</span>
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
                      className="w-full p-4 pt-12 bg-card border border-border rounded-xl focus:outline-none focus:border-primary text-sm font-medium leading-relaxed resize-none text-foreground placeholder:text-muted-foreground transition-all"
                    />
                  </div>

                  {sentCard && (
                    <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-border-strong bg-white/[0.06] px-4 py-3 text-xs text-foreground animate-pop-in">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        <b>{sentCard.title}</b> @ {sentCard.company} tercatat <b>Terkirim</b> di Kanban.
                        Perubahan status berikutnya mengikuti spreadsheet.
                      </span>
                      <a href="/kanban" className="underline font-bold hover:text-foreground">Buka Kanban →</a>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-border">
                    <span className="text-xs text-muted-foreground font-semibold text-center sm:text-left">
                      💡 Kirim lewat tombol di samping, lalu tekan <b>Tandai Sudah Dikirim</b>.
                    </span>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          const combined = `To: ${emailTo}\nSubject: ${emailSubject}\n\n${emailBody}`;
                          handleCopyText(combined, 'all');
                        }}
                        className="flex-1 sm:flex-initial sm:whitespace-nowrap bg-card border border-border text-muted-foreground hover:bg-muted px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2"
                      >
                        {copiedField === 'all' ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Berhasil Disalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Salin Draf</span>
                          </>
                        )}
                      </button>
                      {generatedCv && (
                        <button
                          onClick={handleMarkSent}
                          className="flex-1 sm:flex-initial sm:whitespace-nowrap bg-foreground text-background hover:opacity-80 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2"
                          title="Tandai lamaran ini sudah dikirim: kartu masuk ke kolom Dikirim di Kanban"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{sentCard ? 'Sudah Tercatat' : 'Tandai Sudah Dikirim'}</span>
                        </button>
                      )}
                      <a
                        href={`mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                        className="flex-1 sm:flex-initial sm:whitespace-nowrap bg-primary text-background hover:opacity-80 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2"
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
    <Suspense fallback={<div className="flex-1 grid place-items-center text-sm text-muted-foreground">Memuat...</div>}>
      <CustomCvContent />
    </Suspense>
  );
}
