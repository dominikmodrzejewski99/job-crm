import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import {
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from './auth-types';

const STORAGE_KEY_TOKEN = 'jobtrack:auth:token';
const STORAGE_KEY_USER = 'jobtrack:auth:user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly doc = inject(DOCUMENT);

  private readonly _token = signal<string | null>(this.read(STORAGE_KEY_TOKEN));
  private readonly _user = signal<AuthUser | null>(this.readUser());

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/v1/auth/register', req)
      .pipe(tap((res) => this.acceptAuth(res)));
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/v1/auth/login', req)
      .pipe(tap((res) => this.acceptAuth(res)));
  }

  refreshCurrentUser(): Observable<AuthUser> {
    return this.http.get<AuthUser>('/api/v1/auth/me').pipe(
      tap((user) => {
        this._user.set(user);
        this.write(STORAGE_KEY_USER, JSON.stringify(user));
      }),
    );
  }

  logout(): void {
    this._token.set(null);
    this._user.set(null);
    this.write(STORAGE_KEY_TOKEN, null);
    this.write(STORAGE_KEY_USER, null);
  }

  private acceptAuth(res: AuthResponse): void {
    this._token.set(res.accessToken);
    this._user.set(res.user);
    this.write(STORAGE_KEY_TOKEN, res.accessToken);
    this.write(STORAGE_KEY_USER, JSON.stringify(res.user));
  }

  private readUser(): AuthUser | null {
    const raw = this.read(STORAGE_KEY_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  private read(key: string): string | null {
    try {
      return this.doc.defaultView?.localStorage.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  private write(key: string, value: string | null): void {
    try {
      const ls = this.doc.defaultView?.localStorage;
      if (!ls) return;
      if (value === null) ls.removeItem(key);
      else ls.setItem(key, value);
    } catch {
      // SSR or sandboxed; ignore.
    }
  }
}
