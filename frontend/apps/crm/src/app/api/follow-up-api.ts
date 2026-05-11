import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiApplication } from './application-types';

@Injectable({ providedIn: 'root' })
export class FollowUpApi {
  private readonly http = inject(HttpClient);

  upcoming(withinDays?: number): Observable<ApiApplication[]> {
    const params = withinDays ? { withinDays: String(withinDays) } : undefined;
    return this.http.get<ApiApplication[]>('/api/v1/follow-ups/upcoming', { params });
  }

  setDate(id: string, nextFollowUpAt: string): Observable<ApiApplication> {
    return this.http.post<ApiApplication>(
      `/api/v1/applications/${id}/follow-up`,
      { nextFollowUpAt },
    );
  }

  markDone(id: string): Observable<ApiApplication> {
    return this.http.post<ApiApplication>(`/api/v1/applications/${id}/follow-up/done`, {});
  }

  snooze(id: string, days: number): Observable<ApiApplication> {
    return this.http.post<ApiApplication>(
      `/api/v1/applications/${id}/follow-up/snooze`,
      { days },
    );
  }
}
