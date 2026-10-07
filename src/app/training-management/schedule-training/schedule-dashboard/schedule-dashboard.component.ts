import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, signal, inject, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
interface scheduleTable {
  id: number;
  training_schedule_id: any;
  training_name: any;
  faculty_name: any;
  mode_of_training: any;
  attendance_type: any;
  from_dt: any;
  to_dt: any;
  status: string;
  schedule_status: string;
};

export type SortColumn = keyof scheduleTable | '';
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
  selector: 'app-schedule-dashboard',
  imports: [CommonModule, NgbdSortableHeader, SelectModule, FormsModule
    , SharedModule],
  templateUrl: './schedule-dashboard.component.html',
  styleUrl: './schedule-dashboard.component.scss'
})
export class ScheduleDashboardComponent implements OnInit {
  public params: any = {}
  public intialFilters: any = JSON.stringify({
    training_name: null,
    faculty_name: null,
    mode_of_training: null,
    attendance_type: null,
    from_time: null,
    to_time: null,
    status: null,
  });

  public scheduleFilters = signal({ ...JSON.parse(this.intialFilters) });
  public trainingList: any = [];
  public facultyNameList: any = [];
  public modeOfTrainingList: any = [];
  public attendanceTypeList: any = [];
  public statusList: any = [];
  public scheduleGrid: any = [];
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
      await this.getScheduleGrid();
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
      this.scheduleGrid = this.scheduleGrid;
    } else {
      this.scheduleGrid = [...this.scheduleGrid].sort((a, b) => {
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
    try {
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
      await this.getScheduleStats();
    } catch (e) { }
  }

  public initailStats = JSON.stringify({
    no_of_training: 0,
    no_of_faculty: 0,
    average_questions: 0,
    average_pass_mark: 0,
    no_of_training_last_updated: null,
    no_of_faculty_last_updated: null,
    average_questions_last_updated: null,
    average_pass_mark_last_updated: null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getScheduleStats() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      this.scheduleGrid = [];
      let info: any = await this._hqms.customGetApiCall('GET', 'fnTrainingScheduleDashboardStatsGet',
        {
          "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
          "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (info.status == 200) {
        info = info['data'][0];
        this.stats.set({
          no_of_training: info.total_training,
          no_of_faculty: info.total_faculty,
          average_questions: info.avg_questions_per_assessment,
          average_pass_mark: info.avg_pass_mark_percent,
          no_of_training_last_updated: info.total_training_last_updated,
          no_of_faculty_last_updated: info.total_faculty_last_updated,
          average_questions_last_updated: info.avg_questions_last_updated,
          average_pass_mark_last_updated: info.avg_pass_mark_percent_last_updated
        })
      };
    } catch (e) { };
  }

  async getScheduleGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.scheduleGrid = [];
      let totalCnt = 0;
      let getScheduleList: any = await this._hqms.customGetApiCall('GET', 'scheduleWriteApi',
        {
          // "is_schedule": true
        });
      if (getScheduleList.status == 200) {
        let sourcedData: any = [];
        totalCnt = getScheduleList.data[0]['total_row_cnt'];
        getScheduleList.data.forEach((schPrp: any, index: number) => {
          let createFaculty: any = {
            id: index + 1,
            training_schedule_id: schPrp.training_schedule_id,
            training_name: schPrp.training_name,
            faculty_name: schPrp.faculty_name,
            mode_of_training: schPrp.mode_of_training,
            attendance_type: schPrp.attendance_type,
            from_dt: schPrp.from_dt,
            // from_time: schPrp.from_time,
            to_dt: schPrp.to_dt,
            // to_time: schPrp.to_time,
            schedule_status: schPrp.schedule_status,
            status: schPrp.status,
            class_status: this._hqms.recordStatus(schPrp.status),
            created_by: schPrp.created_by,
            created_at: schPrp.created_at,
            updated_by: schPrp.updated_by,
            updated_at: schPrp.updated_at,
          };
          sourcedData.push(createFaculty);
        });
        this.scheduleGrid = [...sourcedData];
        this.copyData = [...sourcedData];

        this.trainingList = [...new Set(sourcedData.map((item: any) => item.training_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.facultyNameList = [...new Set(sourcedData.map((item: any) => item.faculty_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.modeOfTrainingList = [...new Set(sourcedData.map((item: any) => item.mode_of_training))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.attendanceTypeList = [...new Set(sourcedData.map((item: any) => item.attendance_type))].map((name, index) => ({
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
    let filters = this.scheduleFilters();
    this.scheduleGrid = this.copyData.filter((fl: any) => {
      let training_name = !filters.training_name || fl['training_name'] === filters.training_name;
      let mode_of_training = !filters.mode_of_training || fl['mode_of_training'] === filters.mode_of_training;
      let attendance_type = !filters.attendance_type || fl['attendance_type'] === filters.attendance_type;
      let faculty_name = !filters.faculty_name || fl['faculty_name'] === filters.faculty_name;
      let status = !filters.status || fl['status'] === filters.status;
      return training_name && mode_of_training && faculty_name && attendance_type && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.scheduleFilters.set(JSON.parse(this.intialFilters));
      this.scheduleGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, scheduleProp: any) {
    try {
      this.router.navigate(
        [
          pageMode == 'VIEW' ? '/schedule-details' : '/schedule-add',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: scheduleProp == null ? null : scheduleProp.training_schedule_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(scheduleProp: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${scheduleProp.faculty_name}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "training_schedule_id": scheduleProp.training_schedule_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "scheduleWriteApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Schedule',
          detail: saveResult.message,
        });
        // this.scheduleGrid = [...this.copyData.filter((fl: any) => fl.training_schedule_id != scheduleProp.training_schedule_id)];
        this.scheduleGrid.forEach((ele: any) => {
          if (ele.training_schedule_id == scheduleProp.training_schedule_id) {
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
    await this.scheduleGrid();
  }
}
