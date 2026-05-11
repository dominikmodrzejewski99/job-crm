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
  templateUrl: './chip.html',
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
