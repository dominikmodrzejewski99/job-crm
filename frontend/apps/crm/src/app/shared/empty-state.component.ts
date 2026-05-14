import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Standard empty placeholder: icon slot, title, body, optional CTA in
 * projected content. Used wherever a list has no items yet.
 */
@Component({
  selector: 'jt-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <div class="empty-icon" aria-hidden="true">
        <ng-content select="[slot=icon]" />
      </div>
      <h3 class="empty-title">{{ title() }}</h3>
      @if (body(); as b) {
        <p class="empty-body">{{ b }}</p>
      }
      <div class="empty-action">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 48px 24px;
      background: var(--bg-surface);
      border: 1px dashed var(--border-1);
      border-radius: 12px;
    }
    .empty-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: var(--brand-50);
      color: var(--brand-600);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .empty-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-1);
      letter-spacing: -0.01em;
    }
    .empty-body {
      margin: 6px 0 0;
      max-width: 360px;
      color: var(--text-3);
      font-size: 13px;
      line-height: 20px;
    }
    .empty-action { margin-top: 16px; }
  `,
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly body = input<string | null>(null);
}
