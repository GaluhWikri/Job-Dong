export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Remote';

export interface Job {
  id: string;
  title: string;
  companyName: string;
  companyLogoUrl?: string;
  location: string;
  description: string;
  qualifications: string[];
  benefits: string[];
  salary?: string;
  postedAt: Date;
  jobType: JobType;
  provider: 'Glints' | 'JobStreet' | 'LinkedIn' | 'Mock';
  originalUrl?: string;
}

export interface JobSearchFilters {
  keyword?: string;
  location?: string;
  category?: string;
  jobType?: JobType;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface JobProviderAdapter {
  providerName: string;
  
  /**
   * Search for jobs based on filters
   */
  searchJobs(filters: JobSearchFilters, cursor?: string): Promise<PaginatedResult<Job>>;

  /**
   * Get detail of a specific job
   */
  getJobDetail(id: string): Promise<Job | null>;
}

export interface TailoredCvData {
  fullName?: string;
  targetedRoles?: string;
  email?: string;
  phone?: string;
  portfolio?: string;
  location?: string;
  professionalSummary?: string;
  skills?: string[];
  experiences?: {
    company?: string;
    role?: string;
    duration?: string;
    highlights?: string[];
  }[];
  education?: {
    institution?: string;
    degree?: string;
    year?: string;
  }[];
  projects?: {
    name?: string;
    role?: string;
    duration?: string;
    highlights?: string[];
  }[];
  organizations?: {
    name?: string;
    role?: string;
    duration?: string;
    highlights?: string[];
  }[];
  emailDraft?: {
    to?: string;
    subject?: string;
    body?: string;
  };
}
