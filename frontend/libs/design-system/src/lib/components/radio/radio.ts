import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { DsRadioGroup } from './radio-group';

@Component({
  selector: 'ds-radio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './radio.html',
  styleUrl: './radio.scss',
  host: {
    class: 'ds-radio',
    role: 'radio',
    tabindex: '0',
    '[attr.aria-checked]': 'selected() ? "true" : "false"',
    '[attr.aria-disabled]': 'disabled() || null',
    '[class.is-selected]': 'selected()',
    '[class.is-disabled]': 'disabled()',
    '(click)': 'select($event)',
    '(keydown.space)': 'select($event)',
    '(keydown.enter)': 'select($event)',
  },
})
export class DsRadio {
  readonly value = input.required<unknown>();
  readonly label = input<string>('');

  private readonly group = inject(forwardRef(() => DsRadioGroup), { optional: true });

  protected readonly selectedInternal = signal(false);

  protected readonly selected = computed(() => {
    if (this.group) return this.group.isSelected(this.value());
    return this.selectedInternal();
  });

  protected readonly disabled = computed(() => this.group?.isDisabled() ?? false);

  protected select(event?: Event): void {
    if (this.disabled()) return;
    event?.preventDefault();
    if (this.group) {
      this.group.select(this.value());
    } else {
      this.selectedInternal.set(true);
    }
  }

  /** Called by the parent group after value changes to trigger CD. */
  syncFromGroup(): void {
    // Just a hook — computed `selected` will re-run when group state changes
    // and Angular signal graph propagates it. This method exists so the parent
    // can imperatively poke each child after writeValue.
    this.selectedInternal.set(this.selected());
  }
}
