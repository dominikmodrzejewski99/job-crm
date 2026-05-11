import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { DsBadge } from '@frontend/design-system/badge';
import { DsButton } from '@frontend/design-system/button';
import { DsCard, DsCardBody, DsCardHeader } from '@frontend/design-system/card';
import { DsSkeleton } from '@frontend/design-system/skeleton';
import { DsStatCard } from '@frontend/design-system/stat-card';
import { I18nService } from '@frontend/design-system/i18n';

import { ApplicationApi } from '../../api/application-api';
import { ApiApplication, statusToBadge } from '../../api/application-types';
import { StatsApi } from '../../api/stats-api';
import { DashboardStats } from '../../api/stats-types';
import { DashboardFunnel } from '../../dashboard/funnel';
import { DashboardStatusBars } from '../../dashboard/status-bars';
import { DashboardWeeklyChart } from '../../dashboard/weekly-chart';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { PageTitleService } from '../../shell/page-title.service';

@Component({
  selector: 'jt-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    DsButton,
    DsBadge,
    DsCard,
    DsCardHeader,
    DsCardBody,
    DsSkeleton,
    DsStatCard,
    DashboardFunnel,
    DashboardStatusBars,
    DashboardWeeklyChart,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
  protected readonly i18n = inject(I18nService);
  private readonly titleService = inject(PageTitleService);
  private readonly statsApi = inject(StatsApi);
  private readonly applicationsApi = inject(ApplicationApi);

  protected readonly stats = signal<DashboardStats | null>(null);
  protected readonly statsLoading = signal(true);

  protected readonly recent = signal<ApiApplication[]>([]);
  protected readonly recentLoading = signal(true);

  protected readonly responseRatePct = computed(() => {
    const s = this.stats();
    return s ? Math.round(s.responseRate * 100) : null;
  });

  protected readonly statusToBadge = statusToBadge;

  constructor() {
    this.titleService.setTitle(
      this.i18n.translate('page.dashboard.title'),
      this.i18n.translate('page.dashboard.subtitle'),
    );
    this.loadStats();
    this.loadRecent();
  }

  private loadStats(): void {
    this.statsLoading.set(true);
    this.statsApi
      .dashboard()
      .pipe(catchError(() => of(null)))
      .subscribe((s) => {
        this.stats.set(s);
        this.statsLoading.set(false);
      });
  }

  private loadRecent(): void {
    this.recentLoading.set(true);
    this.applicationsApi
      .list()
      .pipe(catchError(() => of({ content: [] as ApiApplication[], totalElements: 0, totalPages: 0, number: 0, size: 0, empty: true })))
      .subscribe((page) => {
        const sorted = [...page.content]
          .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
          .slice(0, 5);
        this.recent.set(sorted);
        this.recentLoading.set(false);
      });
  }
}
