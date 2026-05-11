import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApiApplication,
  ApiApplicationStatus,
  ApiPage,
} from './application-types';

@Injectable({ providedIn: 'root' })
export class ApplicationApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/applications';

  list(): Observable<ApiPage<ApiApplication>> {
    return this.http.get<ApiPage<ApiApplication>>(this.base, {
      params: { size: '50' },
    });
  }

  create(payload: Partial<ApiApplication>): Observable<ApiApplication> {
    return this.http.post<ApiApplication>(this.base, payload);
  }

  changeStatus(id: string, status: ApiApplicationStatus): Observable<ApiApplication> {
    return this.http.post<ApiApplication>(`${this.base}/${id}/status`, { status });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
