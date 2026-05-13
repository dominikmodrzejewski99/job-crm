import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';

import { WakeUpService } from './wake-up.service';

// Render free-tier spins the backend down after 15 min idle. The first
// request after a cold start takes ~15-30s to wake the container. Anything
// faster than 3s is normal traffic — no need to flash an overlay.
const COLD_START_THRESHOLD_MS = 3000;

export const wakeUpInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) return next(req);

  const service = inject(WakeUpService);
  let shown = false;
  const timer = setTimeout(() => {
    shown = true;
    service.show();
  }, COLD_START_THRESHOLD_MS);

  return next(req).pipe(
    finalize(() => {
      clearTimeout(timer);
      if (shown) service.done();
    }),
  );
};
