import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Page-level header: large title + optional subtitle + optional right-side
 * action slot. Sits inside the routed page content (not in topbar).
 */
@Component({
  selector: 'jt-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div class="page-header-text">
        <h1 class="page-header-title">{{ title() }}</h1>
        @if (subtitle(); as sub) {
          <p class="page-header-subtitle">{{ sub }}</p>
        }
      </div>
      <div class="page-header-actions">
        <ng-content />
      </div>
    </header>
  `,
  styles: `
    :host { display: block; }
    .page-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 8px;
    }
    .page-header-text { min-width: 0; }
    .page-header-title {
      margin: 0;
      font-size: 24px;
      line-height: 30px;
      font-weight: 600;
      letter-spacing: -0.02em;
      color: var(--text-1);
    }
    .page-header-subtitle {
      margin: 4px 0 0;
      color: var(--text-3);
      font-size: 14px;
      line-height: 20px;
    }
    .page-header-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
    @media (max-width: 640px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
      }
      .page-header-title { font-size: 20px; line-height: 26px; }
    }
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
}
