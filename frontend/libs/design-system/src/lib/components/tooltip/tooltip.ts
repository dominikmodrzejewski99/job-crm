import { Overlay, OverlayRef, ConnectedPosition } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';

export type DsTooltipPosition = 'top' | 'bottom' | 'left' | 'right';

@Component({
  selector: 'ds-tooltip-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ text }}`,
  styleUrl: './tooltip.scss',
  host: { class: 'ds-tooltip', role: 'tooltip' },
})
export class DsTooltipHost {
  text = '';
}

@Directive({
  selector: '[dsTooltip]',
  standalone: true,
  exportAs: 'dsTooltip',
  host: {
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(focus)': 'show()',
    '(blur)': 'hide()',
  },
})
export class DsTooltip {
  readonly text = input.required<string>({ alias: 'dsTooltip' });
  readonly position = input<DsTooltipPosition>('top', { alias: 'dsTooltipPosition' });
  readonly delay = input<number>(150, { alias: 'dsTooltipDelay' });

  private readonly overlay = inject(Overlay);
  private readonly host = inject(ElementRef<HTMLElement>);

  private overlayRef: OverlayRef | null = null;
  private showTimer: ReturnType<typeof setTimeout> | null = null;

  protected show(): void {
    if (this.showTimer) return;
    this.showTimer = setTimeout(() => this.create(), this.delay());
  }

  protected hide(): void {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
    this.overlayRef?.detach();
  }

  private create(): void {
    this.showTimer = null;
    if (this.overlayRef?.hasAttached()) return;

    if (!this.overlayRef) {
      const positionStrategy = this.overlay
        .position()
        .flexibleConnectedTo(this.host)
        .withPositions(this.positions())
        .withPush(true);

      this.overlayRef = this.overlay.create({
        positionStrategy,
        scrollStrategy: this.overlay.scrollStrategies.reposition(),
        panelClass: 'ds-tooltip-panel',
      });
    }

    const portal = new ComponentPortal(DsTooltipHost);
    const ref = this.overlayRef.attach(portal);
    ref.instance.text = this.text();
  }

  private positions(): ConnectedPosition[] {
    const offset = 8;
    switch (this.position()) {
      case 'bottom':
        return [{ originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: offset }];
      case 'left':
        return [{ originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -offset }];
      case 'right':
        return [{ originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: offset }];
      case 'top':
      default:
        return [{ originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -offset }];
    }
  }
}
