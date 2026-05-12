import { ChangeDetectionStrategy, Component, HostBinding, computed, effect, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { DsSkeleton } from '@frontend/design-system/skeleton';
import { I18nService } from '@frontend/design-system/i18n';

import { ApplicationApi } from '../../api/application-api';
import { ApiApplication, ApiApplicationStatus } from '../../api/application-types';
import { AuthService } from '../../auth/auth.service';
import { StatsApi } from '../../api/stats-api';
import { DashboardStats } from '../../api/stats-types';
import { PageTitleService } from '../../shell/page-title.service';

type PipelineView = 'KANBAN' | 'FUNNEL' | 'LIST';
type ColumnKey = 'sent' | 'responded' | 'interview' | 'offer' | 'rejected';
type Density = 'cozy' | 'compact';
type Theme = 'light' | 'dark';

interface PipelineColumn {
  key: ColumnKey;
  label: string;
  short: string;
  color: 'slate' | 'amber' | 'indigo' | 'emerald' | 'rose';
  statuses: ApiApplicationStatus[];
}

interface FunnelRow {
  key: 'sent' | 'responded' | 'interview' | 'offer';
  label: string;
  count: number;
  pct: number;
  conv: string | null;
  color: 'slate' | 'amber' | 'indigo' | 'emerald';
}

interface UpcomingItem {
  id: string;
  company: string;
  role: string;
  logo: string;
  logoBg: string;
  date: Date;
  time: string;
  kind: string;
  channel: string;
  type: 'interview' | 'followup' | 'deadline';
  color: 'slate' | 'amber' | 'indigo' | 'emerald' | 'rose';
}

interface CvVersion {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  sent: number;
  responses: number;
  interviews: number;
  offers: number;
  isWinner: boolean;
}

const PIPELINE_COLUMNS: PipelineColumn[] = [
  { key: 'sent', label: 'Wysłane', short: 'WYS', color: 'slate', statuses: ['DRAFT', 'APPLIED'] },
  { key: 'responded', label: 'Odpowiedź', short: 'ODP', color: 'amber', statuses: ['ACK_RECEIVED'] },
  { key: 'interview', label: 'Rozmowa', short: 'INT', color: 'indigo', statuses: ['INTERVIEW_SCHEDULED', 'INTERVIEW_DONE', 'TASK_RECEIVED', 'TASK_SUBMITTED'] },
  { key: 'offer', label: 'Oferta', short: 'OFR', color: 'emerald', statuses: ['OFFER'] },
  { key: 'rejected', label: 'Odrzucone', short: 'ODR', color: 'rose', statuses: ['REJECTED', 'WITHDRAWN', 'GHOSTED'] },
];

// Stable but pleasant accent colors for company avatars derived from the
// first letter of company name. Same letter → same color across renders.
const AVATAR_COLORS = [
  '#635BFF', '#FF5A00', '#0ACF83', '#DC143C', '#5E6AD2',
  '#000000', '#E60000', '#1B1B1F', '#FC6D26', '#1854D8',
  '#00B6FF', '#F06A6A', '#FFB3C7',
];

// A/B CV comparison is a frontend-only stub today — the backend doesn't
// model CV versions per application, so we surface synthetic data that
// matches the design intent. Replace once we ship a CvVersion entity.
const CV_VERSIONS_STUB: CvVersion[] = [
  {
    id: 'v3.1',
    name: 'v3.1 — Product',
    subtitle: 'Skupione na product design + research',
    color: '#D97757',
    sent: 24, responses: 8, interviews: 4, offers: 1,
    isWinner: false,
  },
  {
    id: 'v3.2',
    name: 'v3.2 — Senior',
    subtitle: 'Strong leadership + system thinking',
    color: '#2A6FDB',
    sent: 18, responses: 9, interviews: 5, offers: 0,
    isWinner: true,
  },
];

const WEEKLY_GOAL = 8;

@Component({
  selector: 'jt-dashboard-page',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, DsSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
  protected readonly i18n = inject(I18nService);
  private readonly titleService = inject(PageTitleService);
  private readonly statsApi = inject(StatsApi);
  private readonly applicationsApi = inject(ApplicationApi);
  private readonly auth = inject(AuthService);

  protected readonly stats = signal<DashboardStats | null>(null);
  protected readonly statsLoading = signal(true);
  protected readonly applications = signal<ApiApplication[]>([]);
  protected readonly applicationsLoading = signal(true);

  protected readonly pipelineView = signal<PipelineView>('KANBAN');
  protected readonly density = signal<Density>('cozy');
  protected readonly theme = signal<Theme>('light');
  protected readonly hideAb = signal(false);
  protected readonly tweaksOpen = signal(false);

  protected readonly drawerApp = signal<ApiApplication | null>(null);

  protected readonly columns = PIPELINE_COLUMNS;
  protected readonly weeklyGoal = WEEKLY_GOAL;

  @HostBinding('attr.data-dashboard-theme') protected get hostTheme(): Theme {
    return this.theme();
  }

  @HostBinding('attr.data-density') protected get hostDensity(): Density {
    return this.density();
  }

  protected readonly userInitials = computed(() => {
    const name = this.auth.user()?.displayName ?? this.auth.user()?.email ?? 'You';
    const parts = name.split(/[\s@]+/).filter(Boolean).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'YU';
  });

  protected readonly userFirstName = computed(() => {
    const name = this.auth.user()?.displayName ?? '';
    if (name) return name.split(/\s+/)[0];
    return this.auth.user()?.email?.split('@')[0] ?? 'Tam';
  });

  // ---------------- KPI computeds ----------------

  protected readonly sentTotal = computed(() => this.stats()?.total ?? 0);

  protected readonly sentThisWeek = computed(() => {
    const buckets = this.stats()?.weekly ?? [];
    if (buckets.length === 0) return 0;
    return buckets[buckets.length - 1].applied;
  });

  protected readonly weeklyGoalPct = computed(() => {
    return Math.min(100, Math.round((this.sentThisWeek() / WEEKLY_GOAL) * 100));
  });

  protected readonly responseRatePct = computed(() => {
    const s = this.stats();
    return s ? Math.round(s.responseRate * 100) : 0;
  });

  protected readonly interviewsInProgress = computed(() => {
    const counts = this.stats()?.byStatus ?? {};
    return (
      (counts.INTERVIEW_SCHEDULED ?? 0) +
      (counts.INTERVIEW_DONE ?? 0) +
      (counts.TASK_RECEIVED ?? 0) +
      (counts.TASK_SUBMITTED ?? 0)
    );
  });

  protected readonly activeOffers = computed(() => this.stats()?.byStatus.OFFER ?? 0);

  // ---------------- Kanban ----------------

  protected readonly kanbanGroups = computed(() => {
    const groups = new Map<ColumnKey, ApiApplication[]>();
    for (const col of PIPELINE_COLUMNS) groups.set(col.key, []);
    for (const app of this.applications()) {
      for (const col of PIPELINE_COLUMNS) {
        if (col.statuses.includes(app.currentStatus)) {
          groups.get(col.key)!.push(app);
          break;
        }
      }
    }
    return groups;
  });

  protected applicationsForColumn(key: ColumnKey): ApiApplication[] {
    return this.kanbanGroups().get(key) ?? [];
  }

  // ---------------- Funnel ----------------

  protected readonly funnelRows = computed<FunnelRow[]>(() => {
    const s = this.stats();
    if (!s) return [];
    const counts = s.byStatus;
    const sent = s.total;
    const responded =
      (counts.ACK_RECEIVED ?? 0) +
      (counts.INTERVIEW_SCHEDULED ?? 0) +
      (counts.INTERVIEW_DONE ?? 0) +
      (counts.TASK_RECEIVED ?? 0) +
      (counts.TASK_SUBMITTED ?? 0) +
      (counts.OFFER ?? 0) +
      (counts.REJECTED ?? 0);
    const interview = this.interviewsInProgress() + (counts.OFFER ?? 0);
    const offer = counts.OFFER ?? 0;

    const max = Math.max(sent, 1);
    const pct = (n: number) => Math.round((n / max) * 100);
    const conv = (n: number, prev: number) =>
      prev === 0 ? null : `${Math.round((n / prev) * 100)}% conv.`;

    return [
      { key: 'sent', label: 'Wysłane', count: sent, pct: pct(sent), conv: null, color: 'slate' },
      { key: 'responded', label: 'Odpowiedź', count: responded, pct: pct(responded), conv: conv(responded, sent), color: 'amber' },
      { key: 'interview', label: 'Rozmowy', count: interview, pct: pct(interview), conv: conv(interview, responded), color: 'indigo' },
      { key: 'offer', label: 'Oferty', count: offer, pct: pct(offer), conv: conv(offer, interview), color: 'emerald' },
    ];
  });

  // ---------------- Upcoming events ----------------

  // Derived from nextFollowUpAt + status — backend doesn't yet expose
  // structured interview-schedule objects, so we approximate from the
  // application list.
  protected readonly upcomingItems = computed<UpcomingItem[]>(() => {
    const now = Date.now();
    const items: UpcomingItem[] = [];
    for (const app of this.applications()) {
      if (!app.nextFollowUpAt) continue;
      const t = new Date(app.nextFollowUpAt).getTime();
      if (Number.isNaN(t) || t < now - 86_400_000) continue;
      const isInterview =
        app.currentStatus === 'INTERVIEW_SCHEDULED' || app.currentStatus === 'TASK_RECEIVED';
      items.push({
        id: app.id,
        company: app.companyName,
        role: app.position,
        logo: app.companyName.charAt(0).toUpperCase() || '·',
        logoBg: this.avatarColorFor(app.companyName),
        date: new Date(app.nextFollowUpAt),
        time: '',
        kind: isInterview ? 'Rozmowa' : 'Follow-up',
        channel: app.remote ? 'Remote' : (app.location ?? '—'),
        type: isInterview ? 'interview' : 'followup',
        color: isInterview ? 'indigo' : 'amber',
      });
    }
    return items.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
  });

  // ---------------- A/B CV stub ----------------

  protected readonly cvVersions = signal<CvVersion[]>(CV_VERSIONS_STUB);

  protected readonly cvInsightDelta = computed(() => {
    const [a, b] = this.cvVersions();
    if (!a || !b) return 0;
    const rateA = a.sent === 0 ? 0 : a.responses / a.sent;
    const rateB = b.sent === 0 ? 0 : b.responses / b.sent;
    return Math.round(Math.abs(rateA - rateB) * 100);
  });

  protected readonly cvWinnerName = computed(() => {
    return this.cvVersions().find((v) => v.isWinner)?.name ?? '';
  });

  // ---------------- Helpers ----------------

  protected avatarColorFor(company: string): string {
    let hash = 0;
    for (const ch of company) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  protected statusFor(app: ApiApplication): { col: PipelineColumn; label: string } {
    const col = PIPELINE_COLUMNS.find((c) => c.statuses.includes(app.currentStatus)) ?? PIPELINE_COLUMNS[0];
    return { col, label: col.label };
  }

  protected formatSalary(app: ApiApplication): string {
    if (app.salaryMin === null && app.salaryMax === null) return '—';
    const fmt = (n: number) => Math.round(n).toLocaleString('pl-PL');
    const cur = app.currency ?? '';
    if (app.salaryMin && app.salaryMax) return `${fmt(app.salaryMin)}–${fmt(app.salaryMax)} ${cur}`;
    if (app.salaryMax) return `do ${fmt(app.salaryMax)} ${cur}`;
    return `od ${fmt(app.salaryMin ?? 0)} ${cur}`;
  }

  protected daysSince(iso: string | null): number | null {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return null;
    return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
  }

  protected appliedRelative(app: ApiApplication): string {
    const days = this.daysSince(app.appliedAt);
    if (days === null) return '—';
    if (days === 0) return 'dzisiaj';
    if (days === 1) return 'wczoraj';
    return `${days} dni temu`;
  }

  protected dayOfMonth(d: Date): number {
    return d.getDate();
  }

  protected monthShort(d: Date): string {
    return d.toLocaleDateString('pl', { month: 'short' }).toUpperCase().replace('.', '');
  }

  protected upcomingNext(): UpcomingItem | null {
    return this.upcomingItems()[0] ?? null;
  }

  protected sourceLabel(app: ApiApplication): string {
    const map: Record<string, string> = {
      LINKEDIN: 'LinkedIn',
      JUSTJOIN: 'JustJoinIT',
      NOFLUFF: 'NoFluffJobs',
      REFERRAL: 'Referral',
      COMPANY_SITE: 'Strona firmy',
      OTHER: 'Inne',
    };
    return map[app.source] ?? app.source;
  }

  protected cvBarSegment(v: CvVersion, kind: 'int' | 'resp' | 'none'): number {
    if (v.sent === 0) return 0;
    if (kind === 'int') return Math.round((v.interviews / v.sent) * 100);
    if (kind === 'resp') return Math.round(((v.responses - v.interviews) / v.sent) * 100);
    return Math.round(((v.sent - v.responses) / v.sent) * 100);
  }

  // ---------------- Lifecycle ----------------

  constructor() {
    this.titleService.setTitle(
      this.i18n.translate('page.dashboard.title'),
      this.i18n.translate('page.dashboard.subtitle'),
    );
    this.loadStats();
    this.loadApplications();

    effect(() => {
      // Soft persistence — tweaks survive a reload within this browser.
      localStorage.setItem('jobtrack:dashboard:theme', this.theme());
      localStorage.setItem('jobtrack:dashboard:density', this.density());
      localStorage.setItem('jobtrack:dashboard:hideAb', String(this.hideAb()));
    });

    const t = localStorage.getItem('jobtrack:dashboard:theme');
    if (t === 'light' || t === 'dark') this.theme.set(t);
    const d = localStorage.getItem('jobtrack:dashboard:density');
    if (d === 'cozy' || d === 'compact') this.density.set(d);
    const h = localStorage.getItem('jobtrack:dashboard:hideAb');
    if (h === 'true') this.hideAb.set(true);
  }

  private loadStats(): void {
    this.statsLoading.set(true);
    this.statsApi.dashboard().pipe(catchError(() => of(null))).subscribe((s) => {
      this.stats.set(s);
      this.statsLoading.set(false);
    });
  }

  private loadApplications(): void {
    this.applicationsLoading.set(true);
    this.applicationsApi
      .list()
      .pipe(catchError(() => of({ content: [] as ApiApplication[], totalElements: 0, totalPages: 0, number: 0, size: 0, empty: true })))
      .subscribe((page) => {
        this.applications.set(page.content);
        this.applicationsLoading.set(false);
      });
  }

  protected openDrawer(app: ApiApplication): void {
    this.drawerApp.set(app);
  }

  protected closeDrawer(): void {
    this.drawerApp.set(null);
  }

  protected toggleTheme(): void {
    this.theme.set(this.theme() === 'light' ? 'dark' : 'light');
  }
}
