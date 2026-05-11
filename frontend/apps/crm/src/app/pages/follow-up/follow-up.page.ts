import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '@frontend/design-system/i18n';

import { EmptyStateComponent } from '../../shared/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { PageTitleService } from '../../shell/page-title.service';

@Component({
  selector: 'jt-follow-up-page',
  standalone: true,
  imports: [PageHeaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jt-page-header [title]="i18n.translate('page.followUp.title')"
                    [subtitle]="i18n.translate('page.followUp.subtitle')" />
    <jt-empty-state [title]="i18n.translate('comingSoon.title')"
                    [body]="i18n.translate('comingSoon.body')">
      <span slot="icon">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 7v5l3 2"/>
        </svg>
      </span>
    </jt-empty-state>
  `,
})
export class FollowUpPage {
  protected readonly i18n = inject(I18nService);
  private readonly titleService = inject(PageTitleService);

  constructor() {
    this.titleService.setTitle(
      this.i18n.translate('page.followUp.title'),
      this.i18n.translate('page.followUp.subtitle'),
    );
  }
}
