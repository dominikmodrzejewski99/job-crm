import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  QueryList,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { DsRadio } from './radio';

let nextGroupId = 0;

@Component({
  selector: 'ds-radio-group',
  standalone: true,
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
export class DsRadioGroup implements ControlValueAccessor, AfterContentInit {
  readonly labelledBy = input<string | null>(null, { alias: 'aria-labelledby' });

  readonly name = `ds-radio-group-${++nextGroupId}`;

  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  protected readonly value = signal<unknown>(null);
  protected readonly disabled = signal(false);

  @ContentChildren(DsRadio, { descendants: true })
  private radios?: QueryList<DsRadio>;

  private onChange: (value: unknown) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngAfterContentInit(): void {
    this.syncRadios();
    this.radios?.changes.subscribe(() => this.syncRadios());
  }

  // ---- ControlValueAccessor ----
  writeValue(value: unknown): void {
    this.value.set(value);
    this.syncRadios();
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    this.syncRadios();
  }

  // ---- API consumed by DsRadio children ----
  select(value: unknown): void {
    if (this.disabled()) return;
    this.value.set(value);
    this.syncRadios();
    this.onChange(value);
    this.onTouched();
  }

  isSelected(value: unknown): boolean {
    return this.value() === value;
  }

  isDisabled(): boolean {
    return this.disabled();
  }

  private syncRadios(): void {
    this.radios?.forEach((radio) => radio.syncFromGroup());
  }
}
