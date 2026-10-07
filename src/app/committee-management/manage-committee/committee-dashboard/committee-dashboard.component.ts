import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, signal, inject, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

interface committeeTable {
  id: number;
  committee_id: any;
  committee_code: any;
  committee_name: any;
  chairperson: any;
  committee_type: any;
  co_ordinator: any;
  remainder_frequency: any;
  created_at: any;
  updated_at: any;
  status: any;
}

export type SortColumn = keyof committeeTable | '';
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
  selector: 'app-committee-dashboard',
  imports: [CommonModule, NgbdSortableHeader, SelectModule, FormsModule, SharedModule],
  templateUrl: './committee-dashboard.component.html',
})
export class CommitteeDashboardComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    committee_code: null,
    committee_name: null,
    committee_type: null,
    co_ordinator: null,
    status: null,
  });
  public committeeFilters = signal(JSON.parse(this.intialFilters));
  public committeeIdList: any = [];
  public committeeNameList: any = [];
  public committeeTypeList: any = [];
  public coOrdinatorList: any = [];
  public statusList: any = [];
  public committeeGrid: committeeTable[] = [];
  public router = inject(Router);
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;
  selectedRange: string = 'Last 30 days';
  public copyData: any = [];

  constructor(public _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
      await this.setRange(this.selectedRange);
      await this.getCommitteeGrid();
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
      this.committeeGrid = this.committeeGrid;
    } else {
      this.committeeGrid = [...this.committeeGrid].sort((a, b) => {
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
    await this.getCommitteeStats();
  }

  public initailStats = JSON.stringify({
    total_committee: 0,
    mom_created: 0,
    scheduled_meetings: 0,
    completed_meetings: 0,
    total_committee_last_updated: null,
    mom_created_last_updated: null,
    scheduled_meetings_last_updated: null,
    completed_meetings_last_updated: null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getCommitteeStats() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      this.committeeGrid = [];
      let getCommitteeStatsInfo: any = await this._hqms.customGetApiCall('GET', 'fnCommitteeDashboardStats',
        {
          "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
          "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (getCommitteeStatsInfo.status == 200) {
        getCommitteeStatsInfo = getCommitteeStatsInfo['data'][0];
        this.stats.set({
          total_committee: getCommitteeStatsInfo.total_committee,
          mom_created: getCommitteeStatsInfo.mom_created,
          scheduled_meetings: getCommitteeStatsInfo.scheduled_meetings,
          completed_meetings: getCommitteeStatsInfo.completed_meetings,
          total_committee_last_updated: getCommitteeStatsInfo.total_committee_last_updated,
          mom_created_last_updated: getCommitteeStatsInfo.mom_created_last_updated,
          scheduled_meetings_last_updated: getCommitteeStatsInfo.scheduled_meetings_last_updated,
          completed_meetings_last_updated: getCommitteeStatsInfo.completed_meetings_last_updated
        })
      };
    } catch (e) { };
  }
  public params: any = {};

  async getCommitteeGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.committeeGrid = [];
      let totalCnt = 0;
      let flages: any = {
        "is_faculty": true,
        "page_no": pageNo,
        "page_size": pageSize,
      };
      this.params = { ...flages }
      let getCommitteeList: any = await this._hqms.customGetApiCall('GET', 'fnCommitteeApi', this.params);
      if (getCommitteeList.status == 200) {
        let sourcedData: any = [];
        totalCnt = getCommitteeList.data[0]['total_row_cnt'];
        getCommitteeList.data.forEach((committeePrp: any, index: number) => {
          let createCommittee: any = {
            id: index + 1,
            committee_id: committeePrp.committee_id,
            committee_code: committeePrp.committee_code,
            committee_name: committeePrp.committee_name,
            chairperson: committeePrp.chairperson,
            committee_type: committeePrp.committee_type,
            co_ordinator: committeePrp.co_ordinator,
            remainder_frequency: committeePrp.remainder_frequency,
            created_by: committeePrp.created_by,
            created_at: committeePrp.created_at,
            updated_by: committeePrp.updated_by,
            updated_at: committeePrp.updated_at,
            status: committeePrp.status,
          };
          sourcedData.push(createCommittee);
        });
        this.committeeGrid = [...sourcedData];
        this.copyData = [...sourcedData];
        this.committeeIdList = [...new Set(sourcedData.map((item: any) => item.committee_code))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.committeeNameList = [...new Set(sourcedData.map((item: any) => item.committee_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.committeeTypeList = [...new Set(sourcedData.map((item: any) => item.committee_type))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.coOrdinatorList = [...new Set(sourcedData.map((item: any) => item.co_ordinator))].map((name, index) => ({
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
    let filters = this.committeeFilters();
    this.committeeGrid = this.copyData.filter((fl: any) => {
      let committee_code = !filters.committee_code || fl['committee_code'] === filters.committee_code;
      let committee_name = !filters.committee_name || fl['committee_name'] === filters.committee_name;
      let committee_type = !filters.committee_type || fl['committee_type'] === filters.committee_type;
      let co_ordinator = !filters.co_ordinator || fl['co_ordinator'] === filters.co_ordinator;
      let status = !filters.status || fl['status'] === filters.status;
      return committee_code && committee_name && committee_type && co_ordinator && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.committeeFilters.set(JSON.parse(this.intialFilters));
      this.committeeGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, committeeProp: any) {
    try {
      this.router.navigate(
        [
          pageMode == 'VIEW' ? '/committee-add' : '/committee-add',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: committeeProp == null ? null : committeeProp.committee_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(commitPrp: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${commitPrp.committee_name}`);
    if (confirm) {
      let savePayload = {
        "action": "D",
        "committee_id": commitPrp.committee_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnCommitteeApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Manage Committee',
          detail: saveResult.message,
        });
        // this.committeeGrid = [...this.copyData.filter((fl: any) => fl.committee_id != commitPrp.committee_id)];
        this.committeeGrid.forEach((ele: any) => {
          if (ele.committee_id == commitPrp.committee_id) {
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
    await this.getCommitteeGrid();
  }
}
