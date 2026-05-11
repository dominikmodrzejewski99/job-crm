import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DsButton, DsButtonSize, DsButtonVariant } from './button';

@Component({
  imports: [DsButton],
  template: `<button ds-button [variant]="variant()" [size]="size()" [loading]="loading()">Click</button>`,
})
class Host {
  readonly variant = signal<DsButtonVariant>('primary');
  readonly size = signal<DsButtonSize>('md');
  readonly loading = signal(false);
}

describe('DsButton', () => {
  let fixture: ComponentFixture<Host>;
  let buttonEl: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    buttonEl = fixture.nativeElement.querySelector('button');
  });

  it('renders projected content', () => {
    expect(buttonEl.textContent).toContain('Click');
  });

  it('applies variant + size classes', () => {
    expect(buttonEl.className).toContain('ds-btn-primary');
    expect(buttonEl.className).toContain('ds-btn-md');

    fixture.componentInstance.variant.set('danger');
    fixture.componentInstance.size.set('lg');
    fixture.detectChanges();

    expect(buttonEl.className).toContain('ds-btn-danger');
    expect(buttonEl.className).toContain('ds-btn-lg');
  });

  it('sets aria-busy and disabled while loading', () => {
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();

    expect(buttonEl.getAttribute('aria-busy')).toBe('true');
    expect(buttonEl.hasAttribute('disabled')).toBe(true);
    expect(buttonEl.className).toContain('is-loading');
  });
});
