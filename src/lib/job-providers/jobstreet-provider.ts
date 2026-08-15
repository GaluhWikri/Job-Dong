import * as cheerio from 'cheerio';
import { Job, JobProviderAdapter, JobSearchFilters, PaginatedResult } from './interface';

function extractReduxData(html: string): Record<string, unknown> | null {
  const marker = 'SEEK_REDUX_DATA = ';
  const idx = html.indexOf(marker);
  if (idx < 0) return null;

  const startIdx = idx + marker.length;
  let depth = 0;
  let endIdx = startIdx;

  for (let i = startIdx; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}') depth--;
    if (depth === 0 && i >= startIdx) {
      endIdx = i + 1;
      break;
    }
  }

  try {
    return JSON.parse(html.substring(startIdx, endIdx)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export class JobStreetProvider implements JobProviderAdapter {
  providerName = 'JobStreet';

  async searchJobs(filters: JobSearchFilters, cursor?: string): Promise<PaginatedResult<Job>> {
    try {
      const cleanKeyword = filters.keyword && filters.keyword.trim()
        ? encodeURIComponent(filters.keyword.toLowerCase().trim())
        : 'it';

      const cleanLocation = filters.location && filters.location.trim()
        ? encodeURIComponent(filters.location.toLowerCase().trim())
        : '';

      const page = cursor ? parseInt(cursor, 10) : 1;
      const pagePath = page > 1 ? `/${page}` : '';
      const locationSegment = cleanLocation ? `-in-${cleanLocation}` : '';
      const url = `https://www.jobstreet.co.id/id/job-search/${cleanKeyword}-jobs${locationSegment}${pagePath}/`;

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        next: { revalidate: 1800 },
      });

      if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);

      const html = await response.text();
      const reduxData = extractReduxData(html);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawJobs: any[] = (reduxData as any)?.results?.results?.jobs ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalCount = (reduxData as any)?.results?.results?.totalCount ?? 0;

      if (rawJobs.length > 0) {
        const jobs: Job[] = rawJobs.map((raw) => {
          const jobUrl = `https://www.jobstreet.co.id/id/job/${raw.id}`;
          return {
            id: encodeURIComponent(jobUrl),
            title: raw.title ?? 'Posisi Tidak Diketahui',
            companyName: raw.companyName ?? raw.advertiser?.description ?? 'Perusahaan',
            location:
              raw.locations?.[0]?.label ??
              raw.locations?.[0]?.countryCode ??
              'Indonesia',
            description: raw.teaser ?? 'Klik untuk melihat deskripsi lengkap.',
            qualifications: raw.bulletPoints ?? [],
            benefits: [],
            salary: raw.salaryLabel ?? undefined,
            postedAt: raw.listingDate ? new Date(raw.listingDate) : new Date(),
            jobType: raw.workTypes?.[0] ?? 'Full-time',
            provider: 'JobStreet',
            originalUrl: jobUrl,
          };
        });

        // hasMore is true if we have reached the total count yet
        const hasMore = page * 30 < totalCount;
        return { data: jobs, total: jobs.length, hasMore, nextCursor: hasMore ? String(page + 1) : undefined };
      }

      // Fallback to Cheerio article scraping
      const $ = cheerio.load(html);
      const jobs: Job[] = [];

      $('article').each((index, element) => {
        if (index >= 30) return;
        const linkEl = $(element).find('a').first();
        const href = linkEl.attr('href') ?? '';
        if (!href.includes('/job/')) return;

        const fullUrl = href.startsWith('http')
          ? href
          : `https://www.jobstreet.co.id${href}`;
        const jobId = encodeURIComponent(fullUrl);

        jobs.push({
          id: jobId,
          title:
            linkEl.text().trim() ||
            $(element).find('h3').text().trim() ||
            'Posisi Tidak Diketahui',
          companyName:
            $(element)
              .find('a[data-automation="jobCompany"]')
              .text()
              .trim() || 'Perusahaan JobStreet',
          location:
            $(element)
              .find('[data-automation="jobLocation"]')
              .text()
              .trim() || 'Indonesia',
          description: 'Klik untuk melihat deskripsi lengkap.',
          qualifications: [],
          benefits: [],
          postedAt: new Date(),
          jobType: 'Full-time',
          provider: 'JobStreet',
          originalUrl: fullUrl,
        });
      });

      return { data: jobs, total: jobs.length, hasMore: jobs.length >= 30, nextCursor: jobs.length >= 30 ? String(page + 1) : undefined };
    } catch (error) {
      console.error('JobStreet searchJobs error:', error);
      return { data: [], total: 0, hasMore: false };
    }
  }

  async getJobDetail(id: string): Promise<Job | null> {
    try {
      const url = decodeURIComponent(id);
      if (!url.includes('jobstreet.co.id')) return null;

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) return null;

      const html = await response.text();
      const reduxData = extractReduxData(html);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jobDetail = (reduxData as any)?.jobdetails?.result?.job;

      if (!jobDetail) return null;

      const location =
        jobDetail.locationHierarchy
          ?.map((l: { name: string }) => l.name)
          .filter(Boolean)
          .join(', ') ?? 'Indonesia';

      // content is already HTML - keep it for rich rendering
      const description: string = jobDetail.content ?? '<p>Tidak ada deskripsi.</p>';

      // Some jobs have a requirements / responsibilities array
      const qualifications: string[] = Array.isArray(jobDetail.requirements)
        ? jobDetail.requirements
        : [];
      const benefits: string[] = Array.isArray(jobDetail.benefits)
        ? jobDetail.benefits
        : [];

      return {
        id,
        title: jobDetail.title ?? 'Detail JobStreet',
        companyName:
          jobDetail.advertiser?.description ??
          jobDetail.advertiser?.name ??
          'Perusahaan',
        companyLogoUrl: jobDetail.companyProfile?.logoUrl ?? undefined,
        location,
        description,
        qualifications,
        benefits,
        salary: typeof jobDetail.salary === 'string' ? jobDetail.salary : (jobDetail.salary?.label ?? jobDetail.salaryLabel ?? undefined),
        postedAt: jobDetail.listingDate
          ? new Date(jobDetail.listingDate)
          : new Date(),
        jobType: jobDetail.workType ?? jobDetail.workTypes?.[0] ?? 'Full-time',
        provider: 'JobStreet',
        originalUrl: url,
      };
    } catch (e) {
      console.error('JobStreet getJobDetail error:', e);
      return null;
    }
  }
}
