import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DsTab } from './tab';
import { DsTabs } from './tabs';

@Component({
  imports: [DsTabs, DsTab],
  template: `
    <ds-tabs [(active)]="active">
      <ds-tab label="One"><ng-template>Body 1</ng-template></ds-tab>
      <ds-tab label="Two"><ng-template>Body 2</ng-template></ds-tab>
    </ds-tabs>
  `,
})
class Host {
  readonly active = signal(0);
}

describe('DsTabs', () => {
  it('renders only the active panel and switches on click', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(2);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');

    const panels = fixture.nativeElement.querySelectorAll('.ds-tabs__panel');
    expect(panels[0].textContent).toContain('Body 1');
    expect(panels[1].hidden).toBe(true);

    (tabs[1] as HTMLElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.active()).toBe(1);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
  });
});
