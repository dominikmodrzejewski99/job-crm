import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { JobOfferApi } from './job-offer-api';

describe('JobOfferApi', () => {
  let api: JobOfferApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(JobOfferApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('GET list passes size=100 page param', () => {
    api.list().subscribe();
    const req = http.expectOne((r) => r.url === '/api/v1/joboffers');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('size')).toBe('100');
    req.flush({ content: [], totalElements: 0 });
  });

  it('POST /:id/save-as-application returns the created application', () => {
    let result: unknown;
    api.saveAsApplication('off-1').subscribe((a) => (result = a));
    const req = http.expectOne('/api/v1/joboffers/off-1/save-as-application');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ id: 'app-1', companyName: 'X' });
    expect(result).toEqual({ id: 'app-1', companyName: 'X' });
  });

  it('POST /refresh triggers crawler and returns the report', () => {
    let result: unknown;
    api.refreshCrawler().subscribe((r) => (result = r));
    const req = http.expectOne('/api/v1/joboffers/refresh');
    expect(req.request.method).toBe('POST');
    req.flush({ inserted: 3, updated: 7 });
    expect(result).toEqual({ inserted: 3, updated: 7 });
  });
});
