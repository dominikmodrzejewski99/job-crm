import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ApplicationApi } from './application-api';

describe('ApplicationApi', () => {
  let api: ApplicationApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ApplicationApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('GET list passes size=50 page param', () => {
    api.list().subscribe();
    const req = http.expectOne((r) => r.url === '/api/v1/applications');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('size')).toBe('50');
    req.flush({ content: [], totalElements: 0 });
  });

  it('POST create sends the payload as JSON body', () => {
    api.create({ companyName: 'Acme', position: 'Dev' }).subscribe();
    const req = http.expectOne('/api/v1/applications');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ companyName: 'Acme', position: 'Dev' });
    req.flush({ id: '1', companyName: 'Acme', position: 'Dev' });
  });

  it('POST /:id/status sends { status }', () => {
    api.changeStatus('abc', 'OFFER').subscribe();
    const req = http.expectOne('/api/v1/applications/abc/status');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ status: 'OFFER' });
    req.flush({});
  });

  it('DELETE :id', () => {
    api.delete('abc').subscribe();
    const req = http.expectOne('/api/v1/applications/abc');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
