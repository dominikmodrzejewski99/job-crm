import { JsonPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';

import { DsAvatar } from '@frontend/design-system/avatar';
import { DsBadge, DsApplicationStatus } from '@frontend/design-system/badge';
import { DsButton } from '@frontend/design-system/button';
import {
  DsCard,
  DsCardBody,
  DsCardFooter,
  DsCardHeader,
} from '@frontend/design-system/card';
import { DsCheckbox } from '@frontend/design-system/checkbox';
import { DsChip } from '@frontend/design-system/chip';
import { DsEmpty } from '@frontend/design-system/empty';
import { DsInput } from '@frontend/design-system/input';
import {
  DsMenu,
  DsMenuDivider,
  DsMenuItem,
  DsMenuTrigger,
} from '@frontend/design-system/menu';
import { DsModalService } from '@frontend/design-system/modal';
import { DsPagination } from '@frontend/design-system/pagination';
import { DsRadio, DsRadioGroup } from '@frontend/design-system/radio';
import { DsOption, DsSelect } from '@frontend/design-system/select';
import { DsSkeleton } from '@frontend/design-system/skeleton';
import { DsSpinner } from '@frontend/design-system/spinner';
import { DsStatCard } from '@frontend/design-system/stat-card';
import { DsSwitch } from '@frontend/design-system/switch';
import { DsTab, DsTabs } from '@frontend/design-system/tabs';
import { DsTextarea } from '@frontend/design-system/textarea';
import { ThemeService } from '@frontend/design-system/theme';
import { DsToastService } from '@frontend/design-system/toast';
import { DsTooltip } from '@frontend/design-system/tooltip';

import { ApplicationApi } from './api/application-api';
import { ApiApplication, statusToBadge } from './api/application-types';
import { FollowUpApi } from './api/follow-up-api';
import { JobOfferApi } from './api/job-offer-api';
import { JobOffer } from './api/job-offer-types';
import { JobOffersGrid } from './job-offers-grid';
import { ApplicationsGrid, ApplicationRow } from './applications-grid';
import { AuthService } from './auth/auth.service';
import { ConfirmModal } from './confirm-modal';

interface PingResponse {
  status: string;
  service: string;
  timestamp: string;
}

interface StatusDemo {
  variant: DsApplicationStatus;
  label: string;
}

type Source = 'justjoin' | 'nofluff' | 'referral' | 'other';
type ToastKind = 'success' | 'info' | 'warning' | 'error';

@Component({
  selector: 'main-page',
  imports: [
    RouterModule,
    JsonPipe,
    DsButton,
    DsBadge,
    DsChip,
    DsCard,
    DsCardHeader,
    DsCardBody,
    DsCardFooter,
    DsAvatar,
    DsSpinner,
    DsSkeleton,
    DsEmpty,
    DsStatCard,
    DsInput,
    DsTextarea,
    DsCheckbox,
    DsSwitch,
    DsRadio,
    DsRadioGroup,
    DsTabs,
    DsTab,
    DsPagination,
    DsTooltip,
    ApplicationsGrid,
    DsMenu,
    DsMenuTrigger,
    DsMenuItem,
    DsMenuDivider,
    DsSelect,
    DsOption,
    JobOffersGrid,
  ],
  templateUrl: './main.page.html',
  styleUrl: './main.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPage {
  private readonly http = inject(HttpClient);
  private readonly modal = inject(DsModalService);
  private readonly toast = inject(DsToastService);
  private readonly api = inject(ApplicationApi);
  private readonly followUpApi = inject(FollowUpApi);
  private readonly jobOfferApi = inject(JobOfferApi);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly themeService = inject(ThemeService);

  protected readonly followUps = signal<ApiApplication[]>([]);
  protected readonly followUpsLoading = signal(true);

  protected readonly jobOffers = signal<JobOffer[]>([]);
  protected readonly jobOffersLoading = signal(true);
  protected readonly crawlerRunning = signal(false);

  protected readonly ping = signal<PingResponse | null>(null);
  protected readonly pingError = signal<string | null>(null);
  protected readonly pingLoading = signal(false);

  protected readonly statusDemos: StatusDemo[] = [
    { variant: 'draft', label: 'Draft' },
    { variant: 'applied', label: 'Applied' },
    { variant: 'ack', label: 'Ack received' },
    { variant: 'intsch', label: 'Interview scheduled' },
    { variant: 'intdone', label: 'Interview done' },
    { variant: 'taskrx', label: 'Task received' },
    { variant: 'tasktx', label: 'Task submitted' },
    { variant: 'offer', label: 'Offer' },
    { variant: 'rejected', label: 'Rejected' },
    { variant: 'withdraw', label: 'Withdrawn' },
    { variant: 'ghosted', label: 'Ghosted' },
  ];

  protected readonly tags = signal<string[]>([
    'remote',
    'java',
    'angular',
    'b2b',
    'kraków',
  ]);

  // ---- Form signals ----
  protected readonly company = signal('');
  protected readonly position = signal('');
  protected readonly notes = signal('');
  protected readonly source = signal<Source>('justjoin');
  protected readonly remote = signal(true);
  protected readonly notifyByEmail = signal(false);
  protected readonly attemptedSubmit = signal(false);
  protected readonly selectedCountry = signal<string | null>('PL');

  protected readonly companyError = computed(() => {
    if (!this.attemptedSubmit() && !this.company()) return false;
    return this.company().trim().length < 2;
  });

  protected readonly positionError = computed(() => {
    if (!this.attemptedSubmit() && !this.position()) return false;
    return this.position().trim().length === 0;
  });

  protected readonly formValid = computed(
    () => this.company().trim().length >= 2 && this.position().trim().length > 0,
  );

  protected readonly formValue = computed(() => ({
    company: this.company(),
    position: this.position(),
    notes: this.notes(),
    source: this.source(),
    country: this.selectedCountry(),
    remote: this.remote(),
    notifyByEmail: this.notifyByEmail(),
  }));

  protected readonly submitted = signal<unknown | null>(null);

  // ---- Tabs state ----
  protected readonly activeTab = signal(0);

  // Live applications loaded from /api/v1/applications. We keep the raw
  // ApiApplication entries (for delete / mutations) and project a UI-shaped
  // ApplicationRow[] for AG Grid via a computed signal.
  protected readonly applications = signal<ApiApplication[]>([]);
  protected readonly applicationsLoading = signal(true);
  protected readonly applicationsError = signal<string | null>(null);

  protected readonly rows = computed<ApplicationRow[]>(() =>
    this.applications().map((a) => ({
      id: a.id,
      company: a.companyName,
      position: a.position,
      status: statusToBadge(a.currentStatus),
      appliedAt: a.appliedAt,
    })),
  );

  constructor() {
    this.loadApplications();
    this.loadFollowUps();
    this.loadJobOffers();
  }

  private loadJobOffers(): void {
    this.jobOffersLoading.set(true);
    this.jobOfferApi
      .list()
      .pipe(
        catchError(() => {
          this.jobOffersLoading.set(false);
          return of({
            content: [] as JobOffer[],
            totalElements: 0, totalPages: 0, number: 0, size: 0, empty: true,
          });
        }),
      )
      .subscribe((page) => {
        this.jobOffers.set(page.content);
        this.jobOffersLoading.set(false);
      });
  }

  protected refreshCrawler(): void {
    this.crawlerRunning.set(true);
    this.jobOfferApi.refreshCrawler().subscribe({
      next: (report) => {
        this.crawlerRunning.set(false);
        this.toast.success(`Crawler: +${report.inserted} nowych, ~${report.updated} odświeżonych`);
        this.loadJobOffers();
      },
      error: () => {
        this.crawlerRunning.set(false);
        this.toast.error('Crawler się wywalił — sprawdź logi backendu');
      },
    });
  }

  protected saveOfferAsApplication(offerId: string): void {
    this.jobOfferApi.saveAsApplication(offerId).subscribe({
      next: (created) => {
        this.applications.update((list) => [created, ...list]);
        this.toast.success(`Zapisano ${created.companyName} jako aplikację`);
      },
      error: () => this.toast.error('Nie udało się zapisać oferty'),
    });
  }

  private loadFollowUps(): void {
    this.followUpsLoading.set(true);
    this.followUpApi
      .upcoming(7)
      .pipe(
        catchError(() => {
          this.followUpsLoading.set(false);
          return of([] as ApiApplication[]);
        }),
      )
      .subscribe((items) => {
        this.followUps.set(items);
        this.followUpsLoading.set(false);
      });
  }

  protected followUpDone(id: string): void {
    this.followUpApi.markDone(id).subscribe({
      next: () => {
        this.followUps.update((list) => list.filter((a) => a.id !== id));
        this.toast.success('Follow-up odhaczony');
      },
      error: () => this.toast.error('Nie udało się zaktualizować'),
    });
  }

  protected followUpSnooze(id: string, days: number): void {
    this.followUpApi.snooze(id, days).subscribe({
      next: () => {
        this.followUps.update((list) => list.filter((a) => a.id !== id));
        this.toast.info(`Odłożone o ${days} dni`);
      },
      error: () => this.toast.error('Nie udało się odłożyć'),
    });
  }

  protected isFollowUpOverdue(timestamp: string): boolean {
    return new Date(timestamp).getTime() < Date.now();
  }

  protected statusToBadgeFn = statusToBadge;

  private loadApplications(): void {
    this.applicationsLoading.set(true);
    this.applicationsError.set(null);
    this.api
      .list()
      .pipe(
        catchError((err) => {
          this.applicationsError.set(err?.message ?? 'Nie udało się pobrać aplikacji');
          this.toast.error('Nie udało się pobrać aplikacji');
          return of({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 0, empty: true });
        }),
      )
      .subscribe((page) => {
        this.applications.set(page.content);
        this.applicationsLoading.set(false);
      });
  }

  protected pingBackend(): void {
    this.pingLoading.set(true);
    this.pingError.set(null);
    this.http
      .get<PingResponse>('/api/v1/ping')
      .pipe(
        catchError((err) => {
          this.pingError.set(err?.message ?? 'request failed');
          return of(null);
        }),
      )
      .subscribe((res) => {
        this.pingLoading.set(false);
        this.ping.set(res);
        if (res) this.toast.success('Backend odpowiedział', res.service);
      });
  }

  protected removeTag(tag: string): void {
    this.tags.update((list) => list.filter((t) => t !== tag));
  }

  protected submit(): void {
    this.attemptedSubmit.set(true);
    if (!this.formValid()) {
      this.toast.warning('Popraw błędy w formularzu');
      return;
    }
    const v = this.formValue();
    this.api
      .create({
        companyName: v.company,
        position: v.position,
        source: this.formSourceToApi(v.source),
        remote: v.remote,
        location: null,
        appliedAt: new Date().toISOString().slice(0, 10),
        notes: v.notes || null,
      })
      .subscribe({
        next: (created) => {
          this.applications.update((list) => [created, ...list]);
          this.submitted.set(this.formValue());
          this.toast.success('Aplikacja zapisana');
          this.reset();
        },
        error: () => this.toast.error('Backend odrzucił aplikację'),
      });
  }

  private formSourceToApi(s: Source): ApiApplication['source'] {
    switch (s) {
      case 'justjoin': return 'JUSTJOIN';
      case 'nofluff':  return 'NOFLUFF';
      case 'referral': return 'REFERRAL';
      default:         return 'OTHER';
    }
  }

  protected reset(): void {
    this.company.set('');
    this.position.set('');
    this.notes.set('');
    this.source.set('justjoin');
    this.selectedCountry.set('PL');
    this.remote.set(true);
    this.notifyByEmail.set(false);
    this.attemptedSubmit.set(false);
    this.submitted.set(null);
  }

  protected confirmDeleteById(id: string): void {
    const app = this.applications().find((a) => a.id === id);
    if (!app) return;
    const ref = this.modal.open<ConfirmModal, boolean>(ConfirmModal, {
      data: {
        title: `Usunąć ${app.companyName}?`,
        message: `Aplikacja "${app.position}" zostanie usunięta na zawsze.`,
        confirmText: 'Usuń',
        cancelText: 'Anuluj',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.api.delete(id).subscribe({
        next: () => {
          this.applications.update((list) => list.filter((a) => a.id !== id));
          this.toast.success(`Usunięto ${app.companyName}`);
        },
        error: () => this.toast.error('Nie udało się usunąć aplikacji'),
      });
    });
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  protected demoConfirmDelete(): void {
    const first = this.applications()[0];
    if (first) {
      this.confirmDeleteById(first.id);
    } else {
      this.toast.info('Brak aplikacji do usunięcia — najpierw dodaj jedną');
    }
  }

  protected showToast(variant: ToastKind): void {
    const messages: Record<ToastKind, string> = {
      success: 'To poszło dobrze',
      info: 'Tylko cię informuję',
      warning: 'Coś jest nie tak',
      error: 'Coś poszło bardzo źle',
    };
    this.toast.show({ variant, message: messages[variant], title: variant.toUpperCase() });
  }
}
