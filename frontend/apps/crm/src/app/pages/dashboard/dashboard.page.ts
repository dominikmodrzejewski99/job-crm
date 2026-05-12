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
  /** Icon name for the channel meta row (video/mail/clock). */
  channelIcon: 'video' | 'mail' | 'clock';
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

interface JobBoard {
  id: string;
  name: string;
  bg: string;
  short: string;
  connected: boolean;
  account: string | null;
  newJobs: number;
  lastSync: string | null;
  autoApply: boolean;
}

interface MatchedJob {
  id: string;
  boardId: string;
  company: string;
  logo: string;
  logoBg: string;
  role: string;
  salary: string;
  location: string;
  match: number;
  postedAgo: string;
  easyApply: boolean;
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

// Job boards demo data — wraps real JJIT/NFJ integration we already have
// plus stubs for boards we don't crawl yet (LinkedIn / Pracuj / Glassdoor).
const JOB_BOARDS_STUB: JobBoard[] = [
  { id: 'linkedin', name: 'LinkedIn',    bg: '#0A66C2', short: 'in', connected: true,  account: 'maja.lewandowska',  newJobs: 124, lastSync: '5 min temu',  autoApply: true },
  { id: 'pracuj',   name: 'Pracuj.pl',   bg: '#FF5A00', short: 'Pr', connected: true,  account: 'maja@example.pl',   newJobs: 38,  lastSync: '12 min temu', autoApply: false },
  { id: 'nofluff',  name: 'NoFluffJobs', bg: '#1B1B1F', short: 'Nf', connected: true,  account: 'maja@design.pl',    newJobs: 22,  lastSync: '34 min temu', autoApply: false },
  { id: 'justjoin', name: 'JustJoin.IT', bg: '#FF003C', short: 'JJ', connected: false, account: null,                newJobs: 0,   lastSync: null,           autoApply: false },
  { id: 'glassdoor',name: 'Glassdoor',   bg: '#0CAA41', short: 'Gd', connected: false, account: null,                newJobs: 0,   lastSync: null,           autoApply: false },
];

// Upcoming events are not yet modelled structurally in the backend (we only
// have nextFollowUpAt timestamps on applications, with no time/kind/channel).
// Until that lands, surface the design's stubbed events so the visual is 1:1.
const UPCOMING_STUB: UpcomingItem[] = [
  { id: 'u1', type: 'interview', company: 'GitLab',   role: 'Staff Product Designer',  logo: 'G', logoBg: '#FC6D26', date: new Date('2026-05-13'), time: '16:00', kind: 'HR Screen',        channel: 'Google Meet', color: 'indigo',  channelIcon: 'video' },
  { id: 'u2', type: 'interview', company: 'Booksy',   role: 'Sr. UX Designer',         logo: 'B', logoBg: '#1B1B1F', date: new Date('2026-05-14'), time: '11:00', kind: 'Final Round',      channel: 'Office',      color: 'emerald', channelIcon: 'video' },
  { id: 'u3', type: 'followup',  company: 'Figma',    role: 'Sr. Product Designer',    logo: 'F', logoBg: '#0ACF83', date: new Date('2026-05-15'), time: '—',     kind: 'Wyślij portfolio', channel: 'Email',       color: 'amber',   channelIcon: 'mail'  },
  { id: 'u4', type: 'deadline',  company: 'Allegro',  role: 'Product Designer',        logo: 'A', logoBg: '#FF5A00', date: new Date('2026-05-16'), time: '23:59', kind: 'Deadline oferty',  channel: '—',           color: 'rose',    channelIcon: 'clock' },
  { id: 'u5', type: 'interview', company: 'Stripe',   role: 'Senior Product Designer', logo: 'S', logoBg: '#635BFF', date: new Date('2026-05-19'), time: '17:30', kind: 'Design Challenge', channel: 'Zoom',        color: 'indigo',  channelIcon: 'video' },
];

const MATCHED_JOBS_STUB: MatchedJob[] = [
  { id: 'j1', boardId: 'linkedin', company: 'Spotify',  logo: 'S', logoBg: '#1DB954', role: 'Senior Product Designer',  salary: '€80–100k',   location: 'Sztokholm / Remote', match: 94, postedAgo: '2h', easyApply: true },
  { id: 'j2', boardId: 'pracuj',   company: 'ING Hubs', logo: 'I', logoBg: '#FF6200', role: 'Sr. UX Designer',          salary: '20–26k PLN', location: 'Katowice',           match: 87, postedAgo: '4h', easyApply: true },
  { id: 'j3', boardId: 'nofluff',  company: 'Brainly',  logo: 'B', logoBg: '#1854D8', role: 'Product Designer (Mobile)',salary: '18–24k PLN', location: 'Remote',             match: 82, postedAgo: '1d', easyApply: false },
];

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

  // Weekly sent series for the sparkline. Falls back to a small constant
  // pattern so the chart isn't a flat line on a fresh account.
  protected readonly sentSeries = computed<number[]>(() => {
    const buckets = this.stats()?.weekly ?? [];
    if (buckets.length === 0) return [3, 5, 7, 6, 8, 4, 6, 3];
    return buckets.map((b) => b.applied);
  });

  // We don't have weekly response counts from the backend yet, so we
  // approximate a steady-rising series scaled to the current rate.
  protected readonly respSeries = computed<number[]>(() => {
    const pct = this.responseRatePct();
    if (pct === 0) return [1, 1, 2, 3, 3, 2, 4, 1];
    const sent = this.sentSeries();
    return sent.map((v) => Math.max(0, Math.round(v * (pct / 100))));
  });

  // Up to 3 company chips for "Rozmowy w toku" — surfaces who's mid-process.
  protected readonly interviewCompanies = computed<string[]>(() => {
    return this.applications()
      .filter((a) =>
        ['INTERVIEW_SCHEDULED', 'INTERVIEW_DONE', 'TASK_RECEIVED', 'TASK_SUBMITTED'].includes(
          a.currentStatus,
        ),
      )
      .slice(0, 3)
      .map((a) => a.companyName);
  });

  // Tiny inline-SVG path generator for the sparkline.
  protected sparkPath(data: number[], w = 88, h = 32): string {
    if (data.length === 0) return '';
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const step = w / (data.length - 1);
    return data
      .map((v, i) => {
        const x = (i * step).toFixed(1);
        const y = (h - ((v - min) / range) * h * 0.85 - 2).toFixed(1);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  }

  protected sparkAreaPath(data: number[], w = 88, h = 32): string {
    const line = this.sparkPath(data, w, h);
    if (!line) return '';
    return `${line} L${w},${h} L0,${h} Z`;
  }

  protected sparkLastPoint(data: number[], w = 88, h = 32): { x: number; y: number } {
    if (data.length === 0) return { x: 0, y: 0 };
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const step = w / (data.length - 1);
    const i = data.length - 1;
    return {
      x: i * step,
      y: h - ((data[i] - min) / range) * h * 0.85 - 2,
    };
  }

  // Week-over-week delta — fed to the Trend chip in the card header.
  protected readonly sentWeeklyDelta = computed<number>(() => {
    const w = this.stats()?.weekly ?? [];
    if (w.length < 2) return 0;
    return w[w.length - 1].applied - w[w.length - 2].applied;
  });

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

  // Surfaced from a fixed stub for now — the backend doesn't model interview
  // schedules / deadlines as first-class events yet, only nextFollowUpAt
  // timestamps. Swap to a real EventApi once that exists.
  protected readonly upcomingItems = signal<UpcomingItem[]>(UPCOMING_STUB);

  // ---------------- A/B CV stub ----------------

  protected readonly cvVersions = signal<CvVersion[]>(CV_VERSIONS_STUB);

  // ---------------- Follow-ups + Job Boards ----------------

  protected readonly jobBoards = signal<JobBoard[]>(JOB_BOARDS_STUB);
  protected readonly matchedJobs = signal<MatchedJob[]>(MATCHED_JOBS_STUB);
  protected readonly boardsTab = signal<'matched' | 'boards'>('matched');
  protected readonly composeFor = signal<ApiApplication | null>(null);
  protected readonly postFor = signal<MatchedJob | null>(null);
  protected readonly sentFollowUpIds = signal<Set<string>>(new Set());

  protected readonly followupCandidates = computed<ApiApplication[]>(() => {
    return this.applications()
      .filter((a) => {
        const days = this.daysSince(a.appliedAt) ?? 0;
        return days >= 5 &&
          !['OFFER', 'REJECTED', 'WITHDRAWN', 'GHOSTED'].includes(a.currentStatus);
      })
      .sort((a, b) => (this.daysSince(b.appliedAt) ?? 0) - (this.daysSince(a.appliedAt) ?? 0))
      .slice(0, 6);
  });

  protected readonly connectedBoards = computed(() => this.jobBoards().filter((b) => b.connected));
  protected readonly totalNewBoardJobs = computed(() =>
    this.connectedBoards().reduce((s, b) => s + b.newJobs, 0),
  );

  protected boardFor(id: string): JobBoard | undefined {
    return this.jobBoards().find((b) => b.id === id);
  }

  protected matchTier(score: number): 'high' | 'mid' | 'low' {
    return score >= 90 ? 'high' : score >= 80 ? 'mid' : 'low';
  }

  protected matchDash(score: number): string {
    return `${(score / 100) * 94.2} 94.2`;
  }

  protected openComposeFor(app: ApiApplication): void {
    this.composeFor.set(app);
  }

  protected closeCompose(): void {
    this.composeFor.set(null);
  }

  protected confirmComposeSend(): void {
    const app = this.composeFor();
    if (!app) return;
    this.sentFollowUpIds.update((set) => new Set(set).add(app.id));
    setTimeout(() => this.composeFor.set(null), 600);
  }

  protected openPostFor(job: MatchedJob): void {
    this.postFor.set(job);
  }

  protected closePost(): void {
    this.postFor.set(null);
  }

  // Relative % improvement of the winner over the loser, matching the
  // design's insight wording ("o X% wyższy response rate").
  protected readonly cvInsightDelta = computed(() => {
    const versions = this.cvVersions();
    const winner = versions.find((v) => v.isWinner);
    const loser = versions.find((v) => !v.isWinner);
    if (!winner || !loser || winner.sent === 0 || loser.sent === 0) return 0;
    const rateW = winner.responses / winner.sent;
    const rateL = loser.responses / loser.sent;
    if (rateL === 0) return 0;
    return Math.round(((rateW - rateL) / rateL) * 100);
  });

  protected readonly cvWinnerName = computed(() => {
    return this.cvVersions().find((v) => v.isWinner)?.name ?? '';
  });

  // Short label ("v3.2") for the insight sentence — full name is too long
  // and the design uses just the version prefix.
  protected readonly cvWinnerShort = computed(() => {
    const name = this.cvWinnerName();
    return name.split(/\s|—/)[0] || name;
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
