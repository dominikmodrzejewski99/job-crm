import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '@frontend/design-system/i18n';

import { EmptyStateComponent } from '../../shared/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { PageTitleService } from '../../shell/page-title.service';

@Component({
  selector: 'jt-applications-page',
  standalone: true,
  imports: [PageHeaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jt-page-header [title]="i18n.translate('page.applications.title')"
                    [subtitle]="i18n.translate('page.applications.subtitle')" />
    <jt-empty-state [title]="i18n.translate('comingSoon.title')"
                    [body]="i18n.translate('comingSoon.body')">
      <span slot="icon">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="7" width="18" height="13" rx="2"/>
          <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
        </svg>
      </span>
    </jt-empty-state>
  `,
})
export class ApplicationsPage {
  protected readonly i18n = inject(I18nService);
  private readonly titleService = inject(PageTitleService);

  constructor() {
    this.titleService.setTitle(
      this.i18n.translate('page.applications.title'),
      this.i18n.translate('page.applications.subtitle'),
    );
  }
}
