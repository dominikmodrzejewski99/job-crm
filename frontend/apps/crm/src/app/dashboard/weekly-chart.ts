import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface WeeklyPoint {
  weekStart: string;
  applied: number;
}

interface Geometry {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
  yMax: number;
  points: Array<{ x: number; y: number; raw: WeeklyPoint }>;
  linePath: string;
  areaPath: string;
  gridLines: Array<{ y: number; value: number }>;
  xLabels: Array<{ x: number; label: string }>;
}

@Component({
  selector: 'dashboard-weekly-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let g = geometry();
    <svg class="weekly" [attr.viewBox]="'0 0 ' + g.width + ' ' + g.height" preserveAspectRatio="none">
      <!-- Y-axis grid -->
      @for (gl of g.gridLines; track $index) {
        <line class="weekly__grid"
              [attr.x1]="g.padding.left" [attr.x2]="g.width - g.padding.right"
              [attr.y1]="gl.y" [attr.y2]="gl.y" />
        <text class="weekly__label"
              [attr.x]="g.padding.left - 6" [attr.y]="gl.y + 3"
              text-anchor="end">{{ gl.value }}</text>
      }
      <!-- X-axis -->
      <line class="weekly__axis"
            [attr.x1]="g.padding.left" [attr.x2]="g.width - g.padding.right"
            [attr.y1]="g.height - g.padding.bottom"
            [attr.y2]="g.height - g.padding.bottom" />
      <!-- Area + line -->
      <path class="weekly__area" [attr.d]="g.areaPath" />
      <path class="weekly__line" [attr.d]="g.linePath" />
      <!-- Dots -->
      @for (p of g.points; track $index) {
        <circle class="weekly__dot" [attr.cx]="p.x" [attr.cy]="p.y" r="3" />
      }
      <!-- X-axis labels (every other week to avoid overlap) -->
      @for (lbl of g.xLabels; track $index) {
        <text class="weekly__label"
              [attr.x]="lbl.x" [attr.y]="g.height - 4"
              text-anchor="middle">{{ lbl.label }}</text>
      }
    </svg>
  `,
  styleUrl: './weekly-chart.scss',
})
export class DashboardWeeklyChart {
  readonly data = input.required<WeeklyPoint[]>();

  protected readonly geometry = computed<Geometry>(() => {
    const data = this.data();
    const width = 640;
    const height = 160;
    const padding = { top: 12, right: 12, bottom: 22, left: 30 };

    const counts = data.map((d) => d.applied);
    const yMax = Math.max(1, ...counts, 4);

    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;
    const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

    const points = data.map((d, i) => {
      const x = padding.left + i * stepX;
      const y = padding.top + innerH - (d.applied / yMax) * innerH;
      return { x, y, raw: d };
    });

    const linePath = points.length === 0
      ? ''
      : points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    const areaPath = points.length === 0
      ? ''
      : `${linePath} L ${points[points.length - 1].x} ${padding.top + innerH} L ${points[0].x} ${padding.top + innerH} Z`;

    const gridSteps = 3;
    const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
      const value = Math.round((yMax * (gridSteps - i)) / gridSteps);
      const y = padding.top + (i * innerH) / gridSteps;
      return { y, value };
    });

    const xLabels = points
      .map((p, i) => ({ x: p.x, label: formatLabel(p.raw.weekStart), idx: i }))
      .filter((_, i) => i % 2 === 0)
      .map((l) => ({ x: l.x, label: l.label }));

    return { width, height, padding, yMax, points, linePath, areaPath, gridLines, xLabels };
  });
}

function formatLabel(weekStart: string): string {
  // weekStart is "YYYY-MM-DD" — show "d.M"
  const [, m, d] = weekStart.split('-');
  return `${parseInt(d, 10)}.${parseInt(m, 10)}`;
}
