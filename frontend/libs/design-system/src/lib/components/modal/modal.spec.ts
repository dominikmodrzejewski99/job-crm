import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DsModal } from './modal';

@Component({
  imports: [DsModal],
  template: `
    <ds-modal>
      <h2 ds-modal-title>Title</h2>
      <p>Body</p>
      <button ds-modal-actions>OK</button>
    </ds-modal>
  `,
})
class Host {}

describe('DsModal', () => {
  it('renders header/body/footer slots and dialog role', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('ds-modal') as HTMLElement;
    expect(modal.getAttribute('role')).toBe('dialog');
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(modal.querySelector('.ds-modal__header')!.textContent).toContain('Title');
    expect(modal.querySelector('.ds-modal__body')!.textContent).toContain('Body');
    expect(modal.querySelector('.ds-modal__footer')!.textContent).toContain('OK');
  });
});
