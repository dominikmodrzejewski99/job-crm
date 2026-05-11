import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  computed,
  input,
  model,
} from '@angular/core';

export type DsSortDirection = 'asc' | 'desc';

export interface DsSortState {
  column: string | null;
  direction: DsSortDirection;
}

/**
 * Styled <table> wrapper. Consumers compose with native <thead>, <tbody>, etc.
 *
 *   <table ds-table>
 *     <thead>
 *       <tr>
 *         <th ds-sort-header="company" [(sort)]="sort">Firma</th>
 *       </tr>
 *     </thead>
 *     <tbody>...</tbody>
 *   </table>
 */
@Component({
  selector: 'table[ds-table]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styleUrl: './table.scss',
})
export class DsTable {}

/**
 * Attribute selector for sortable header cells. Two-way binds to a DsSortState.
 * Clicking the header cycles asc → desc → unset.
 */
@Component({
  selector: 'th[ds-sort-header]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
    <svg class="ds-sort-icon" width="11" height="11" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2.5"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  `,
  styleUrls: ['./table.scss'],
  host: {
    '[attr.data-sort-active]': 'isActive()',
    '[attr.data-sort-direction]': 'isActive() ? sort().direction : null',
    '[attr.aria-sort]': 'ariaSort()',
    role: 'columnheader',
    '(click)': 'toggle()',
  },
})
export class DsSortHeader {
  readonly column = input.required<string>({ alias: 'ds-sort-header' });

  /** Two-way bound shared sort state. */
  readonly sort = model<DsSortState>({ column: null, direction: 'asc' });

  @Output() readonly sortChange = new EventEmitter<DsSortState>();

  protected readonly isActive = computed(() => this.sort().column === this.column());

  protected readonly ariaSort = computed(() => {
    if (!this.isActive()) return 'none';
    return this.sort().direction === 'asc' ? 'ascending' : 'descending';
  });

  protected toggle(): void {
    const current = this.sort();
    let next: DsSortState;
    if (current.column !== this.column()) {
      next = { column: this.column(), direction: 'asc' };
    } else if (current.direction === 'asc') {
      next = { column: this.column(), direction: 'desc' };
    } else {
      next = { column: null, direction: 'asc' };
    }
    this.sort.set(next);
    this.sortChange.emit(next);
  }
}
