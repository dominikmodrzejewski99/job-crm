import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DsCard, DsCardBody, DsCardFooter, DsCardHeader } from './card';

@Component({
  imports: [DsCard, DsCardHeader, DsCardBody, DsCardFooter],
  template: `
    <ds-card>
      <ds-card-header>Header</ds-card-header>
      <ds-card-body>Body</ds-card-body>
      <ds-card-footer>Footer</ds-card-footer>
    </ds-card>
  `,
})
class Host {}

describe('DsCard family', () => {
  it('renders card with header/body/footer host classes', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('ds-card');
    expect(card.className).toContain('ds-card');
    expect(fixture.nativeElement.querySelector('ds-card-header').className).toContain('ds-card__header');
    expect(fixture.nativeElement.querySelector('ds-card-body').className).toContain('ds-card__body');
    expect(fixture.nativeElement.querySelector('ds-card-footer').className).toContain('ds-card__footer');

    expect(card.textContent.replace(/\s+/g, ' ').trim()).toContain('Header');
    expect(card.textContent).toContain('Body');
    expect(card.textContent).toContain('Footer');
  });
});
