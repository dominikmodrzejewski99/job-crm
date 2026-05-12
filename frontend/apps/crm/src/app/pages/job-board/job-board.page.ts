import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';

import { DsButton } from '@frontend/design-system/button';
import { DsBadge } from '@frontend/design-system/badge';
import { DsCard, DsCardBody } from '@frontend/design-system/card';
import { DsInput } from '@frontend/design-system/input';
import { DsOption, DsSelect } from '@frontend/design-system/select';
import { DsSkeleton } from '@frontend/design-system/skeleton';
import { DsToastService } from '@frontend/design-system/toast';
import { I18nService } from '@frontend/design-system/i18n';

import { ApplicationApi } from '../../api/application-api';
import { JobOfferApi } from '../../api/job-offer-api';
import { JobOffer } from '../../api/job-offer-types';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { PageTitleService } from '../../shell/page-title.service';

export type PostedWithin = 'ALL' | 'DAY' | 'THREE_DAYS' | 'WEEK' | 'MONTH';
export type SortBy = 'NEWEST' | 'OLDEST' | 'SALARY_DESC' | 'SALARY_ASC';
export type WorkMode = 'ALL' | 'REMOTE' | 'ONSITE';
export type Seniority = 'ALL' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD';
export type Category =
  | 'ALL'
  | 'FRONTEND'
  | 'BACKEND'
  | 'FULLSTACK'
  | 'DEVOPS'
  | 'MOBILE'
  | 'DATA'
  | 'QA'
  | 'OTHER';

// Detected from offer title (backend has no structured field for these).
const SENIORITY_RULES: ReadonlyArray<[Exclude<Seniority, 'ALL'>, RegExp]> = [
  ['LEAD', /\b(lead|principal|staff|architect|head\s+of)\b/i],
  ['SENIOR', /\b(senior|sr\.?|expert)\b/i],
  ['JUNIOR', /\b(junior|jr\.?|intern|trainee|graduate)\b/i],
  // Mid is the fallback when none of the above match.
];

const CATEGORY_RULES: ReadonlyArray<[Exclude<Category, 'ALL'>, RegExp]> = [
  ['FULLSTACK', /\b(full[\s-]?stack)\b/i],
  ['FRONTEND', /\b(front[\s-]?end|angular|react(?!\s+native)|vue|svelte|next\.?js|nuxt)\b/i],
  ['MOBILE', /\b(ios|android|mobile|flutter|react\s+native|swift|kotlin\s+(dev|engineer))\b/i],
  ['DEVOPS', /\b(devops|sre|platform\s+engineer|cloud\s+engineer|kubernetes|terraform|infra)\b/i],
  ['DATA', /\b(data\s+(engineer|scientist|analyst)|ml\s+engineer|machine\s+learning|analyst|bi\s)/i],
  ['QA', /\b(qa|tester|sdet|automation\s+(engineer|tester)|quality\s+assurance)\b/i],
  ['BACKEND', /\b(back[\s-]?end|java(?!\s*script)|spring|node|python|django|fastapi|\.net|c#|golang|\bgo\b|rust|php|laravel|ruby|rails)\b/i],
];

// Keywords we surface in the technology filter when they appear in titles.
const TECH_KEYWORDS = [
  'Angular', 'React', 'Vue', 'Svelte', 'Next.js', 'TypeScript', 'JavaScript',
  'Java', 'Spring', 'Kotlin', 'Scala',
  'Python', 'Django', 'FastAPI',
  'Node', 'NestJS',
  '.NET', 'C#', 'C++',
  'Go', 'Rust', 'PHP', 'Laravel', 'Ruby',
  'iOS', 'Swift', 'Android', 'Flutter', 'React Native',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform',
  'SQL', 'PostgreSQL', 'MongoDB',
] as const;

function detectSeniority(title: string): Exclude<Seniority, 'ALL'> {
  for (const [level, rx] of SENIORITY_RULES) {
    if (rx.test(title)) return level;
  }
  return 'MID';
}

function detectCategory(title: string): Exclude<Category, 'ALL'> {
  for (const [cat, rx] of CATEGORY_RULES) {
    if (rx.test(title)) return cat;
  }
  return 'OTHER';
}

@Component({
  selector: 'jt-job-board-page',
  standalone: true,
  imports: [
    DsButton,
    DsBadge,
    DsCard,
    DsCardBody,
    DsInput,
    DsSelect,
    DsOption,
    DsSkeleton,
    EmptyStateComponent,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './job-board.page.html',
  styleUrl: './job-board.page.scss',
})
export class JobBoardPage {
  protected readonly i18n = inject(I18nService);
  private readonly titleService = inject(PageTitleService);
  private readonly api = inject(JobOfferApi);
  private readonly applications = inject(ApplicationApi);
  private readonly toast = inject(DsToastService);

  protected readonly offers = signal<JobOffer[]>([]);
  protected readonly loading = signal(true);
  protected readonly crawlerRunning = signal(false);
  protected readonly savingId = signal<string | null>(null);
  protected readonly savedIds = signal<Set<string>>(new Set());

  protected readonly search = signal('');
  protected readonly sourceFilter = signal<'ALL' | 'JUSTJOIN' | 'NOFLUFF'>('ALL');
  protected readonly workMode = signal<WorkMode>('ALL');
  protected readonly locationFilter = signal<string>('ALL');
  protected readonly technologyFilter = signal<string>('ALL');
  protected readonly seniorityFilter = signal<Seniority>('ALL');
  protected readonly categoryFilter = signal<Category>('ALL');
  protected readonly currencyFilter = signal<string>('ALL');
  protected readonly postedWithin = signal<PostedWithin>('ALL');
  protected readonly salaryMin = signal<number | null>(null);
  protected readonly salaryMax = signal<number | null>(null);
  protected readonly sortBy = signal<SortBy>('NEWEST');

  protected readonly availableLocations = computed(() => {
    const set = new Set<string>();
    for (const o of this.offers()) {
      if (o.location) set.add(o.location);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pl'));
  });

  protected readonly availableTechnologies = computed(() => {
    const titles = this.offers().map((o) => o.title.toLowerCase()).join(' || ');
    return TECH_KEYWORDS.filter((t) => titles.includes(t.toLowerCase()));
  });

  protected readonly availableCurrencies = computed(() => {
    const set = new Set<string>();
    for (const o of this.offers()) {
      if (o.currency) set.add(o.currency);
    }
    return Array.from(set).sort();
  });

  // Cache detections so we don't re-run regex per filter computation.
  private readonly detectionCache = computed(() => {
    const map = new Map<string, { seniority: Exclude<Seniority, 'ALL'>; category: Exclude<Category, 'ALL'> }>();
    for (const o of this.offers()) {
      map.set(o.id, {
        seniority: detectSeniority(o.title),
        category: detectCategory(o.title),
      });
    }
    return map;
  });

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const src = this.sourceFilter();
    const wm = this.workMode();
    const loc = this.locationFilter();
    const tech = this.technologyFilter().toLowerCase();
    const sen = this.seniorityFilter();
    const cat = this.categoryFilter();
    const cur = this.currencyFilter();
    const postedAfter = this.postedAfterCutoff();
    const sMin = this.salaryMin();
    const sMax = this.salaryMax();
    const detect = this.detectionCache();

    const result = this.offers().filter((o) => {
      if (src !== 'ALL' && o.source !== src) return false;
      if (wm === 'REMOTE' && !o.remote) return false;
      if (wm === 'ONSITE' && o.remote) return false;
      if (loc !== 'ALL' && o.location !== loc) return false;
      if (tech !== 'all' && !o.title.toLowerCase().includes(tech)) return false;
      if (cur !== 'ALL' && o.currency !== cur) return false;
      if (sen !== 'ALL' && detect.get(o.id)?.seniority !== sen) return false;
      if (cat !== 'ALL' && detect.get(o.id)?.category !== cat) return false;
      if (postedAfter !== null) {
        const ts = new Date(o.postedAt ?? o.fetchedAt).getTime();
        if (ts < postedAfter) return false;
      }
      if (sMin !== null && (o.salaryMax ?? o.salaryMin ?? 0) < sMin) return false;
      if (sMax !== null && (o.salaryMin ?? o.salaryMax ?? Number.MAX_SAFE_INTEGER) > sMax) return false;
      if (!q) return true;
      return (
        o.title.toLowerCase().includes(q) ||
        o.companyName.toLowerCase().includes(q) ||
        (o.location ?? '').toLowerCase().includes(q)
      );
    });

    return this.sortOffers(result);
  });

  protected readonly activeFilterCount = computed(() => {
    let n = 0;
    if (this.sourceFilter() !== 'ALL') n++;
    if (this.workMode() !== 'ALL') n++;
    if (this.locationFilter() !== 'ALL') n++;
    if (this.technologyFilter() !== 'ALL') n++;
    if (this.seniorityFilter() !== 'ALL') n++;
    if (this.categoryFilter() !== 'ALL') n++;
    if (this.currencyFilter() !== 'ALL') n++;
    if (this.postedWithin() !== 'ALL') n++;
    if (this.salaryMin() !== null) n++;
    if (this.salaryMax() !== null) n++;
    return n;
  });

  protected readonly subtitle = computed(() => {
    const count = this.filtered().length;
    const total = this.offers().length;
    if (total === 0) return `0 ofert`;
    const latest = this.offers().reduce(
      (acc, o) => (o.fetchedAt > acc ? o.fetchedAt : acc),
      this.offers()[0].fetchedAt,
    );
    const counter = count === total ? `${total} ofert` : `${count} z ${total}`;
    return `${counter} · świeże do ${this.relativeTime(latest)}`;
  });

  protected readonly seniorityOptions: ReadonlyArray<{ value: Seniority; label: string }> = [
    { value: 'ALL', label: 'Wszystkie' },
    { value: 'JUNIOR', label: 'Junior' },
    { value: 'MID', label: 'Mid' },
    { value: 'SENIOR', label: 'Senior' },
    { value: 'LEAD', label: 'Lead' },
  ];

  protected readonly categoryOptions: ReadonlyArray<{ value: Category; label: string }> = [
    { value: 'ALL', label: 'Wszystkie' },
    { value: 'FRONTEND', label: 'Frontend' },
    { value: 'BACKEND', label: 'Backend' },
    { value: 'FULLSTACK', label: 'Fullstack' },
    { value: 'DEVOPS', label: 'DevOps' },
    { value: 'MOBILE', label: 'Mobile' },
    { value: 'DATA', label: 'Data / AI' },
    { value: 'QA', label: 'QA' },
    { value: 'OTHER', label: 'Inne' },
  ];

  protected readonly workModeOptions: ReadonlyArray<{ value: WorkMode; label: string }> = [
    { value: 'ALL', label: 'Wszędzie' },
    { value: 'REMOTE', label: 'Remote' },
    { value: 'ONSITE', label: 'Stacjonarnie' },
  ];

  private sortOffers(offers: JobOffer[]): JobOffer[] {
    const sorted = [...offers];
    const dateOf = (o: JobOffer) => new Date(o.postedAt ?? o.fetchedAt).getTime();
    const salaryOf = (o: JobOffer) => o.salaryMax ?? o.salaryMin ?? -1;
    switch (this.sortBy()) {
      case 'NEWEST':
        sorted.sort((a, b) => dateOf(b) - dateOf(a));
        break;
      case 'OLDEST':
        sorted.sort((a, b) => dateOf(a) - dateOf(b));
        break;
      case 'SALARY_DESC':
        sorted.sort((a, b) => salaryOf(b) - salaryOf(a));
        break;
      case 'SALARY_ASC':
        // Push "no salary" offers (-1) to the end.
        sorted.sort((a, b) => {
          const sa = salaryOf(a);
          const sb = salaryOf(b);
          if (sa < 0 && sb < 0) return 0;
          if (sa < 0) return 1;
          if (sb < 0) return -1;
          return sa - sb;
        });
        break;
    }
    return sorted;
  }

  private postedAfterCutoff(): number | null {
    const w = this.postedWithin();
    if (w === 'ALL') return null;
    const now = Date.now();
    const day = 86_400_000;
    if (w === 'DAY') return now - day;
    if (w === 'THREE_DAYS') return now - 3 * day;
    if (w === 'WEEK') return now - 7 * day;
    if (w === 'MONTH') return now - 30 * day;
    return null;
  }

  private relativeTime(iso: string): string {
    const date = new Date(iso);
    const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    if (days < 1) return 'dzisiaj';
    if (days === 1) return 'wczoraj';
    if (days < 7) return `${days} dni temu`;
    if (days < 30) return `${Math.floor(days / 7)} tyg. temu`;
    return date.toLocaleDateString('pl-PL');
  }

  constructor() {
    this.titleService.setTitle(
      this.i18n.translate('page.jobBoard.title'),
      this.i18n.translate('page.jobBoard.subtitle'),
    );
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api
      .list()
      .pipe(catchError(() => of({ content: [] as JobOffer[], totalElements: 0, totalPages: 0, number: 0, size: 0, empty: true })))
      .subscribe((page) => {
        this.offers.set(page.content);
        this.loading.set(false);
      });
  }

  protected refresh(): void {
    this.crawlerRunning.set(true);
    this.api.refreshCrawler().subscribe({
      next: (report) => {
        this.crawlerRunning.set(false);
        this.toast.success(
          this.i18n.translate('toast.crawler.success'),
          `+${report.inserted} / ~${report.updated}`,
        );
        this.load();
      },
      error: () => {
        this.crawlerRunning.set(false);
        this.toast.error(this.i18n.translate('toast.crawler.error'));
      },
    });
  }

  protected save(offerId: string): void {
    this.savingId.set(offerId);
    this.api.saveAsApplication(offerId).subscribe({
      next: (created) => {
        this.savingId.set(null);
        this.savedIds.update((set) => new Set(set).add(offerId));
        this.toast.success(
          this.i18n.translate('toast.jobOffer.savedAsApplication'),
          created.companyName,
        );
      },
      error: () => {
        this.savingId.set(null);
        this.toast.error(this.i18n.translate('toast.jobOffer.saveFailed'));
      },
    });
  }

  protected resetFilters(): void {
    this.search.set('');
    this.sourceFilter.set('ALL');
    this.workMode.set('ALL');
    this.locationFilter.set('ALL');
    this.technologyFilter.set('ALL');
    this.seniorityFilter.set('ALL');
    this.categoryFilter.set('ALL');
    this.currencyFilter.set('ALL');
    this.postedWithin.set('ALL');
    this.salaryMin.set(null);
    this.salaryMax.set(null);
  }

  protected onSalaryMinChange(value: string): void {
    const n = Number(value);
    this.salaryMin.set(Number.isFinite(n) && n > 0 ? n : null);
  }

  protected onSalaryMaxChange(value: string): void {
    const n = Number(value);
    this.salaryMax.set(Number.isFinite(n) && n > 0 ? n : null);
  }

  protected formatSalary(o: JobOffer): string | null {
    if (o.salaryMin === null && o.salaryMax === null) return null;
    const cur = o.currency ?? '';
    const fmt = (n: number) => Math.round(n).toLocaleString('pl-PL');
    if (o.salaryMin && o.salaryMax) return `${fmt(o.salaryMin)} – ${fmt(o.salaryMax)} ${cur}`;
    if (o.salaryMax) return `do ${fmt(o.salaryMax)} ${cur}`;
    if (o.salaryMin) return `od ${fmt(o.salaryMin)} ${cur}`;
    return null;
  }

  protected formatPosted(o: JobOffer): string {
    return this.relativeTime(o.postedAt ?? o.fetchedAt);
  }

  protected offerSeniority(o: JobOffer): Exclude<Seniority, 'ALL'> {
    return this.detectionCache().get(o.id)?.seniority ?? 'MID';
  }

  protected offerCategory(o: JobOffer): Exclude<Category, 'ALL'> {
    return this.detectionCache().get(o.id)?.category ?? 'OTHER';
  }

  protected seniorityLabel(s: Exclude<Seniority, 'ALL'>): string {
    return this.seniorityOptions.find((o) => o.value === s)?.label ?? s;
  }

  protected categoryLabel(c: Exclude<Category, 'ALL'>): string {
    return this.categoryOptions.find((o) => o.value === c)?.label ?? c;
  }
}
