import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type DsStatDeltaTone = 'positive' | 'negative' | 'neutral';

@Component({
  selector: 'ds-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ds-stat-card__label">{{ label() }}</div>
    <div class="ds-stat-card__value">{{ value() }}</div>
    @if (delta()) {
      <div [class]="deltaClasses()">
        <ng-content select="[ds-stat-icon]" />
        <span>{{ delta() }}</span>
      </div>
    }
  `,
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
