import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DsTextarea } from './textarea';

@Component({
  imports: [DsTextarea],
  template: `<ds-textarea [(value)]="value" label="Notes" [rows]="5" />`,
})
class Host {
  readonly value = signal('');
}

describe('DsTextarea', () => {
  it('two-way binds via the value model signal', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.rows).toBe(5);

    textarea.value = 'hello';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('hello');
  });
});
