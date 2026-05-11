import {
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  effect,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { DsRadio } from './radio';

let nextGroupId = 0;

@Component({
  selector: 'ds-radio-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'ds-radio-group',
    role: 'radiogroup',
    '[attr.aria-labelledby]': 'labelledBy()',
  },
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
    `,
  ],
})
export class DsRadioGroup implements ControlValueAccessor {
  /** Two-way bound selected value. Use `[(value)]="mySignal"`. */
  readonly value = model<unknown>(null);

  readonly labelledBy = input<string | null>(null, { alias: 'aria-labelledby' });

  readonly name = `ds-radio-group-${++nextGroupId}`;

  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  protected readonly disabled = signal(false);

  // Signal-based content query — handles forward references between
  // ds-radio (child) and ds-radio-group (parent) without circular DI issues.
  protected readonly radios = contentChildren(forwardRef(() => DsRadio), { descendants: true });

  private onChange: (value: unknown) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private writingFromFormApi = false;

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    effect(() => {
      const v = this.value();
      // Mark every child stale so isSelected() computed re-evaluates.
      this.radios().forEach((r) => r.syncFromGroup());
      if (!this.writingFromFormApi) {
        this.onChange(v);
      }
    });
  }

  writeValue(value: unknown): void {
    this.writingFromFormApi = true;
    this.value.set(value);
    queueMicrotask(() => {
      this.writingFromFormApi = false;
    });
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  // ---- API consumed by DsRadio children ----
  select(value: unknown): void {
    if (this.disabled()) return;
    this.value.set(value);
    this.onTouched();
  }

  isSelected(value: unknown): boolean {
    return this.value() === value;
  }

  isDisabled(): boolean {
    return this.disabled();
  }
}
