import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type DsStatDeltaTone = 'positive' | 'negative' | 'neutral';

@Component({
  selector: 'ds-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
  host: { class: 'ds-stat-card' },
})
export class DsStatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly delta = input<string | null>(null);
  readonly deltaTone = input<DsStatDeltaTone>('neutral');

  protected readonly deltaClasses = computed(
    () => `ds-stat-card__delta ds-stat-card__delta--${this.deltaTone()}`,
  );
}
