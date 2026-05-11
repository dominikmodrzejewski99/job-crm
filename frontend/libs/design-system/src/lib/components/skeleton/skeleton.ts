import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ds-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  styleUrl: './skeleton.scss',
  host: {
    class: 'ds-skeleton',
    'aria-hidden': 'true',
    '[style.width]': 'width()',
    '[style.height]': 'height()',
    '[style.border-radius]': 'rounded() ? "999px" : null',
  },
})
export class DsSkeleton {
  readonly width = input<string | null>(null);
  readonly height = input<string | null>(null);
  readonly rounded = input(false, { transform: (v: boolean | string) => v === '' || v === true });
}
