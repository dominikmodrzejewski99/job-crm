import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';

export type DsToastVariant = 'success' | 'info' | 'warning' | 'error';

export interface DsToastOptions {
  title?: string;
  message: string;
  variant?: DsToastVariant;
  /** Milliseconds before auto-dismiss; 0 = sticky. */
  duration?: number;
}

interface ActiveToast extends DsToastOptions {
  id: number;
}

@Component({
  selector: 'ds-toast-stack',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (toast of items(); track toast.id) {
      <div [class]="toastClass(toast)" role="status" [attr.aria-live]="ariaLive(toast)">
        <svg class="ds-toast__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          @switch (toast.variant) {
            @case ('success') { <polyline points="20 6 9 17 4 12" /> }
            @case ('warning') { <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /> }
            @case ('error')   { <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /> }
            @default          { <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /> }
          }
        </svg>
        <div class="ds-toast__body">
          @if (toast.title) { <div class="ds-toast__title">{{ toast.title }}</div> }
          <div class="ds-toast__message">{{ toast.message }}</div>
        </div>
        <button type="button" class="ds-toast__close" aria-label="Zamknij" (click)="dismiss(toast.id)">×</button>
      </div>
    }
  `,
  styleUrl: './toast.scss',
  host: { class: 'ds-toast-stack' },
})
export class DsToastStack {
  private readonly toastService = inject(DsToastService);
  protected readonly items = this.toastService.toasts;

  protected toastClass(toast: ActiveToast): string {
    return `ds-toast ds-toast--${toast.variant ?? 'info'}`;
  }

  protected ariaLive(toast: ActiveToast): 'polite' | 'assertive' {
    return toast.variant === 'error' || toast.variant === 'warning' ? 'assertive' : 'polite';
  }

  protected dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}

@Injectable({ providedIn: 'root' })
export class DsToastService {
  private readonly overlay = inject(Overlay);

  private overlayRef: OverlayRef | null = null;
  private nextId = 1;

  readonly toasts = signal<ActiveToast[]>([]);

  show(opts: DsToastOptions): number {
    this.ensureHost();
    const id = this.nextId++;
    const toast: ActiveToast = { id, duration: 4000, variant: 'info', ...opts };
    this.toasts.update((list) => [...list, toast]);

    if (toast.duration && toast.duration > 0) {
      setTimeout(() => this.dismiss(id), toast.duration);
    }
    return id;
  }

  success(message: string, title?: string): number { return this.show({ message, title, variant: 'success' }); }
  info(message: string, title?: string): number    { return this.show({ message, title, variant: 'info' }); }
  warning(message: string, title?: string): number { return this.show({ message, title, variant: 'warning' }); }
  error(message: string, title?: string): number   { return this.show({ message, title, variant: 'error' }); }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private ensureHost(): void {
    if (this.overlayRef) return;
    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay.position().global().top('16px').right('16px'),
      hasBackdrop: false,
      panelClass: 'ds-toast-overlay',
    });
    const portal = new ComponentPortal(DsToastStack);
    this.overlayRef.attach(portal);
  }
}
