// Local storage-based application store
// No database needed - all data lives in the browser localStorage
import { TailoredCvData } from './job-providers/interface';
import type { TrackerRow } from './tracker-sheet';

/** Tahapan pipeline lamaran — dipakai sebagai kolom kanban, urut dari kiri ke kanan. */
export const APPLICATION_STATUSES = [
  'CV Dibuat',
  'Dikirim',
  'Dilihat',
  'Interview',
  'Diterima',
  'Ditolak',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Status di Google Spreadsheet tracker → tahapan kanban. */
export const SHEET_STATUS_MAP: Record<string, ApplicationStatus> = {
  'pending': 'Dikirim',
  'dalam proses': 'Dilihat',
  'dilihat': 'Dilihat',
  'interview': 'Interview',
  'diterima': 'Diterima',
  'ditolak': 'Ditolak',
  'tidak lanjut': 'Ditolak',
  'lowongan ditutup': 'Ditolak',
};

/** Hasil penilaian AI: skor kecocokan CV vs deskripsi lowongan + saran perbaikan CV. */
export interface MatchAnalysis {
  score: number;
  verdict: string;
  matched: string[];
  missing: string[];
  suggestions: string[];
}

export interface ApplicationRecord {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  location: string;
  appliedAt: string; // ISO string
  status: ApplicationStatus;
  generatedCv?: TailoredCvData;
  jobDescription?: string;
  match?: MatchAnalysis;
  /** 'sheet' = diimpor dari Google Spreadsheet tracker (sumber data asli lamaran). */
  source?: 'sheet' | 'manual';
  sheetKey?: string;
  /** Kartu yang digeser manual: auto-sinkron tidak menimpa statusnya sampai user menekan Sinkron. */
  manualOverride?: boolean;
}

const STORAGE_KEY = 'job_dong_applications';

export function getApplications(): ApplicationRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(applications: ApplicationRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

/**
 * Tanggal dari spreadsheet bisa datang sebagai angka serial Google Sheets
 * (mis. 46289), bukan teks. Tanpa ini, `new Date("46289T00:00:00.000Z")` jadi
 * Invalid Date dan halaman Riwayat Lamaran gagal render.
 */
export function normalizeSheetDate(value: string): string {
  // Buang bagian waktu lebih dulu supaya "46289T00:00:00.000Z" ikut dikenali sebagai serial.
  const v = (value || '').trim().split('T')[0];
  const fallback = new Date().toISOString().slice(0, 10);
  if (!v) return fallback;

  // Serial Google Sheets = jumlah hari sejak 1899-12-30 (5 digit: 1936..2173).
  if (/^\d{5}(\.\d+)?$/.test(v)) {
    const ms = Date.UTC(1899, 11, 30) + Math.round(Number(v)) * 86400000;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }

  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? fallback : d.toISOString().slice(0, 10);
}

/** Kunci pencocokan kartu ↔ baris spreadsheet (posisi + perusahaan, tanpa tanda baca). */
export function applicationKey(position: string, company: string): string {
  return `${position}|${company}`.toLowerCase().replace(/[^a-z0-9|]/g, '');
}

export function saveApplication(app: Omit<ApplicationRecord, 'id' | 'appliedAt' | 'status'>): ApplicationRecord {
  // Remove existing application for the same job so we can overwrite it with the new CV
  const applications = getApplications().filter(a => a.jobId !== app.jobId);

  const newApp: ApplicationRecord = {
    ...app,
    id: `app-${Date.now()}`,
    appliedAt: new Date().toISOString(),
    status: 'CV Dibuat',
    source: 'manual',
  };

  applications.unshift(newApp); // add to front
  persist(applications);
  return newApp;
}

/** Tambah lamaran tanpa dedupe jobId — dipakai kartu kanban hasil tempel deskripsi. */
export function createApplication(app: Omit<ApplicationRecord, 'id' | 'appliedAt' | 'status'>): ApplicationRecord {
  const newApp: ApplicationRecord = {
    ...app,
    id: `app-${Date.now()}`,
    appliedAt: new Date().toISOString(),
    status: 'CV Dibuat',
    source: 'manual',
  };
  persist([newApp, ...getApplications()]);
  return newApp;
}

export function updateApplication(id: string, patch: Partial<ApplicationRecord>): ApplicationRecord[] {
  const applications = getApplications().map(a => (a.id === id ? { ...a, ...patch } : a));
  persist(applications);
  return applications;
}

export function removeApplication(id: string): ApplicationRecord[] {
  const applications = getApplications().filter(a => a.id !== id);
  persist(applications);
  return applications;
}

/**
 * Sinkronkan kanban dengan spreadsheet: tambah baris baru + ikutkan perubahan status
 * pada kartu yang berasal dari sheet. Kartu yang digeser manual tidak ditimpa
 * kecuali `force` (dipakai tombol Sinkron Spreadsheet).
 */
export function syncFromSheet(
  rows: TrackerRow[],
  { force = false }: { force?: boolean } = {}
): { imported: number; updated: number } {
  const applications = getApplications();
  const byKey = new Map<string, ApplicationRecord>();
  applications.forEach(a => byKey.set(a.sheetKey ?? applicationKey(a.jobTitle, a.companyName), a));

  const added: ApplicationRecord[] = [];
  let updated = 0;

  rows.forEach((row, i) => {
    if (!row.position && !row.company) return;
    const key = applicationKey(row.position, row.company);
    const status = SHEET_STATUS_MAP[row.status.trim().toLowerCase()] ?? 'Dikirim';
    const appliedAt = `${normalizeSheetDate(row.date)}T00:00:00.000Z`;
    // Kartu "perusahaan belum diketahui" (kunci berakhiran '|') dicocokkan lewat posisi saja,
    // lalu dilengkapi nama perusahaan dari spreadsheet — supaya tidak jadi kartu kembar.
    const existing = byKey.get(key) ?? byKey.get(applicationKey(row.position, ''));

    if (!existing) {
      const card: ApplicationRecord = {
        id: `sheet-${Date.now()}-${i}`,
        jobId: `sheet-${key}`,
        jobTitle: row.position || '(tanpa posisi)',
        companyName: row.company,
        location: '',
        appliedAt,
        status,
        source: 'sheet',
        sheetKey: key,
      };
      added.push(card);
      byKey.set(key, card);
      return;
    }

    // Baris ini sudah punya kartu: ikutkan perubahan dari spreadsheet.
    if (existing.source === 'sheet' && (force || !existing.manualOverride)) {
      if (existing.sheetKey !== key) {
        existing.sheetKey = key;
        if (!existing.companyName || existing.companyName === '(tanpa perusahaan)') {
          existing.companyName = row.company;
        }
      }
      if (existing.status !== status || existing.appliedAt !== appliedAt) {
        existing.status = status;
        existing.appliedAt = appliedAt;
        updated++;
      }
      if (force) existing.manualOverride = false;
    }
  });

  if (added.length || updated) {
    persist([...added, ...applications]);
  }

  return { imported: added.length, updated };
}

/**
 * Tandai lamaran sudah dikirim dari halaman Custom CV AI: buat kartu kanban
 * berstatus 'Dikirim', atau naikkan kartu yang sudah ada.
 * `source: 'sheet'` + `sheetKey` sengaja dipakai supaya perubahan status
 * berikutnya tetap mengikuti Google Spreadsheet (bukan dikunci manual).
 */
export function markApplicationSent(app: {
  jobTitle: string;
  companyName: string;
  location?: string;
  jobDescription?: string;
  generatedCv?: TailoredCvData;
}): ApplicationRecord {
  const key = applicationKey(app.jobTitle, app.companyName);
  const applications = getApplications();
  // Tanpa nama perusahaan, kunci tidak akan cocok — jatuhkan ke pencocokan judul
  // supaya kartu yang sudah ada diperbarui, bukan digandakan.
  const existing =
    applications.find(a => (a.sheetKey ?? applicationKey(a.jobTitle, a.companyName)) === key) ??
    (!app.companyName
      ? applications.find(a => a.jobTitle.trim().toLowerCase() === app.jobTitle.trim().toLowerCase())
      : undefined);

  const patch = {
    status: 'Dikirim' as ApplicationStatus,
    appliedAt: new Date().toISOString(),
    source: 'sheet' as const,
    sheetKey: key,
    manualOverride: false,
    jobDescription: app.jobDescription ?? existing?.jobDescription,
    generatedCv: app.generatedCv ?? existing?.generatedCv,
  };

  if (existing) {
    const updated = { ...existing, ...patch };
    persist(applications.map(a => (a.id === existing.id ? updated : a)));
    return updated;
  }

  const card: ApplicationRecord = {
    id: `sent-${Date.now()}`,
    jobId: `sent-${key}`,
    jobTitle: app.jobTitle || '(tanpa posisi)',
    companyName: app.companyName || '(tanpa perusahaan)',
    location: app.location ?? '',
    ...patch,
  };
  persist([card, ...applications]);
  return card;
}

export function hasApplied(jobId: string): boolean {
  return getApplications().some(a => a.jobId === jobId);
}
