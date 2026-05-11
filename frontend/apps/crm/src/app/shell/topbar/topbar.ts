import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService, Locale, TrPipe } from '@frontend/design-system/i18n';

import { PageTitleService } from '../page-title.service';

@Component({
  selector: 'jt-topbar',
  standalone: true,
  imports: [TrPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  protected readonly i18n = inject(I18nService);
  protected readonly pageTitle = inject(PageTitleService);

  protected setLocale(loc: Locale): void {
    this.i18n.setLocale(loc);
  }
}
