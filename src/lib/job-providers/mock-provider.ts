import { Job, JobProviderAdapter, JobSearchFilters, PaginatedResult } from './interface';

const mockJobs: Job[] = [
  {
    id: 'job-1',
    title: 'Frontend Developer (React)',
    companyName: 'Tech Innovators',
    location: 'Jakarta (Hybrid)',
    description: 'We are looking for a skilled Frontend Developer with experience in React and Next.js to build amazing modern web applications.',
    qualifications: [
      'Minimum 2 years of experience with React.js',
      'Proficient in TypeScript and Tailwind CSS',
      'Experience with REST APIs and state management',
    ],
    benefits: ['Health Insurance', 'Flexible Working Hours', 'MacBook Pro provided'],
    salary: 'Rp 10,000,000 - Rp 15,000,000',
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    jobType: 'Full-time',
    provider: 'LinkedIn',
    originalUrl: 'https://linkedin.com/jobs/view/1'
  },
  {
    id: 'job-2',
    title: 'UX/UI Designer',
    companyName: 'Creative Studio',
    location: 'Remote',
    description: 'Seeking a talented UX/UI Designer to craft intuitive user experiences. Must have a strong portfolio demonstrating clean and modern aesthetics.',
    qualifications: [
      '3+ years of experience in product design',
      'Expert in Figma and prototyping tools',
      'Understanding of HTML/CSS is a plus',
    ],
    benefits: ['Fully Remote', 'Annual Retreat', 'Learning Budget'],
    salary: 'Rp 8,000,000 - Rp 12,000,000',
    postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    jobType: 'Remote',
    provider: 'Glints',
    originalUrl: 'https://glints.com/jobs/2'
  },
  {
    id: 'job-3',
    title: 'Backend Engineer (Node.js)',
    companyName: 'Fintech Solutions',
    location: 'Bandung',
    description: 'Join our core backend team to build scalable and secure financial APIs using Node.js and PostgreSQL.',
    qualifications: [
      'Strong backend engineering experience (Node.js, Express/NestJS)',
      'Experience with SQL databases and query optimization',
      'Knowledge of microservices architecture',
    ],
    benefits: ['Bonus Tahunan', 'Asuransi Keluarga', 'Catering Makan Siang'],
    salary: 'Rp 12,000,000 - Rp 18,000,000',
    postedAt: new Date(), // today
    jobType: 'Full-time',
    provider: 'JobStreet',
    originalUrl: 'https://jobstreet.co.id/jobs/3'
  }
];

export class MockJobProvider implements JobProviderAdapter {
  providerName = 'Mock Provider';

  async searchJobs(filters: JobSearchFilters, _cursor?: string): Promise<PaginatedResult<Job>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    let filtered = mockJobs;

    if (filters.keyword) {
      const keywordLower = filters.keyword.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(keywordLower) || 
        job.companyName.toLowerCase().includes(keywordLower)
      );
    }

    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      filtered = filtered.filter(job => job.location.toLowerCase().includes(locationLower));
    }

    // In a real app, we'd handle pagination logic with the cursor
    return {
      data: filtered,
      total: filtered.length,
      hasMore: false,
    };
  }

  async getJobDetail(id: string): Promise<Job | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const job = mockJobs.find(j => j.id === id);
    return job || null;
  }
}
