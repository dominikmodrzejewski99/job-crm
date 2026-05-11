import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DsAvatar, DsAvatarSize } from './avatar';

@Component({
  imports: [DsAvatar],
  template: `<ds-avatar [size]="size()" [src]="src()" [alt]="alt()" [initials]="initials()" />`,
})
class Host {
  readonly size = signal<DsAvatarSize>('md');
  readonly src = signal<string | null>(null);
  readonly alt = signal<string>('Acme Corp');
  readonly initials = signal<string>('');
}

describe('DsAvatar', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders initials when no src is provided', () => {
    fixture.componentInstance.alt.set('John Doe');
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('ds-avatar span');
    expect(span.textContent).toBe('JD');
  });

  it('uses explicit initials over alt', () => {
    fixture.componentInstance.initials.set('ZZ');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ds-avatar span').textContent).toBe('ZZ');
  });

  it('renders an img when src is set', () => {
    fixture.componentInstance.src.set('/photo.png');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img.ds-avatar__img')).toBeTruthy();
  });

  it('applies size class', () => {
    fixture.componentInstance.size.set('lg');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ds-avatar').className).toContain('ds-avatar--lg');
  });
});
