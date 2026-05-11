import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Optional,
  ViewChild,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

let nextId = 0;

@Component({
  selector: 'ds-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './input.html',
  styleUrl: './input.scss',
  host: { class: 'ds-field' },
})
export class DsInput implements ControlValueAccessor {
  readonly type = input<'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'>('text');
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly helperText = input<string>('');
  readonly errorText = input<string>('');
  readonly required = input(false, { transform: (v: boolean | string) => v === '' || v === true });
  readonly autocomplete = input<string | null>(null);
  readonly errorOverride = input<boolean | null>(null, { alias: 'error' });

  @ViewChild('control', { static: true }) private readonly inputEl!: ElementRef<HTMLInputElement>;

  // Wired to NgControl in the constructor below.
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  protected readonly inputId = `ds-input-${++nextId}`;
  protected readonly helperId = `${this.inputId}-helper`;
  protected readonly errorId = `${this.inputId}-error`;

  protected readonly disabled = signal(false);
  private readonly touched = signal(false);

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

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
  }

  // ---- ControlValueAccessor ----
  writeValue(value: unknown): void {
    afterNextRender(() => {
      if (this.inputEl?.nativeElement) {
        this.inputEl.nativeElement.value = value == null ? '' : String(value);
      }
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
    const value = (event.target as HTMLInputElement).value;
    this.onChange(value);
  }

  protected onBlur(): void {
    this.touched.set(true);
    this.onTouched();
  }
}
