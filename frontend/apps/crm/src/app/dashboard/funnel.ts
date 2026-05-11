import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface FunnelInput {
  applied: number;
  interview: number;
  offer: number;
}

interface Stage {
  key: 'applied' | 'interview' | 'offer';
  label: string;
  count: number;
  widthPct: number;
}

@Component({
  selector: 'dashboard-funnel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="funnel" role="img" aria-label="Lejek rekrutacji">
      @for (stage of stages(); track stage.key) {
        <div [class]="'funnel__stage funnel__stage--' + stage.key">
          <div class="funnel__label">
            <span class="funnel__label-name">{{ stage.label }}</span>
            <span class="funnel__label-count">{{ stage.count }}</span>
          </div>
          <div class="funnel__bar-wrap">
            <div class="funnel__bar" [style.width.%]="stage.widthPct">
              @if (stage.widthPct > 12) {
                {{ stage.count }} ({{ percent(stage.count) }}%)
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './funnel.scss',
})
export class DashboardFunnel {
  readonly data = input.required<FunnelInput>();

  protected readonly stages = computed<Stage[]>(() => {
    const d = this.data();
    const base = Math.max(d.applied, 1);
    return [
      { key: 'applied',   label: 'Applied',   count: d.applied,   widthPct: 100 },
      { key: 'interview', label: 'Interview', count: d.interview, widthPct: (d.interview / base) * 100 },
      { key: 'offer',     label: 'Offer',     count: d.offer,     widthPct: (d.offer / base) * 100 },
    ];
  });

  protected percent(count: number): number {
    const applied = this.data().applied || 1;
    return Math.round((count / applied) * 100);
  }
}
