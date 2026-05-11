import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import {
  DsApplicationStatus,
  DsAvatar,
  DsBadge,
  DsButton,
  DsCard,
  DsCardBody,
  DsCardFooter,
  DsCardHeader,
  DsChip,
  DsEmpty,
  DsSkeleton,
  DsSpinner,
  DsStatCard,
  ThemeService,
} from '@frontend/design-system';

interface PingResponse {
  status: string;
  service: string;
  timestamp: string;
}

interface StatusDemo {
  variant: DsApplicationStatus;
  label: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
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
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly http = inject(HttpClient);
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
}
