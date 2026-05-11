import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ds-empty',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ds-empty__icon">
      <ng-content select="[ds-empty-icon]" />
    </div>
    <h3 class="ds-empty__title">{{ title() }}</h3>
    @if (description()) {
      <p class="ds-empty__description">{{ description() }}</p>
    }
    <div class="ds-empty__actions">
      <ng-content select="[ds-empty-actions]" />
    </div>
  `,
  styleUrl: './empty.scss',
  host: { class: 'ds-empty' },
})
export class DsEmpty {
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
}
