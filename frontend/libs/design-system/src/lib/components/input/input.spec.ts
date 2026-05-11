import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DsInput } from './input';

@Component({
  imports: [DsInput],
  template: `
    <ds-input
      [(value)]="value"
      label="Firma"
      [error]="forcedError()"
      errorText="bad"
      helperText="help"
    />
  `,
})
class Host {
  readonly value = signal('');
  readonly forcedError = signal<boolean | null>(null);
}

describe('DsInput', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders label and helper, hides error by default', () => {
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.ds-field__label')!.textContent).toContain('Firma');
    expect(root.querySelector('.ds-field__helper')!.textContent).toContain('help');
    expect(root.querySelector('.ds-field__error')).toBeNull();
  });

  it('propagates DOM input → model signal', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'Acme';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('Acme');
  });

  it('shows error state when [error] is true', () => {
    fixture.componentInstance.forcedError.set(true);
    fixture.detectChanges();
    const control = fixture.nativeElement.querySelector('.ds-field__control') as HTMLElement;
    expect(control.className).toContain('is-error');
    expect(fixture.nativeElement.querySelector('.ds-field__error')!.textContent).toContain('bad');
  });
});
