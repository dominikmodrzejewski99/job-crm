import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

/**
 * Menu panel — wraps menu items and exposes the templateRef to a trigger.
 *
 *   <ds-menu #menu>
 *     <button ds-menu-item (click)="...">Item 1</button>
 *     <hr ds-menu-divider />
 *     <button ds-menu-item>Item 2</button>
 *   </ds-menu>
 *
 *   <button [dsMenuTrigger]="menu">Open</button>
 */
@Component({
  selector: 'ds-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template>
      <div class="ds-menu" role="menu">
        <ng-content />
      </div>
    </ng-template>
  `,
  styleUrl: './menu.scss',
})
export class DsMenu {
  @ViewChild(TemplateRef, { static: true }) templateRef!: TemplateRef<unknown>;
  readonly closed = output<void>();
}

@Component({
  selector: 'button[ds-menu-item], a[ds-menu-item]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styleUrls: ['./menu.scss'],
  host: {
    class: 'ds-menu__item',
    role: 'menuitem',
    type: 'button',
  },
})
export class DsMenuItem {}

@Component({
  selector: 'hr[ds-menu-divider]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  styleUrls: ['./menu.scss'],
  host: {
    class: 'ds-menu__divider',
    role: 'separator',
  },
})
export class DsMenuDivider {}

@Directive({
  selector: '[dsMenuTrigger]',
  host: {
    '(click)': 'toggle()',
    '[attr.aria-expanded]': 'isOpen()',
    '[attr.aria-haspopup]': '"menu"',
  },
})
export class DsMenuTrigger {
  readonly menu = input.required<DsMenu>({ alias: 'dsMenuTrigger' });

  private readonly overlay = inject(Overlay);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly vcr = inject(ViewContainerRef);

  protected readonly isOpen = signal(false);
  private overlayRef: OverlayRef | null = null;

  toggle(): void {
    this.isOpen() ? this.close() : this.open();
  }

  open(): void {
    if (this.isOpen()) return;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.host)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
    });

    this.overlayRef.backdropClick().subscribe(() => this.close());
    this.overlayRef.keydownEvents().subscribe((e) => {
      if (e.key === 'Escape') this.close();
    });

    const portal = new TemplatePortal(this.menu().templateRef, this.vcr);
    this.overlayRef.attach(portal);
    this.isOpen.set(true);

    // Close menu when any item is clicked.
    queueMicrotask(() => {
      const pane = this.overlayRef?.overlayElement;
      pane?.addEventListener('click', (ev) => {
        const target = ev.target as HTMLElement;
        if (target.closest('[ds-menu-item]')) this.close();
      });
    });
  }

  close(): void {
    if (!this.isOpen()) return;
    this.overlayRef?.detach();
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.isOpen.set(false);
    this.menu().closed.emit();
  }
}
