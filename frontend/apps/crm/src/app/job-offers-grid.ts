import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridOptions,
  Theme,
  colorSchemeDark,
  colorSchemeLight,
  themeQuartz,
} from 'ag-grid-community';

import { JobOffer } from './api/job-offer-types';
import {
  GridSalaryCell,
  GridSaveOfferCell,
  GridSourceCell,
} from './grid-job-renderers';

const sharedParams = {
  fontFamily: { googleFont: 'Geist' },
  fontSize: 13,
  cellHorizontalPadding: 14,
  rowHeight: 44,
  headerHeight: 38,
  spacing: 6,
  wrapperBorderRadius: 0,
  borderRadius: 4,
};

const lightTheme: Theme = themeQuartz.withPart(colorSchemeLight).withParams({
  ...sharedParams,
  backgroundColor: '#ffffff',
  foregroundColor: '#141b41',
  chromeBackgroundColor: '#f7f9fd',
  headerBackgroundColor: '#f7f9fd',
  headerTextColor: '#4a5380',
  borderColor: '#d9e1f2',
  rowHoverColor: 'rgba(145, 142, 244, 0.06)',
  accentColor: '#918ef4',
});

const darkTheme: Theme = themeQuartz.withPart(colorSchemeDark).withParams({
  ...sharedParams,
  backgroundColor: '#111118',
  foregroundColor: '#f3f3f6',
  chromeBackgroundColor: '#15151d',
  headerBackgroundColor: '#15151d',
  headerTextColor: '#9a9aa6',
  borderColor: '#23232f',
  rowHoverColor: 'rgba(145, 142, 244, 0.10)',
  accentColor: '#918ef4',
});

@Component({
  selector: 'job-offers-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridAngular],
  template: `
    <ag-grid-angular
      class="job-offers-grid"
      [theme]="theme()"
      [rowData]="rows()"
      [columnDefs]="columnDefs"
      [defaultColDef]="defaultColDef"
      [gridOptions]="gridOptions"
      [context]="context"
    />
  `,
  styleUrl: './job-offers-grid.scss',
})
export class JobOffersGrid {
  readonly rows = input<JobOffer[]>([]);
  readonly themeMode = input<'light' | 'dark'>('dark');

  readonly save = output<string>();

  protected readonly theme = computed<Theme>(() =>
    this.themeMode() === 'dark' ? darkTheme : lightTheme,
  );

  protected readonly defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  protected readonly columnDefs: ColDef<JobOffer>[] = [
    { field: 'source', headerName: 'Źródło', cellRenderer: GridSourceCell, width: 140 },
    { field: 'companyName', headerName: 'Firma', flex: 1.2, minWidth: 160 },
    { field: 'title', headerName: 'Stanowisko', flex: 1.8, minWidth: 220 },
    { field: 'location', headerName: 'Lokalizacja', flex: 1, minWidth: 140,
      valueGetter: (p) => p.data?.remote ? `${p.data.location ?? ''} · remote` : p.data?.location },
    { headerName: 'Widełki', cellRenderer: GridSalaryCell, width: 200, filter: false, sortable: false },
    { field: 'postedAt', headerName: 'Opublikowano', width: 140 },
    { headerName: '', cellRenderer: GridSaveOfferCell, width: 110, sortable: false, filter: false, resizable: false,
      cellStyle: { textAlign: 'right', padding: 0 } },
  ];

  protected readonly gridOptions: GridOptions<JobOffer> = {
    animateRows: true,
    pagination: true,
    paginationPageSize: 10,
    paginationPageSizeSelector: [10, 25, 50, 100],
    suppressCellFocus: true,
    domLayout: 'normal',
  };

  protected readonly context = {
    save: (id: string) => this.save.emit(id),
  };
}
