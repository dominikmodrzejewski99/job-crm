export type JobBoardSource = 'JUSTJOIN' | 'NOFLUFF';

export interface JobOffer {
  id: string;
  source: JobBoardSource;
  externalId: string;
  title: string;
  companyName: string;
  location: string | null;
  remote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  url: string;
  postedAt: string | null;
  fetchedAt: string;
}

export interface ApiPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  empty: boolean;
}

export interface CrawlReport {
  inserted: number;
  updated: number;
  skipped: number;
  total: number;
}
