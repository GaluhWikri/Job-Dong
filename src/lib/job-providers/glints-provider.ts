import { Job, JobProviderAdapter, JobSearchFilters, PaginatedResult } from './interface';

// Glints is protected by Datadome enterprise anti-bot - server-to-server requests
// are fully blocked regardless of headers/cookies/GraphQL.
// We use a curated realistic dataset based on real Glints job categories.
// In production, replace with Apify/ScraperAPI or Glints partnership API.

const GLINTS_JOB_POOL: Omit<Job, 'id'>[] = [
  {
    title: 'Frontend Developer (React)',
    companyName: 'Tokopedia',
    location: 'Jakarta Selatan',
    description: 'Kami mencari Frontend Developer berpengalaman yang menguasai React.js dan TypeScript untuk membangun fitur-fitur unggulan di platform e-commerce terbesar Indonesia.',
    qualifications: ['Pengalaman 2+ tahun React.js', 'Menguasai TypeScript', 'Familiar dengan state management (Redux/Zustand)', 'Kemampuan komunikasi yang baik'],
    benefits: ['Saham perusahaan (ESOP)', 'Remote Working', 'BPJS Kesehatan & Ketenagakerjaan', 'Tunjangan internet'],
    salary: 'Rp 12.000.000 – Rp 20.000.000',
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    jobType: 'Full-time',
    provider: 'Glints',
    originalUrl: 'https://glints.com/id/opportunities/jobs/explore?keyword=frontend',
  },
  {
    title: 'UI/UX Designer',
    companyName: 'Gojek',
    location: 'Jakarta Pusat',
    description: 'Bergabunglah dengan tim desain Gojek untuk menciptakan pengalaman pengguna yang luar biasa di ekosistem super-app kami. Kamu akan berkolaborasi dengan PM dan Engineer.',
    qualifications: ['Portfolio yang kuat', 'Menguasai Figma', 'Pengalaman user research', 'Familiar dengan design systems'],
    benefits: ['Asuransi kesehatan premium', 'Learning & Development budget', 'Saham perusahaan', 'Flexible working hours'],
    salary: 'Rp 10.000.000 – Rp 18.000.000',
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    jobType: 'Full-time',
    provider: 'Glints',
    originalUrl: 'https://glints.com/id/opportunities/jobs/explore?keyword=ui+ux',
  },
  {
    title: 'Backend Engineer (Node.js)',
    companyName: 'Bukalapak',
    location: 'Bandung / Remote',
    description: 'Dibutuhkan Backend Engineer untuk membangun dan memelihara layanan microservices yang melayani jutaan transaksi harian. Stack utama Node.js, Kafka, dan PostgreSQL.',
    qualifications: ['Menguasai Node.js & TypeScript', 'Pengalaman dengan microservices', 'Pemahaman database SQL & NoSQL', 'Pengalaman CI/CD pipeline'],
    benefits: ['Fully remote', 'Home office allowance', 'Asuransi jiwa', 'Internet allowance'],
    salary: 'Rp 15.000.000 – Rp 25.000.000',
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    jobType: 'Full-time',
    provider: 'Glints',
    originalUrl: 'https://glints.com/id/opportunities/jobs/explore?keyword=backend',
  },
  {
    title: 'Data Analyst',
    companyName: 'Traveloka',
    location: 'Jakarta Selatan',
    description: 'Kami mencari Data Analyst untuk menganalisis data perjalanan jutaan pengguna, memberikan insight bisnis yang actionable, dan membantu pengambilan keputusan berbasis data.',
    qualifications: ['Menguasai SQL & Python/R', 'Pengalaman dengan Tableau/Looker', 'Kemampuan komunikasi hasil analisis', 'Background statistik atau matematika'],
    benefits: ['Travel credit gratis', 'Asuransi kesehatan keluarga', 'Saham perusahaan', 'Continuous learning budget'],
    salary: 'Rp 9.000.000 – Rp 16.000.000',
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    jobType: 'Full-time',
    provider: 'Glints',
    originalUrl: 'https://glints.com/id/opportunities/jobs/explore?keyword=data+analyst',
  },
  {
    title: 'Product Manager',
    companyName: 'Sea Group (Shopee)',
    location: 'Jakarta Barat',
    description: 'Shopee Indonesia membuka posisi Product Manager untuk memimpin pengembangan fitur-fitur checkout dan pembayaran. Kamu akan menjadi jembatan antara bisnis, desain, dan engineering.',
    qualifications: ['Pengalaman 3+ tahun sebagai PM', 'Kemampuan analisis data yang kuat', 'Pengalaman Agile/Scrum', 'Excellent stakeholder management'],
    benefits: ['Kompensasi kompetitif', 'Medical insurance', 'Annual bonus', 'Career growth yang cepat'],
    salary: 'Kompetitif (negotiable)',
    postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    jobType: 'Full-time',
    provider: 'Glints',
    originalUrl: 'https://glints.com/id/opportunities/jobs/explore?keyword=product+manager',
  },
  {
    title: 'DevOps Engineer',
    companyName: 'OVO',
    location: 'Jakarta / Hybrid',
    description: 'OVO mencari DevOps Engineer untuk mengelola infrastruktur cloud AWS, membangun pipeline CI/CD, dan memastikan ketersediaan layanan fintech 99.9% uptime.',
    qualifications: ['Pengalaman AWS/GCP/Azure', 'Menguasai Kubernetes & Docker', 'Pengalaman Terraform/Ansible', 'Pemahaman keamanan cloud'],
    benefits: ['Hybrid working', 'Certified cloud training', 'BPJS + asuransi tambahan', 'Transport allowance'],
    salary: 'Rp 18.000.000 – Rp 30.000.000',
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    jobType: 'Full-time',
    provider: 'Glints',
    originalUrl: 'https://glints.com/id/opportunities/jobs/explore?keyword=devops',
  },
  {
    title: 'iOS Developer (Swift)',
    companyName: 'Dana Indonesia',
    location: 'Jakarta Pusat',
    description: 'Dana mencari iOS Developer untuk mengembangkan aplikasi dompet digital yang digunakan lebih dari 100 juta pengguna. Kamu akan bekerja pada fitur pembayaran, transfer, dan keamanan.',
    qualifications: ['Pengalaman 2+ tahun iOS (Swift)', 'Familiar dengan UIKit dan SwiftUI', 'Pengalaman publish app ke App Store', 'Memahami keamanan mobile app'],
    benefits: ['Saham perusahaan', 'Asuransi premium', 'Flexible hours', 'Makan siang gratis'],
    salary: 'Rp 14.000.000 – Rp 22.000.000',
    postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    jobType: 'Full-time',
    provider: 'Glints',
    originalUrl: 'https://glints.com/id/opportunities/jobs/explore?keyword=ios+developer',
  },
  {
    title: 'Digital Marketing Specialist',
    companyName: 'Lazada Indonesia',
    location: 'Jakarta Selatan',
    description: 'Bergabunglah sebagai Digital Marketing Specialist di Lazada untuk merencanakan dan mengeksekusi kampanye pemasaran digital yang mendorong pertumbuhan GMV platform.',
    qualifications: ['Pengalaman Google Ads & Meta Ads', 'Kemampuan analisis data marketing', 'Kreatif dan data-driven', 'Pengalaman e-commerce marketing'],
    benefits: ['E-voucher belanja bulanan', 'Asuransi kesehatan', 'KPI bonus', 'Training internasional'],
    salary: 'Rp 7.000.000 – Rp 12.000.000',
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    jobType: 'Full-time',
    provider: 'Glints',
    originalUrl: 'https://glints.com/id/opportunities/jobs/explore?keyword=digital+marketing',
  },
];

export class GlintsProvider implements JobProviderAdapter {
  providerName = 'Glints';

  async searchJobs(filters: JobSearchFilters, cursor?: string): Promise<PaginatedResult<Job>> {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 300));

    const keyword = filters.keyword?.toLowerCase() ?? '';
    const location = filters.location?.toLowerCase() ?? '';

    // Replicate jobs to simulate a larger pool (32 items)
    const largePool = [
      ...GLINTS_JOB_POOL,
      ...GLINTS_JOB_POOL.map(j => ({ ...j, title: `Senior ${j.title}` })),
      ...GLINTS_JOB_POOL.map(j => ({ ...j, title: `Junior ${j.title}` })),
      ...GLINTS_JOB_POOL.map(j => ({ ...j, title: `Lead ${j.title}` }))
    ];

    let filtered = largePool.filter(job => {
      const matchKeyword = !keyword ||
        job.title.toLowerCase().includes(keyword) ||
        job.description.toLowerCase().includes(keyword) ||
        job.qualifications.some(q => q.toLowerCase().includes(keyword));
      const matchLocation = !location ||
        job.location.toLowerCase().includes(location);
      return matchKeyword && matchLocation;
    });


    const page = cursor ? parseInt(cursor, 10) : 1;
    const itemsPerPage = 12;
    const startIndex = (page - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

    const jobs: Job[] = paginated.map((raw, i) => ({
      ...raw,
      id: `glints-${startIndex + i}-${raw.title.replace(/\s+/g, '-').toLowerCase()}`,
    }));

    const hasMore = startIndex + itemsPerPage < filtered.length;

    return { data: jobs, total: filtered.length, hasMore, nextCursor: hasMore ? String(page + 1) : undefined };
  }

  async getJobDetail(id: string): Promise<Job | null> {
    const idx = parseInt(id.split('-')[1]);
    
    const largePool = [
      ...GLINTS_JOB_POOL,
      ...GLINTS_JOB_POOL.map(j => ({ ...j, title: `Senior ${j.title}` })),
      ...GLINTS_JOB_POOL.map(j => ({ ...j, title: `Junior ${j.title}` })),
      ...GLINTS_JOB_POOL.map(j => ({ ...j, title: `Lead ${j.title}` }))
    ];

    const raw = !isNaN(idx) ? largePool[idx] : null;
    if (!raw) return null;
    return { ...raw, id };
  }
}
