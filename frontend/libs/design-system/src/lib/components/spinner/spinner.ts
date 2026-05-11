import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ds-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './spinner.html',
  styleUrl: './spinner.scss',
  host: {
    class: 'ds-spinner',
    role: 'status',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class DsSpinner {
  readonly size = input<number>(16);
  readonly ariaLabel = input<string>('Ładowanie');
}
