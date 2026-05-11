import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
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
  selector: 'ds-textarea',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './textarea.html',
  styleUrl: './textarea.scss',
  host: { class: 'ds-field' },
})
export class DsTextarea implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly helperText = input<string>('');
  readonly errorText = input<string>('');
  readonly required = input(false, { transform: (v: boolean | string) => v === '' || v === true });
  readonly rows = input<number>(4);
  readonly errorOverride = input<boolean | null>(null, { alias: 'error' });

  @ViewChild('control', { static: true }) private readonly inputEl!: ElementRef<HTMLTextAreaElement>;

  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  protected readonly inputId = `ds-textarea-${++nextId}`;
  protected readonly helperId = `${this.inputId}-helper`;
  protected readonly errorId = `${this.inputId}-error`;

  protected readonly disabled = signal(false);

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

  protected onInput(event: Event): void {
    this.onChange((event.target as HTMLTextAreaElement).value);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
