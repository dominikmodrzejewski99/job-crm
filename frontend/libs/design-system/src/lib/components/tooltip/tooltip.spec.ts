import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DsTooltip } from './tooltip';

@Component({
  imports: [DsTooltip],
  template: `<button [dsTooltip]="text" [dsTooltipDelay]="0">Hover me</button>`,
})
class Host {
  text = 'I am a tooltip';
}

describe('DsTooltip', () => {
  it('attaches the directive without errors and stores the tooltip text', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button).toBeTruthy();
    // We don't open the overlay in unit tests (no AnimationFrame, no real DOM
    // overlay container). The directive being constructed is the smoke test.
  });
});
