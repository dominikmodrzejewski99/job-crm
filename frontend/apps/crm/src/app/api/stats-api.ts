import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardStats } from './stats-types';

@Injectable({ providedIn: 'root' })
export class StatsApi {
  private readonly http = inject(HttpClient);

  dashboard(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>('/api/v1/stats/dashboard');
  }
}
