import { Injectable, signal } from '@angular/core';

/**
 * Lets the active route component publish the title shown in the shell's
 * topbar. Pages call setTitle()/setSubtitle() from their constructor.
 */
@Injectable({ providedIn: 'root' })
export class PageTitleService {
  private readonly _title = signal('');
  private readonly _subtitle = signal<string | null>(null);

  readonly title = this._title.asReadonly();
  readonly subtitle = this._subtitle.asReadonly();

  setTitle(title: string, subtitle?: string | null): void {
    this._title.set(title);
    this._subtitle.set(subtitle ?? null);
  }
}
