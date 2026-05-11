import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DsSortHeader, DsSortState, DsTable } from './table';

@Component({
  imports: [DsTable, DsSortHeader],
  template: `
    <table ds-table>
      <thead>
        <tr>
          <th ds-sort-header="company" [(sort)]="sort">Firma</th>
          <th ds-sort-header="appliedAt" [(sort)]="sort">Aplikowano</th>
        </tr>
      </thead>
      <tbody><tr><td>x</td><td>y</td></tr></tbody>
    </table>
  `,
})
class Host {
  readonly sort = signal<DsSortState>({ column: null, direction: 'asc' });
}

describe('DsSortHeader', () => {
  it('cycles unsorted → asc → desc → unsorted on click', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const company = fixture.nativeElement.querySelector('th[ds-sort-header="company"]') as HTMLElement;

    company.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.sort()).toEqual({ column: 'company', direction: 'asc' });
    expect(company.getAttribute('aria-sort')).toBe('ascending');

    company.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.sort()).toEqual({ column: 'company', direction: 'desc' });

    company.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.sort().column).toBeNull();
    expect(company.getAttribute('aria-sort')).toBe('none');
  });

  it('switches the active column when a different header is clicked', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.sort.set({ column: 'company', direction: 'desc' });
    fixture.detectChanges();

    const applied = fixture.nativeElement.querySelector('th[ds-sort-header="appliedAt"]') as HTMLElement;
    applied.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.sort()).toEqual({ column: 'appliedAt', direction: 'asc' });
  });
});
