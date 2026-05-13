import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { WakeUpOverlayComponent } from './shared/wake-up-overlay.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, WakeUpOverlayComponent],
  template: `
    <router-outlet />
    <app-wake-up-overlay />
  `,
})
export class App {}
