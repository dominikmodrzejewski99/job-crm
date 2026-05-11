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
import { DsRadio, DsRadioGroup } from '@frontend/design-system/radio';
import { DsSkeleton } from '@frontend/design-system/skeleton';
import { DsSpinner } from '@frontend/design-system/spinner';
import { DsStatCard } from '@frontend/design-system/stat-card';
import { DsSwitch } from '@frontend/design-system/switch';
import { DsTextarea } from '@frontend/design-system/textarea';
import { ThemeService } from '@frontend/design-system/theme';

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

@Component({
  selector: 'app-root',
  standalone: true,
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
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly http = inject(HttpClient);
  protected readonly themeService = inject(ThemeService);

  // ---- Backend ping ----
  protected readonly ping = signal<PingResponse | null>(null);
  protected readonly pingError = signal<string | null>(null);
  protected readonly pingLoading = signal(false);

  // ---- Demo data ----
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

  // ---- Form state — pure signals, no FormBuilder, no FormGroup ----
  protected readonly company = signal('');
  protected readonly position = signal('');
  protected readonly notes = signal('');
  protected readonly source = signal<Source>('justjoin');
  protected readonly remote = signal(true);
  protected readonly notifyByEmail = signal(false);
  protected readonly attemptedSubmit = signal(false);

  // Per-field validators as computed signals.
  protected readonly companyError = computed(() => {
    if (!this.attemptedSubmit() && !this.company()) return false;
    const v = this.company().trim();
    return v.length < 2;
  });

  protected readonly positionError = computed(() => {
    if (!this.attemptedSubmit() && !this.position()) return false;
    return this.position().trim().length === 0;
  });

  protected readonly formValid = computed(
    () => this.company().trim().length >= 2 && this.position().trim().length > 0,
  );

  // Live snapshot of the whole form — composed from individual signals.
  protected readonly formValue = computed(() => ({
    company: this.company(),
    position: this.position(),
    notes: this.notes(),
    source: this.source(),
    remote: this.remote(),
    notifyByEmail: this.notifyByEmail(),
  }));

  protected readonly submitted = signal<unknown | null>(null);

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
      });
  }

  protected removeTag(tag: string): void {
    this.tags.update((list) => list.filter((t) => t !== tag));
  }

  protected submit(): void {
    this.attemptedSubmit.set(true);
    if (!this.formValid()) return;
    this.submitted.set(this.formValue());
  }

  protected reset(): void {
    this.company.set('');
    this.position.set('');
    this.notes.set('');
    this.source.set('justjoin');
    this.remote.set(true);
    this.notifyByEmail.set(false);
    this.attemptedSubmit.set(false);
    this.submitted.set(null);
  }
}
