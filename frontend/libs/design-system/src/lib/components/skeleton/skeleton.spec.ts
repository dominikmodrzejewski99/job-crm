import { TestBed } from '@angular/core/testing';
import { DsSkeleton } from './skeleton';

describe('DsSkeleton', () => {
  it('applies width and height inline styles', async () => {
    await TestBed.configureTestingModule({ imports: [DsSkeleton] }).compileComponents();
    const fixture = TestBed.createComponent(DsSkeleton);
    fixture.componentRef.setInput('width', '80%');
    fixture.componentRef.setInput('height', '24px');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.style.width).toBe('80%');
    expect(host.style.height).toBe('24px');
    expect(host.getAttribute('aria-hidden')).toBe('true');
  });

  it('rounds when [rounded] is true', async () => {
    await TestBed.configureTestingModule({ imports: [DsSkeleton] }).compileComponents();
    const fixture = TestBed.createComponent(DsSkeleton);
    fixture.componentRef.setInput('rounded', true);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).style.borderRadius).toBe('999px');
  });
});
