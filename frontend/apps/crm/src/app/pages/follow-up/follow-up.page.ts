import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';

import { DsBadge } from '@frontend/design-system/badge';
import { DsButton } from '@frontend/design-system/button';
import { DsSkeleton } from '@frontend/design-system/skeleton';
import { DsToastService } from '@frontend/design-system/toast';
import { I18nService } from '@frontend/design-system/i18n';

import { ApiApplication, statusToBadge } from '../../api/application-types';
import { FollowUpApi } from '../../api/follow-up-api';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { PageTitleService } from '../../shell/page-title.service';

interface Bucket {
  readonly kind: 'overdue' | 'today' | 'thisWeek' | 'later';
  readonly title: string;
  readonly items: ApiApplication[];
}

@Component({
  selector: 'jt-follow-up-page',
  standalone: true,
  imports: [DsBadge, DsButton, DsSkeleton, EmptyStateComponent, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './follow-up.page.html',
  styleUrl: './follow-up.page.scss',
})
export class FollowUpPage {
  protected readonly i18n = inject(I18nService);
  private readonly titleService = inject(PageTitleService);
  private readonly api = inject(FollowUpApi);
  private readonly toast = inject(DsToastService);

  protected readonly items = signal<ApiApplication[]>([]);
  protected readonly loading = signal(true);
  protected readonly busyId = signal<string | null>(null);

  protected readonly statusToBadge = statusToBadge;

  protected readonly buckets = computed<Bucket[]>(() => {
    const items = this.items();
    if (items.length === 0) return [];
    const now = Date.now();
    const today: ApiApplication[] = [];
    const overdue: ApiApplication[] = [];
    const thisWeek: ApiApplication[] = [];
    const later: ApiApplication[] = [];

    for (const a of items) {
      if (!a.nextFollowUpAt) continue;
      const t = new Date(a.nextFollowUpAt).getTime();
      const days = Math.floor((t - now) / 86_400_000);
      if (days < 0) overdue.push(a);
      else if (days === 0) today.push(a);
      else if (days <= 7) thisWeek.push(a);
      else later.push(a);
    }

    return [
      { kind: 'overdue' as const,  title: 'Przegapione',     items: overdue },
      { kind: 'today' as const,    title: 'Na dziś',         items: today },
      { kind: 'thisWeek' as const, title: 'W tym tygodniu',  items: thisWeek },
      { kind: 'later' as const,    title: 'Później',         items: later },
    ].filter((b) => b.items.length > 0);
  });

  constructor() {
    this.titleService.setTitle(
      this.i18n.translate('page.followUp.title'),
      this.i18n.translate('page.followUp.subtitle'),
    );
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api
      .upcoming(30)
      .pipe(catchError(() => of([] as ApiApplication[])))
      .subscribe((items) => {
        this.items.set(items);
        this.loading.set(false);
      });
  }

  protected markDone(id: string): void {
    this.busyId.set(id);
    this.api.markDone(id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.items.update((list) => list.filter((a) => a.id !== id));
        this.toast.success(this.i18n.translate('toast.followUp.done'));
      },
      error: () => {
        this.busyId.set(null);
        this.toast.error(this.i18n.translate('toast.followUp.doneFailed'));
      },
    });
  }

  protected snooze(id: string, days: number): void {
    this.busyId.set(id);
    this.api.snooze(id, days).subscribe({
      next: () => {
        this.busyId.set(null);
        this.items.update((list) => list.filter((a) => a.id !== id));
        this.toast.info(this.i18n.translate('toast.followUp.snoozed'), `+${days}d`);
      },
      error: () => {
        this.busyId.set(null);
        this.toast.error(this.i18n.translate('toast.followUp.snoozeFailed'));
      },
    });
  }

  protected relativeDue(iso: string | null): string {
    if (!iso) return '—';
    const t = new Date(iso).getTime();
    const days = Math.floor((t - Date.now()) / 86_400_000);
    if (days < 0) return `${Math.abs(days)} dni po terminie`;
    if (days === 0) return 'dzisiaj';
    if (days === 1) return 'jutro';
    return `za ${days} dni`;
  }
}
