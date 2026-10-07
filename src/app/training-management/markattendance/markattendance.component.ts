import { Location, CommonModule } from '@angular/common';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, signal, inject, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DatePipe } from '@angular/common';

interface markAttendanceTable {
  id: number;
  training_id: any;
  nominee_name: any;
  employee_id: any;
  date_of_presence: any;
  attendees : any;
};

export type SortColumn =  '';
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
  selector: 'app-markattendance',
  imports: [ CommonModule, FormsModule, NgbdSortableHeader, SelectModule, SharedModule],
  templateUrl: './markattendance.component.html'
})
export class MarkattendanceComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    nominee_name: null,
    employee_id: null,
  });
  public markAttenFilters = signal(JSON.parse(this.intialFilters));
  public nomineeList: any = [];
  public employeeIDList: any = [];
  public statusList: any = [];
  public markAttendGrid: markAttendanceTable[] = [];
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
      this.readOnlyMarkAttend().attendees = this.readOnlyMarkAttend().attendees;
    } else {
      this.readOnlyMarkAttend().attendees = [... this.readOnlyMarkAttend().attendees].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  public readOnlyMarkAttend: any = signal({
    "action": "I",
    "training_id": null,
    "training_schedule_id": null,
    "training_name": null,
    "mode_of_training": null,
    "venue": null,
    "starting_date": null,
    "ending_date": null,
    "attendees": null,
    "present_cnt" : 0
  })

  async ngOnInit() {
    try {
      let getStatus: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "ATTENDANCESTATUS" });
      if (getStatus.status == 200) {
        this.statusList = getStatus.data.entities.ATTENDANCESTATUS.values.map((ele: any, index: number) => ({
          ind: index + 1,
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code
        }))
      };
      let state = history.state;
      if (state ?.data) {
        await this.editMarkAttend(state['data']['id']);
        // await this.getMarkAttendGrid(),
      };
    } catch (e) { };
  }

  async editMarkAttend(training_id: any) {
    try {
      let getTraningsListEdit: any = await this._hqms.customGetApiCall('GET', 'fnAttendanceListGet',
        {
          "training_id": training_id,
        });
      if (getTraningsListEdit.status == 200) {
        let editInfo = getTraningsListEdit['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.readOnlyMarkAttend.set({
            "action": "I",
            "training_id": editInfo.training_id,
            "training_schedule_id": editInfo.training_schedule_id,
            "training_name": editInfo['training_name'],
            "mode_of_training": editInfo['mode_of_training'],
            "venue": editInfo['venue_name'],
            "starting_date": editInfo['from_date_time'],
            "ending_date": editInfo['to_date_time'],
            "attendees" : editInfo['attendees'],
            "present_cnt" : editInfo['present_cnt'],
          });
        }
      }
    } catch (e) { };
  }

  onFilterClick() {
    let filters = this.markAttenFilters();
    this.markAttendGrid = this.copyData.filter((fl: any) => {
      let nominee_name = !filters.nominee_name || fl['nominee_name'] === filters.nominee_name;
      let employee_id = !filters.employee_id || fl['employee_id'] === filters.employee_id;
      return nominee_name && employee_id;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.markAttenFilters.set(JSON.parse(this.intialFilters));
      this.markAttendGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }


  goBack(): void {
    this.location.back();
  }

 async onSubmitClick(){
   try{
     let submitCnt: any = 0;
     let payLoad =  JSON.parse(JSON.stringify(this.readOnlyMarkAttend()));

     if(payLoad.attendees.length == 0){
        this._hqms.hqmsToasterService({
          key: 'att',
          severity: 'warn',
          summary: 'Atleast mark an attendance for an Attendee',
          detail: 'Check the errors',
        });
        return;
     }

     payLoad.attendees.forEach((att)=> {
       delete att.role_id;
       delete att.role_name;
       delete att.attendee_name;
       delete att.department_id;
       delete att.employee_code;
       delete att.attendee_status;
       delete att.department_name;
       delete att.date_of_presence;
     })
     delete payLoad.training_name;
     delete payLoad.mode_of_training;
     delete payLoad.venue;
     delete payLoad.starting_date;
     delete payLoad.ending_date;
     delete payLoad.present_cnt;

     let confirmLicenseMaster = await this._hqms.showConfirmMessage();
      if (confirmLicenseMaster) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnAttendanceListGet", payLoad);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            severity: 'success',
            summary: 'Mark Attendance',
            detail: saveResult.message,
          });
          this.onClearClick();
          this.router.navigateByUrl('/attendance-dashboard');
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            severity: 'warn',
            summary: 'Mark Attendance',
            detail: saveResult.message,
          });
        }
      };
   }catch(e){
   }
  }

 async onClearClick(){
    await this.ngOnInit();
  }
}
