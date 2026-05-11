import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService, TrPipe } from '@frontend/design-system/i18n';

import { EmptyStateComponent } from '../../shared/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { PageTitleService } from '../../shell/page-title.service';

@Component({
  selector: 'jt-dashboard-page',
  standalone: true,
  imports: [PageHeaderComponent, EmptyStateComponent, TrPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jt-page-header [title]="i18n.translate('page.dashboard.title')"
                    [subtitle]="i18n.translate('page.dashboard.subtitle')" />
    <jt-empty-state [title]="i18n.translate('comingSoon.title')"
                    [body]="i18n.translate('comingSoon.body')">
      <span slot="icon">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1.2"/>
          <rect x="14" y="3" width="7" height="5" rx="1.2"/>
          <rect x="14" y="12" width="7" height="9" rx="1.2"/>
          <rect x="3" y="16" width="7" height="5" rx="1.2"/>
        </svg>
      </span>
    </jt-empty-state>
  `,
})
export class DashboardPage {
  protected readonly i18n = inject(I18nService);
  private readonly titleService = inject(PageTitleService);

  constructor() {
    this.titleService.setTitle(
      this.i18n.translate('page.dashboard.title'),
      this.i18n.translate('page.dashboard.subtitle'),
    );
  }
}
