import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { FollowUpApi } from './follow-up-api';

describe('FollowUpApi', () => {
  let api: FollowUpApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(FollowUpApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('upcoming(7) passes withinDays as a query param', () => {
    api.upcoming(7).subscribe();
    const req = http.expectOne((r) => r.url === '/api/v1/follow-ups/upcoming');
    expect(req.request.params.get('withinDays')).toBe('7');
    req.flush([]);
  });

  it('upcoming() with no arg omits the query param', () => {
    api.upcoming().subscribe();
    const req = http.expectOne((r) => r.url === '/api/v1/follow-ups/upcoming');
    expect(req.request.params.has('withinDays')).toBe(false);
    req.flush([]);
  });

  it('setDate POSTs nextFollowUpAt', () => {
    api.setDate('a1', '2026-06-01').subscribe();
    const req = http.expectOne('/api/v1/applications/a1/follow-up');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nextFollowUpAt: '2026-06-01' });
    req.flush({});
  });

  it('markDone POSTs an empty body', () => {
    api.markDone('a1').subscribe();
    const req = http.expectOne('/api/v1/applications/a1/follow-up/done');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('snooze POSTs the day count', () => {
    api.snooze('a1', 3).subscribe();
    const req = http.expectOne('/api/v1/applications/a1/follow-up/snooze');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ days: 3 });
    req.flush({});
  });
});
