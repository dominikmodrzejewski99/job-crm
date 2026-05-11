import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  input,
  model,
} from '@angular/core';
import { DsTab } from './tab';

let nextId = 0;

export type DsTabsOrientation = 'horizontal' | 'vertical';

@Component({
  selector: 'ds-tabs',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabs.html',
  styleUrl: './tabs.scss',
  host: {
    '[class]': 'rootClasses()',
  },
})
export class DsTabs {
  readonly orientation = input<DsTabsOrientation>('horizontal');

  /** Active tab index — two-way bindable. */
  readonly active = model<number>(0);

  readonly tabs = contentChildren(DsTab);

  protected readonly groupId = `ds-tabs-${++nextId}`;

  protected readonly rootClasses = computed(
    () => `ds-tabs ds-tabs--${this.orientation()}`,
  );

  protected readonly listClasses = computed(
    () => `ds-tabs__list ds-tabs__list--${this.orientation()}`,
  );

  protected tabClasses(index: number): string {
    const base = 'ds-tabs__tab';
    return index === this.active() ? `${base} is-active` : base;
  }

  protected tabId(i: number): string { return `${this.groupId}-tab-${i}`; }
  protected panelId(i: number): string { return `${this.groupId}-panel-${i}`; }

  protected select(index: number): void {
    const tab = this.tabs()[index];
    if (!tab || tab.disabled()) return;
    this.active.set(index);
  }

  protected onKeydown(event: KeyboardEvent, current: number): void {
    const list = this.tabs();
    if (list.length === 0) return;
    const isHorizontal = this.orientation() === 'horizontal';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

    let target = current;
    if (event.key === nextKey) target = (current + 1) % list.length;
    else if (event.key === prevKey) target = (current - 1 + list.length) % list.length;
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = list.length - 1;
    else return;

    event.preventDefault();
    // Skip disabled tabs by walking forward.
    let safety = list.length;
    while (list[target]?.disabled() && safety-- > 0) {
      target = (target + 1) % list.length;
    }
    this.select(target);
  }
}
