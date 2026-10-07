import { Component, ViewChild, CUSTOM_ELEMENTS_SCHEMA, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';
interface kpiMasterTable {
  id: number;
  kpi_id: any;
  kpi_code: any;
  kpi_name: any;
  category_name: any,
  department_name: any,
  kpi_type_name: any,
  frequency_name: any
  unit_of_measure_name: any,
  status: any;
}

export type SortColumn = keyof kpiMasterTable | '';
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
  selector: 'app-kpi-master-dashboard',
  imports: [CommonModule, NgbdSortableHeader, SharedModule],
  templateUrl: './kpi-master-dashboard.component.html',
})
export class KpiMasterDashboardComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    kpi_code: null,
    kpi_name: null,
    category_name: null,
    department_name: null,
    kpi_type_name: null,
    frequency_name: null,
    status: null,
  });
  public kpiMasterFilters = signal({ ...JSON.parse(this.intialFilters) });
  public kpiIdList: any = [];
  public kpiNameList: any = [];
  public catgeoryList: any = [];
  public departmentList: any = [];
  public kpiTypeList: any = [];
  public frequencyList: any = [];
  public statusList: any = [];
  public kpimasterGrid: any = [];
  public router = inject(Router);

  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;

  // Filter Dropdown
  public copyData: any = [];
  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
      await this.setRange(this.selectedRange);
      await this.getKpiMasterGrid();
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
      this.kpimasterGrid = this.kpimasterGrid;
    } else {
      this.kpimasterGrid = [...this.kpimasterGrid].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }
  selectedRange: string = 'Last 30 days';

  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  async setRange(value: string) {
    try {
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
      await this.getKPIStats();
    } catch (e) {
    }
  }
  public date_range: any = null;

  public initailStats = JSON.stringify({
    total_department_cnt: 0,
    data_entries_cnt: 0,
    total_capa_cnt: 0,
    total_indicators_cnt: 0,
    total_department_cnt_last_updated: null,
    total_capa_cnt_last_updated: null,
    total_indicators_cnt_last_updated: null,
    data_entries_last_updated: null,
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getKPIStats() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      let statInfo: any = await this._hqms.customGetApiCall('GET', 'fnKpiDashboardStats',
        {
          "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
          "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (statInfo.status == 200) {
        this.stats.set({
          total_department_cnt: statInfo['data'][0].total_department_cnt,
          data_entries_cnt: statInfo['data'][0].data_entries_cnt,
          total_capa_cnt: statInfo['data'][0].total_capa_cnt,
          total_indicators_cnt: statInfo['data'][0].total_indicators_cnt,
          total_department_cnt_last_updated: statInfo['data'][0].total_department_cnt_last_updated,
          data_entries_last_updated: statInfo['data'][0].data_entries_last_updated,
          total_capa_cnt_last_updated: statInfo['data'][0].total_capa_cnt_last_updated,
          total_indicators_cnt_last_updated: statInfo['data'][0].total_indicators_cnt_last_updated
        })
      };
    } catch (e) {
    };
  }


  public params: any = {};
  async getKpiMasterGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.kpimasterGrid = [];
      let totalCnt = 0;
      let flags: any = {
        "page_no": pageNo,
        "page_size": pageSize,
      };
      this.params = { ...flags }
      let getKpiMasterList: any = await this._hqms.customGetApiCall('GET', 'fnKpiMstrApi',
        flags);
      if (getKpiMasterList.status == 200) {
        let sourcedData: any = [];
        totalCnt = getKpiMasterList.data[0]['total_row_cnt'];
        getKpiMasterList.data.forEach((kpiMasters: any, index: number) => {
          let createKpiMaster: any = {
            id: index + 1,
            kpi_id: kpiMasters.kpi_id,
            kpi_code: kpiMasters.kpi_code,
            kpi_name: kpiMasters.kpi_name,
            category_name: kpiMasters.category_name,
            department_name: kpiMasters.department_name,
            kpi_type_name: kpiMasters.kpi_type_name,
            frequency_name: kpiMasters.frequency_name,
            unit_of_measure_name: kpiMasters.unit_of_measure_name,
            created_by: kpiMasters.created_by,
            created_at: kpiMasters.created_at,
            updated_by: kpiMasters.updated_by,
            updated_at: kpiMasters.updated_at,
            status: kpiMasters.status,
          };
          sourcedData.push(createKpiMaster);
        });
        this.kpimasterGrid = [...sourcedData];
        this.copyData = [...sourcedData];
        this.kpiIdList = [...new Set(sourcedData.map((item: any) => item.kpi_code))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.kpiNameList = [...new Set(sourcedData.map((item: any) => item.kpi_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.catgeoryList = [...new Set(sourcedData.map((item: any) => item.category_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.departmentList = [...new Set(sourcedData.map((item: any) => item.department_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.kpiTypeList = [...new Set(sourcedData.map((item: any) => item.kpi_type_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.frequencyList = [...new Set(sourcedData.map((item: any) => item.frequency_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.statusList = [...new Set(sourcedData.map((item: any) => item.status))].map((name, index) => ({
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
    let filters = this.kpiMasterFilters();
    this.kpimasterGrid = this.copyData.filter((fl: any) => {
      let kpi_code = !filters.kpi_code || fl['kpi_code'] === filters.kpi_code;
      let kpi_name = !filters.kpi_name || fl['kpi_name'] === filters.kpi_name;
      let category_name = !filters.category_name || fl['category_name'] === filters.category_name;
      let department_name = !filters.department_name || fl['department_name'] === filters.department_name;
      let kpi_type_name = !filters.kpi_type_name || fl['kpi_type_name'] === filters.kpi_type_name;
      let frequency_name = !filters.frequency_name || fl['frequency_name'] === filters.frequency_name;
      let status = !filters.status || fl['status'] === filters.status;
      return kpi_code && kpi_name && category_name && department_name && kpi_type_name && frequency_name && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.kpiMasterFilters.set(JSON.parse(this.intialFilters));
      this.kpimasterGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, kpiMasterr: any) {
    try {
      this.router.navigate(
        [
          '/kpi-master-add',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: kpiMasterr == null ? null : kpiMasterr.kpi_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(kpiMasterr: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${kpiMasterr.kpi_name}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "kpi_id": kpiMasterr.kpi_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnKpiMstrApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'KPI Master',
          detail: saveResult.message,
        });
        this.kpimasterGrid.forEach((ele: any) => {
          if (ele.kpi_id == kpiMasterr.kpi_id) {
            ele['status'] = 'Inactive';
          };
        });
      };
    };
  }

  public pageNators = signal({
    pageNo: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  readonly pageNumbers = computed(() => {
    let pages = this.pageNators().totalItems;
    return Array.from({ length: pages }, (_, i) => i + 1);
  })

  async changePage(newDisplayPage: number) {
    this.pageNators.update(prev => ({ ...prev, pageNo: newDisplayPage }));
    await this.getKpiMasterGrid();
  }
}
