import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
} from '@angular/core';

export type DsSortDirection = 'asc' | 'desc';

export interface DsSortState {
  column: string | null;
  direction: DsSortDirection;
}

/**
 * Styled wrapper for a native <table>. Compose with <thead>, <tbody>, etc.
 *
 *   <table ds-table>
 *     <thead>
 *       <tr>
 *         <th ds-sort-header="company" [(sort)]="sort">Firma</th>
 *       </tr>
 *     </thead>
 *     <tbody>
 *       <tr [attr.data-selected]="row.selected">...</tr>
 *     </tbody>
 *   </table>
 */
@Component({
  selector: 'table[ds-table]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styleUrl: './table.scss',
})
export class DsTable {}

/**
 * Sortable header cell. Two-way binds to a DsSortState shared across columns.
 * Click cycles: unsorted → asc → desc → unsorted.
 *
 *   <th ds-sort-header="company" [(sort)]="sort">Firma</th>
 */
@Component({
  selector: 'th[ds-sort-header]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
    <svg class="ds-sort-icon" width="11" height="11" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2.5"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      @if (isActive()) {
        <polyline points="6 9 12 15 18 9" />
      } @else {
        <polyline points="7 15 12 20 17 15" />
        <polyline points="7 9 12 4 17 9" />
      }
    </svg>
  `,
  styleUrls: ['./table.scss'],
  host: {
    '[attr.data-sort-active]': 'isActive()',
    '[attr.data-sort-direction]': 'isActive() ? sort().direction : null',
    '[attr.aria-sort]': 'ariaSort()',
    role: 'columnheader',
    tabindex: '0',
    '(click)': 'toggle()',
    '(keydown.enter)': 'toggle(); $event.preventDefault()',
    '(keydown.space)': 'toggle(); $event.preventDefault()',
  },
})
export class DsSortHeader {
  readonly column = input.required<string>({ alias: 'ds-sort-header' });

  /** Two-way bound shared sort state. */
  readonly sort = model<DsSortState>({ column: null, direction: 'asc' });

  readonly sortChange = output<DsSortState>();

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
