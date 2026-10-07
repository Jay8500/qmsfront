import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, signal, inject, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';

interface capaTable {
  id: number;
  kpi_id: any;
  kpi_name: any;
  frequency_name: any;
  kpi_code: any;
  kpi_type_name: any;
  department_name: any;
  unit_of_measure_name: any;
  kpi_formula: any;
  kpi_actual_score_status: any;
  target_benchmark: any;
  is_capa_completed: boolean;
}

export type SortColumn = keyof capaTable | '';
export type SortDirection = 'asc' | 'desc' | '';
const rotate: { [key: string]: SortDirection } = { asc: 'desc', desc: '', '': 'asc' };
const compare = (v1: string | number, v2: string | number) => (v1 < v2 ? -1 : v1 > v2 ? 1 : 0);

export interface SortEvent {
  column: SortColumn;
  direction: SortDirection;
}

@Directive({
  selector: 'th[sortable]',
  standalone: true,
  host: {
    '[class.asc]': 'direction === "asc"',
    '[class.desc]': 'direction === "desc"',
    '(click)': 'rotate()',
  },
})
export class NgbdSortableHeader {
  @Input() sortable: SortColumn = '';
  @Input() direction: SortDirection = '';
  @Output() sort = new EventEmitter<SortEvent>();

  rotate() {
    this.direction = rotate[this.direction];
    this.sort.emit({ column: this.sortable, direction: this.direction });
  }
}

@Component({
  selector: 'app-capa-dashboard',
  imports: [CommonModule, NgbdSortableHeader, SharedModule],
  templateUrl: './capa-dashboard.component.html',
})
export class CapaDashboardComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    kpi_name: null,
    frequency_name: null,
    kpi_code: null,
    kpi_type_name: null,
    kpi_actual_score_status: null,
  });
  public capaFilters = signal(JSON.parse(this.intialFilters));
  public kpiNameList: any = [];
  public frequencyNameList: any = [];
  public kpiCodeList: any = [];
  public kpiTypeList: any = [];
  public kpiStatusList: any = [];
  public capaGrid: capaTable[] = [];
  public router = inject(Router);
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;
  // Filter Dropdown
  selectedRange: string = 'Last 30 days';
  public copyData: any = [];

  constructor(public _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
      await this.setRange(this.selectedRange);
      await this.getCapaGrid();
    } catch (e) { }
  }

  onSort({ column, direction }: SortEvent) {
    // resetting other headers
    for (const header of this.headers) {
      if (header.sortable !== column) {
        header.direction = '';
      }
    }
    // sorting data
    if (direction === '' || column === '') {
      this.capaGrid = this.capaGrid;
    } else {
      this.capaGrid = [...this.capaGrid].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  public date_range: any = null;
  async setRange(value: string) {
    this.selectedRange = value;
    let getSrvrDt: any = await this._hqms.getServerDate('DATE');
    let today: any = new Date(getSrvrDt);
    let endDateToday: any = new Date();
    let prev7Day: any = null;
    this.date_range = null;
    this.selectedRange = value;
    switch (value) {
      case 'Last 7 days':
        prev7Day = new Date(today.setDate(today.getDate() - 7));
        this.date_range = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 30 days':
        prev7Day = new Date(today.setDate(today.getDate() - 30));
        this.date_range = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last Month':
        let firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        let lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        this.date_range = `${this._datePipe.transform(firstDayLastMonth, "dd-MMM-yyyy")} - ${this._datePipe.transform(lastDayLastMonth, "dd-MMM-yyyy")}`;
        break;
      case 'Last 6 Months':
        prev7Day = new Date(today.setDate(today.getDate() - 180));
        this.date_range = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last Year':
        prev7Day = new Date(today.setDate(today.getDate() - 365));
        this.date_range = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
    };
    await this.getCapaStats();
  }

  public initailStats = JSON.stringify({
    total_indicators_cnt: 0,
    total_department_cnt: 0,
    total_capa_cnt: 0,
    avg_compliance_cnt: 0,
    total_indicators_cnt_last_updated: null,
    total_department_cnt_last_updated: null,
    total_capa_cnt_last_updated: null,
    avg_compliance_cnt_last_updated: null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getCapaStats() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      let getCapaStatsInfo: any = await this._hqms.customGetApiCall('GET', 'fnKpiDashboardStats',
        {
          "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
          "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (getCapaStatsInfo.status == 200) {
        getCapaStatsInfo = getCapaStatsInfo['data'][0];
        this.stats.set({
          total_indicators_cnt: getCapaStatsInfo.total_indicators_cnt,
          total_department_cnt: getCapaStatsInfo.total_department_cnt,
          total_capa_cnt: getCapaStatsInfo.total_capa_cnt,
          avg_compliance_cnt: getCapaStatsInfo.avg_compliance_cnt,
          total_indicators_cnt_last_updated: getCapaStatsInfo.total_indicators_cnt_last_updated,
          total_department_cnt_last_updated: getCapaStatsInfo.total_department_cnt_last_updated,
          total_capa_cnt_last_updated: getCapaStatsInfo.total_capa_cnt_last_updated,
          avg_compliance_cnt_last_updated: getCapaStatsInfo.avg_compliance_cnt_last_updated
        })
      };
    } catch (e) { };
  }
  public params: any = {};

  async getCapaGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.capaGrid = [];
      let totalCnt = 0;
      let flages: any = {
        "page_no": pageNo,
        "page_size": pageSize,
      };
      this.params = { ...flages }
      let getCapaList: any = await this._hqms.customGetApiCall('GET', 'fnKpiCapaSummaryList', this.params);
      if (getCapaList.status == 200) {
        let sourcedData: any = [];
        totalCnt = getCapaList.data[0]['total_row_cnt'];
        getCapaList.data.forEach((capaPrp: any, index: number) => {
          let createCapa: any = {
            id: index + 1,
            kpi_id: capaPrp.kpi_id,
            kpi_name: capaPrp.kpi_name,
            frequency_name: capaPrp.frequency_name,
            kpi_code: capaPrp.kpi_code,
            kpi_type_name: capaPrp.kpi_type_name,
            department_name: capaPrp.department_name,
            unit_of_measure_name: capaPrp.unit_of_measure_name,
            kpi_formula: capaPrp.kpi_formula,
            kpi_actual_score: capaPrp.kpi_actual_score,
            kpi_actual_score_status: capaPrp.kpi_actual_score_status,
            is_capa_completed: capaPrp.is_capa_completed,
            kpi_data_capture_id: capaPrp.kpi_data_capture_id,
            target_benchmark: capaPrp.benchmark[0]['target_benchmark'],
            created_by: capaPrp.created_by,
            created_at: capaPrp.created_at,
            updated_by: capaPrp.updated_by,
            updated_at: capaPrp.updated_at,
          };
          sourcedData.push(createCapa);
        });
        this.capaGrid = [...sourcedData];
        this.copyData = [...sourcedData];
        this.kpiNameList = [...new Set(sourcedData.map((item: any) => item.kpi_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.frequencyNameList = [...new Set(sourcedData.map((item: any) => item.frequency_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.kpiCodeList = [...new Set(sourcedData.map((item: any) => item.kpi_code))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.kpiTypeList = [...new Set(sourcedData.map((item: any) => item.kpi_type_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.kpiStatusList = [...new Set(sourcedData.map((item: any) => item.kpi_actual_score_status))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.pageNators.update(current => ({
          ...current,
          totalItems: Math.ceil(totalCnt / pageSize),
          totalPages: Math.ceil(totalCnt / pageSize)
        }));
      };
    } catch (e) { };
  }

  onFilterClick() {
    let filters = this.capaFilters();
    this.capaGrid = this.copyData.filter((fl: any) => {
      let kpi_name = !filters.kpi_name || fl['kpi_name'] === filters.kpi_name;
      let frequency_name = !filters.frequency_name || fl['frequency_name'] === filters.frequency_name;
      let kpi_code = !filters.kpi_code || fl['kpi_code'] === filters.kpi_code;
      let kpi_type_name = !filters.kpi_type_name || fl['kpi_type_name'] === filters.kpi_type_name;
      let kpi_actual_score_status = !filters.kpi_actual_score_status || fl['kpi_actual_score_status'] === filters.kpi_actual_score_status;
      return kpi_name && frequency_name && kpi_code && kpi_type_name && kpi_actual_score_status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.capaFilters.set(JSON.parse(this.intialFilters));
      this.capaGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, capaProp: any) {
    try {
      this.router.navigate(
        [
          pageMode == 'VIEW' ? '/capa-details' : '/write-capa-specific',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: capaProp == null ? null : capaProp.kpi_data_capture_id
            }
          }
        },
      );
    } catch (e) { };
  }

  public pageNators = signal({
    pageNo: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  readonly pageNumbers = computed(() => {
    let pages = this.pageNators().totalPages;
    return Array.from({ length: pages }, (_, i) => i + 1);
  })

  async changePage(newDisplayPage: number) {
    this.pageNators.update(prev => ({ ...prev, pageNo: newDisplayPage }));
    await this.getCapaGrid();
  }

  // getComplianceClass(unit_of_measure_name: string): string {
  //   // remove % and convert to number
  //   const value = parseInt(unit_of_measure_name.replace('%', ''), 10);
  //   if (value < 45) {
  //     return 'text-danger';   // red
  //   } else if (value >= 45 && value < 75) {
  //     return 'text-warning';  // orange
  //   } else {
  //     return 'text-success';  // green
  //   }
  // }

  // Navigation methods
  // viewDetails(item: capaTable) {
  //   console.log('View Details clicked for:', item.kpi_name, 'Status:', item.status);
  //   this.router.navigate(['/capa-details'], {
  //     queryParams: { kpi_name: item.kpi_name, status: item.status }
  //   });
  // }

  // writeCapa(item: capaTable) {
  //   console.log('Write CAPA clicked for:', item.kpi_name);
  //   this.router.navigate(['/capa-write'], {
  //     queryParams: { kpi_name: item.kpi_name, status: item.status }
  //   });
  // }

  // downloadCapa(item: capaTable) {
  //   console.log('Download CAPA clicked for:', item.kpi_name);
  //   // Implement download functionality
  //   alert('Downloading CAPA for: ' + item.kpi_name);
  // }

  // Helper method to get status-specific action text
  // getActionText(status: string): string {
  //   switch (status) {
  //     case 'Good':
  //       return 'View Details';
  //     case 'Critical':
  //       return 'Write CAPA';
  //     case 'Average':
  //       return 'View Details';
  //     default:
  //       return 'View Details';
  //   }
  // }

}
