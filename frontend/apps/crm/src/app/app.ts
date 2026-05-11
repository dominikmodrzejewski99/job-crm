import { JsonPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
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

import { ApplicationsGrid, ApplicationRow } from './applications-grid';
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
  selector: 'app-root',
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
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly http = inject(HttpClient);
  private readonly modal = inject(DsModalService);
  private readonly toast = inject(DsToastService);
  protected readonly themeService = inject(ThemeService);

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

  protected readonly allRows: ApplicationRow[] = [
    { id: 1, company: 'Acme Corp', position: 'Senior Java Engineer', status: 'intsch', appliedAt: '2026-05-06' },
    { id: 2, company: 'Globex', position: 'Backend Lead', status: 'applied', appliedAt: '2026-05-04' },
    { id: 3, company: 'Initech', position: 'Software Engineer II', status: 'ack', appliedAt: '2026-05-02' },
    { id: 4, company: 'Stark Industries', position: 'Platform Engineer', status: 'offer', appliedAt: '2026-04-28' },
    { id: 5, company: 'Umbrella', position: 'Java/Kotlin Dev', status: 'rejected', appliedAt: '2026-04-25' },
    { id: 6, company: 'Tyrell', position: 'Senior SWE', status: 'intdone', appliedAt: '2026-04-22' },
    { id: 7, company: 'Cyberdyne', position: 'JVM Engineer', status: 'taskrx', appliedAt: '2026-04-20' },
    { id: 8, company: 'OCP', position: 'Tech Lead', status: 'tasktx', appliedAt: '2026-04-18' },
    { id: 9, company: 'Soylent', position: 'Senior Backend', status: 'ghosted', appliedAt: '2026-04-15' },
    { id: 10, company: 'Massive Dynamic', position: 'Staff Engineer', status: 'withdraw', appliedAt: '2026-04-10' },
  ];

  // AG Grid handles sort + pagination internally; rows() drives its dataset.
  protected readonly rows = computed(() => this.allRows);

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
    this.submitted.set(this.formValue());
    this.toast.success('Aplikacja zapisana lokalnie');
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

  protected confirmDeleteById(id: number): void {
    const row = this.allRows.find((r) => r.id === id);
    if (!row) return;
    this.confirmDelete(row);
  }

  protected confirmDelete(row: ApplicationRow): void {
    const ref = this.modal.open<ConfirmModal, boolean>(ConfirmModal, {
      data: {
        title: `Usunąć ${row.company}?`,
        message: `Aplikacja "${row.position}" zostanie usunięta z lokalnego stanu (demo).`,
        confirmText: 'Usuń',
        cancelText: 'Anuluj',
      },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.toast.error(`Usunięto aplikację ${row.company}`);
    });
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
