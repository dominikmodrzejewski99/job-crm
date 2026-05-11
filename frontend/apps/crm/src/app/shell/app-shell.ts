import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Sidebar } from './sidebar/sidebar';
import { Topbar } from './topbar/topbar';

@Component({
  selector: 'jt-app-shell',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Topbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <jt-sidebar />
      <div class="shell-main">
        <jt-topbar />
        <main class="shell-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styleUrl: './app-shell.scss',
})
export class AppShell {}
