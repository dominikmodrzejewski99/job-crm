import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  Output,
  input,
} from '@angular/core';

@Component({
  selector: 'ds-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
    @if (removable()) {
      <button
        type="button"
        class="ds-chip__remove"
        [attr.aria-label]="removeAriaLabel()"
        (click)="remove.emit()"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>
    }
  `,
  styleUrl: './chip.scss',
  host: {
    '[class]': 'classes()',
  },
})
export class DsChip {
  readonly removable = input(false, {
    transform: (v: boolean | string) => v === '' || v === true,
  });
  readonly removeAriaLabel = input<string>('Usuń');

  @Output() readonly remove = new EventEmitter<void>();

  protected readonly classes = computed(() =>
    this.removable() ? 'ds-chip' : 'ds-chip ds-chip--no-close',
  );
}
