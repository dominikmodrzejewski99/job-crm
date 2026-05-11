import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

@Component({
  selector: 'ds-switch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './switch.html',
  styleUrl: './switch.scss',
  host: {
    class: 'ds-switch',
    role: 'switch',
    tabindex: '0',
    '[attr.aria-checked]': 'checked() ? "true" : "false"',
    '[attr.aria-disabled]': 'disabled() || null',
    '[class.is-checked]': 'checked()',
    '[class.is-disabled]': 'disabled()',
    '(click)': 'toggle()',
    '(keydown.space)': 'toggle($event)',
    '(keydown.enter)': 'toggle($event)',
    '(blur)': 'onBlur()',
  },
})
export class DsSwitch implements ControlValueAccessor {
  readonly label = input<string>('');

  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  protected readonly checked = signal(false);
  protected readonly disabled = signal(false);

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
