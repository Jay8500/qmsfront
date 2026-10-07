import { Component, signal, computed, effect, QueryList, ViewChildren, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location, CommonModule, DatePipe } from '@angular/common';
interface createScheduleTraining {
  "action": string,
  "training_schedule_id": any,
  "training_id": any,
  "mode_of_training_id": any,
  "attendance_type_id": any,
  "participants_fb_id": any,
  "venue_id": any,
  "from_dt": any,
  "to_dt": any,
  // "from_time": any,
  // "to_time": any,
  "max_capacity": any,
  "is_dep_role": any,
  "basic_training": any,
  "faculty_name": any,
  "faculty_id": any,
  "is_active": boolean
};
interface Employee {
  id: number
  employee_name: string,
  employee_id: string,
  is_selected: boolean
}
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SharedModule } from '../../../shared/shared.module';
import { HqmsService } from '../../../services/hqms.service';
import { Validations } from '../../../validations';
@Component({
  selector: 'app-schedule-add',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, SharedModule],
  templateUrl: './schedule-add.component.html',
  styleUrl: './schedule-add.component.scss',
  providers: [DatePipe]
})
export class ScheduleAddComponent implements OnInit {
  private validations = inject(Validations);
  readonly FORM_NAME = 'ScheduleAddForm';
  public router: any = inject(Router);
  public pageMode = "NEW";
  public errorMsg: any = {
    department: '', role: '', training_id: '', mode_of_training_id: '',
    venue_id: '', attendance_type_id: '', from_dt: '', to_dt: '', participants_fb_id: ''
  };
  public departmentList = [];
  public roleList = [];
  public trainingList = [];
  public facultyList = [];
  public modeOfTrainingList = [];
  public venueList = [];
  public attendanceTypeList = [];
  public feedbackList = [];
  public enRollMentSourceList: any = [];
  public attendees = signal<Employee[]>([]);
  public selectedEmployeesCnt = computed(() => this.attendees().filter(e => e.is_selected).length);
  public isAllSelected = computed(() => {
    let list = this.attendees();
    return list.length > 0 && list.every(e => e.is_selected);
  });
  public initialShceduleAdd: any = JSON.stringify({
    "action": "I", //INSERT
    "training_schedule_id": null,
    "training_id": null,
    "mode_of_training_id": null,
    "attendance_type_id": null,
    "participants_fb_id": null,
    "venue_id": null,
    "from_dt": null,
    "to_dt": null,
    "max_capacity": null,
    "is_dep_role": null,
    "basic_training": null, // NO DB
    "faculty_name": null, // NO DB
    "faculty_id": null, // NO DB
    "is_active": true,
  });
  public createScheduleTraining = signal<createScheduleTraining>({ ...JSON.parse(this.initialShceduleAdd) });
  public isEmpLoading = signal<boolean>(true);
  public getServerDate: any = null;
  public minDateSetter: any = signal(null);

  constructor(private location: Location,
    public _hqms: HqmsService,
    private activatedRoute: ActivatedRoute,
    public _datePipe: DatePipe
  ) { }

  async ngOnInit() {
    try {
      let getSrvrDt = await this._hqms.getServerDate('DATE');
      this.minDateSetter.set(getSrvrDt)
      let trainingList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        {
          "flag": "TRAINING"
        });
      if (trainingList.status == 200) {
        this.trainingList = trainingList.data.map((ele: any) => ({
          label: ele.training_name,
          value: ele.training_id,
          faculty_name: ele.faculty_name,
          faculty_id: ele.faculty_id,
          mode_of_training_id: ele.mode_of_training_id
        }))
      };

      let info: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "MODEOFTRAINING | ATTENDANCETYPE | PARTICIPANTSFEEDBACK | ENROLLMENT_SOURCE" });
      if (info.status == 200) {
        this.modeOfTrainingList = info.data['entities']['MODEOFTRAINING']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id
        }));
        this.attendanceTypeList = info.data['entities']['ATTENDANCETYPE']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id
        }));
        this.feedbackList = info.data['entities']['PARTICIPANTSFEEDBACK']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id
        }));
        this.enRollMentSourceList = info.data['entities']['ENROLLMENT_SOURCE']['values'].map((ele: any, index: number) => ({
          ind: index + 1,
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code
        }));
      };
      let getVenueList: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "VENUE" });
      if (getVenueList.status == 200) {
        this.venueList = getVenueList.data.entities.VENUE.values.map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
        }))
      };
      let state = history.state;
      this.pageMode = state['data']['mode'];
      if (this.pageMode != 'NEW') {
        await this.editScheduleTraining(state['data']['id'])
      };
    } catch (e) {
    };
  }
  public copyEmployees = signal<Employee[]>([]);

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.createScheduleTraining()[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  async onDepRoleChange() {
    const ctrl = this.selectedSrcType === 'DEPARTMENT' ? 'department' : 'role';
    const otherCtrl = ctrl === 'department' ? 'role' : 'department';
    this.errorMsg[otherCtrl] = '';
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.createScheduleTraining().is_dep_role);
    this.errorMsg[ctrl] = result?.message || '';
    if (![null, ''].includes(this.createScheduleTraining().is_dep_role)) {
      await this.getEmployees(ctrl == 'department' ? 'DEPT' : 'ROLE', this.createScheduleTraining().is_dep_role);
    };
  }

  onTrainingChange() {
    this.onGetErrorMsgs('training_id');
    let value = this.createScheduleTraining().training_id;
    if (!["", null].includes(value)) {
      let getFaculty = this.trainingList.filter((fl: any) => fl.value == value) || [];
      if (getFaculty.length > 0) {
        this.createScheduleTraining().faculty_name = null;
        this.createScheduleTraining().faculty_id = null;
        this.createScheduleTraining().faculty_name = getFaculty[0]["faculty_name"];
        this.createScheduleTraining().faculty_id = getFaculty[0]["faculty_id"];
        this.createScheduleTraining().mode_of_training_id = getFaculty[0]["mode_of_training_id"];
        let attEmp: any = this.copyEmployees();
        this.attendees.set([]);
        let filterSame: any = attEmp.filter((fl: any) => fl.employee_id !== this.createScheduleTraining().faculty_id)
        if (filterSame.length > 0) {
          this.attendees.set(filterSame);
        } else {
          this.attendees.set([]);
          let copy = this.copyEmployees();
          this.attendees.set(copy)
        };
      };
    };
  }

  async getEmployees(flag: any, id: any) {
    try {
      this.isEmpLoading.set(true);
      this.attendees.set([]);
      this.copyEmployees.set([]);
      let tempArray: Employee[] = [];
      let getEmpsInfo: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        {
          "reference_type": flag,
          "reference_type_id": id,
          "flag": "EMPLOYEE"
        });

      if (getEmpsInfo.status == 200) {
        getEmpsInfo.data.forEach((emp: any, index: number) => {
          let emps = {
            "attendee_id": null,
            "id": index + 1,//NO DB
            "is_selected": false, // NO DB
            "employee_name": emp.employee_name, // NO DB
            "employee_id": emp.employee_id,
            "attendee_status_id": null
          };
          if (flag == 'DEPT') {
            emps['department_id'] = id;
            emps['role_id'] = null;
          } else {
            emps['department_id'] = null;
            emps['role_id'] = id;
          };
          if (this.createScheduleTraining().basic_training != null) {
            emps['enrollment_source_id'] = this.createScheduleTraining().basic_training;
          };
          if (this.copyEditAttendees.length > 0) {// EDITING
            let filterParticipants = this.copyEditAttendees.filter((fl: any) => fl.employee_id == emps['employee_id']);
            if (filterParticipants.length > 0) {
              emps['is_selected'] = true;
              emps['attendee_id'] = filterParticipants[0]['attendee_id'];
              emps['attendee_status_id'] = filterParticipants[0]['attendee_status_id'];
            };
          };
          tempArray.push(emps);
        });
        this.attendees.set(tempArray);
        this.copyEmployees.set(tempArray);
        this.isEmpLoading.set(false);
      }
    } catch (e) {
      this.isEmpLoading.set(false);
    };
    this.isEmpLoading.set(false);
  }
  public copyEditAttendees: any = [];
  async editScheduleTraining(scheduleId: any) {
    try {
      this.copyEditAttendees = [];
      let getScheduleListEdit: any = await this._hqms.customGetApiCall('GET', 'scheduleWriteApi',
        {
          "training_schedule_id": scheduleId
        });
      if (getScheduleListEdit.status == 200) {
        let editInfo = getScheduleListEdit['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.onTypeClick(this.enRollMentSourceList.filter((fl: any) => fl.value === editInfo['attendees'][0]['enrollment_source_id'])[0]['value_code']) //value code
          this.createScheduleTraining.set({
            "action": "U",
            "training_schedule_id": scheduleId,
            "training_id": editInfo['training_id'],
            "mode_of_training_id": editInfo['mode_of_training_id'],
            "attendance_type_id": editInfo['attendance_type_id'],
            "participants_fb_id": editInfo['participants_fb_id'],
            "venue_id": editInfo['venue_id'],
            "from_dt": editInfo['from_dt'],
            "to_dt": editInfo['to_dt'],
            // "from_time": editInfo['from_time'],
            // "to_time": editInfo['to_time'],
            "max_capacity": editInfo['max_capacity'],
            "is_dep_role": editInfo['attendees'][0]['department_id'],
            "basic_training": editInfo['attendees'][0]['enrollment_source_id'], // NOb
            "faculty_name": editInfo['faculty_name'], // NO DB
            "faculty_id": editInfo['faculty_id'], // NO DB
            "is_active": editInfo['is_active'],
          });
          this.copyEditAttendees = editInfo['attendees'];
          let getContext = this.enRollMentSourceList.filter((fl: any) => fl.value === editInfo['attendees'][0]['enrollment_source_id'])[0]['value_code'];
          // this.createScheduleTraining.update(
          //   {
          //     is_dep_role : getContext
          //   }
          // )

          await this.getEmployees(getContext == 'DEPARTMENT' ? 'DEPT' : 'ROLE', this.createScheduleTraining().is_dep_role)
        }
      }
    } catch (e) {
    };
  }
  public selectedSrcType: string = '';

  async onTypeClick(flag: string) {
    this.attendees.set([])
    this.errorMsg['department'] = '';
    this.errorMsg['role'] = '';
    try {
      if (flag == 'DEPARTMENT') {
        this.departmentList = [];
      } else {
        this.roleList = [];
      }
      this.selectedSrcType = flag;
      let getTypesList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        {
          "flag": flag
        });
      if (getTypesList.status == 200) {
        if (flag == 'DEPARTMENT') {
          this.departmentList = getTypesList.data.map((ele: any) => ({
            label: ele.department_name,
            value: ele.department_id,
          }));
        }
        if (flag == 'ROLE') {
          this.roleList = getTypesList.data.map((ele: any) => ({
            label: ele.role_name,
            value: ele.role_id,
          }));
        }
      };
    } catch (e) { }
  }

  toggleAll(shoudSelect: boolean) {
    this.attendees.update(list => list.map(e => ({ ...e, is_selected: shoudSelect })));
  }

  toggleSelection(id: number) {
    this.attendees.update((list: any) =>
      list.map(emp => emp.id === id ? { ...emp, is_selected: !emp.is_selected } : emp))
  }

  async onSubmitClick() {
    ['training_id', 'mode_of_training_id', 'venue_id', 'attendance_type_id', 'from_dt', 'to_dt', 'participants_fb_id']
      .forEach((ctrl) => this.onGetErrorMsgs(ctrl));
    const depRoleCtrl = this.selectedSrcType === 'DEPARTMENT' ? 'department' : 'role';
    const otherCtrl = depRoleCtrl === 'department' ? 'role' : 'department';
    this.errorMsg[otherCtrl] = '';
    const depRoleResult = this.validations.validateField(this.FORM_NAME, depRoleCtrl, this.createScheduleTraining().is_dep_role);
    this.errorMsg[depRoleCtrl] = depRoleResult?.message || '';
    let isValid = this._hqms.showErrorSummary(this.errorMsg);
    if (isValid || this.createScheduleTraining().basic_training == null) {
      this._hqms.hqmsToasterService({
        key: 'schedule',
        severity: 'warn',
        summary: 'Schedule',
        detail: 'Check the errors',
      });
      return;
    };
    if (this.selectedEmployeesCnt() == 0) {
      this._hqms.hqmsToasterService({
        key: 'schedule',
        severity: 'warn',
        summary: 'Schedule',
        detail: 'Select atleast an attendee',
      });
      return;
    };
    let getScheduleRcd = JSON.parse(JSON.stringify(this.createScheduleTraining()));
    getScheduleRcd['from_dt'] = this._datePipe.transform(new Date(getScheduleRcd['from_dt']), 'yyyy-MM-dd hh:mm a');
    getScheduleRcd['to_dt'] = this._datePipe.transform(new Date(getScheduleRcd['to_dt']), 'yyyy-MM-dd hh:mm a');
    let filterEmp: any = JSON.parse(JSON.stringify(this.attendees()));
    if (this.pageMode == 'NEW') { // ACTIVE RECORDS
      filterEmp = filterEmp.filter((fl: any) => (fl.attendee_id == null && fl.is_selected == true));
    } else { // (edited id and active)
      filterEmp = filterEmp.filter((fl: any) => (fl.attendee_id != null && fl.is_selected == true) ||
        (fl.attendee_id != null && fl.is_selected == false) || (fl.attendee_id == null && fl.is_selected == true));
    };
    filterEmp.forEach((ele: any) => {
      ele['is_active'] = ele.is_selected;
      delete ele.id;
      delete ele.employee_name;
      delete ele.is_selected;
    });
    getScheduleRcd['attendees'] = filterEmp;
    delete getScheduleRcd['basic_training'];
    delete getScheduleRcd['faculty_name'];
    delete getScheduleRcd['faculty_id'];
    delete getScheduleRcd['is_dep_role'];
    delete getScheduleRcd['basic_training'];
    let confirmTraining = await this._hqms.showConfirmMessage();
    if (confirmTraining) {
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "scheduleWriteApi", getScheduleRcd);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          key: 'schedule',
          severity: 'success',
          summary: 'Schedule',
          detail: saveResult.message,
        });
        this.onClearClick();
        this.router.navigateByUrl('/schedule-dashboard');
      } else if (saveResult.status == 204 || saveResult.status == 501) {
        this._hqms.hqmsToasterService({
          key: 'schedule',
          severity: 'warn',
          summary: 'Schedule',
          detail: saveResult.message,
        });
      }
    };
  }

  onClearClick() {
    this.createScheduleTraining.set({ ...JSON.parse(this.initialShceduleAdd) });
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
    this.selectedSrcType = '';
    this.isEmpLoading.set(false);
    this.attendees.set([]);
    this.copyEditAttendees = [];
  }

  goBack(): void {
    this.router.navigateByUrl('/schedule-dashboard');
  }
}
