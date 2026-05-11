import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiApplication } from './application-types';
import { ApiPage, CrawlReport, JobOffer } from './job-offer-types';

@Injectable({ providedIn: 'root' })
export class JobOfferApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/joboffers';

  list(): Observable<ApiPage<JobOffer>> {
    return this.http.get<ApiPage<JobOffer>>(this.base, { params: { size: '100' } });
  }

  saveAsApplication(offerId: string): Observable<ApiApplication> {
    return this.http.post<ApiApplication>(`${this.base}/${offerId}/save-as-application`, {});
  }

  refreshCrawler(): Observable<CrawlReport> {
    return this.http.post<CrawlReport>(`${this.base}/refresh`, {});
  }
}
