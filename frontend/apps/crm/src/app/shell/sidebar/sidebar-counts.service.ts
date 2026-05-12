import { Injectable, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';

import { ApplicationApi } from '../../api/application-api';
import { JobOfferApi } from '../../api/job-offer-api';

// Small ambient counts so the sidenav nav items can render a numeric pill
// next to their label, mirroring the Claude Design "jobflow" handoff.
// One refresh per session is enough for the bento; downstream pages refresh
// their own data anyway.
@Injectable({ providedIn: 'root' })
export class SidebarCountsService {
  private readonly applications = inject(ApplicationApi);
  private readonly jobOffers = inject(JobOfferApi);

  private readonly counts = signal<Record<string, number>>({});

  constructor() {
    this.refresh();
  }

  countFor(path: string): number {
    return this.counts()[path] ?? 0;
  }

  refresh(): void {
    this.applications.list()
      .pipe(catchError(() => of(null)))
      .subscribe((page) => {
        if (!page) return;
        const apps = page.content;
        const activeStatuses = new Set([
          'APPLIED', 'ACK_RECEIVED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_DONE',
          'TASK_RECEIVED', 'TASK_SUBMITTED', 'OFFER',
        ]);
        const active = apps.filter((a) => activeStatuses.has(a.currentStatus) && !a.archived).length;
        const due = apps.filter((a) => a.nextFollowUpAt && new Date(a.nextFollowUpAt).getTime() <= Date.now() + 7 * 86_400_000).length;
        this.counts.update((c) => ({ ...c, '/applications': active, '/follow-up': due }));
      });

    this.jobOffers.list()
      .pipe(catchError(() => of(null)))
      .subscribe((page) => {
        if (!page) return;
        this.counts.update((c) => ({ ...c, '/job-board': page.content.length }));
      });
  }
}
