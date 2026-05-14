import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { RouteAnnouncerComponent } from '../shared/route-announcer.component';
import { Sidebar } from './sidebar/sidebar';
import { Topbar } from './topbar/topbar';

@Component({
  selector: 'jt-app-shell',
  imports: [RouterOutlet, Sidebar, Topbar, RouteAnnouncerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main-content">Przejdź do treści</a>
    <div class="shell">
      <jt-sidebar />
      <div class="shell-main">
        <jt-topbar />
        <main #main id="main-content" class="shell-content" tabindex="-1">
          <router-outlet />
        </main>
      </div>
    </div>
    <app-route-announcer />
  `,
  styleUrl: './app-shell.scss',
})
export class AppShell {
  private readonly main = viewChild<ElementRef<HTMLElement>>('main');

  constructor() {
    const router = inject(Router);
    const destroyRef = inject(DestroyRef);

    router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe(() => {
        // Angular Router does not move focus on SPA navigation, so the
        // previous focus stays put and screen-reader cursors lag behind.
        // Push focus to <main> after the new view is in the DOM.
        queueMicrotask(() => this.main()?.nativeElement.focus({ preventScroll: false }));
      });
  }
}
