import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DsMenu, DsMenuItem, DsMenuTrigger } from './menu';

@Component({
  imports: [DsMenu, DsMenuItem, DsMenuTrigger],
  template: `
    <button [dsMenuTrigger]="m">Open</button>
    <ds-menu #m>
      <button ds-menu-item>Item</button>
    </ds-menu>
  `,
})
class Host {}

describe('DsMenu', () => {
  it('renders the trigger with aria-haspopup and aria-expanded=false initially', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});
