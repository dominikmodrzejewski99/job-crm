import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { DsButton } from '@frontend/design-system/button';
import { DsCard, DsCardBody, DsCardHeader } from '@frontend/design-system/card';
import { I18nService, Locale } from '@frontend/design-system/i18n';

import { AuthService } from '../../auth/auth.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { PageTitleService } from '../../shell/page-title.service';

@Component({
  selector: 'jt-settings-page',
  imports: [DatePipe, DsButton, DsCard, DsCardHeader, DsCardBody, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
})
export class SettingsPage {
  protected readonly i18n = inject(I18nService);
  protected readonly auth = inject(AuthService);
  private readonly titleService = inject(PageTitleService);
  private readonly router = inject(Router);

  constructor() {
    this.titleService.setTitle(
      this.i18n.translate('page.settings.title'),
      this.i18n.translate('page.settings.subtitle'),
    );
  }

  protected setLocale(loc: Locale): void {
    this.i18n.setLocale(loc);
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
