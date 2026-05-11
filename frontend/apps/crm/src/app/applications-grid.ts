import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule,
  ColDef,
  GridOptions,
  ModuleRegistry,
  Theme,
  colorSchemeDark,
  colorSchemeLight,
  themeQuartz,
} from 'ag-grid-community';

import { DsApplicationStatus } from '@frontend/design-system/badge';

import {
  GridActionsCell,
  GridCompanyCell,
  GridStatusCell,
} from './grid-renderers';

// AG Grid module registration — required once per app for the community
// bundle. Doing it module-scope keeps the side effect close to the consumer.
ModuleRegistry.registerModules([AllCommunityModule]);

export interface ApplicationRow {
  id: number;
  company: string;
  position: string;
  status: DsApplicationStatus;
  appliedAt: string;
}

const sharedThemeParams = {
  fontFamily: { googleFont: 'Inter' },
  fontSize: 13,
  cellHorizontalPadding: 14,
  rowHeight: 44,
  headerHeight: 38,
  spacing: 6,
  wrapperBorderRadius: 0,
  borderRadius: 4,
};

const lightTheme: Theme = themeQuartz.withPart(colorSchemeLight).withParams({
  ...sharedThemeParams,
  backgroundColor: '#ffffff',
  foregroundColor: '#0e0e14',
  chromeBackgroundColor: '#f4f4f6',
  headerBackgroundColor: '#f4f4f6',
  headerTextColor: '#6c6c79',
  borderColor: '#e7e7eb',
  rowHoverColor: 'rgba(91, 77, 238, 0.04)',
  selectedRowBackgroundColor: 'rgba(91, 77, 238, 0.08)',
  accentColor: '#5b4dee',
  inputFocusBorder: { color: '#5b4dee' },
});

const darkTheme: Theme = themeQuartz.withPart(colorSchemeDark).withParams({
  ...sharedThemeParams,
  backgroundColor: '#111118',
  foregroundColor: '#f3f3f6',
  chromeBackgroundColor: '#15151d',
  headerBackgroundColor: '#15151d',
  headerTextColor: '#9a9aa6',
  borderColor: '#23232f',
  rowHoverColor: 'rgba(122, 106, 255, 0.08)',
  selectedRowBackgroundColor: 'rgba(122, 106, 255, 0.14)',
  accentColor: '#7a6aff',
  inputFocusBorder: { color: '#7a6aff' },
});

@Component({
  selector: 'applications-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridAngular],
  template: `
    <ag-grid-angular
      class="applications-grid"
      [theme]="theme()"
      [rowData]="rows()"
      [columnDefs]="columnDefs"
      [defaultColDef]="defaultColDef"
      [gridOptions]="gridOptions"
      [context]="context"
    />
  `,
  styleUrl: './applications-grid.scss',
})
export class ApplicationsGrid {
  readonly rows = input<ApplicationRow[]>([]);
  readonly themeMode = input<'light' | 'dark'>('dark');

  readonly delete = output<number>();

  protected readonly theme = computed<Theme>(() =>
    this.themeMode() === 'dark' ? darkTheme : lightTheme,
  );

  protected readonly defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    suppressMovable: false,
  };

  protected readonly columnDefs: ColDef<ApplicationRow>[] = [
    {
      field: 'company',
      headerName: 'Firma',
      cellRenderer: GridCompanyCell,
      flex: 1.4,
      minWidth: 180,
    },
    {
      field: 'position',
      headerName: 'Stanowisko',
      flex: 1.6,
      minWidth: 200,
    },
    {
      field: 'status',
      headerName: 'Status',
      cellRenderer: GridStatusCell,
      width: 200,
      filter: 'agSetColumnFilter',
    },
    {
      field: 'appliedAt',
      headerName: 'Aplikowano',
      width: 140,
      sort: 'desc',
      cellClass: 'mono-cell',
    },
    {
      headerName: '',
      cellRenderer: GridActionsCell,
      width: 60,
      sortable: false,
      filter: false,
      resizable: false,
      cellStyle: { textAlign: 'right', padding: 0 },
    },
  ];

  protected readonly gridOptions: GridOptions<ApplicationRow> = {
    animateRows: true,
    pagination: true,
    paginationPageSize: 5,
    paginationPageSizeSelector: [5, 10, 20, 50],
    suppressCellFocus: true,
    domLayout: 'normal',
  };

  /**
   * Exposed to AG Grid via [context] so cell renderers (which don't have
   * access to this component's instance directly) can call back through it.
   */
  protected readonly context = {
    delete: (id: number) => this.delete.emit(id),
  };
}
