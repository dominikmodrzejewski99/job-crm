import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DsOption, DsSelect } from './select';

@Component({
  imports: [DsSelect, DsOption],
  template: `
    <ds-select [(value)]="value" label="Kraj">
      <ds-option [value]="'PL'">Polska</ds-option>
      <ds-option [value]="'DE'">Niemcy</ds-option>
    </ds-select>
  `,
})
class Host {
  readonly value = signal<string | null>(null);
}

describe('DsSelect', () => {
  it('renders the trigger with the placeholder when no value is selected', async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideAnimationsAsync()],
    }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.ds-select__trigger') as HTMLElement;
    expect(trigger.textContent).toContain('Wybierz');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('displays the matching option label when value is set externally', async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideAnimationsAsync()],
    }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.value.set('PL');
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('.ds-select__trigger') as HTMLElement;
    expect(trigger.textContent).toContain('Polska');
  });
});
