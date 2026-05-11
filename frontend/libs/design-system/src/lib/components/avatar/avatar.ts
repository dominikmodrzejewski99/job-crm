import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type DsAvatarSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ds-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (src()) {
      <img class="ds-avatar__img" [src]="src()" [alt]="alt()" />
    } @else {
      <span aria-hidden="true">{{ shortInitials() }}</span>
    }
  `,
  styleUrl: './avatar.scss',
  host: {
    '[class]': 'classes()',
    '[attr.aria-label]': 'src() ? null : alt() || initials()',
    role: 'img',
  },
})
export class DsAvatar {
  readonly size = input<DsAvatarSize>('md');
  readonly src = input<string | null>(null);
  readonly alt = input<string>('');
  readonly initials = input<string>('');

  protected readonly classes = computed(() => `ds-avatar ds-avatar--${this.size()}`);
  protected readonly shortInitials = computed(() => {
    const raw = this.initials().trim();
    if (raw) return raw.slice(0, 2).toUpperCase();
    const alt = this.alt().trim();
    if (!alt) return '?';
    return alt
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  });
}
