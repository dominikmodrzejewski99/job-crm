import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WakeUpService {
  readonly visible = signal(false);
  private pending = 0;

  show(): void {
    this.pending++;
    this.visible.set(true);
  }

  done(): void {
    this.pending = Math.max(0, this.pending - 1);
    if (this.pending === 0) this.visible.set(false);
  }
}
