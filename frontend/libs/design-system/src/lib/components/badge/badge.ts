import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type DsApplicationStatus =
  | 'draft'
  | 'applied'
  | 'ack'
  | 'intsch'
  | 'intdone'
  | 'taskrx'
  | 'tasktx'
  | 'offer'
  | 'rejected'
  | 'withdraw'
  | 'ghosted';

export type DsBadgeVariant =
  | DsApplicationStatus
  | 'neutral'
  | 'outline'
  | 'solid-success'
  | 'solid-warning'
  | 'solid-danger'
  | 'solid-info'
  | 'solid-brand';

@Component({
  selector: 'ds-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
  host: {
    '[class]': 'classes()',
    role: 'status',
  },
})
export class DsBadge {
  readonly variant = input<DsBadgeVariant>('neutral');
  readonly dot = input(false, { transform: (v: boolean | string) => v === '' || v === true });

  protected readonly classes = computed(() => `ds-badge ds-badge--${this.variant()}`);
}
