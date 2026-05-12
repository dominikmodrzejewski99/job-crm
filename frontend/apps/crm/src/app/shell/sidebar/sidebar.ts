import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { I18nService, TrPipe } from '@frontend/design-system/i18n';

import { AuthService } from '../../auth/auth.service';
import { SidebarCountsService } from './sidebar-counts.service';

interface NavItem {
  readonly path: string;
  readonly icon: string;
  readonly labelKey: 'nav.dashboard' | 'nav.applications' | 'nav.jobOffers' | 'nav.followUp' | 'nav.settings';
}

@Component({
  selector: 'jt-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TrPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  protected readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18nService);
  protected readonly counts = inject(SidebarCountsService);
  private readonly router = inject(Router);

  protected readonly navItems: readonly NavItem[] = [
    { path: '/dashboard',    icon: 'dashboard', labelKey: 'nav.dashboard' },
    { path: '/applications', icon: 'briefcase', labelKey: 'nav.applications' },
    { path: '/job-board',    icon: 'compass',   labelKey: 'nav.jobOffers' },
    { path: '/follow-up',    icon: 'clock',     labelKey: 'nav.followUp' },
  ];

  protected readonly initials = computed(() => {
    const name = this.auth.user()?.displayName ?? this.auth.user()?.email ?? '?';
    const parts = name.split(/[\s@]+/).filter(Boolean).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
  });

  protected countFor(path: string): number | null {
    const n = this.counts.countFor(path);
    return n > 0 ? n : null;
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
