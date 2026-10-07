import { Location, CommonModule } from '@angular/common';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, signal, inject, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

interface meetingAttendanceTable {
  id: number;
  meeting_id: any;
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
  selector: 'app-meeting-attendance',
  imports: [CommonModule, NgbdSortableHeader, SelectModule, FormsModule, SharedModule],
  templateUrl: './meeting-attendance.component.html',
})
export class MeetingAttendanceComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    nominee_name: null,
    employee_id: null,
  });
  public meetingAttenFilters = signal(JSON.parse(this.intialFilters));
  public nomineeList: any = [];
  public employeeIDList: any = [];
  public statusList: any = [];
  public meetingAttendGrid: meetingAttendanceTable[] = [];
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
      this.readOnlyMeetingAttend().attendees = this.readOnlyMeetingAttend().attendees;
    } else {
      this.readOnlyMeetingAttend().attendees = [... this.readOnlyMeetingAttend().attendees].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  public readOnlyMeetingAttend: any = signal({
    "action": "I",
    "meeting_id": null,
    "meeting_name": null,
    "committee_name": null,
    "committee_type_name": null,
    "venue_name": null,
    "meeting_date": null,
    "meeting_period": null,
  })

  async ngOnInit() {
    try {
      let getStatus: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "METNGATTENDCSTS" });
      if (getStatus.status == 200) {
        this.statusList = getStatus.data.entities.METNGATTENDCSTS.values.map((ele: any, index: number) => ({
          ind: index + 1,
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code
        }))
      };
      let state = history.state;
      if (state ?.data) {
        await this.editMeetingAttend(state['data']['id']);
      };
    } catch (e) { };
  }

  async editMeetingAttend(meeting_id: any) {
    try {
      let getMeetingsListEdit: any = await this._hqms.customGetApiCall('GET', 'fnMeetingApi',
        {
          "meeting_id": meeting_id,
        });
      if (getMeetingsListEdit.status == 200) {
        let editInfo = getMeetingsListEdit['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.readOnlyMeetingAttend.set({
            "action": "I",
            "meeting_id": editInfo.meeting_id,
            "meeting_name": editInfo.meeting_name,
            "committee_name": editInfo.committee_name,
            "committee_type_name": editInfo.committee_type_name,
            "venue_name": editInfo.venue_name,
            "meeting_date": editInfo.meeting_date,
            "meeting_period": editInfo.meeting_period,
            "attendance": editInfo.meeting_participants
          });
        }
      }
    } catch (e) {
    };
  }

  onFilterClick() {
    let filters = this.meetingAttenFilters();
    this.meetingAttendGrid = this.copyData.filter((fl: any) => {
      let nominee_name = !filters.nominee_name || fl['nominee_name'] === filters.nominee_name;
      let employee_id = !filters.employee_id || fl['employee_id'] === filters.employee_id;
      return nominee_name && employee_id;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.meetingAttenFilters.set(JSON.parse(this.intialFilters));
      this.meetingAttendGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  goBack(): void {
     this.router.navigateByUrl('/manage-meetings-dashboard');
  }

  async onSubmitClick() {
    try {
      let submitCnt: any = 0;
      let payLoad = JSON.parse(JSON.stringify(this.readOnlyMeetingAttend()));
      if (payLoad.attendance.length == 0) {
        this._hqms.hqmsToasterService({
          key: 'att',
          severity: 'warn',
          summary: 'Atleast Mark attendance for an Member',
          detail: 'Check the errors',
        });
        return;
      }

      payLoad.attendance.forEach((att) => {
        delete att.member_type;
        delete att.employee_code;
        delete att.meeting_user_name;
      })
      delete payLoad.loc_id;
      delete payLoad.org_id;
      delete payLoad.status;
      delete payLoad.end_time;
      delete payLoad.is_active;
      delete payLoad.venue_id;
      delete payLoad.tenant_id;
      delete payLoad.created_at;
      delete payLoad.created_by;
      delete payLoad.rec_status;
      delete payLoad.start_time;
      delete payLoad.updated_at;
      delete payLoad.updated_by;
      delete payLoad.venue_name;
      delete payLoad.committee_id;
      delete payLoad.meeting_code;
      delete payLoad.meeting_date;
      delete payLoad.meeting_name;
      delete payLoad.created_by_id;
      delete payLoad.total_row_cnt;
      delete payLoad.updated_by_id;
      delete payLoad.committee_name;
      delete payLoad.meeting_agenda;
      delete payLoad.meeting_period;
      delete payLoad.chair_person_id;
      delete payLoad.co_ordinator_id;
      delete payLoad.total_attendees;
      delete payLoad.external_members;
      delete payLoad.chair_person_name;
      delete payLoad.co_ordinator_name;
      delete payLoad.committee_members;
      delete payLoad.committee_type_id;
      delete payLoad.co_chair_person_id;
      delete payLoad.committee_type_name;
      delete payLoad.co_chair_person_name;
      delete payLoad.meeting_participants;
      delete payLoad.supporting_documents;
      let confirmMeeting = await this._hqms.showConfirmMessage();
      if (confirmMeeting) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnMeetingAttendaceApi", payLoad);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            severity: 'success',
            summary: 'Meeting Attendance',
            detail: saveResult.message,
          });
          this.onClearClick();
          this.router.navigateByUrl('/schedule-commitee-meetings-dashboard');
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            severity: 'warn',
            summary: 'Meeting Attendance',
            detail: saveResult.message,
          });
        }
      };
    } catch (e) {
    }
  }

  async onClearClick() {
    await this.ngOnInit();
  }
}
