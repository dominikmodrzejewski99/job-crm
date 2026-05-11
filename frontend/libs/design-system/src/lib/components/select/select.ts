import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

export interface DsOptionLike<T = unknown> {
  value: T;
  label: string;
}

@Component({
  selector: 'ds-option',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  styles: [':host { display: none; }'],
})
export class DsOption<T = unknown> {
  readonly value = input.required<T>();
  /** Optional display label override; defaults to the projected text. */
  readonly label = input<string>('');

  private readonly host = inject(ElementRef<HTMLElement>);

  getLabel(): string {
    return this.label() || this.host.nativeElement.textContent?.trim() || '';
  }
}

let nextId = 0;

@Component({
  selector: 'ds-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './select.html',
  styleUrl: './select.scss',
  host: { class: 'ds-field' },
})
export class DsSelect<T = unknown> implements ControlValueAccessor {
  /** Two-way bound selected value. */
  readonly value = model<T | null>(null);

  readonly label = input<string>('');
  readonly placeholder = input<string>('Wybierz…');
  readonly helperText = input<string>('');
  readonly errorText = input<string>('');
  readonly disabled = input(false, { transform: (v: boolean | string) => v === '' || v === true });
  readonly errorOverride = input<boolean | null>(null, { alias: 'error' });

  readonly options = contentChildren(DsOption);

  @ViewChild('panel', { static: true }) private readonly panelTemplate!: TemplateRef<unknown>;
  @ViewChild('trigger', { static: true }) private readonly trigger!: ElementRef<HTMLElement>;

  private readonly overlay = inject(Overlay);
  private readonly vcr = inject(ViewContainerRef);
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  protected readonly inputId = `ds-select-${++nextId}`;
  protected readonly isOpen = signal(false);
  protected readonly disabledFromForm = signal(false);

  private overlayRef: OverlayRef | null = null;
  private onChange: (v: T | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private writingFromFormApi = false;

  protected readonly showError = computed(() => {
    const override = this.errorOverride();
    if (override !== null) return override;
    const ctrl = this.ngControl?.control;
    if (!ctrl) return false;
    return ctrl.invalid && (ctrl.touched || ctrl.dirty);
  });

  protected readonly displayLabel = computed(() => {
    const v = this.value();
    if (v === null || v === undefined) return '';
    const match = this.options().find((opt) => opt.value() === v);
    return match?.getLabel() ?? String(v);
  });

  protected readonly isDisabled = computed(() => this.disabled() || this.disabledFromForm());

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    effect(() => {
      const v = this.value();
      if (!this.writingFromFormApi) {
        this.onChange(v);
      }
    });
  }

  writeValue(value: unknown): void {
    this.writingFromFormApi = true;
    this.value.set(value as T | null);
    queueMicrotask(() => { this.writingFromFormApi = false; });
  }

  registerOnChange(fn: (v: T | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabledFromForm.set(d); }

  protected toggle(): void {
    if (this.isDisabled()) return;
    this.isOpen() ? this.close() : this.open();
  }

  protected select(option: DsOption<T>): void {
    this.value.set(option.value());
    this.close();
  }

  protected isSelected(opt: DsOption<T>): boolean {
    return opt.value() === this.value();
  }

  private open(): void {
    if (this.isOpen()) return;
    const triggerEl = this.trigger.nativeElement;
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(triggerEl)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      minWidth: triggerEl.clientWidth,
    });
    this.overlayRef.backdropClick().subscribe(() => this.close());
    this.overlayRef.keydownEvents().subscribe((e) => {
      if (e.key === 'Escape') this.close();
    });

    const portal = new TemplatePortal(this.panelTemplate, this.vcr);
    this.overlayRef.attach(portal);
    this.isOpen.set(true);
  }

  private close(): void {
    if (!this.isOpen()) return;
    this.overlayRef?.detach();
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.isOpen.set(false);
    this.onTouched();
  }
}
