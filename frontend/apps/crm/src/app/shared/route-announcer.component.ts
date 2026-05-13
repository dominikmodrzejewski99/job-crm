import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { PageTitleService } from '../shell/page-title.service';

/**
 * Visually-hidden live region that announces the active page title to
 * screen-reader users whenever the route changes. Angular Router doesn't
 * announce navigation by itself in a SPA, so without this SR users only
 * hear the focused element after a route change.
 */
@Component({
  selector: 'app-route-announcer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {{ title() }}
    </div>
  `,
  styles: [`
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `],
})
export class RouteAnnouncerComponent {
  private readonly pageTitle = inject(PageTitleService);
  protected readonly title = this.pageTitle.title;
}
