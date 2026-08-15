// Local storage-based application store
// No database needed - all data lives in the browser localStorage
import { TailoredCvData } from './job-providers/interface';

export interface ApplicationRecord {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  location: string;
  appliedAt: string; // ISO string
  status: 'CV Dibuat' | 'Dikirim' | 'Dilihat';
  generatedCv: TailoredCvData;
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

export function saveApplication(app: Omit<ApplicationRecord, 'id' | 'appliedAt' | 'status'>): ApplicationRecord {
  let applications = getApplications();
  
  // Remove existing application for the same job so we can overwrite it with the new CV
  applications = applications.filter(a => a.jobId !== app.jobId);

  const newApp: ApplicationRecord = {
    ...app,
    id: `app-${Date.now()}`,
    appliedAt: new Date().toISOString(),
    status: 'CV Dibuat',
  };

  applications.unshift(newApp); // add to front
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  return newApp;
}

export function hasApplied(jobId: string): boolean {
  return getApplications().some(a => a.jobId === jobId);
}
