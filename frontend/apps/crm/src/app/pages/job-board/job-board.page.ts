import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '@frontend/design-system/i18n';

import { EmptyStateComponent } from '../../shared/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { PageTitleService } from '../../shell/page-title.service';

@Component({
  selector: 'jt-job-board-page',
  standalone: true,
  imports: [PageHeaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jt-page-header [title]="i18n.translate('page.jobBoard.title')"
                    [subtitle]="i18n.translate('page.jobBoard.subtitle')" />
    <jt-empty-state [title]="i18n.translate('comingSoon.title')"
                    [body]="i18n.translate('comingSoon.body')">
      <span slot="icon">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z"/>
        </svg>
      </span>
    </jt-empty-state>
  `,
})
export class JobBoardPage {
  protected readonly i18n = inject(I18nService);
  private readonly titleService = inject(PageTitleService);

  constructor() {
    this.titleService.setTitle(
      this.i18n.translate('page.jobBoard.title'),
      this.i18n.translate('page.jobBoard.subtitle'),
    );
  }
}
