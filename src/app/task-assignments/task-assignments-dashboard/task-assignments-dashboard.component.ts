import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
import { DatePipe } from '@angular/common';
interface taskTable {
  id: number;
  task_id: any;
  task_code: any;
  task_name: any;
  assigned_to: any;
  role: any;
  created_at: any;
  task_description: any;
  task_status: any;
  status: any;
}
export type SortColumn = keyof taskTable | '';
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
  selector: 'app-task-assignments-dashboard',
  imports: [CommonModule, NgbdSortableHeader, SharedModule],
  templateUrl: './task-assignments-dashboard.component.html',
})
export class TaskAssignmentsDashboardComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    task_name: null,
    assigned_to: null,
    role: null,
    task_status: null,
    status: null,
  });
  public taskFilters = signal({ ...JSON.parse(this.intialFilters) });
  public taskNameList: any = [];
  public assignedToList: any = [];
  public roleList: any = [];
  public taskStatusList: any = [];
  public statusList: any = [];
  public taskkGrid: any = [];
  public router = inject(Router);

  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;
  selectedRange: string = 'Last 30 days';
  public copyData: any = [];

  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
      await this.setRange(this.selectedRange);
      await this.getTaskGrid();
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
      this.taskkGrid = this.taskkGrid;
    } else {
      this.taskkGrid = [...this.taskkGrid].sort((a, b) => {
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
    await this.getTaskStats();
  }

  public initailStats = JSON.stringify({
    total_tasks: 0,
    pending_tasks: 0,
    completed_tasks: 0,
    assigned_employees: 0,
    total_tasks_last_update: null,
    pending_tasks_last_update: null,
    completed_tasks_last_update: null,
    assigned_employees_last_update: null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getTaskStats() {
    try {
      let fromDate = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDate = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      this.taskkGrid = [];
      let getTaskStats: any = await this._hqms.customGetApiCall('GET', 'fnTaskDashboardStats',
        {
          "from_date": fromDate == null ? null : this._datePipe.transform(fromDate, 'dd-MMM-yyyy'),
          "to_date": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (getTaskStats.status == 200) {
        getTaskStats = getTaskStats['data'][0];
        this.stats.set({
          total_tasks: getTaskStats.total_tasks,
          pending_tasks: getTaskStats.pending_tasks,
          completed_tasks: getTaskStats.completed_tasks,
          assigned_employees: getTaskStats.assigned_employees,
          total_tasks_last_update: getTaskStats.total_tasks_last_update,
          pending_tasks_last_update: getTaskStats.pending_tasks_last_update,
          completed_tasks_last_update: getTaskStats.completed_tasks_last_update,
          assigned_employees_last_update: getTaskStats.assigned_employees_last_update
        })
      };
    } catch (e) { };
  }

  public params: any = {};

  async getTaskGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.taskkGrid = [];
      let totalCnt = 0;
      let startDatetime = null;
      let endDatetime = null;
      let flages: any = {
        "page_no": pageNo,
        "page_size": pageSize,
        "start_datetime": startDatetime == null ? null : this._datePipe.transform(startDatetime, 'dd-MMM-yyyy'),
        "end_datetime": endDatetime == null ? null : this._datePipe.transform(endDatetime, 'dd-MMM-yyyy'),
        "is_active": true,
      };
      this.params = { ...flages }
      let getTaskList: any = await this._hqms.customGetApiCall('GET', 'fnTaskApi', this.params);
      if (getTaskList.status == 200) {
        let sourcedData: any = [];
        totalCnt = getTaskList.data[0]['total_row_cnt'];
        getTaskList.data.forEach((tasks: any, index: number) => {
          let createTasks: any = {
            id: index + 1,
            task_id: tasks.task_id,
            task_code: tasks.task_code,
            task_name: tasks.task_name,
            assigned_to: tasks.assigned_to,
            role: tasks.role,
            task_description: tasks.task_description,
            task_status: tasks.task_status,
            created_by: tasks.created_by,
            created_at: tasks.created_at,
            updated_by: tasks.updated_by,
            updated_at: tasks.updated_at,
            status: tasks.status,
          };
          sourcedData.push(createTasks);
        });
        this.taskkGrid = [...sourcedData];
        this.copyData = [...sourcedData];

        this.taskNameList = [...new Set(sourcedData.map((item: any) => item.task_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.assignedToList = [...new Set(sourcedData.map((item: any) => item.assigned_to))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.roleList = [...new Set(sourcedData.map((item: any) => item.role))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.taskStatusList = [...new Set(sourcedData.map((item: any) => item.task_status))].map((name, index) => ({
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
    let filters = this.taskFilters();
    this.taskkGrid = this.copyData.filter((fl: any) => {
      let task_name = !filters.task_name || fl['task_name'] === filters.task_name;
      let assigned_to = !filters.assigned_to || fl['assigned_to'] === filters.assigned_to;
      let role = !filters.role || fl['role'] === filters.role;
      let task_status = !filters.task_status || fl['task_status'] === filters.task_status;
      let status = !filters.status || fl['status'] === filters.status;
      return task_name && assigned_to && role && task_status && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.taskFilters.set(JSON.parse(this.intialFilters));
      this.taskkGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, taskAssign: any) {
    try {
      this.router.navigate(
        [
          pageMode == 'VIEW' ? '/task-assignments-details' : '/task-assignments-add',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: taskAssign == null ? null : taskAssign.task_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(taskAssign: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${taskAssign.task_name}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "task_id": taskAssign.task_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnTaskApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Task Assignment',
          detail: saveResult.message,
        });
        // this.taskkGrid = [...this.copyData.filter((fl: any) => fl.task_id != taskAssign.task_id)];
        this.taskkGrid.forEach((ele: any) => {
          if (ele.task_id == taskAssign.task_id) {
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
    await this.taskkGrid();
  }

}
