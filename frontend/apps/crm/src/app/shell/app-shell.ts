import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

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
        <main id="main-content" class="shell-content" tabindex="-1">
          <router-outlet />
        </main>
      </div>
    </div>
    <app-route-announcer />
  `,
  styleUrl: './app-shell.scss',
})
export class AppShell {}
