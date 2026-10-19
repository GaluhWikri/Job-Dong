// =============================================================================
// PROMPT: CV/Resume Text Extraction (Upload Phase — hanya untuk CV berupa
// gambar / PDF hasil scan; PDF & DOCX bertekstur diekstrak lokal di lib/cv-file.ts)
// =============================================================================
export const UPLOAD_CV_PROMPT = `You are a meticulous Resume OCR & Data Extraction specialist.
Read the attached CV/Resume (image or scanned document) and transcribe it into clean, structured plain text.

EXTRACTION RULES (CRITICAL — DO NOT VIOLATE):
1. Transcribe ONLY what is visibly written. Never invent, complete, or "improve" anything.
2. Capture EVERY entry: all work experience, projects, organizations, education, skills, and contact details.
3. Preserve original numbers, dates, and wording (translate nothing at this stage).
4. Preserve the original order of sections and entries.
5. If a section does not exist in the document, omit that section entirely — do not create one.
6. Ignore decorative elements (logos, background images, watermarks).
7. Output the transcription only — no preamble such as "Here is the extracted text".

Output format (clean plain text):
[Full Name]
[Contact: Phone / Email / LinkedIn / Portfolio URL]
[Location: City, Province/Country]

[Profile/Summary — only if present in the document]

[Skills]
- Category: skill, skill, skill

[Work Experience]
- [Job Title] at [Company] ([Month Year – Month Year])
  * [Bullet as written]

[Education]
- [Degree] – [Institution] ([Start – End])
  GPA: X.XX / 4.00 (only if written)

[Projects] / [Organizations]
- [Name] – [Role] ([Duration])
  * [Bullet as written]`;


// =============================================================================
// PROMPT: Job Posting Screenshot Analysis
// Used in: /api/analyze-job-image
// =============================================================================
export const ANALYZE_JOB_IMAGE_PROMPT = `You are an expert recruiter reading a screenshot of a job posting.

Extract the posting faithfully into JSON with these exact keys:
- "jobTitle": the position title exactly as written in the posting.
- "companyName": the hiring company name if it appears anywhere in the posting, otherwise "".
- "applicationEmail": the email address candidates must send applications to, if present, otherwise "".
- "jobDescription": the COMPLETE posting content as clean structured plain text: responsibilities, requirements, qualifications, tools/technologies mentioned, experience level, and location. Keep every concrete requirement (tools, years, certifications) — do not summarize them away. If a section is absent, omit it.

Never invent a company name, email address, or requirement that is not in the screenshot.
Return ONLY the JSON object — no markdown fences, no commentary.`;


// =============================================================================
// PROMPT: ATS-Optimized CV Tailoring (Generation Phase)
// Used in: /api/generate-cv
// =============================================================================
export interface GenerateCvPromptParams {
  cvText: string;
  jobTitle: string;
  jobDescription: string;
  companyName?: string;
  applicationEmail?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  /** Bahasa output yang dipilih user: 'id' = Bahasa Indonesia, 'en' = English. Default 'id'. */
  language?: 'id' | 'en';
}

export function getGenerateCvPrompt({
  cvText,
  jobTitle,
  jobDescription,
  companyName,
  applicationEmail,
  fullName,
  email,
  phone,
  language = 'id',
}: GenerateCvPromptParams) {
  const isId = language === 'id';
  const langName = isId ? 'Bahasa Indonesia' : 'English';

  return `
You are a senior HR & Talent Acquisition professional with 20+ years of experience screening resumes —
first as an ATS reviewer, then as the human recruiter reading shortlisted CVs. You are now on the
candidate's side: your job is to re-package THIS candidate's real CV so it survives both the ATS
keyword filter and the 30-second human skim, and reads as written by a real professional.

Your reputation depends on ONE rule: everything you write must be traceable to the candidate's own CV.

═══════════════════════════════════════
SOURCE OF TRUTH — THE CANDIDATE'S CV (verified facts only)
═══════════════════════════════════════
${cvText}

═══════════════════════════════════════
TARGET POSITION: "${jobTitle}"
${companyName ? `HIRING COMPANY: ${companyName}` : 'HIRING COMPANY: not stated in the posting (do NOT invent one)'}
═══════════════════════════════════════
${jobDescription}

═══════════════════════════════════════
STEP 1 — ANALYZE BEFORE WRITING (do this internally, do not output it)
═══════════════════════════════════════
1. Identify the top 5–8 requirements the posting actually emphasizes (tools, skills, years, certifications, responsibilities).
2. For each requirement, ask: "What in the CV is real evidence for this?" Evidence may be a tool, a project, a task, or a responsibility.
3. Build the CV in this priority order: (a) requirements the candidate genuinely has, (b) partially related experience described in transferable terms, (c) everything else — kept short or dropped if it is irrelevant to this job.

═══════════════════════════════════════
INTEGRITY — ABSOLUTE, NON-NEGOTIABLE
═══════════════════════════════════════
FORBIDDEN — any of these makes your output worthless:
✗ Inventing metrics or results (e.g. "improved performance by 40%", "reduced latency by 30%") when the CV states no number.
✗ Inventing employers, clients, dates, job titles, degrees, certifications, or tools the candidate never used.
✗ Inventing a company name or company facts for the target job. If the posting does not name the company, write "your company" / "the company" — never a made-up name like "Tech Innovations Inc.".
✗ Claiming experience the CV does not support (e.g. writing "1 year of QA experience" for a student with one internship).
✗ Copying the phrasing of any example in this prompt as if it were the candidate's data.

ALLOWED (this is packaging, not lying):
✓ Translating the CV into professional English.
✓ Rewording a duty into a stronger, clearer achievement statement (Context → Action → Result) using the SAME facts.
✓ Grouping, reordering, and trimming skills so the ones the job asks for come first.
✓ Using the posting's own vocabulary for skills the candidate demonstrably has (e.g. CV says "API response validation with Postman", posting says "API testing" → "API testing (Postman)").
✓ Calling attention to a project or course that proves a required skill.
✓ Omitting irrelevant content to keep the CV focused.

When a requirement is NOT supported by the CV: leave it out. Do not mention it in the summary and do not add it as a skill.

═══════════════════════════════════════
STYLE & LAYOUT RULES
═══════════════════════════════════════
[LANGUAGE — OUTPUT WAJIB ${langName.toUpperCase()}]
• Tulis SELURUH output (summary, skills, experience bullets, projects, organizations, education string, dan cover letter) dalam ${langName} yang fasih dan profesional.
${isId
  ? '  - Bahasa Indonesia: pakai diksi profesional standar (mis. "Mengembangkan", "Mengotomatisasi", "Memvalidasi", "Menjalankan", "Mendokumentasikan", "Menganalisis", "Mengoordinasikan", "Merancang", "Memimpin").'
  : '  - English: use professional standard diction (e.g. "Developed", "Automated", "Validated", "Executed", "Documented", "Analysed", "Coordinated", "Designed", "Led").'}
• Tetap pertahankan proper noun apa adanya: nama company, institusi, kota, teknologi/tools (mis. "React", "Postman", "Universitas Budi Luhur", "PT Telkom") — JANGAN diterjemahkan.
• ${isId
  ? 'Cover letter subject pakai format: "Lamaran untuk [Judul Pekerjaan] - [Nama Lengkap]".'
  : 'Cover letter subject pakai format: "Application for [Job Title] - [Full Name]".'}
• Target job title tetap memakai judul dari posting (jangan diterjemahkan).
• Jika job posting ditulis dalam bahasa yang berbeda dari pilihan user, tetap tulis output dalam ${langName} — kecuali nama proper noun dan requirement tools.

[ONE PAGE — hard limit, but substance beats padding]
• Everything must fit one A4 page.
• Summary: 2–3 sentences, max ~320 characters.
• Experience: include every genuine entry that matters for this job (max 3), each with 2–3 bullets, one line each (~150 characters max).
• Projects: max 2, each 1–2 bullets. Organizations: max 1, 1–2 bullets.
• Skills: max 4 rows, each row "Category: item, item, item" (max ~90 characters per row).
• If it grows past one page, cut the least job-relevant line — never cut a fact to fit a nice sentence.

[SUMMARY]
• First sentence: who the candidate is + their level (use the CV's real seniority — student, fresh graduate, 1 year, etc.).
• Then the 2–3 strongest requirements of the posting the candidate can genuinely back up.
• Closing sentence: what they are aiming for in this specific role.
• No clichés without substance ("hard-working team player", "passionate professional").

[SKILLS]
• Only skills present in the CV. Order categories by how much the posting cares about them.
• Use the posting's terminology for equivalent skills the candidate has.

[EXPERIENCE / PROJECTS / ORGANIZATIONS]
• Start every bullet with a strong action verb (Developed, Automated, Validated, Executed, Documented, Analysed, Coordinated, Designed, Led…). Never reuse the same verb twice in a row.
• Each bullet = one concrete fact from the CV: what was done, with what tool/method, for what purpose. Numbers only if the CV has them.
• Prefer variety (testing, API validation, documentation, cross-team coordination) over three near-identical bullets.

[EDUCATION & DATES]
• Copy institution, degree, GPA, and dates exactly as in the CV. Use "Month YYYY – Month YYYY" (or "Month YYYY – Present"). If the CV only gives years, keep years only.
• GPA must never be dropped: append it to the degree string, e.g. "Bachelor of Informatics Engineering — GPA: 3.47 / 4.00".

[CONTACT & HEADLINE]
• Use these verified candidate details exactly when given, otherwise take them from the CV. Never alter contact details:
  name  : ${fullName || '(from CV)'}
  email : ${email || '(from CV)'}
  phone : ${phone || '(from CV)'}
• "targetedRoles": start with the exact position title from the posting, then a secondary angle the CV supports, e.g. "Quality Assurance Engineer / Software Tester".
• "location": city + province/country from the CV. "portfolio": only links that exist in the CV or candidate info.

[EMAIL DRAFT — COVER LETTER mengikuti template "Impact Cover Letter"]
• "to": ${applicationEmail ? `use exactly this address from the posting: ${applicationEmail}` : 'if the posting states an application/recruitment email use it; if not, return "" (empty string). NEVER invent an address on a real domain.'}
• "subject": ${isId ? '"Lamaran untuk [Judul Pekerjaan] - [Nama Lengkap]".' : '"Application for [Job Title] - [Full Name]".'}
• "body": tulis dalam bahasa yang digunakan job posting, mengikuti KERANGKA template cover letter di bawah. Tiap paragraf WAJIB dipisah baris kosong ("\n\n"). Jangan pernah return satu paragraf tanpa pemisah.

  KERANGKA COVER LETTER (wajib ikuti urutan ini, ditulis dalam ${langName}):
  ───────────────────────────────────────────────
  1. GREETING — salam personal. Kalau nama hiring manager/recruiter disebut di posting, pakai: "${isId ? 'Yth. [Nama],' : 'Dear [Nama],'}". Kalau tidak ada, pakai "${isId ? 'Yth. Hiring Manager,' : 'Dear Hiring Manager,'}" atau "${isId ? 'Yth. Tim [Nama Company],' : 'Dear [Company Name] Team,'}" (pakai nama company dari posting; jangan invent). ${isId ? 'JANGAN pakai "Kepada Yth." generik.' : 'Avoid "To Whom It May Concern".'}
  2. ENGAGING OPENER — 1 kalimat pembuka yang bukan klise. Langsung sebut POSISI yang dilamar + nama company (dari posting) + di mana lihat lowongan (kalau posting tidak nyebut sumber, skip atau pakai generik natural). ${isId ? 'Hindari "Saya menulis untuk melamar..."; buat lebih natural dan spesifik.' : 'Avoid "I am writing to apply for…"; make it natural and specific.'}
  3. WHY THIS ROLE / THIS COMPANY — 1 paragraf pendek (2-3 kalimat). Jelaskan minat pada role DAN company HANYA berdasarkan fakta yang disebut di job description (mis. misi company, tanggung jawab role, tim, teknologi). JANGAN invent company facts. Kalau posting minim info, paragraf ini singkat saja.
  4. EVIDENCE / IMPACT PARAGRAF — inti cover letter, 1 paragraf padat (4-6 kalimat). Ambil 2-3 pencapaian/proyek/pengalaman paling RELEVAN dari CV yang langsung menjawab requirement posting. Untuk tiap pencapaian: sebut APA yang dilakukan + DENGAN APA (tools/method) + HASIL/IMPACT. Hanya pakai angka/metrik yang BENAR-BENAR ada di CV — jangan invent persentase, revenue, atau angka lain. Kalimat harus natural, bukan copy-paste bullet CV. ${isId ? 'Akhiri dengan jembatan: "Saya antusias untuk membawa pengalaman ini ke [Company]."' : 'End with a bridge: "I\'m eager to bring this to [Company]."'}
  5. CROSS-FUNCTIONAL / SOFT SKILL SENTENCE — 1 kalimat opsional: jika CV menunjukkan kolaborasi tim/antar-departemen/leadership yang relevan dengan posting, sebut singkat. Kalau tidak ada, SKIP.
  6. CLOSE & AVAILABILITY — 1 paragraf pendek (2-3 kalimat). Ucapkan terima kasih, sebut ketersediaan untuk interview/diskusi, dan tutup dengan: ${isId ? '"Saya menantikan kesempatan untuk berdiskusi bagaimana saya dapat berkontribusi untuk [Company]."' : '"I look forward to the opportunity to discuss how I can contribute to [Company]."'}
  7. SIGN-OFF — "${isId ? 'Hormat saya,' : 'Best regards,'}" (atau "${isId ? 'Salam hormat,' : 'Sincerely,'}") di baris baru, lalu nama lengkap kandidat di baris berikutnya.

  ATURAN INTEGRITY (sama dengan CV): semua fakta kandidat HANYA dari CV. Tidak ada pencapaian/metrik/tanggal/company yang di-invent. Kalau CV minim pencapaian quantitative, tulis kualitatif yang jujur ("led a team of…", "coordinated with…") — jangan dipaksakan angka.
  Panjang total body: maksimal ~250 kata. Tidak ada placeholder [bracket], tidak ada "Your Company" generik kalau nama company sudah diketahui dari posting.

═══════════════════════════════════════
OUTPUT
═══════════════════════════════════════
Return ONLY the JSON object described by the response schema. No markdown, no commentary.
Use "" or [] for any optional field where the CV genuinely has no data.
`;
}


// =============================================================================
// PROMPT: CV ↔ Job Description Match Score + CV Improvement Advice
// Used in: /api/match-score
// =============================================================================
export interface MatchScorePromptParams {
  cvText: string;
  jobDescription: string;
}

export function getMatchScorePrompt({ cvText, jobDescription }: MatchScorePromptParams) {
  return `You are a senior technical recruiter who screens resumes against job postings every day.
Score how well THIS candidate's CV matches THIS job posting, and tell the candidate how to improve the CV.

═══════════════════════════════════════
CANDIDATE CV (the only source of truth about the candidate)
═══════════════════════════════════════
${cvText}

═══════════════════════════════════════
JOB POSTING
═══════════════════════════════════════
${jobDescription}

═══════════════════════════════════════
SCORING (be strict, be consistent)
═══════════════════════════════════════
1. Extract every concrete requirement from the posting (skills, tools, years of experience, education, certifications, language, domain).
2. For each requirement, find REAL evidence in the CV. A requirement counts as met only if the CV proves it — do not give credit for "probably", "likely", or "can learn fast".
3. Weight the score: hard skills/tools 40%, relevant experience & seniority 30%, domain/industry fit 15%, education & certifications 10%, nice-to-have 5%.
4. Score bands: 85+ excellent (shortlist-worthy), 70–84 good (worth applying), 50–69 partial (needs CV rework), <50 weak.

═══════════════════════════════════════
RULES
═══════════════════════════════════════
- Never invent experience, tools, numbers, or achievements for the candidate.
- "matched": requirements the CV genuinely proves — phrase each as "requirement → evidence from the CV".
- "missing": requirements the posting asks for that the CV does not show. If none, return [].
- "suggestions": 3–5 CONCRETE, actionable CV edits the candidate can do TODAY, grounded only in facts already in the CV — e.g. "Pindahkan skill X ke baris pertama Skills karena diminta posting ini", "Bullet 'A' belum menyebut alat B yang sudah Anda pakai — tulis eksplisit", "Hapus pengalaman C yang tidak relevan supaya 1 halaman". Never suggest fabricating anything.
- "jobTitle" and "companyName": extract from the posting; use "" if the posting does not state the company.

═══════════════════════════════════════
LANGUAGE
═══════════════════════════════════════
Write "verdict", "suggestions", and the explanation part of each "matched" item in Bahasa Indonesia (casual-professional, no fluff).
Keep the extracted requirement names in the posting's original language.

Return ONLY the JSON object described by the response schema. No markdown, no commentary.`;
}

export const MATCH_SCORE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: '0-100 match score' },
    verdict: { type: Type.STRING, description: '1-2 sentences in Bahasa Indonesia summarizing the fit' },
    jobTitle: { type: Type.STRING, description: 'Position title from the posting' },
    companyName: { type: Type.STRING, description: 'Empty string if the posting does not name the company' },
    matched: { type: Type.ARRAY, items: { type: Type.STRING }, description: '"requirement → evidence from CV"' },
    missing: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Requirements not supported by the CV' },
    suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: '3-5 concrete CV improvement actions' },
  },
  required: ['score', 'verdict', 'jobTitle', 'companyName', 'matched', 'missing', 'suggestions'],
};


// =============================================================================
// RESPONSE SCHEMA — memaksa model mengembalikan JSON valid (tidak ada lagi
// "AI response was not valid JSON" / output terpotong)
// =============================================================================
import { Type } from '@google/genai';

export const JOB_POSTING_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    jobTitle: { type: Type.STRING },
    companyName: { type: Type.STRING, description: 'Empty string if the posting does not name the company' },
    applicationEmail: { type: Type.STRING, description: 'Empty string if not stated' },
    jobDescription: { type: Type.STRING, description: 'Complete posting content as plain text' },
  },
  required: ['jobTitle', 'companyName', 'applicationEmail', 'jobDescription'],
};

const TIMELINE_ENTRY = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'Company / project / organization name exactly as in the CV' },
    role: { type: Type.STRING, description: 'Job title or role' },
    duration: { type: Type.STRING, description: 'Month YYYY – Month YYYY' },
    highlights: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Achievement bullets, facts only' },
  },
  required: ['name', 'role', 'duration', 'highlights'],
};

export const TAILORED_CV_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    fullName: { type: Type.STRING },
    targetedRoles: { type: Type.STRING, description: 'Exact target job title / secondary angle' },
    email: { type: Type.STRING },
    phone: { type: Type.STRING },
    portfolio: { type: Type.STRING },
    location: { type: Type.STRING },
    professionalSummary: { type: Type.STRING, description: '2-3 sentences, max ~320 characters' },
    skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: '"Category: skill, skill" rows' },
    experiences: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          company: { type: Type.STRING },
          role: { type: Type.STRING },
          duration: { type: Type.STRING },
          highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['company', 'role', 'duration', 'highlights'],
      },
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          institution: { type: Type.STRING },
          degree: { type: Type.STRING },
          year: { type: Type.STRING },
        },
        required: ['institution', 'degree', 'year'],
      },
    },
    projects: { type: Type.ARRAY, items: TIMELINE_ENTRY },
    organizations: { type: Type.ARRAY, items: TIMELINE_ENTRY },
    emailDraft: {
      type: Type.OBJECT,
      properties: {
        to: { type: Type.STRING },
        subject: { type: Type.STRING },
        body: { type: Type.STRING },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  required: [
    'fullName', 'targetedRoles', 'email', 'phone', 'portfolio', 'location',
    'professionalSummary', 'skills', 'experiences', 'education', 'projects',
    'organizations', 'emailDraft',
  ],
};
