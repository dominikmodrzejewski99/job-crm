import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  contentChild,
  input,
} from '@angular/core';

/**
 * Single tab declaration. Wrap the panel body in an <ng-template> child so the
 * parent <ds-tabs> can stamp only the active tab's content.
 *
 *   <ds-tab label="Overview">
 *     <ng-template>...content...</ng-template>
 *   </ds-tab>
 */
@Component({
  selector: 'ds-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  host: { hidden: 'true' },
})
export class DsTab {
  readonly label = input.required<string>();
  readonly disabled = input(false, { transform: (v: boolean | string) => v === '' || v === true });

  readonly panel = contentChild(TemplateRef);
}
