import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Card container. Use with optional <ds-card-header>, <ds-card-body>,
 * <ds-card-footer> sub-components for structured content.
 */
@Component({
  selector: 'ds-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card.html',
  styleUrl: './card.scss',
  host: { class: 'ds-card' },
})
export class DsCard {}

@Component({
  selector: 'ds-card-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card.html',
  styleUrls: ['./card.scss'],
  host: { class: 'ds-card__header' },
})
export class DsCardHeader {}

@Component({
  selector: 'ds-card-body',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card.html',
  styleUrls: ['./card.scss'],
  host: { class: 'ds-card__body' },
})
export class DsCardBody {}

@Component({
  selector: 'ds-card-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card.html',
  styleUrls: ['./card.scss'],
  host: { class: 'ds-card__footer' },
})
export class DsCardFooter {}
