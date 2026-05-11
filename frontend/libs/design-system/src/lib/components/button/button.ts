import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type DsButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type DsButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'button[ds-button]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="ds-btn-content">
      <ng-content />
    </span>
    @if (loading()) {
      <span class="ds-btn-spinner" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
             stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </span>
    }
  `,
  styleUrl: './button.scss',
  host: {
    '[class]': 'classes()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.disabled]': 'disabled() || loading() ? "" : null',
  },
})
export class DsButton {
  readonly variant = input<DsButtonVariant>('primary');
  readonly size = input<DsButtonSize>('md');
  readonly loading = input(false, { transform: (v: boolean | string) => v === '' || v === true });
  readonly disabled = input(false, { transform: (v: boolean | string) => v === '' || v === true });

  protected readonly classes = computed(() => {
    const parts = [`ds-btn-${this.variant()}`, `ds-btn-${this.size()}`];
    if (this.loading()) parts.push('is-loading');
    return parts.join(' ');
  });
}
