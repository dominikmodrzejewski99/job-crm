import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { StatsApi } from './stats-api';

describe('StatsApi', () => {
  let api: StatsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(StatsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('GET /api/v1/stats/dashboard and emits the body', () => {
    let result: unknown;
    api.dashboard().subscribe((s) => (result = s));
    const req = http.expectOne('/api/v1/stats/dashboard');
    expect(req.request.method).toBe('GET');
    req.flush({ total: 5, active: 2 });
    expect(result).toEqual({ total: 5, active: 2 });
  });
});
