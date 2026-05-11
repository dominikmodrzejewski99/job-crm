import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DsBadge, DsBadgeVariant } from './badge';

@Component({
  imports: [DsBadge],
  template: `<ds-badge [variant]="variant()" [dot]="dot()">{{ label }}</ds-badge>`,
})
class Host {
  readonly variant = signal<DsBadgeVariant>('neutral');
  readonly dot = signal(false);
  label = 'Hello';
}

describe('DsBadge', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders projected label and role=status', () => {
    const el = fixture.nativeElement.querySelector('ds-badge') as HTMLElement;
    expect(el.textContent).toContain('Hello');
    expect(el.getAttribute('role')).toBe('status');
  });

  it('applies variant class for ApplicationStatus values', () => {
    for (const variant of ['draft', 'applied', 'offer', 'rejected'] as const) {
      fixture.componentInstance.variant.set(variant);
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('ds-badge') as HTMLElement;
      expect(el.className).toContain(`ds-badge--${variant}`);
    }
  });

  it('renders a leading dot when [dot] is true', () => {
    fixture.componentInstance.dot.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ds-badge__dot')).toBeTruthy();
  });
});
