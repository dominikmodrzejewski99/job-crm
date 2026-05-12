import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';

import { DsBadge } from '@frontend/design-system/badge';
import { DsButton } from '@frontend/design-system/button';
import { DsSkeleton } from '@frontend/design-system/skeleton';
import { DsToastService } from '@frontend/design-system/toast';
import { I18nService } from '@frontend/design-system/i18n';

import { ApiApplication, statusToBadge } from '../../api/application-types';
import { FollowUpApi } from '../../api/follow-up-api';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { PageTitleService } from '../../shell/page-title.service';

interface Bucket {
  readonly kind: 'overdue' | 'today' | 'thisWeek' | 'later';
  readonly title: string;
  readonly items: ApiApplication[];
}

interface Template {
  readonly id: string;
  readonly label: string;
  readonly subject: string;
  readonly body: string;
}

// Three preset templates lifted from the Claude Design followups handoff —
// gentle reminder, value-add nudge, final dignity-preserving check-in.
const TEMPLATES: Template[] = [
  {
    id: 'gentle',
    label: 'Delikatny ping',
    subject: 'Re: Aplikacja na {role}',
    body: `Cześć {name},

Chciał(a)bym dopytać o status mojej aplikacji na pozycję {role} z dnia {date}. Wciąż jestem bardzo zainteresowan(a) tą rolą i chętnie dostarczę dodatkowe informacje, jeśli będą potrzebne.

Pozdrawiam`,
  },
  {
    id: 'value',
    label: 'Z dodatkową wartością',
    subject: 'Mój wkład w {company} — szybki update',
    body: `Cześć {name},

W nawiązaniu do aplikacji z {date} — chciał(a)bym podzielić się świeżym case study, które dobrze pokazuje moje podejście do problemów podobnych do tych w {company}.

Daj znać, jeśli to dobry moment na rozmowę.

Pozdrawiam`,
  },
  {
    id: 'final',
    label: 'Ostateczne dopytanie',
    subject: 'Czy moja aplikacja jest jeszcze aktywna?',
    body: `Cześć {name},

Minęło już parę tygodni od mojej aplikacji na {role}. Rozumiem, że proces rekrutacyjny może się przeciągać — chciał(a)bym tylko upewnić się, że moja aplikacja nie zaginęła i czy mogę spodziewać się odpowiedzi.

Pozdrawiam`,
  },
];

@Component({
  selector: 'jt-follow-up-page',
  standalone: true,
  imports: [DsBadge, DsButton, DsSkeleton, EmptyStateComponent, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './follow-up.page.html',
  styleUrl: './follow-up.page.scss',
})
export class FollowUpPage {
  protected readonly i18n = inject(I18nService);
  private readonly titleService = inject(PageTitleService);
  private readonly api = inject(FollowUpApi);
  private readonly toast = inject(DsToastService);

  protected readonly items = signal<ApiApplication[]>([]);
  protected readonly loading = signal(true);
  protected readonly busyId = signal<string | null>(null);

  protected readonly composeFor = signal<ApiApplication | null>(null);
  protected readonly templateId = signal<string>('gentle');
  protected readonly sentIds = signal<Set<string>>(new Set());

  protected readonly templates = TEMPLATES;

  protected readonly statusToBadge = statusToBadge;

  protected readonly buckets = computed<Bucket[]>(() => {
    const items = this.items();
    if (items.length === 0) return [];
    const now = Date.now();
    const today: ApiApplication[] = [];
    const overdue: ApiApplication[] = [];
    const thisWeek: ApiApplication[] = [];
    const later: ApiApplication[] = [];

    for (const a of items) {
      if (!a.nextFollowUpAt) continue;
      const t = new Date(a.nextFollowUpAt).getTime();
      const days = Math.floor((t - now) / 86_400_000);
      if (days < 0) overdue.push(a);
      else if (days === 0) today.push(a);
      else if (days <= 7) thisWeek.push(a);
      else later.push(a);
    }

    return [
      { kind: 'overdue' as const,  title: 'Przegapione',     items: overdue },
      { kind: 'today' as const,    title: 'Na dziś',         items: today },
      { kind: 'thisWeek' as const, title: 'W tym tygodniu',  items: thisWeek },
      { kind: 'later' as const,    title: 'Później',         items: later },
    ].filter((b) => b.items.length > 0);
  });

  protected readonly currentTemplate = computed<Template>(() => {
    return TEMPLATES.find((t) => t.id === this.templateId()) ?? TEMPLATES[0];
  });

  protected readonly filledSubject = computed<string>(() => {
    const app = this.composeFor();
    if (!app) return '';
    return this.fillTemplate(this.currentTemplate().subject, app);
  });

  protected readonly filledBody = computed<string>(() => {
    const app = this.composeFor();
    if (!app) return '';
    return this.fillTemplate(this.currentTemplate().body, app);
  });

  constructor() {
    this.titleService.setTitle(
      this.i18n.translate('page.followUp.title'),
      this.i18n.translate('page.followUp.subtitle'),
    );
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api
      .upcoming(30)
      .pipe(catchError(() => of([] as ApiApplication[])))
      .subscribe((items) => {
        this.items.set(items);
        this.loading.set(false);
      });
  }

  protected openCompose(app: ApiApplication): void {
    this.composeFor.set(app);
    this.templateId.set('gentle');
  }

  protected closeCompose(): void {
    this.composeFor.set(null);
  }

  protected selectTemplate(id: string): void {
    this.templateId.set(id);
  }

  protected sendCompose(): void {
    const app = this.composeFor();
    if (!app) return;
    this.busyId.set(app.id);
    // Optimistic UI — mark sent client-side, then call markDone so the
    // backend's nextFollowUpAt clears and the row leaves the inbox.
    this.sentIds.update((set) => new Set(set).add(app.id));
    this.api.markDone(app.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.items.update((list) => list.filter((a) => a.id !== app.id));
        this.toast.success('Follow-up wysłany');
        setTimeout(() => this.composeFor.set(null), 400);
      },
      error: () => {
        this.busyId.set(null);
        this.sentIds.update((set) => {
          const next = new Set(set);
          next.delete(app.id);
          return next;
        });
        this.toast.error('Nie udało się wysłać follow-upu');
      },
    });
  }

  protected markDone(id: string): void {
    this.busyId.set(id);
    this.api.markDone(id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.items.update((list) => list.filter((a) => a.id !== id));
        this.toast.success(this.i18n.translate('toast.followUp.done'));
      },
      error: () => {
        this.busyId.set(null);
        this.toast.error(this.i18n.translate('toast.followUp.doneFailed'));
      },
    });
  }

  protected snooze(id: string, days: number): void {
    this.busyId.set(id);
    this.api.snooze(id, days).subscribe({
      next: () => {
        this.busyId.set(null);
        this.items.update((list) => list.filter((a) => a.id !== id));
        this.toast.info(this.i18n.translate('toast.followUp.snoozed'), `+${days}d`);
      },
      error: () => {
        this.busyId.set(null);
        this.toast.error(this.i18n.translate('toast.followUp.snoozeFailed'));
      },
    });
  }

  protected relativeDue(iso: string | null): string {
    if (!iso) return '—';
    const t = new Date(iso).getTime();
    const days = Math.floor((t - Date.now()) / 86_400_000);
    if (days < 0) return `${Math.abs(days)} dni po terminie`;
    if (days === 0) return 'dzisiaj';
    if (days === 1) return 'jutro';
    return `za ${days} dni`;
  }

  protected recruiterEmail(company: string): string {
    return `rekrutacja@${company.toLowerCase().replace(/\s+/g, '')}.com`;
  }

  private fillTemplate(text: string, app: ApiApplication): string {
    const date = app.appliedAt
      ? new Date(app.appliedAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })
      : '—';
    return text
      .replace(/{role}/g, app.position)
      .replace(/{company}/g, app.companyName)
      .replace(/{name}/g, 'Zespole')
      .replace(/{date}/g, date);
  }
}
