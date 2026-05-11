import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import { DsButton, ThemeService } from '@frontend/design-system';

interface PingResponse {
  status: string;
  service: string;
  timestamp: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, DsButton],
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
}
