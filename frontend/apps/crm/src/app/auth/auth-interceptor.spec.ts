import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { authInterceptor } from './auth-interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => httpMock.verify());

  it('attaches Authorization header when token is present', () => {
    auth.login({ email: 'a@b.c', password: 'pw' }).subscribe();
    httpMock.expectOne('/api/v1/auth/login').flush({
      accessToken: 'tok-123',
      expiresInSeconds: 3600,
      user: { id: 'u1', email: 'a@b.c', displayName: null, createdAt: '2026-01-01T00:00:00Z' },
    });

    http.get('/api/v1/applications').subscribe();
    const req = httpMock.expectOne('/api/v1/applications');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok-123');
    req.flush({ content: [] });
  });

  it('does not attach Authorization to /auth/login itself', () => {
    auth.login({ email: 'a@b.c', password: 'pw' }).subscribe();
    const req = httpMock.expectOne('/api/v1/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({
      accessToken: 'tok-123',
      expiresInSeconds: 3600,
      user: { id: 'u1', email: 'a@b.c', displayName: null, createdAt: '2026-01-01T00:00:00Z' },
    });
  });

  it('on 401 from a protected endpoint, logs out and redirects to /login', () => {
    auth.login({ email: 'a@b.c', password: 'pw' }).subscribe();
    httpMock.expectOne('/api/v1/auth/login').flush({
      accessToken: 'tok-123',
      expiresInSeconds: 3600,
      user: { id: 'u1', email: 'a@b.c', displayName: null, createdAt: '2026-01-01T00:00:00Z' },
    });
    expect(auth.isAuthenticated()).toBe(true);

    http.get('/api/v1/applications').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/v1/applications').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isAuthenticated()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('does not redirect on 401 from /auth/login (user just typed wrong password)', () => {
    auth.login({ email: 'a@b.c', password: 'wrong' }).subscribe({ error: () => undefined });
    httpMock
      .expectOne('/api/v1/auth/login')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(router.navigate).not.toHaveBeenCalled();
  });
});
