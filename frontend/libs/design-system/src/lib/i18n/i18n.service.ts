import { DOCUMENT } from '@angular/common';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';

import { Locale, TranslationKey, dictionaries } from './dictionaries';

const STORAGE_KEY = 'jobtrack:locale';
const HTML_LANG_ATTR = 'lang';

/**
 * Signal-based i18n. The current locale is a writable signal; `t()` returns
 * a *computed* signal so consumers can read `t('common.save')()` in templates
 * and re-render automatically when the locale changes — no event bus needed.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly doc = inject(DOCUMENT);
  private readonly _locale = signal<Locale>(this.readInitialLocale());

  readonly locale = this._locale.asReadonly();

  constructor() {
    this.applyToDocument(this._locale());
  }

  setLocale(next: Locale): void {
    this._locale.set(next);
    this.applyToDocument(next);
    this.persist(next);
  }

  /**
   * Returns a computed signal for the requested key. Templates can either
   * read it imperatively (`{{ t('common.save')() }}`) or, more commonly,
   * inject the service and bind to the function via the `tr` pipe.
   */
  t(key: TranslationKey): Signal<string> {
    return computed(() => dictionaries[this._locale()][key] ?? key);
  }

  /** Eagerly resolve a translation — useful from .ts (toasts, modal data). */
  translate(key: TranslationKey, locale?: Locale): string {
    const loc = locale ?? this._locale();
    return dictionaries[loc][key] ?? key;
  }

  private readInitialLocale(): Locale {
    const stored = this.safeStorage()?.getItem(STORAGE_KEY);
    if (stored === 'pl' || stored === 'en') return stored;

    const attr = this.doc.documentElement.getAttribute(HTML_LANG_ATTR);
    if (attr === 'en') return 'en';

    const nav = this.doc.defaultView?.navigator?.language ?? '';
    if (nav.toLowerCase().startsWith('en')) return 'en';

    return 'pl';
  }

  private applyToDocument(locale: Locale): void {
    this.doc.documentElement.setAttribute(HTML_LANG_ATTR, locale);
  }

  private persist(locale: Locale): void {
    this.safeStorage()?.setItem(STORAGE_KEY, locale);
  }

  private safeStorage(): Storage | null {
    try {
      return this.doc.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }
}
