import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DsButton } from '@frontend/design-system/button';
import { DS_MODAL_DATA, DsModal, DsModalRef } from '@frontend/design-system/modal';

interface ConfirmData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'confirm-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsModal, DsButton],
  template: `
    <ds-modal>
      <h2 ds-modal-title>{{ data.title }}</h2>
      <p>{{ data.message }}</p>
      <ng-container ds-modal-actions>
        <button ds-button variant="ghost" size="md" (click)="ref.close(false)">
          {{ data.cancelText ?? 'Anuluj' }}
        </button>
        <button ds-button variant="primary" size="md" (click)="ref.close(true)">
          {{ data.confirmText ?? 'Potwierdź' }}
        </button>
      </ng-container>
    </ds-modal>
  `,
})
export class ConfirmModal {
  protected readonly ref = inject<DsModalRef<boolean>>(DsModalRef);
  protected readonly data = inject<ConfirmData>(DS_MODAL_DATA);
}
