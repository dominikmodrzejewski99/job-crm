import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ds-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="ds-spinner__svg"
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  `,
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
