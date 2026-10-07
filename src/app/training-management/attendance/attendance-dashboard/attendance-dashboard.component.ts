import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, signal, inject, computed } from '@angular/core';
import {  Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

interface attendanceTable {
  id: number;
  training_schedule_id: any;
  training_name: any;
  mode_of_training: any;
  venue_name: any;
  from_date_time: any;
  to_date_time: any;
};

export type SortColumn = keyof attendanceTable | '';
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
  selector: 'app-attendance-dashboard',
  imports: [ CommonModule, NgbdSortableHeader, SelectModule, FormsModule, SharedModule],
  templateUrl: './attendance-dashboard.component.html'
})
export class AttendanceDashboardComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    training_name: null,
    mode_of_training: null,
    venue_name: null,
  });
  public attendanceFilters = signal(JSON.parse(this.intialFilters));
  public trainingNameList: any = [];
  public modeOfTrainingList: any = [];
  public venueList: any = [];
  public attendanceGrid: attendanceTable[] = [];
  public router = inject(Router);
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;
  // Filter Dropdown
  selectedRange: string = 'Last 30 days';
  public copyData: any = [];
  public params: any = {};
  constructor(public _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
      await this.setRange(this.selectedRange);
      await this.getAttendanceGrid();
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
      this.attendanceGrid = this.attendanceGrid;
    } else {
      this.attendanceGrid = [... this.attendanceGrid].sort((a, b) => {
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
    await this.getAttendanceStats();
  }

  public initailStats = JSON.stringify({
    total_training: 0,
    nominees_present: 0,
    avg_nominees_per_training: 0,
    avg_pass_mark_percent: 0,
    total_training_last_updated: null,
    nominees_present_last_updated: null,
    avg_nominees_per_training_last_updated: null,
    avg_pass_mark_percent_last_updated: null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getAttendanceStats() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      this.attendanceGrid = [];
      let getAttendStatsInfo: any = await this._hqms.customGetApiCall('GET', 'fnTrainingAttendanceDashboardStats',
        {
          "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
          "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (getAttendStatsInfo.status == 200) {
        getAttendStatsInfo = getAttendStatsInfo['data'][0];
        this.stats.set({
          total_training: getAttendStatsInfo.total_training,
          nominees_present: getAttendStatsInfo.nominees_present,
          avg_nominees_per_training: getAttendStatsInfo.avg_nominees_per_training,
          avg_pass_mark_percent: getAttendStatsInfo.avg_pass_mark_percent,
          total_training_last_updated: getAttendStatsInfo.total_training_last_updated,
          nominees_present_last_updated: getAttendStatsInfo.nominees_present_last_updated,
          avg_nominees_per_training_last_updated: getAttendStatsInfo.avg_nominees_per_training_last_updated,
          avg_pass_mark_percent_last_updated: getAttendStatsInfo.avg_pass_mark_percent_last_updated
        })
      };
    } catch (e) { };
  }

  async getAttendanceGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.attendanceGrid = [];
      let totalCnt = 0;
      let getAttendList: any = await this._hqms.customGetApiCall('GET', 'fnAttendanceListGet',
        {
          // "training_schedule_id": this.training_schedule_id, // from DB
          // "is_attend": true // not added
        });
      // this.params
      if (getAttendList.status == 200) {
        let sourcedData: any = [];
        totalCnt = getAttendList.data[0]['total_row_cnt'];
        getAttendList.data.forEach((attendPrp: any, index: number) => {
          let createAttend: any = {
            id: index + 1,
            training_schedule_id: attendPrp.training_schedule_id,
            training_id: attendPrp.training_id,
            training_name: attendPrp.training_name,
            mode_of_training: attendPrp.mode_of_training,
            venue_name: attendPrp.venue_name,
            from_date_time: attendPrp.from_date_time,
            to_date_time: attendPrp.to_date_time,
            is_show_mark_attandance: attendPrp.is_show_mark_attandance,
            created_by: attendPrp.created_by,
            created_at: attendPrp.created_at,
            updated_by: attendPrp.updated_by,
            updated_at: attendPrp.updated_at,
          };
          sourcedData.push(createAttend);
        });
        this.attendanceGrid = [...sourcedData];
        this.copyData = [...sourcedData];

        this.trainingNameList = [...new Set(sourcedData.map((item: any) => item.training_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.modeOfTrainingList = [...new Set(sourcedData.map((item: any) => item.mode_of_training))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.venueList = [...new Set(sourcedData.map((item: any) => item.venue_name))].map((name, index) => ({
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
    let filters = this.attendanceFilters();
    this.attendanceGrid = this.copyData.filter((fl: any) => {
      let training_name = !filters.training_name || fl['training_name'] === filters.training_name;
      let venue_name = !filters.venue_name || fl['venue_name'] === filters.venue_name;
      let mode_of_training = !filters.mode_of_training || fl['mode_of_training'] === filters.mode_of_training;
      return training_name && venue_name && mode_of_training;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.attendanceFilters.set(JSON.parse(this.intialFilters));
      this.attendanceGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  // async onDelete(attendProp: any) {
  //   let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${attendProp.mode_of_training}`);
  //   if (confirm) {
  //     let savePayload = {
  //       action: "D",
  //       "training_schedule_id": attendProp.training_schedule_id
  //     }
  //     var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnAttendanceWriteApi", savePayload);
  //     if (saveResult.status == 200) {
  //       this._hqms.hqmsToasterService({
  //         severity: 'success',
  //         summary: 'Attendance',
  //         detail: saveResult.message,
  //       });
  //       this.attendanceGrid = [...this.copyData.filter((fl: any) => fl.training_schedule_id != attendProp.training_schedule_id)];
  //     };
  //   };
  // }

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
    await this.getAttendanceGrid();
  }

  onPageRoute(pageMode: string, trning: any) {
    try {

      this.router.navigate(
        [
          pageMode == 'VIEW' ? '/attendance-details' : '/markattendance',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: trning == null ? null : trning.training_id
            }
          }
        },
      );
    } catch (e) { };
  }
}
