import { CdkTrapFocus } from '@angular/cdk/a11y';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, ComponentType } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  InjectionToken,
  Injector,
  Type,
  inject,
} from '@angular/core';
import { Subject } from 'rxjs';

export interface DsModalConfig<D = unknown> {
  data?: D;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  panelClass?: string;
}

export const DS_MODAL_DATA = new InjectionToken<unknown>('DS_MODAL_DATA');

/** Returned to the caller of DsModalService.open(). */
export class DsModalRef<TResult = unknown> {
  private readonly afterClosed$ = new Subject<TResult | undefined>();

  constructor(private readonly overlayRef: OverlayRef) {}

  close(result?: TResult): void {
    this.afterClosed$.next(result);
    this.afterClosed$.complete();
    this.overlayRef.dispose();
  }

  afterClosed() {
    return this.afterClosed$.asObservable();
  }
}

@Injectable({ providedIn: 'root' })
export class DsModalService {
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);

  open<TComponent, TResult = unknown, TData = unknown>(
    component: Type<TComponent>,
    config: DsModalConfig<TData> = {},
  ): DsModalRef<TResult> {
    const overlayConfig: OverlayConfig = {
      hasBackdrop: true,
      backdropClass: 'ds-modal-backdrop',
      panelClass: config.panelClass ?? 'ds-modal-panel',
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
      scrollStrategy: this.overlay.scrollStrategies.block(),
    };

    const overlayRef = this.overlay.create(overlayConfig);
    const modalRef = new DsModalRef<TResult>(overlayRef);

    if (config.closeOnBackdrop !== false) {
      overlayRef.backdropClick().subscribe(() => modalRef.close());
    }
    if (config.closeOnEscape !== false) {
      overlayRef.keydownEvents().subscribe((event) => {
        if (event.key === 'Escape') modalRef.close();
      });
    }

    const portalInjector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: DS_MODAL_DATA, useValue: config.data ?? null },
        { provide: DsModalRef, useValue: modalRef },
      ],
    });
    const portal = new ComponentPortal<TComponent>(component as ComponentType<TComponent>, null, portalInjector);
    overlayRef.attach(portal);

    return modalRef;
  }
}

/**
 * Optional structural wrapper for modal content. Provides header/body/footer
 * slots with the design system's modal styling.
 */
@Component({
  selector: 'ds-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CdkTrapFocus,
      inputs: ['cdkTrapFocusAutoCapture: cdkTrapFocusAutoCapture'],
    },
  ],
  template: `
    <div class="ds-modal__header">
      <ng-content select="[ds-modal-title]" />
    </div>
    <div class="ds-modal__body">
      <ng-content />
    </div>
    <div class="ds-modal__footer">
      <ng-content select="[ds-modal-actions]" />
    </div>
  `,
  styleUrl: './modal.scss',
  host: {
    class: 'ds-modal',
    role: 'dialog',
    'aria-modal': 'true',
    cdkTrapFocus: 'true',
    cdkTrapFocusAutoCapture: 'true',
  },
})
export class DsModal {}
