import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

import { DsApplicationStatus, DsBadge } from '@frontend/design-system/badge';
import { DsAvatar } from '@frontend/design-system/avatar';
import { DsButton } from '@frontend/design-system/button';
import {
  DsMenu,
  DsMenuDivider,
  DsMenuItem,
  DsMenuTrigger,
} from '@frontend/design-system/menu';
import { DsTooltip } from '@frontend/design-system/tooltip';

interface RowCtx {
  delete?: (id: number) => void;
}

@Component({
  selector: 'grid-status-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsBadge],
  template: `<ds-badge [variant]="value()" dot>{{ value() }}</ds-badge>`,
})
export class GridStatusCell implements ICellRendererAngularComp {
  protected readonly value = signal<DsApplicationStatus>('draft');

  agInit(params: ICellRendererParams<unknown, DsApplicationStatus>): void {
    if (params.value) this.value.set(params.value);
  }

  refresh(params: ICellRendererParams<unknown, DsApplicationStatus>): boolean {
    if (params.value) this.value.set(params.value);
    return true;
  }
}

@Component({
  selector: 'grid-company-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsAvatar],
  template: `
    <div class="grid-company-cell">
      <ds-avatar size="sm" [initials]="initials()" [alt]="value()" />
      <span class="grid-company-cell__name">{{ value() }}</span>
    </div>
  `,
  styleUrl: './grid-renderers.scss',
})
export class GridCompanyCell implements ICellRendererAngularComp {
  protected readonly value = signal<string>('');
  protected readonly initials = signal<string>('?');

  agInit(params: ICellRendererParams<unknown, string>): void {
    this.assign(params.value ?? '');
  }

  refresh(params: ICellRendererParams<unknown, string>): boolean {
    this.assign(params.value ?? '');
    return true;
  }

  private assign(value: string): void {
    this.value.set(value);
    this.initials.set(value.trim().charAt(0).toUpperCase() || '?');
  }
}

@Component({
  selector: 'grid-actions-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsButton, DsMenu, DsMenuItem, DsMenuDivider, DsMenuTrigger, DsTooltip],
  template: `
    <button
      ds-button
      variant="ghost"
      size="sm"
      [dsMenuTrigger]="rowMenu"
      aria-label="Więcej akcji"
    >⋯</button>
    <ds-menu #rowMenu>
      <button ds-menu-item dsTooltip="Wyślij follow-up email">📧 Wyślij follow-up</button>
      <button ds-menu-item>📌 Snooze 3 dni</button>
      <hr ds-menu-divider />
      <button ds-menu-item class="is-danger" (click)="delete()">🗑 Usuń aplikację</button>
    </ds-menu>
  `,
})
export class GridActionsCell implements ICellRendererAngularComp {
  private rowId = 0;
  private context: RowCtx = {};

  agInit(params: ICellRendererParams<{ id: number }> & { context?: RowCtx }): void {
    this.rowId = params.data?.id ?? 0;
    this.context = (params.context ?? {}) as RowCtx;
  }

  refresh(params: ICellRendererParams<{ id: number }> & { context?: RowCtx }): boolean {
    this.rowId = params.data?.id ?? 0;
    this.context = (params.context ?? {}) as RowCtx;
    return true;
  }

  protected delete(): void {
    this.context.delete?.(this.rowId);
  }
}
