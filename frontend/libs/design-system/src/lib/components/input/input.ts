import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

let nextId = 0;

@Component({
  selector: 'ds-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './input.html',
  styleUrl: './input.scss',
  host: { class: 'ds-field' },
})
export class DsInput implements ControlValueAccessor {
  /** Two-way bound value. Use `[(value)]="mySignal"` for signal-based forms. */
  readonly value = model<string>('');

  readonly type = input<'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'>('text');
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly helperText = input<string>('');
  readonly errorText = input<string>('');
  readonly required = input(false, { transform: (v: boolean | string) => v === '' || v === true });
  readonly autocomplete = input<string | null>(null);
  readonly errorOverride = input<boolean | null>(null, { alias: 'error' });

  @ViewChild('control', { static: true }) private readonly inputEl!: ElementRef<HTMLInputElement>;

  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  protected readonly inputId = `ds-input-${++nextId}`;
  protected readonly helperId = `${this.inputId}-helper`;
  protected readonly errorId = `${this.inputId}-error`;

  protected readonly disabled = signal(false);
  protected readonly touched = signal(false);

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private writingFromFormApi = false;

  protected readonly showError = computed(() => {
    const override = this.errorOverride();
    if (override !== null) return override;
    const ctrl = this.ngControl?.control;
    if (!ctrl) return false;
    return ctrl.invalid && (ctrl.touched || ctrl.dirty);
  });

  protected readonly describedBy = computed(() => {
    if (this.showError() && this.errorText()) return this.errorId;
    if (this.helperText()) return this.helperId;
    return null;
  });

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    // Mirror the model signal into the native input and notify CVA.
    effect(() => {
      const v = this.value();
      const el = this.inputEl?.nativeElement;
      if (el && el.value !== v) {
        el.value = v;
      }
      if (!this.writingFromFormApi) {
        this.onChange(v);
      }
    });
  }

  // ---- ControlValueAccessor ----
  writeValue(value: unknown): void {
    this.writingFromFormApi = true;
    this.value.set(value == null ? '' : String(value));
    queueMicrotask(() => {
      this.writingFromFormApi = false;
    });
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  // ---- DOM handlers ----
  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }

  protected onBlur(): void {
    this.touched.set(true);
    this.onTouched();
  }
}
