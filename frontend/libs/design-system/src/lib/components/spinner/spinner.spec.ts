import { TestBed } from '@angular/core/testing';
import { DsSpinner } from './spinner';

describe('DsSpinner', () => {
  it('renders a spinning svg with the requested size and aria-label', async () => {
    await TestBed.configureTestingModule({ imports: [DsSpinner] }).compileComponents();
    const fixture = TestBed.createComponent(DsSpinner);
    fixture.componentRef.setInput('size', 32);
    fixture.componentRef.setInput('ariaLabel', 'Loading');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const svg = host.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute('width')).toBe('32');
    expect(host.getAttribute('aria-label')).toBe('Loading');
    expect(host.getAttribute('role')).toBe('status');
  });
});
