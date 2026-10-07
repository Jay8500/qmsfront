import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, signal, inject, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

interface mouTable {
  id: number;
  mou_id: any;
  mou_no: any;
  partner_org: any;
  agreement_date: any;
  expiry_date: any;
  // file_name: any;
  status: string;
}

export type SortColumn = keyof mouTable | '';
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
  selector: 'app-mou-tracker-dashboard',
  imports: [CommonModule, NgbdSortableHeader, SelectModule, FormsModule, SharedModule],
  templateUrl: './mou-tracker-dashboard.component.html',
  styleUrl: './mou-tracker-dashboard.component.scss'
})
export class MouTrackerDashboardComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    mou_no: null,
    partner_org: null,
    status: null,
  });
  public mouFilters = signal(JSON.parse(this.intialFilters));
  public mouNoList: any = [];
  public partnerOrgList: any = [];
  public statusList: any = [];
  public mouGrid: mouTable[] = [];
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
      await this.getMouGrid();
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
      this.mouGrid = this.mouGrid;
    } else {
      this.mouGrid = [...this.mouGrid].sort((a, b) => {
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
    await this.getMouStats();
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

  async getMouStats() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      this.mouGrid = [];
      let getMouStatsInfo: any = await this._hqms.customGetApiCall('GET', 'fnMouDashboardApi',
        {
          "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
          "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (getMouStatsInfo.status == 200) {
        getMouStatsInfo = getMouStatsInfo['data'][0];
        this.stats.set({
          total_mou: getMouStatsInfo.total_mou,
          active_mou: getMouStatsInfo.active_mou,
          expired_mou: getMouStatsInfo.expired_mou,
          partner_organizations: getMouStatsInfo.partner_organizations,
          total_mou_last_updated: getMouStatsInfo.total_mou_last_updated,
          active_mou_last_updated: getMouStatsInfo.active_mou_last_updated,
          expired_mou_last_updated: getMouStatsInfo.expired_mou_last_updated,
          partner_organizations_last_updated: getMouStatsInfo.partner_organizations_last_updated
        })
      };
    } catch (e) { };
  }
  public params: any = {};

  async getMouGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.mouGrid = [];
      let totalCnt = 0;
      let flages: any = {
        "is_faculty": true,
        "page_no": pageNo,
        "page_size": pageSize,
      };
      this.params = { ...flages }
      let getMouList: any = await this._hqms.customGetApiCall('GET', 'fnMouGetDetailApi', this.params);
      if (getMouList.status == 200) {
        let sourcedData: any = [];
        totalCnt = getMouList.data[0]['total_row_cnt'];
        getMouList.data.forEach((mouPrp: any, index: number) => {
          let createMou: any = {
            id: index + 1,
            mou_id: mouPrp.mou_id,
            mou_no: mouPrp.mou_no,
            partner_org: mouPrp.partner_org,
            agreement_date: mouPrp.agreement_date,
            expiry_date: mouPrp.expiry_date,
            // file_name: mouPrp.file_name,
            created_by: mouPrp.created_by,
            created_at: mouPrp.created_at,
            updated_by: mouPrp.updated_by,
            updated_at: mouPrp.updated_at,
            status: mouPrp.status,
          };
          sourcedData.push(createMou);
        });
        this.mouGrid = [...sourcedData];
        this.copyData = [...sourcedData];
        this.mouNoList = [...new Set(sourcedData.map((item: any) => item.mou_no))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.partnerOrgList = [...new Set(sourcedData.map((item: any) => item.partner_org))].map((name, index) => ({
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
    let filters = this.mouFilters();
    this.mouGrid = this.copyData.filter((fl: any) => {
      let mou_no = !filters.mou_no || fl['mou_no'] === filters.mou_no;
      let partner_org = !filters.partner_org || fl['partner_org'] === filters.partner_org;
      let status = !filters.status || fl['status'] === filters.status;
      return mou_no && partner_org && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.mouFilters.set(JSON.parse(this.intialFilters));
      this.mouGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, mouProp: any) {
    try {
      this.router.navigate(
        [
          pageMode == 'VIEW' ? '/mou-tracker-details' : '/mou-tracker-add',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: mouProp == null ? null : mouProp.mou_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(mouProp: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${mouProp.partner_org}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "mou_id": mouProp.mou_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnMouGetDetailApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'MOU Tracker',
          detail: saveResult.message,
        });
        // this.mouGrid = [...this.copyData.filter((fl: any) => fl.mou_id != mouProp.mou_id)];
        this.mouGrid.forEach((ele: any) => {
          if (ele.mou_id == mouProp.mou_id) {
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
    await this.getMouGrid();
  }
}
