import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ds-empty',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty.html',
  styleUrl: './empty.scss',
  host: { class: 'ds-empty' },
})
export class DsEmpty {
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
}
