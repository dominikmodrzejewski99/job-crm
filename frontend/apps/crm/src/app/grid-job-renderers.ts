import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

import { DsButton } from '@frontend/design-system/button';

import { JobBoardSource, JobOffer } from './api/job-offer-types';

interface JobOfferCtx {
  save?: (id: string) => void;
}

@Component({
  selector: 'grid-salary-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (display()) {
      <span class="salary-cell">
        {{ display() }}
        @if (currency()) {
          <span class="salary-cell__currency">{{ currency() }}</span>
        }
      </span>
    } @else {
      <span class="text-3">—</span>
    }
  `,
  styleUrl: './grid-job-renderers.scss',
})
export class GridSalaryCell implements ICellRendererAngularComp {
  protected readonly min = signal<number | null>(null);
  protected readonly max = signal<number | null>(null);
  protected readonly currency = signal<string | null>(null);

  protected readonly display = computed<string | null>(() => {
    const lo = this.min();
    const hi = this.max();
    if (lo == null && hi == null) return null;
    if (lo != null && hi != null) return `${fmt(lo)} – ${fmt(hi)}`;
    return fmt(lo ?? hi ?? 0);
  });

  agInit(params: ICellRendererParams<JobOffer>): void {
    this.assign(params.data ?? null);
  }

  refresh(params: ICellRendererParams<JobOffer>): boolean {
    this.assign(params.data ?? null);
    return true;
  }

  private assign(row: JobOffer | null): void {
    this.min.set(row?.salaryMin ?? null);
    this.max.set(row?.salaryMax ?? null);
    this.currency.set(row?.currency ?? null);
  }
}

function fmt(value: number): string {
  return new Intl.NumberFormat('pl-PL').format(value);
}

@Component({
  selector: 'grid-source-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="cssClass()">{{ label() }}</span>`,
  styleUrl: './grid-job-renderers.scss',
})
export class GridSourceCell implements ICellRendererAngularComp {
  protected readonly value = signal<JobBoardSource>('JUSTJOIN');

  protected readonly label = computed(() =>
    this.value() === 'JUSTJOIN' ? 'JustJoinIT' : 'NoFluffJobs',
  );

  protected readonly cssClass = computed(() =>
    this.value() === 'JUSTJOIN'
      ? 'source-pill source-pill--justjoin'
      : 'source-pill source-pill--nofluff',
  );

  agInit(params: ICellRendererParams<unknown, JobBoardSource>): void {
    if (params.value) this.value.set(params.value);
  }

  refresh(params: ICellRendererParams<unknown, JobBoardSource>): boolean {
    if (params.value) this.value.set(params.value);
    return true;
  }
}

@Component({
  selector: 'grid-save-offer-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsButton],
  template: `<button ds-button variant="primary" size="sm" (click)="save()">Zapisz</button>`,
})
export class GridSaveOfferCell implements ICellRendererAngularComp {
  private rowId = '';
  private context: JobOfferCtx = {};

  agInit(params: ICellRendererParams<{ id: string }> & { context?: JobOfferCtx }): void {
    this.rowId = params.data?.id ?? '';
    this.context = (params.context ?? {}) as JobOfferCtx;
  }

  refresh(params: ICellRendererParams<{ id: string }> & { context?: JobOfferCtx }): boolean {
    this.rowId = params.data?.id ?? '';
    this.context = (params.context ?? {}) as JobOfferCtx;
    return true;
  }

  protected save(): void {
    this.context.save?.(this.rowId);
  }
}
