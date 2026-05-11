import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';

import { DsButton } from '@frontend/design-system/button';
import { DsBadge } from '@frontend/design-system/badge';
import { DsCard, DsCardBody } from '@frontend/design-system/card';
import { DsInput } from '@frontend/design-system/input';
import { DsOption, DsSelect } from '@frontend/design-system/select';
import { DsSkeleton } from '@frontend/design-system/skeleton';
import { DsSwitch } from '@frontend/design-system/switch';
import { DsToastService } from '@frontend/design-system/toast';
import { I18nService } from '@frontend/design-system/i18n';

import { ApplicationApi } from '../../api/application-api';
import { JobOfferApi } from '../../api/job-offer-api';
import { JobOffer } from '../../api/job-offer-types';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { PageTitleService } from '../../shell/page-title.service';

@Component({
  selector: 'jt-job-board-page',
  standalone: true,
  imports: [
    DsButton,
    DsBadge,
    DsCard,
    DsCardBody,
    DsInput,
    DsSelect,
    DsOption,
    DsSkeleton,
    DsSwitch,
    EmptyStateComponent,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './job-board.page.html',
  styleUrl: './job-board.page.scss',
})
export class JobBoardPage {
  protected readonly i18n = inject(I18nService);
  private readonly titleService = inject(PageTitleService);
  private readonly api = inject(JobOfferApi);
  private readonly applications = inject(ApplicationApi);
  private readonly toast = inject(DsToastService);

  protected readonly offers = signal<JobOffer[]>([]);
  protected readonly loading = signal(true);
  protected readonly crawlerRunning = signal(false);
  protected readonly savingId = signal<string | null>(null);
  protected readonly savedIds = signal<Set<string>>(new Set());

  protected readonly search = signal('');
  protected readonly sourceFilter = signal<'ALL' | 'JUSTJOIN' | 'NOFLUFF'>('ALL');
  protected readonly remoteOnly = signal(false);

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const src = this.sourceFilter();
    const rem = this.remoteOnly();
    return this.offers().filter((o) => {
      if (src !== 'ALL' && o.source !== src) return false;
      if (rem && !o.remote) return false;
      if (!q) return true;
      return (
        o.title.toLowerCase().includes(q) ||
        o.companyName.toLowerCase().includes(q) ||
        (o.location ?? '').toLowerCase().includes(q)
      );
    });
  });

  protected readonly subtitle = computed(() => {
    const count = this.filtered().length;
    const offers = this.offers();
    if (offers.length === 0) return `0 ofert`;
    const latest = offers.reduce(
      (acc, o) => (o.fetchedAt > acc ? o.fetchedAt : acc),
      offers[0].fetchedAt,
    );
    return `${count} ofert · świeże do ${this.relativeTime(latest)}`;
  });

  private relativeTime(iso: string): string {
    const date = new Date(iso);
    const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    if (days < 1) return 'dzisiaj';
    if (days === 1) return 'wczoraj';
    if (days < 7) return `${days} dni temu`;
    if (days < 30) return `${Math.floor(days / 7)} tyg. temu`;
    return date.toLocaleDateString('pl-PL');
  }

  constructor() {
    this.titleService.setTitle(
      this.i18n.translate('page.jobBoard.title'),
      this.i18n.translate('page.jobBoard.subtitle'),
    );
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api
      .list()
      .pipe(catchError(() => of({ content: [] as JobOffer[], totalElements: 0, totalPages: 0, number: 0, size: 0, empty: true })))
      .subscribe((page) => {
        this.offers.set(page.content);
        this.loading.set(false);
      });
  }

  protected refresh(): void {
    this.crawlerRunning.set(true);
    this.api.refreshCrawler().subscribe({
      next: (report) => {
        this.crawlerRunning.set(false);
        this.toast.success(
          this.i18n.translate('toast.crawler.success'),
          `+${report.inserted} / ~${report.updated}`,
        );
        this.load();
      },
      error: () => {
        this.crawlerRunning.set(false);
        this.toast.error(this.i18n.translate('toast.crawler.error'));
      },
    });
  }

  protected save(offerId: string): void {
    this.savingId.set(offerId);
    this.api.saveAsApplication(offerId).subscribe({
      next: (created) => {
        this.savingId.set(null);
        this.savedIds.update((set) => new Set(set).add(offerId));
        this.toast.success(
          this.i18n.translate('toast.jobOffer.savedAsApplication'),
          created.companyName,
        );
      },
      error: () => {
        this.savingId.set(null);
        this.toast.error(this.i18n.translate('toast.jobOffer.saveFailed'));
      },
    });
  }

  protected formatSalary(o: JobOffer): string | null {
    if (o.salaryMin === null && o.salaryMax === null) return null;
    const cur = o.currency ?? '';
    const fmt = (n: number) => Math.round(n).toLocaleString('pl-PL');
    if (o.salaryMin && o.salaryMax) return `${fmt(o.salaryMin)} – ${fmt(o.salaryMax)} ${cur}`;
    if (o.salaryMax) return `do ${fmt(o.salaryMax)} ${cur}`;
    if (o.salaryMin) return `od ${fmt(o.salaryMin)} ${cur}`;
    return null;
  }

  protected formatPosted(o: JobOffer): string {
    return this.relativeTime(o.postedAt ?? o.fetchedAt);
  }
}
