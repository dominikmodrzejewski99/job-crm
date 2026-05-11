import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DsCheckbox } from './checkbox';

@Component({
  imports: [DsCheckbox],
  template: `<ds-checkbox [(checked)]="checked" [indeterminate]="indeterminate()" label="Remote" />`,
})
class Host {
  readonly checked = signal(false);
  readonly indeterminate = signal(false);
}

describe('DsCheckbox', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('toggles on click and updates aria-checked', () => {
    const host = fixture.nativeElement.querySelector('ds-checkbox') as HTMLElement;
    expect(host.getAttribute('aria-checked')).toBe('false');

    host.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.checked()).toBe(true);
    expect(host.getAttribute('aria-checked')).toBe('true');
  });

  it('reports aria-checked="mixed" when [indeterminate] is set', () => {
    fixture.componentInstance.indeterminate.set(true);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('ds-checkbox') as HTMLElement;
    expect(host.getAttribute('aria-checked')).toBe('mixed');
  });
});
