import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DsStatCard, DsStatDeltaTone } from './stat-card';

@Component({
  imports: [DsStatCard],
  template: `<ds-stat-card [label]="label()" [value]="value()" [delta]="delta()" [deltaTone]="tone()" />`,
})
class Host {
  readonly label = signal('Active apps');
  readonly value = signal<string | number>(47);
  readonly delta = signal<string | null>('+12% / 7d');
  readonly tone = signal<DsStatDeltaTone>('positive');
}

describe('DsStatCard', () => {
  it('renders label, value and delta with the correct tone class', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.ds-stat-card__label')!.textContent).toContain('Active apps');
    expect(host.querySelector('.ds-stat-card__value')!.textContent).toContain('47');

    const delta = host.querySelector('.ds-stat-card__delta')!;
    expect(delta.className).toContain('ds-stat-card__delta--positive');
    expect(delta.textContent).toContain('+12% / 7d');
  });

  it('omits delta when not provided', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.delta.set(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ds-stat-card__delta')).toBeNull();
  });
});
