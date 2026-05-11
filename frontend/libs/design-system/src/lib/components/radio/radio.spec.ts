import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DsRadio } from './radio';
import { DsRadioGroup } from './radio-group';

@Component({
  imports: [DsRadioGroup, DsRadio],
  template: `
    <ds-radio-group [(value)]="value">
      <ds-radio [value]="'a'" label="A" />
      <ds-radio [value]="'b'" label="B" />
    </ds-radio-group>
  `,
})
class Host {
  readonly value = signal<string>('a');
}

describe('DsRadio + DsRadioGroup', () => {
  it('marks the matching child as selected and updates on click', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const radios = fixture.nativeElement.querySelectorAll('ds-radio');
    expect(radios[0].getAttribute('aria-checked')).toBe('true');
    expect(radios[1].getAttribute('aria-checked')).toBe('false');

    (radios[1] as HTMLElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('b');
    expect(radios[0].getAttribute('aria-checked')).toBe('false');
    expect(radios[1].getAttribute('aria-checked')).toBe('true');
  });
});
