import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { AuthResponse } from './auth-types';

const STORAGE_KEY_TOKEN = 'jobtrack:auth:token';
const STORAGE_KEY_USER = 'jobtrack:auth:user';

const fakeAuth: AuthResponse = {
  accessToken: 'tok-123',
  expiresInSeconds: 3600,
  user: { id: 'u1', email: 'a@b.c', displayName: 'A', createdAt: '2026-01-01T00:00:00Z' },
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('starts unauthenticated when nothing is stored', () => {
    expect(service.token()).toBeNull();
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('register stores token + user and flips isAuthenticated', () => {
    service.register({ email: 'a@b.c', password: 'pw' }).subscribe();
    http.expectOne('/api/v1/auth/register').flush(fakeAuth);

    expect(service.token()).toBe('tok-123');
    expect(service.user()?.email).toBe('a@b.c');
    expect(service.isAuthenticated()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY_TOKEN)).toBe('tok-123');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY_USER) ?? 'null')?.id).toBe('u1');
  });

  it('login stores credentials the same way as register', () => {
    service.login({ email: 'a@b.c', password: 'pw' }).subscribe();
    http.expectOne('/api/v1/auth/login').flush(fakeAuth);

    expect(service.isAuthenticated()).toBe(true);
  });

  it('logout clears in-memory and persisted state', () => {
    service.login({ email: 'a@b.c', password: 'pw' }).subscribe();
    http.expectOne('/api/v1/auth/login').flush(fakeAuth);
    expect(service.isAuthenticated()).toBe(true);

    service.logout();

    expect(service.token()).toBeNull();
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY_TOKEN)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY_USER)).toBeNull();
  });

  it('refreshCurrentUser updates the user signal', () => {
    localStorage.setItem(STORAGE_KEY_TOKEN, 'tok-123');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);

    service.refreshCurrentUser().subscribe();
    http.expectOne('/api/v1/auth/me').flush(fakeAuth.user);

    expect(service.user()?.email).toBe('a@b.c');
  });
});
