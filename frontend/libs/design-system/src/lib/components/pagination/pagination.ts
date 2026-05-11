import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';

@Component({
  selector: 'ds-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
})
export class DsPagination {
  /** Two-way bound current page (1-indexed). */
  readonly page = model<number>(1);

  readonly total = input.required<number>();
  readonly perPage = input<number>(10);
  /** Max numeric buttons shown (excluding first/last/ellipsis). Should be odd. */
  readonly maxVisible = input<number>(5);
  readonly ariaLabel = input<string>('Paginacja');

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / Math.max(1, this.perPage()))),
  );

  protected readonly pages = computed<Array<number | '…'>>(() => {
    const last = this.totalPages();
    const current = this.page();
    const max = this.maxVisible();
    if (last <= max + 2) {
      return Array.from({ length: last }, (_, i) => i + 1);
    }

    const window = Math.floor(max / 2);
    let start = Math.max(2, current - window);
    let end = Math.min(last - 1, current + window);
    // Pad if near edges.
    if (end - start < max - 1) {
      if (start === 2) end = Math.min(last - 1, start + max - 1);
      else if (end === last - 1) start = Math.max(2, end - max + 1);
    }

    const out: Array<number | '…'> = [1];
    if (start > 2) out.push('…');
    for (let i = start; i <= end; i++) out.push(i);
    if (end < last - 1) out.push('…');
    out.push(last);
    return out;
  });

  protected goTo(target: number): void {
    const clamped = Math.min(this.totalPages(), Math.max(1, target));
    if (clamped !== this.page()) this.page.set(clamped);
  }
}
