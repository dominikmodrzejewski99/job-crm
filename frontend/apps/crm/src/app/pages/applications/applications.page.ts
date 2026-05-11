import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DsButton } from '@frontend/design-system/button';
import { DsCard, DsCardBody } from '@frontend/design-system/card';
import { DsCheckbox } from '@frontend/design-system/checkbox';
import { DsInput } from '@frontend/design-system/input';
import { DsOption, DsSelect } from '@frontend/design-system/select';
import { DsSkeleton } from '@frontend/design-system/skeleton';
import { DsTextarea } from '@frontend/design-system/textarea';
import { DsToastService } from '@frontend/design-system/toast';
import { DsModalService } from '@frontend/design-system/modal';
import { I18nService } from '@frontend/design-system/i18n';

import { ApplicationApi } from '../../api/application-api';
import { ApiApplication, ApiApplicationSource, statusToBadge } from '../../api/application-types';
import { ApplicationRow, ApplicationsGrid } from '../../applications-grid';
import { ConfirmModal } from '../../confirm-modal';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { PageTitleService } from '../../shell/page-title.service';

type FormSource = 'justjoin' | 'nofluff' | 'linkedin' | 'referral' | 'companysite' | 'other';

const SOURCE_MAP: Record<FormSource, ApiApplicationSource> = {
  justjoin:    'JUSTJOIN',
  nofluff:     'NOFLUFF',
  linkedin:    'LINKEDIN',
  referral:    'REFERRAL',
  companysite: 'COMPANY_SITE',
  other:       'OTHER',
};

@Component({
  selector: 'jt-applications-page',
  standalone: true,
  imports: [
    DsButton,
    DsCard,
    DsCardBody,
    DsInput,
    DsTextarea,
    DsCheckbox,
    DsSelect,
    DsOption,
    DsSkeleton,
    ApplicationsGrid,
    EmptyStateComponent,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './applications.page.html',
  styleUrl: './applications.page.scss',
})
export class ApplicationsPage {
  protected readonly i18n = inject(I18nService);
  private readonly titleService = inject(PageTitleService);
  private readonly api = inject(ApplicationApi);
  private readonly toast = inject(DsToastService);
  private readonly modal = inject(DsModalService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly applications = signal<ApiApplication[]>([]);
  protected readonly loading = signal(true);

  protected readonly search = signal('');
  protected readonly statusFilter = signal<string>('ALL');

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    return this.applications().filter((a) => {
      if (status !== 'ALL' && a.currentStatus !== status) return false;
      if (!q) return true;
      return (
        a.companyName.toLowerCase().includes(q) ||
        a.position.toLowerCase().includes(q)
      );
    });
  });

  protected readonly rows = computed<ApplicationRow[]>(() =>
    this.filtered().map((a) => ({
      id: a.id,
      company: a.companyName,
      position: a.position,
      status: statusToBadge(a.currentStatus),
      appliedAt: a.appliedAt,
    })),
  );

  // ---- Drawer state (deep-linked via ?drawer=new) ----
  protected readonly drawerOpen = signal(false);
  protected readonly submitting = signal(false);
  protected readonly company = signal('');
  protected readonly position = signal('');
  protected readonly notes = signal('');
  protected readonly source = signal<FormSource>('justjoin');
  protected readonly remote = signal(true);
  protected readonly attempted = signal(false);

  protected readonly companyError = computed(
    () => this.attempted() && this.company().trim().length < 2,
  );
  protected readonly positionError = computed(
    () => this.attempted() && this.position().trim().length === 0,
  );
  protected readonly formValid = computed(
    () => this.company().trim().length >= 2 && this.position().trim().length > 0,
  );

  constructor() {
    this.titleService.setTitle(
      this.i18n.translate('page.applications.title'),
      this.i18n.translate('page.applications.subtitle'),
    );
    this.load();

    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => {
        this.drawerOpen.set(params.get('drawer') === 'new');
      });
  }

  private load(): void {
    this.loading.set(true);
    this.api
      .list()
      .pipe(
        catchError(() => {
          this.toast.error(this.i18n.translate('toast.applications.loadFailed'));
          return of({ content: [] as ApiApplication[], totalElements: 0, totalPages: 0, number: 0, size: 0, empty: true });
        }),
      )
      .subscribe((page) => {
        this.applications.set(page.content);
        this.loading.set(false);
      });
  }

  protected openDrawer(): void {
    void this.router.navigate([], { queryParams: { drawer: 'new' }, queryParamsHandling: 'merge' });
  }

  protected closeDrawer(): void {
    this.resetForm();
    void this.router.navigate([], { queryParams: { drawer: null }, queryParamsHandling: 'merge' });
  }

  protected submit(): void {
    this.attempted.set(true);
    if (!this.formValid()) {
      this.toast.warning(this.i18n.translate('toast.form.fixErrors'));
      return;
    }
    this.submitting.set(true);
    this.api
      .create({
        companyName: this.company().trim(),
        position: this.position().trim(),
        source: SOURCE_MAP[this.source()],
        remote: this.remote(),
        location: null,
        appliedAt: new Date().toISOString().slice(0, 10),
        notes: this.notes() || null,
      })
      .subscribe({
        next: (created) => {
          this.applications.update((list) => [created, ...list]);
          this.toast.success(this.i18n.translate('toast.application.saved'));
          this.submitting.set(false);
          this.closeDrawer();
        },
        error: () => {
          this.toast.error(this.i18n.translate('toast.application.saveFailed'));
          this.submitting.set(false);
        },
      });
  }

  protected onDelete(id: string): void {
    const app = this.applications().find((a) => a.id === id);
    if (!app) return;
    const ref = this.modal.open<ConfirmModal, boolean>(ConfirmModal, {
      data: {
        title: `Usunąć ${app.companyName}?`,
        message: `Aplikacja "${app.position}" zostanie usunięta na zawsze.`,
        confirmText: 'Usuń',
        cancelText: 'Anuluj',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.api.delete(id).subscribe({
        next: () => {
          this.applications.update((list) => list.filter((a) => a.id !== id));
          this.toast.success(this.i18n.translate('toast.applications.deleted'), app.companyName);
        },
        error: () => this.toast.error(this.i18n.translate('toast.applications.deleteFailed')),
      });
    });
  }

  private resetForm(): void {
    this.company.set('');
    this.position.set('');
    this.notes.set('');
    this.source.set('justjoin');
    this.remote.set(true);
    this.attempted.set(false);
  }
}
