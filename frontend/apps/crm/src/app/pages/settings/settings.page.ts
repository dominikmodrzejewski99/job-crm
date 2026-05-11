import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '@frontend/design-system/i18n';

import { EmptyStateComponent } from '../../shared/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { PageTitleService } from '../../shell/page-title.service';

@Component({
  selector: 'jt-settings-page',
  standalone: true,
  imports: [PageHeaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jt-page-header [title]="i18n.translate('page.settings.title')"
                    [subtitle]="i18n.translate('page.settings.subtitle')" />
    <jt-empty-state [title]="i18n.translate('comingSoon.title')"
                    [body]="i18n.translate('comingSoon.body')">
      <span slot="icon">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 0 1 4.27 16.97l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 0 1 7.04 4.27l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </span>
    </jt-empty-state>
  `,
})
export class SettingsPage {
  protected readonly i18n = inject(I18nService);
  private readonly titleService = inject(PageTitleService);

  constructor() {
    this.titleService.setTitle(
      this.i18n.translate('page.settings.title'),
      this.i18n.translate('page.settings.subtitle'),
    );
  }
}
