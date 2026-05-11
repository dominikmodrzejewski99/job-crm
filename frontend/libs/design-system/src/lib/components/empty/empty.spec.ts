import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DsEmpty } from './empty';

@Component({
  imports: [DsEmpty],
  template: `
    <ds-empty title="Nothing yet" description="Add the first one">
      <svg ds-empty-icon><path /></svg>
      <button ds-empty-actions>Add</button>
    </ds-empty>
  `,
  schemas: [],
})
class Host {}

describe('DsEmpty', () => {
  it('renders title, description and projected slots', async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      schemas: [],
    }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.ds-empty__title')!.textContent).toBe('Nothing yet');
    expect(host.querySelector('.ds-empty__description')!.textContent).toContain('Add the first one');
    expect(host.querySelector('.ds-empty__icon svg')).toBeTruthy();
    expect(host.querySelector('.ds-empty__actions button')!.textContent).toContain('Add');
  });
});
