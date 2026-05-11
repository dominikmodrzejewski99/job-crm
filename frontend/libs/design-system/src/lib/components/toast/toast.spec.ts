import { TestBed } from '@angular/core/testing';
import { DsToastService } from './toast';

describe('DsToastService', () => {
  it('tracks shown toasts in the signal and dismisses them', () => {
    TestBed.configureTestingModule({});
    const svc = TestBed.inject(DsToastService);

    const id = svc.show({ message: 'hi', duration: 0 });
    expect(svc.toasts().length).toBe(1);
    expect(svc.toasts()[0].message).toBe('hi');

    svc.dismiss(id);
    expect(svc.toasts().length).toBe(0);
  });

  it('uses semantic variants via convenience methods', () => {
    TestBed.configureTestingModule({});
    const svc = TestBed.inject(DsToastService);

    svc.success('done');
    svc.error('boom');
    svc.warning('careful');
    svc.info('fyi');

    const variants = svc.toasts().map((t) => t.variant);
    expect(variants).toEqual(['success', 'error', 'warning', 'info']);
  });
});
