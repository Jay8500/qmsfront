import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, signal, inject, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';

interface kpiTable {
  id: number;
  kpi_id: any;
  indicator_name: any;
  category: any;
  type: any;
  monitoringFrequency: any;
  createdOn: any;
  lastUpdated: any;
  status: any;
}
export type SortColumn = keyof kpiTable | '';
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
  selector: 'app-kpi-dashboard',
  imports: [CommonModule, NgbdSortableHeader, SharedModule],
  templateUrl: './kpi-dashboard.component.html',
})
export class KpiDashboardComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    kpi_id: null,
    indicator_name: null,
    category: null,
    type: null,
    status: null,
  });
  public kpiFilters = signal(JSON.parse(this.intialFilters));
  public kpiIdList: any = [];
  public indicatorNameList: any = [];
  public categoryList: any = [];
  public typeList: any = [];
  public statusList: any = [];
  public kpiGrid: kpiTable[] = [];
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
      await this.getKpiGrid();
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
      this.kpiGrid = this.kpiGrid;
    } else {
      this.kpiGrid = [...this.kpiGrid].sort((a, b) => {
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
    await this.getKpiStats();
  }

  public initailStats = JSON.stringify({
    total_mou: 0,
    active_mou: 0,
    expired_mou: 0,
    partner_organizations: 0,
    total_mou_last_updated: null,
    active_mou_last_updated: null,
    expired_mou_last_updated: null,
    partner_organizations_last_updated: null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getKpiStats() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      this.kpiGrid = [];
      let getKpiStatsInfo: any = await this._hqms.customGetApiCall('GET', '',
        {
          "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
          "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (getKpiStatsInfo.status == 200) {
        getKpiStatsInfo = getKpiStatsInfo['data'][0];
        this.stats.set({
          total_mou: getKpiStatsInfo.total_mou,
          active_mou: getKpiStatsInfo.active_mou,
          expired_mou: getKpiStatsInfo.expired_mou,
          partner_organizations: getKpiStatsInfo.partner_organizations,
          total_mou_last_updated: getKpiStatsInfo.total_mou_last_updated,
          active_mou_last_updated: getKpiStatsInfo.active_mou_last_updated,
          expired_mou_last_updated: getKpiStatsInfo.expired_mou_last_updated,
          partner_organizations_last_updated: getKpiStatsInfo.partner_organizations_last_updated
        })
      };
    } catch (e) { };
  }
  public params: any = {};

  async getKpiGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.kpiGrid = [];
      let totalCnt = 0;
      let flages: any = {
        "page_no": pageNo,
        "page_size": pageSize,
      };
      this.params = { ...flages }
      let getKpiList: any = await this._hqms.customGetApiCall('GET', '', this.params);
      if (getKpiList.status == 200) {
        let sourcedData: any = [];
        totalCnt = getKpiList.data[0]['total_row_cnt'];
        getKpiList.data.forEach((kpiPrp: any, index: number) => {
          let createKpi: any = {
            id: index + 1,
            kpi_id: kpiPrp.kpi_id,
            indicator_name: kpiPrp.indicator_name,
            category: kpiPrp.category,
            type: kpiPrp.type,
            monitoringFrequency: kpiPrp.monitoringFrequency,
            createdOn: kpiPrp.createdOn,
            lastUpdated: kpiPrp.lastUpdated,
            status: kpiPrp.status,
          };
          sourcedData.push(createKpi);
        });
        this.kpiGrid = [...sourcedData];
        this.copyData = [...sourcedData];
        this.kpiIdList = [...new Set(sourcedData.map((item: any) => item.kpi_id))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.indicatorNameList = [...new Set(sourcedData.map((item: any) => item.indicator_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.categoryList = [...new Set(sourcedData.map((item: any) => item.category))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.typeList = [...new Set(sourcedData.map((item: any) => item.type))].map((name, index) => ({
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
    let filters = this.kpiFilters();
    this.kpiGrid = this.copyData.filter((fl: any) => {
      let kpi_id = !filters.kpi_id || fl['kpi_id'] === filters.kpi_id;
      let indicator_name = !filters.indicator_name || fl['indicator_name'] === filters.indicator_name;
      let category = !filters.category || fl['category'] === filters.category;
      let type = !filters.type || fl['type'] === filters.type;
      let status = !filters.status || fl['status'] === filters.status;
      return kpi_id && indicator_name && category && type && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.kpiFilters.set(JSON.parse(this.intialFilters));
      this.kpiGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, kpiProp: any) {
    try {
      this.router.navigate(
        [
          pageMode == 'VIEW' ? '/kpi-details' : '/kpi-setup-add',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: kpiProp == null ? null : kpiProp.kpi_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(kpiProp: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${kpiProp.indicator_name}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "kpi_id": kpiProp.kpi_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Manage KPI',
          detail: saveResult.message,
        });
        // this.kpiGrid = [...this.copyData.filter((fl: any) => fl.kpi_id != kpiProp.kpi_id)];
        this.kpiGrid.forEach((ele: any) => {
          if (ele.kpi_id == kpiProp.kpi_id) {
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
    let pages = this.pageNators().totalPages;
    return Array.from({ length: pages }, (_, i) => i + 1);
  })

  async changePage(newDisplayPage: number) {
    this.pageNators.update(prev => ({ ...prev, pageNo: newDisplayPage }));
    await this.getKpiGrid();
  }
}
