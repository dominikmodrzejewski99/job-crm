import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

@Component({
  selector: 'ds-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.scss',
  host: {
    class: 'ds-checkbox',
    role: 'checkbox',
    tabindex: '0',
    '[attr.aria-checked]': 'ariaChecked()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[class.is-disabled]': 'disabled()',
    '(click)': 'toggle()',
    '(keydown.space)': 'toggle($event)',
    '(keydown.enter)': 'toggle($event)',
    '(blur)': 'onBlur()',
  },
})
export class DsCheckbox implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly indeterminate = input(false, { transform: (v: boolean | string) => v === '' || v === true });

  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  protected readonly checked = signal(false);
  protected readonly disabled = signal(false);

  protected readonly ariaChecked = computed(() => {
    if (this.indeterminate()) return 'mixed';
    return this.checked() ? 'true' : 'false';
  });

  private onChange: (value: boolean) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  writeValue(value: unknown): void {
    this.checked.set(value === true);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected toggle(event?: Event): void {
    if (this.disabled()) return;
    event?.preventDefault();
    const next = !this.checked();
    this.checked.set(next);
    this.onChange(next);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
