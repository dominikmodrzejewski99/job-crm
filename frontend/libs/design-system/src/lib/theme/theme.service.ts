import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'jobtrack:theme';
const ATTR = 'data-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly _theme = signal<Theme>(this.readInitialTheme());

  readonly theme = this._theme.asReadonly();

  constructor() {
    this.applyToDocument(this._theme());
  }

  setTheme(next: Theme): void {
    this._theme.set(next);
    this.applyToDocument(next);
    this.persist(next);
  }

  toggle(): void {
    this.setTheme(this._theme() === 'dark' ? 'light' : 'dark');
  }

  private readInitialTheme(): Theme {
    const stored = this.safeLocalStorage()?.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    // Honor the attribute we ship in index.html if no preference is stored.
    const attr = this.doc.documentElement.getAttribute(ATTR);
    return attr === 'light' ? 'light' : 'dark';
  }

  private applyToDocument(theme: Theme): void {
    this.doc.documentElement.setAttribute(ATTR, theme);
  }

  private persist(theme: Theme): void {
    this.safeLocalStorage()?.setItem(STORAGE_KEY, theme);
  }

  private safeLocalStorage(): Storage | null {
    try {
      return this.doc.defaultView?.localStorage ?? null;
    } catch {
      // SSR or sandboxed contexts where localStorage throws.
      return null;
    }
  }
}
