import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DsApplicationStatus } from '@frontend/design-system/badge';

interface Row {
  key: DsApplicationStatus;
  label: string;
  count: number;
  widthPct: number;
  colorVar: string;
}

const ORDER: { key: DsApplicationStatus; label: string }[] = [
  { key: 'draft',    label: 'Draft' },
  { key: 'applied',  label: 'Applied' },
  { key: 'ack',      label: 'Ack received' },
  { key: 'intsch',   label: 'Interview scheduled' },
  { key: 'intdone',  label: 'Interview done' },
  { key: 'taskrx',   label: 'Task received' },
  { key: 'tasktx',   label: 'Task submitted' },
  { key: 'offer',    label: 'Offer' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'withdraw', label: 'Withdrawn' },
  { key: 'ghosted',  label: 'Ghosted' },
];

const API_TO_BADGE: Record<string, DsApplicationStatus> = {
  DRAFT: 'draft',
  APPLIED: 'applied',
  ACK_RECEIVED: 'ack',
  INTERVIEW_SCHEDULED: 'intsch',
  INTERVIEW_DONE: 'intdone',
  TASK_RECEIVED: 'taskrx',
  TASK_SUBMITTED: 'tasktx',
  OFFER: 'offer',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdraw',
  GHOSTED: 'ghosted',
};

@Component({
  selector: 'dashboard-status-bars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="status-bars">
      @for (row of rows(); track row.key) {
        <div class="status-bars__row">
          <span class="status-bars__label">{{ row.label }}</span>
          <div class="status-bars__track">
            <div
              class="status-bars__fill"
              [style.--st-fill]="'var(' + row.colorVar + ')'"
              [style.width.%]="row.widthPct"
            ></div>
          </div>
          <span class="status-bars__count">{{ row.count }}</span>
        </div>
      }
    </div>
  `,
  styleUrl: './status-bars.scss',
})
export class DashboardStatusBars {
  /** Map keyed by backend status names (UPPER_CASE) — pass byStatus directly. */
  readonly counts = input.required<Record<string, number>>();

  protected readonly rows = computed<Row[]>(() => {
    const raw = this.counts();
    const normalized = new Map<DsApplicationStatus, number>();
    for (const [apiKey, count] of Object.entries(raw)) {
      const mapped = API_TO_BADGE[apiKey];
      if (mapped) normalized.set(mapped, count);
    }
    const max = Math.max(1, ...normalized.values());

    return ORDER.map((entry) => {
      const count = normalized.get(entry.key) ?? 0;
      return {
        key: entry.key,
        label: entry.label,
        count,
        widthPct: (count / max) * 100,
        colorVar: `--st-${entry.key}-fg`,
      };
    });
  });
}
