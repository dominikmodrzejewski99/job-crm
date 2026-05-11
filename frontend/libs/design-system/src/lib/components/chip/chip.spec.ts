import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DsChip } from './chip';

@Component({
  imports: [DsChip],
  template: `<ds-chip [removable]="removable()" (remove)="onRemove()">tag</ds-chip>`,
})
class Host {
  readonly removable = signal(false);
  removed = 0;
  onRemove() { this.removed++; }
}

describe('DsChip', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders content', () => {
    expect(fixture.nativeElement.textContent).toContain('tag');
  });

  it('hides remove button by default', () => {
    expect(fixture.nativeElement.querySelector('.ds-chip__remove')).toBeNull();
  });

  it('emits remove on close-button click', () => {
    fixture.componentInstance.removable.set(true);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.ds-chip__remove') as HTMLButtonElement;
    btn.click();
    expect(fixture.componentInstance.removed).toBe(1);
  });
});
