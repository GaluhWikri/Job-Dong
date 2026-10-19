<div align="center">

# Job Dong

**AI-powered job application assistant** — temukan lowongan, latih CV ke ATS, dan kirim lamaran yang benar-benar tailored, dari satu tempat.

[![Next.js](https://img.shields.io/badge/Next.js-16.3-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Google GenAI](https://img.shields.io/badge/Google%20GenAI-Gemini-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3FCF8E?logo=supabase&logoColor=black)](https://supabase.com)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

</div>

---

## 📑 Daftar Isi

- [Tentang](#-tentang)
- [Fitur Utama](#-fitur-utama)
- [Cara Kerja](#-cara-kerja)
- [Tech Stack](#-tech-stack)
- [Struktur Proyek](#-struktur-proyek)
- [Prasyarat](#-prasyarat)
- [Instalasi](#-instalasi)
- [Variabel Lingkungan](#-variabel-lingkungan)
- [Menjalankan](#-menjalankan)
- [API Endpoints](#-api-endpoints)
- [Integritas Data](#-integritas-data)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Kontribusi](#-kontribusi)
- [Lisensi](#-lisensi)

---

## 🎯 Tentang

**Job Dong** adalah aplikasi web yang membantu pelamar kerja mengelola seluruh siklus lamaran — dari riset lowongan, optimasi CV agar lolos ATS, sampai menghasilkan draft email lamaran yang sudah disesuaikan dengan deskripsi pekerjaan.

Aplikasi ini dibangun dengan premis sederhana: **AI tidak boleh berbohong atas nama kandidat.** Setiap output yang dihasilkan (CV yang dit-tailor, cover letter, skor match) selalu ditelusuri ke fakta nyata di CV asli kandidat — tidak ada metrik, pengalaman, atau perusahaan yang di-invent.

<div align="center">
<i>Tempat satu workflow: riset → match → tailor → apply → track.</i>
</div>

---

## ✨ Fitur Utama

### 🔍 Agregasi Lowongan Multi-Platform
- Scraping lowongan dari **Jobstreet**, **Glints**, dan **LinkedIn** lewat provider adapter (`src/lib/job-providers/`).
- Pencarian terpadu dengan filter posisi/perusahaan.

### 📄 Upload & Ekstraksi CV (Multi-format)
- Mendukung **PDF**, **DOCX**, dan **gambar/scan**.
- Ekstraksi teks lokal untuk PDF & DOCX (`src/lib/cv-file.ts`); AI vision (Gemini) sebagai fallback untuk gambar atau PDF hasil scan dengan teks kosong.
- Mekanisme **retry 3× exponential backoff** untuk error 429/500/503.
- Validasi ukuran file maksimal **15 MB**.

### 🤖 Tailoring CV Berbasis AI (ATS-Optimized)
- Prompt bertindak sebagai **senior HR/ATS reviewer** dengan 20+ tahun pengalaman.
- Memetakan setiap requirement di job description ke **bukti nyata di CV** — yang tidak didukung ditinggalkan, bukan di-invent.
- Output: CV 1 halaman A4 yang sudah dioptimasi keyword ATS, dengan struktur JSON ter-skema (`TAILORED_CV_SCHEMA`).

### 📝 Cover Letter mengikuti "Impact Cover Letter"
- Draft email lamaran mengikuti **kerangka 7-bagian**: Greeting → Engaging Opener → Why This Role/Company → Evidence/Impact → Cross-functional → Close → Sign-off.
- Metrik hanya jika ada di CV; bahasa mengikuti bahasa job posting.

### 📊 Match Score & Saran Perbaikan
- Skor kecocokan 0–100 dengan bobot: hard skills 40% · experience 30% · domain 15% · education 10% · nice-to-have 5%.
- Daftar requirement yang **matched** (dengan evidence) dan **missing**.
- 3–5 saran perbaikan CV yang konkret & actionable, dalam Bahasa Indonesia.

### 🗂️ Dashboard Aplikasi & Kanban
- Profil kandidat tersimpan lokal (`src/lib/local-profile.ts`) — fitur AI tetap bisa dipakai tanpa koneksi cloud Supabase.
- Tracking lamaran via integrasi Google Spreadsheet "Job Application Tracker".
- Tampilan Kanban untuk manajemen status pipeline.

### 🖨️ Export & Print
- Pratinjau CV ATS-ready via komponen `ats-document.tsx`.
- Print ke PDF lewat iframe dengan auto-scale agar selalu muat 1 halaman.

---

## 🔄 Cara Kerja

```
┌─────────────┐    ┌──────────────┐    ┌───────────────┐    ┌──────────────┐    ┌─────────────┐
│  Riset      │───▶│  Upload CV   │───▶│  Analyze Job  │───▶│  Match Score │───▶│  Tailor CV  │
│  Lowongan   │    │  (PDF/DOCX/  │    │  (Screenshot  │    │  + Saran     │    │  + Cover    │
│  (3 source) │    │   IMG)       │    │   Posting)    │    │  Perbaikan   │    │  Letter     │
└─────────────┘    └──────────────┘    └───────────────┘    └──────────────┘    └──────┬──────┘
                                                                                        │
                                                                                        ▼
                                                                               ┌────────────────┐
                                                                               │  Print / PDF   │
                                                                               │  + Track di    │
                                                                               │  Spreadsheet   │
                                                                               └────────────────┘
```

---

## 🛠️ Tech Stack

| Kategori | Teknologi |
|----------|-----------|
| **Framework** | Next.js 16.3 (App Router, RSC) |
| **UI** | React 19.2, Tailwind CSS 4, Framer Motion 13 |
| **Bahasa** | TypeScript 5 |
| **AI** | Google GenAI (Gemini) via `@google/genai` |
| **Backend/DB** | Supabase (Auth + Postgres), dengan fallback lokal |
| **Parsing** | `pdf-parse` (PDF), `cheerio` (HTML scraping), ekstraksi DOCX via zlib |
| **PDF Export** | `html2pdf.js` + iframe printing |
| **Icons** | `lucide-react` |
| **Validasi** | Skema JSON response Gemini (`Type.OBJECT`) |

---

## 📁 Struktur Proyek

```
Job Dong/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze-job-image/   # OCR screenshot job posting → JSON
│   │   │   ├── generate-cv/         # Generate CV tailored + cover letter
│   │   │   ├── match-score/         # Skor kecocokan CV ↔ JD + saran
│   │   │   ├── tracker/             # Sync Google Spreadsheet tracker
│   │   │   └── upload-cv/           # Upload & ekstraksi CV (PDF/DOCX/IMG)
│   │   ├── applications/            # Halaman daftar lamaran
│   │   ├── custom-cv/               # Halaman pratinjau CV tailored
│   │   ├── jobs/                    # Halaman listing + detail lowongan
│   │   ├── kanban/                  # View Kanban pipeline lamaran
│   │   ├── profile/                 # Profil kandidat
│   │   └── page.tsx                 # Landing / dashboard
│   ├── components/
│   │   ├── ats-document.tsx         # Komponen CV ATS-ready (print-ready)
│   │   ├── cv-preview.tsx           # Pratinjau CV
│   │   ├── dashboard-insights.tsx   # Insight dashboard
│   │   ├── job-card.tsx             # Kartu lowongan
│   │   ├── sidebar.tsx              # Navigasi sidebar
│   │   └── application-button.tsx
│   ├── context/
│   │   └── background-jobs-context.tsx
│   └── lib/
│       ├── ai-prompts.ts            # 🧠 Semua prompt AI + response schema
│       ├── applications-store.ts
│       ├── cv-file.ts               # Ekstraksi PDF/DOCX lokal
│       ├── gemini.ts                # Client Google GenAI
│       ├── local-profile.ts         # Profil kandidat (fallback offline)
│       ├── tracker-sheet.ts         # Integrasi Google Spreadsheet
│       ├── supabase/
│       │   ├── client.ts
│       │   └── server.ts
│       └── job-providers/           # Adapter scraping lowongan
│           ├── interface.ts         # Kontrak provider
│           ├── aggregator.ts        # Gabungan multi-source
│           ├── jobstreet-provider.ts
│           ├── glints-provider.ts
│           ├── linkedin-provider.ts
│           └── mock-provider.ts     # Data dummy untuk dev
├── public/
├── .env.local                       # Variabel lingkungan (jangan commit!)
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── package.json
```

---

## ✅ Prasyarat

- **Node.js** ≥ 18.18 (rekomendasi 20+)
- **npm** / **pnpm** / **yarn**
- **Google Gemini API Key** — dapatkan di [Google AI Studio](https://aistudio.google.com/apikey)
- **Supabase project** (opsional — fitur AI tetap jalan tanpa ini via local profile)
- **Google OAuth credentials** untuk integrasi Spreadsheet tracker (opsional)

---

## 🚀 Instalasi

```bash
# 1. Clone repo
git clone https://github.com/GaluhWikri/Job-Dong.git
cd Job-Dong

# 2. Install dependencies
npm install
# atau: pnpm install / yarn install

# 3. Salin contoh env
cp .env.example .env.local   # lalu isi nilai (lihat bagian berikutnya)

# 4. Jalankan dev server
npm run dev
```

Buka **http://localhost:3000**.

---

## 🔐 Variabel Lingkungan

Buat file `.env.local` di root proyek:

```env
# Google Gemini (WAJIB untuk fitur AI)
GEMINI_API_KEY=your_google_gemini_api_key

# Supabase (opsional — untuk auth & cloud sync)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Spreadsheet Tracker (opsional)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
TRACKER_SHEET_ID=your_google_sheet_id
```

> ⚠️ **Penting:** Jangan pernah commit `.env.local`. Pastikan sudah ada di `.gitignore`.

---

## ▶️ Menjalankan

| Perintah | Deskripsi |
|----------|-----------|
| `npm run dev` | Mode development (hot reload) |
| `npm run build` | Build produksi |
| `npm run start` | Jalankan hasil build produksi |
| `npm run lint` | Cek ESLint |

---

## 🌐 API Endpoints

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| `POST` | `/api/upload-cv` | Upload & ekstrak teks dari CV (PDF/DOCX/IMG) |
| `POST` | `/api/analyze-job-image` | OCR screenshot job posting → JSON terstruktur |
| `POST` | `/api/match-score` | Hitung skor kecocokan CV ↔ JD + saran perbaikan |
| `POST` | `/api/generate-cv` | Generate CV tailored + cover letter (JSON skema) |
| `GET` | `/api/tracker` | Sync data lamaran dengan Google Spreadsheet |

Semua endpoint AI menggunakan `runtime = 'nodejs'` dan `maxDuration = 60` detik.

---

## 🛡️ Integritas Data

Job Dong dibangun dengan **aturan integrity non-negotiable**:

- ✅ Semua fakta kandidat **hanya dari CV** yang di-upload.
- ❌ Tidak boleh invent metrik, persentase, revenue, atau angka yang tidak ada di CV.
- ❌ Tidak boleh invent perusahaan, klien, tanggal, gelar, sertifikasi, atau tools.
- ❌ Tidak boleh invent nama perusahaan target kalau job posting tidak menyebut.
- ✅ Kalau CV minim data quantitative, gunakan deskripsi kualitatif yang jujur.
- ✅ "Packaging, not lying" — boleh menerjemahkan, menyusun ulang, dan memangkas, tapi tidak mengarang.

Aturan ini di-enforce langsung di prompt sistem (`src/lib/ai-prompts.ts`).

---

## 📦 Deployment

Cara termudah: deploy ke **Vercel** (creator Next.js).

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy dari root proyek
vercel
```

Atau hubungkan repo GitHub `GaluhWikri/Job-Dong` ke dashboard Vercel untuk auto-deploy setiap push ke `main`.

**Catatan untuk deployment:**
- Set variabel lingkungan di **Project Settings → Environment Variables** Vercel.
- Untuk Supabase: pastikan URL situs deployment ditambahkan ke **Allowed Redirect URLs** di Supabase Auth settings.

---

## 🗺️ Roadmap

- [ ] Dukungan provider lowongan tambahan (Kalibrr, Indeed)
- [ ] Multi-CV profile (CV berbeda per target role)
- [ ] Template CV visual (bukan hanya ATS)
- [ ] Integrasi follow-up email otomatis 7–10 hari pasca-lamar
- [ ] Analisis reply HR untuk deteksi sinyal interview

---

## 🤝 Kontribusi

Kontribusi terbuka! Untuk perubahan besar, buka issue dulu untuk diskusi.

```bash
# Fork repo
# Buat branch fitur
git checkout -b feat/nama-fitur

# Commit dengan konvensi conventional commits
git commit -m "feat: tambahkan fitur X"

# Push & buka Pull Request
git push origin feat/nama-fitur
```

---

## 📄 Lisensi

Distribusi di bawah lisensi **MIT**. Lihat file [LICENSE](LICENSE) untuk detail.

---

<div align="center">

**Dibangun oleh [Galuh Wikri](https://github.com/GaluhWikri)**

*Job Dong — Lamar kerja dengan CV yang jujur, bukan CV yang mengarang.*

</div>
