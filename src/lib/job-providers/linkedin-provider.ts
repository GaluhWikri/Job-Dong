import * as cheerio from 'cheerio';
import { Job, JobProviderAdapter, JobSearchFilters, PaginatedResult } from './interface';

export class LinkedInProvider implements JobProviderAdapter {
  providerName = 'LinkedIn';

  async searchJobs(filters: JobSearchFilters, cursor?: string): Promise<PaginatedResult<Job>> {
    try {
      const keyword = filters.keyword
        ? encodeURIComponent(filters.keyword)
        : 'software+developer';

      const location = filters.location
        ? encodeURIComponent(filters.location)
        : 'Indonesia';

      const page = cursor ? parseInt(cursor, 10) : 1;
      const start = (page - 1) * 10;
      const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${keyword}&location=${location}&f_WT=2&start=${start}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
          'x-requested-with': 'XMLHttpRequest',
        },
        next: { revalidate: 1800 },
      });

      if (!response.ok) {
        throw new Error(`LinkedIn responded ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const jobs: Job[] = [];

      $('li').each((i, el) => {
        const title = $(el).find('.base-search-card__title').text().trim();
        const company = $(el).find('.base-search-card__subtitle').text().trim();
        const locationText = $(el).find('.job-search-card__location').text().trim();
        const link = $(el).find('a.base-card__full-link').attr('href') ?? '';
        const entityUrn =
          $(el).find('[data-entity-urn]').attr('data-entity-urn') ?? '';
        const postedDatetime = $(el)
          .find('.job-search-card__listdate')
          .attr('datetime');
        const logoUrl = $(el).find('img.artdeco-entity-image').attr('data-delayed-url');

        if (!title) return;

        const jobNumericId = entityUrn.replace('urn:li:jobPosting:', '');
        const id = `li-${jobNumericId}`;

        jobs.push({
          id,
          title,
          companyName: company || 'Perusahaan LinkedIn',
          companyLogoUrl: logoUrl || undefined,
          location: locationText || 'Indonesia',
          description: `${title} di ${company || 'perusahaan ini'}. Lihat detail lengkap di LinkedIn untuk informasi lebih lanjut tentang kualifikasi dan tanggung jawab pekerjaan ini.`,
          qualifications: ['Lihat detail lengkap di LinkedIn'],
          benefits: [],
          postedAt: postedDatetime ? new Date(postedDatetime) : new Date(),
          jobType: 'Full-time',
          provider: 'LinkedIn',
          originalUrl: link || undefined,
        });
      });

      const hasMore = jobs.length >= 10;
      return { data: jobs, total: jobs.length, hasMore, nextCursor: hasMore ? String(page + 1) : undefined };
    } catch (error) {
      console.error('LinkedIn searchJobs error:', error);
      return { data: [], total: 0, hasMore: false };
    }
  }

  async getJobDetail(id: string): Promise<Job | null> {
    try {
      const numericId = id.replace('li-', '');
      if (!numericId) return null;

      const url = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${numericId}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) return null;

      const html = await response.text();
      const $ = cheerio.load(html);

      const title = $('.topcard__title').text().trim();
      const company = $('.topcard__org-name-link, .topcard__org-name').first().text().trim();
      const location = $('.topcard__flavor--bullet').first().text().trim();
      const criteria: string[] = [];
      $('.description__job-criteria-item').each((_, el) => {
        criteria.push($(el).find('.description__job-criteria-text').text().trim());
      });

      // Description HTML
      const descriptionHtml = $('.show-more-less-html__markup').html() ??
        $('.description__text').html() ??
        '<p>Silakan lihat detail lowongan di LinkedIn langsung.</p>';

      const logoUrl = $('.topcard__logo img').attr('src') || undefined;
      const jobTypeRaw = criteria[0] ?? 'Full-time';
      const originalUrl = `https://www.linkedin.com/jobs/view/${numericId}`;

      return {
        id,
        title: title || 'Lowongan LinkedIn',
        companyName: company || 'Perusahaan LinkedIn',
        companyLogoUrl: logoUrl,
        location: location || 'Indonesia',
        description: descriptionHtml,
        qualifications: criteria.filter(Boolean),
        benefits: [],
        postedAt: new Date(),
        jobType: jobTypeRaw as Job['jobType'],
        provider: 'LinkedIn',
        originalUrl,
      };
    } catch (e) {
      console.error('LinkedIn getJobDetail error:', e);
      return null;
    }
  }
}
