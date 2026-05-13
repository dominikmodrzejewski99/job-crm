import { Injectable, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';

const APP_NAME = 'JobTrack';

/**
 * Lets the active route component publish the title shown in the shell's
 * topbar. Pages call setTitle()/setSubtitle() from their constructor.
 *
 * Also updates document.title so the browser tab + screen-reader page
 * announcement match the in-app heading. RouteAnnouncerComponent reads
 * the same signal and pushes it into a polite live region for SPA route
 * changes (Angular Router doesn't announce navigation natively).
 */
@Injectable({ providedIn: 'root' })
export class PageTitleService {
  private readonly browserTitle = inject(Title);
  private readonly _title = signal('');
  private readonly _subtitle = signal<string | null>(null);

  readonly title = this._title.asReadonly();
  readonly subtitle = this._subtitle.asReadonly();

  setTitle(title: string, subtitle?: string | null): void {
    this._title.set(title);
    this._subtitle.set(subtitle ?? null);
    this.browserTitle.setTitle(title ? `${title} — ${APP_NAME}` : APP_NAME);
  }
}
