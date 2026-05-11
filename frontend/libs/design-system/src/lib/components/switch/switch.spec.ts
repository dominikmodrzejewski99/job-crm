import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DsSwitch } from './switch';

@Component({
  imports: [DsSwitch],
  template: `<ds-switch [(checked)]="checked" label="Notify" />`,
})
class Host {
  readonly checked = signal(false);
}

describe('DsSwitch', () => {
  it('toggles checked state on click and reflects aria-checked', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const host = fixture.nativeElement.querySelector('ds-switch') as HTMLElement;
    expect(host.getAttribute('role')).toBe('switch');
    expect(host.getAttribute('aria-checked')).toBe('false');

    host.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.checked()).toBe(true);
    expect(host.getAttribute('aria-checked')).toBe('true');
    expect(host.className).toContain('is-checked');
  });
});
