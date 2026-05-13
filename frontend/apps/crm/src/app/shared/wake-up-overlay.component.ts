import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { WakeUpService } from './wake-up.service';

@Component({
  selector: 'app-wake-up-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (service.visible()) {
      <div class="overlay" role="status" aria-live="polite">
        <div class="card">
          <div class="spinner" aria-hidden="true"></div>
          <h2 class="title">Budzenie serwera…</h2>
          <p class="msg">
            Backend hibernuje po okresie nieaktywności (Render free tier).
            Pierwsze załadowanie może zająć do 30 sekund.
          </p>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(27, 27, 31, 0.55);
      backdrop-filter: blur(4px);
      display: grid;
      place-items: center;
      z-index: 9999;
      animation: fade 200ms ease-out;
    }
    .card {
      background: var(--bg-surface, #fff);
      border-radius: 16px;
      padding: 32px 40px;
      max-width: 380px;
      text-align: center;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
    }
    .spinner {
      width: 44px;
      height: 44px;
      margin: 0 auto 20px;
      border: 3px solid rgba(217, 119, 87, 0.2);
      border-top-color: #D97757;
      border-radius: 50%;
      animation: spin 0.9s linear infinite;
    }
    .title {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-on-bg, #1B1B1F);
    }
    .msg {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
      color: var(--text-secondary, #6B6B72);
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
  `],
})
export class WakeUpOverlayComponent {
  protected readonly service = inject(WakeUpService);
}
