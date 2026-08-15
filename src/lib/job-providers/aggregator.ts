import { Job, JobSearchFilters, PaginatedResult } from './interface';
import { JobStreetProvider } from './jobstreet-provider';
import { GlintsProvider } from './glints-provider';
import { LinkedInProvider } from './linkedin-provider';

export type ProviderFilter = 'Semua' | 'Glints' | 'JobStreet' | 'LinkedIn';

export class JobAggregator {
  private jobStreet = new JobStreetProvider();
  private glints = new GlintsProvider();
  private linkedin = new LinkedInProvider();

  async searchJobs(filters: JobSearchFilters, providerFilter: ProviderFilter = 'Semua', cursor?: string): Promise<PaginatedResult<Job>> {
    let allJobs: Job[] = [];
    let anyHasMore = false;
    const promises: Promise<PaginatedResult<Job>>[] = [];

    if (providerFilter === 'Semua' || providerFilter === 'JobStreet') {
      promises.push(this.jobStreet.searchJobs(filters, cursor).catch(() => ({ data: [], total: 0, hasMore: false })));
    }
    if (providerFilter === 'Semua' || providerFilter === 'Glints') {
      promises.push(this.glints.searchJobs(filters, cursor).catch(() => ({ data: [], total: 0, hasMore: false })));
    }
    if (providerFilter === 'Semua' || providerFilter === 'LinkedIn') {
      promises.push(this.linkedin.searchJobs(filters, cursor).catch(() => ({ data: [], total: 0, hasMore: false })));
    }

    const results = await Promise.all(promises);
    
    for (const res of results) {
      allJobs = allJobs.concat(res.data);
      if (res.hasMore) anyHasMore = true;
    }

    // Shuffle jobs to mix sources if 'Semua'
    if (providerFilter === 'Semua') {
      allJobs.sort(() => Math.random() - 0.5);
    }

    return {
      data: allJobs,
      total: allJobs.length,
      hasMore: anyHasMore,
    };
  }

  async getJobDetail(id: string): Promise<Job | null> {
    // Try all sequentially or concurrently since we don't store provider in ID reliably for all
    // But we encoded the URL in the ID, so we can check it
    const decodedUrl = decodeURIComponent(id);
    
    if (decodedUrl.includes('jobstreet.co.id') || id.startsWith('js-')) {
      return this.jobStreet.getJobDetail(id);
    }
    
    if (decodedUrl.includes('glints.com') || id.startsWith('gl-')) {
      return this.glints.getJobDetail(id);
    }

    if (decodedUrl.includes('linkedin.com') || id.startsWith('li-')) {
      return this.linkedin.getJobDetail(id);
    }

    // Fallback: try all
    const results = await Promise.all([
      this.jobStreet.getJobDetail(id).catch(() => null),
      this.glints.getJobDetail(id).catch(() => null),
      this.linkedin.getJobDetail(id).catch(() => null),
    ]);

    return results.find(job => job !== null) || null;
  }
}
