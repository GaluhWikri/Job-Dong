// Profil & CV di browser — dipakai sebagai sumber utama, Supabase hanya sinkronisasi
// best-effort (project cloud bisa mati/paused dan form tetap harus bisa disimpan).
const PROFILE_KEY = 'job_dong_profile';
const CV_KEY = 'job_dong_cv_text';

export interface LocalProfile {
  fullName: string;
  email: string;
  phone: string;
  cvText: string;
  cvName: string;
}

export function getLocalProfile(): Partial<LocalProfile> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveLocalProfile(patch: Partial<LocalProfile>): Partial<LocalProfile> {
  const next = { ...getLocalProfile(), ...patch };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  if (patch.cvText !== undefined) {
    if (patch.cvText) localStorage.setItem(CV_KEY, patch.cvText);
    else localStorage.removeItem(CV_KEY);
  }
  return next;
}

/** Teks CV dari browser (key sama yang dipakai Kanban & Custom CV). */
export function getLocalCvText(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(CV_KEY) || '';
}
