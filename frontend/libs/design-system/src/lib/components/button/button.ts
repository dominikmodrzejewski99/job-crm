import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type DsButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type DsButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'button[ds-button]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.html',
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
