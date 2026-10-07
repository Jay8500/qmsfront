import { Location, CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, signal, inject, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DatePipe } from '@angular/common';

interface scheduleDetailTable {
  id: number;
  training_schedule_id: any;
  employee_code: any;
  attendee_name: any;
  role_name: any;
  attendees: any;
};

export type SortColumn = '';
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
  selector: 'app-schedule-details',
  imports: [CommonModule, FormsModule, NgbdSortableHeader, SelectModule, SharedModule],
  templateUrl: './schedule-details.component.html',
})
export class ScheduleDetailsComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    attendee_name: null,
    department_name: null,
    role_name: null,
  });
  public scheduleFilters = signal(JSON.parse(this.intialFilters));
  public empNameList: any = [];
  public departmentList: any = [];
  public roleList: any = [];
  public scheduleDetGrid: scheduleDetailTable[] = [];
  public router = inject(Router);
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;
  public copyData: any = [];
  public params: any = {};
  constructor(public _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe, private location: Location) { }

  onSort({ column, direction }: SortEvent) {
    // resetting other headers
    for (const header of this.headers) {
      if (header.sortable !== column) {
        header.direction = '';
      }
    }
    // sorting data
    if (direction === '' || column === '') {
      this.readOnlySchedule().attendees = this.readOnlySchedule().attendees;
    } else {
      this.readOnlySchedule().attendees = [... this.readOnlySchedule().attendees].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  public readOnlySchedule: any = signal({
    "action": "v",
    "training_schedule_id": null,
    "department_name": null,
    "role_name": null,
    "training_name": null,
    "faculty_name": null,
    "mode_of_training": null,
    "attendance_type": null,
    "venue_name": null,
    "from_dt": null,
    "to_dt": null,
    "scheduled_time": null,
    "status": null,
    "attendees": [],
  })

  async ngOnInit() {
    try {
      let state = history.state;
      if (state ?.data) {
        await this.editScheduleDetail(state['data']['id']);
      };
    } catch (e) { };
  }

  async editScheduleDetail(training_schedule_id: any) {
    try {
      let getScheduleDetailEdit: any = await this._hqms.customGetApiCall('GET', 'scheduleWriteApi',
        {
          "action": "v",
          "training_schedule_id": training_schedule_id,
        });
      if (getScheduleDetailEdit.status == 200) {
        let editInfo = getScheduleDetailEdit['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.readOnlySchedule.set({
            "action": "v",
            "training_schedule_id": training_schedule_id,
            "role_name": editInfo['role_name'],
            "training_name": editInfo['training_name'],
            "faculty_name": editInfo['faculty_name'],
            "mode_of_training": editInfo['mode_of_training'],
            "attendance_type": editInfo['attendance_type'],
            "venue_name": editInfo['venue_name'],
            "from_dt": editInfo['from_dt'],
            "to_dt": editInfo['to_dt'],
            "scheduled_time": editInfo['scheduled_time'],
            "status": editInfo['status'],
            "attendees": editInfo['attendees'],
          });
        }
      }
    } catch (e) { };
  }

  onFilterClick() {
    let filters = this.scheduleFilters();
    this.scheduleDetGrid = this.copyData.filter((fl: any) => {
      let attendee_name = !filters.attendee_name || fl['attendee_name'] === filters.attendee_name;
      let department_name = !filters.department_name || fl['department_name'] === filters.department_name;
      let role_name = !filters.role_name || fl['role_name'] === filters.role_name;
      return attendee_name && department_name && role_name;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.scheduleFilters.set(JSON.parse(this.intialFilters));
      this.scheduleDetGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }


  goBack(): void {
    this.location.back();
  }

}
