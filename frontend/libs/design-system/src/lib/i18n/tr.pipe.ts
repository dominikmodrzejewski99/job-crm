import { Pipe, PipeTransform, inject } from '@angular/core';

import { TranslationKey } from './dictionaries';
import { I18nService } from './i18n.service';

/**
 * `{{ 'common.save' | tr }}` — pipe variant of {@link I18nService.translate}.
 * Marked impure so it re-runs whenever the locale signal changes.
 */
@Pipe({
  name: 'tr',
  pure: false,
})
export class TrPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(value: TranslationKey): string {
    return this.i18n.translate(value);
  }
}
