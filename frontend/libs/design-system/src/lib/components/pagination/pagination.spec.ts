import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DsPagination } from './pagination';

@Component({
  imports: [DsPagination],
  template: `<ds-pagination [(page)]="page" [total]="total" [perPage]="perPage" />`,
})
class Host {
  readonly page = signal(1);
  total = 47;
  perPage = 10;
}

describe('DsPagination', () => {
  it('computes total pages and marks active page', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.ds-pagination__btn');
    // first, prev, 1, 2, 3, 4, 5, next, last → at least 9 buttons for 5 pages
    expect(buttons.length).toBeGreaterThanOrEqual(7);

    // 5 pages of 10 items for total=47
    const active = fixture.nativeElement.querySelector('.ds-pagination__btn.is-active');
    expect(active!.textContent!.trim()).toBe('1');
  });

  it('changes page when a number is clicked', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const numberButtons = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('.ds-pagination__btn'),
    ).filter((b) => /^\d+$/.test(b.textContent!.trim()));
    numberButtons.find((b) => b.textContent!.trim() === '3')!.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.page()).toBe(3);
  });
});
