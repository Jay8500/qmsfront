import { Component, signal, inject, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';

import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { Validations } from '../../../validations';

@Component({
  selector: 'app-schedule-commitee-meetings-add',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SelectModule, MultiSelectModule, FileUploadModule, SharedModule],
  templateUrl: './schedule-commitee-meetings-add.component.html',
})
export class ScheduleCommiteeMeetingsAddComponent implements OnInit {
  @ViewChild('sprtngDocs') sprtngDocs!: FileUpload;
  readonly FORM_NAME = 'SchMeetingAddForm';
  private validations = inject(Validations);
  public router = inject(Router);
  public pageMode = "NEW";
  public attachedFiles: any = [];
  public minDateSetter: any = signal(null);
  public errorMsg: any = {
    committee_id: '',
    external_members: '',
    meeting_name: '',
    meeting_date: '',
    start_time: '',
    end_time: '',
    venue_id: '',
    meeting_agenda: '',
  };
  public committeeTypeList = [];
  public chooseCommitteeList = [];
  public externalMemberList = [];
  public coordinatorList = [];
  public venueList = [];

  public schMeetings: any = JSON.stringify({
    "action": "I",
    "meeting_id": null,
    "committee_type_id": null,
    "committee_id": null,
    "meeting_name": null,
    "meeting_date": null,
    "start_time": null,
    "end_time": null,
    "venue_id": null,
    "supporting_documents": [],
    "meeting_agenda": null,
    "is_active": true,

    "chair_person_id": null,
    "chairperson": null,
    "co_chair_person_id": null,
    "co_chair_person_name": null,
    "co_ordinator_id": null,
    "co_ordinator": null,
    "committee_members": [],
    "external_members": [],
  });
  public createSchMeeting = signal<any>({ ...JSON.parse(this.schMeetings) });
  public getSrvrDt: any = null;
  public uploadError1 = false;
  public chairPersonList: any = [];
  public cochairPersonList: any = [];

  async onCommitteeTypeClick(ctrl) { // get committee list on type
    try {
      this.createSchMeeting().meeting_id = null;
      this.createSchMeeting().committee_id = null;
      this.createSchMeeting().meeting_name = null;
      this.createSchMeeting().meeting_date = null;
      this.createSchMeeting().start_time = null;
      this.createSchMeeting().end_time = null;
      this.createSchMeeting().venue_id = null;
      this.createSchMeeting().supporting_documents = [];
      this.createSchMeeting().meeting_agenda = null;
      this.createSchMeeting().is_active = true;
      this.createSchMeeting().chair_person_id = null;
      this.createSchMeeting().chairperson = null;
      this.createSchMeeting().co_chair_person_id = null;
      this.createSchMeeting().co_chair_person_name = null;
      this.createSchMeeting().co_ordinator_id = null;
      this.createSchMeeting().co_ordinator = null;
      this.createSchMeeting().committee_members = [];
      this.createSchMeeting().external_members = [];
      this.selectedCommitteId = null;
      Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
      let info: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        {
          "flag": "COMMITTEE",
          "committee_type_id": ctrl
        });
      if (info.status == 200) {
        this.chooseCommitteeList = info.data.map((ele: any) => ({
          label: ele.committee_name,
          value: ele.committee_id,
          chair_person_id: ele.chair_person_id,
          chairperson: ele.chairperson,
          co_ordinator_id: ele.co_ordinator_id,
          co_ordinator: ele.co_ordinator,
          committee_members: ele.committee_members,
          co_chair_person_id: ele.co_chair_person_id,
          co_chair_person_name: ele.co_chair_person_name,
        }))
      };
    } catch (e) { };
  }
  public selectedCommitteId = null;

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.createSchMeeting()[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  onCommitteeChange() {
    this.onGetErrorMsgs('committee_id');
    if (this.createSchMeeting().committee_id != null) {
      let filterRcd = this.chooseCommitteeList.filter((rs: any) => rs.value == this.createSchMeeting().committee_id);
      if (filterRcd.length > 0) {
        this.createSchMeeting().chair_person_id = filterRcd[0]['chair_person_id'];
        this.createSchMeeting().chairperson = filterRcd[0]['chairperson'];
        this.createSchMeeting().co_chair_person_name = filterRcd[0]['co_chair_person_name'];
        this.createSchMeeting().co_ordinator_id = filterRcd[0]['co_ordinator_id'];
        this.createSchMeeting().co_ordinator = filterRcd[0]['co_ordinator'];
        this.createSchMeeting().committee_members = filterRcd[0]['committee_members']
      };
    };
  }

  constructor(private location: Location,
    public _hqms: HqmsService,
    private activatedRoute: ActivatedRoute
  ) { }

  async ngOnInit() {
    try {
      let getSrvrDt = await this._hqms.getServerDate('DATE');
      this.minDateSetter.set(getSrvrDt);
      let info: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "COMMITTEETYPE" });
      if (info.status == 200) {
        this.committeeTypeList = info.data.entities.COMMITTEETYPE.values.map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code,
          sort_order: ele.sort_order,
        }))
      };

      let getExternalMemberList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        {
          "flag": "ECM"
        });
      if (getExternalMemberList.status == 200) {
        this.externalMemberList = getExternalMemberList.data.map((ele: any) => ({
          label: ele.employee_name,
          value: ele.employee_id
        }))
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
        await this.editScheduleMeet(state['data']['id'])
      };
    } catch (e) { };
  }

  async editScheduleMeet(meetingId: any) {
    try {
      let getScheduleMeetEdit: any = await this._hqms.customGetApiCall('GET', 'fnMeetingApi',
        {
          "action": "U",
          "meeting_id": meetingId,
          "is_active": true
        });
      if (getScheduleMeetEdit.status == 200) {
        let editInfo = getScheduleMeetEdit['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          await this.onCommitteeTypeClick(editInfo.committee_type_id)
          let supporting_documents = editInfo['supporting_documents'].length > 0 ? editInfo['supporting_documents'] : [];
          this.createSchMeeting.set({
            "action": "U", //INSERT
            "meeting_id": editInfo.meeting_id,
            "committee_type_id": editInfo.committee_type_id,
            "committee_id": editInfo.committee_id,
            "meeting_name": editInfo.meeting_name,
            "meeting_date": editInfo.meeting_date,
            "start_time": editInfo.start_time,
            "end_time": editInfo.end_time,
            "venue_id": editInfo.venue_id,
            "meeting_agenda": editInfo.meeting_agenda,
            "supporting_documents": supporting_documents,
            "is_active": editInfo.is_active,
            "chair_person_id": editInfo.chair_person_id,
            "chairperson": editInfo.chair_person_name,
            "co_chair_person_id": editInfo.co_chair_person_id,
            "co_chair_person_name": editInfo.co_chair_person_name,
            "co_ordinator_id": editInfo.co_ordinator_id,
            "co_ordinator": editInfo.co_ordinator_name,
            "committee_members": editInfo.committee_members,
            "external_members": editInfo.external_members.map((ele) => (ele.meeting_user_id)),
          })
        }
      };
    } catch (e) {
    };
  }

  getActiveimg(image: any) {
    let active = image.filter((im: any) => im.is_active == true);
    return active.length;
  }

  async  onFileSelect(thisFile: any, fileSelected: any, fileType: any, thisObj: any, maindata: any) {
    this.uploadError1 = false;
    thisObj.supporting_documents.push(
      {
        file_id: null,
        file_name: fileSelected.files[0].name,
        file_type: fileSelected.files[0].type, // "JPG"
        file_size: fileSelected.files[0].size,
        storage_path: null,
        fileSaveType: null,
        is_active: true,
        upload_file_name: fileSelected.files[0].name
      }
    );
    this.attachedFiles.push({ "fileName": fileSelected.files[0].name, "fileContent": fileSelected.files[0] });
    thisFile.clear();
  }

  async removeImage(doc: any, imgIndex: any) {
    let confirm = await this._hqms.showConfirmMessage(`Remove ${doc.file_name}`);
    if (confirm) {
      this.uploadError1 = false;
      doc.is_active = false;
      let thisFileName = doc.upload_file_name;
      let thisFileIndex: any = -1;
      this.attachedFiles.forEach((aFile: any, aIndex: number) => {
        if (aFile.fileName == thisFileName) thisFileIndex = aIndex;
      });
      if (thisFileIndex >= 0) {
        this.attachedFiles.splice(thisFileIndex, 1);
      };
      this.sprtngDocs.clear();
    };
  }

  async onSubmitClick() {
    let isValid = false;
    if (this.pageMode == 'Reschedule') {
      ['meeting_date', 'start_time', 'end_time'].forEach((ctrl) => this.onGetErrorMsgs(ctrl));
      isValid = this._hqms.showErrorSummary({
        meeting_date: this.errorMsg.meeting_date,
        start_time: this.errorMsg.start_time,
        end_time: this.errorMsg.end_time,
      });
    } else {
      Object.keys(this.errorMsg).forEach((ctrl) => this.onGetErrorMsgs(ctrl));
      isValid = this._hqms.showErrorSummary(this.errorMsg);
    };
    if (isValid || this.uploadError1) {
      this._hqms.hqmsToasterService({
        key: 'schedmeet',
        severity: 'warn',
        summary: 'Schedule Committee Meetings',
        detail: 'Check the errors',
      });
      return;
    };
    let getSchComit = JSON.parse(JSON.stringify(this.createSchMeeting()));
    getSchComit['committee_members'] = getSchComit['committee_members'].map((ele) => (ele.committee_user_id))
    if (this.pageMode == 'NEW') {
      getSchComit['supporting_documents'] = getSchComit['supporting_documents'].filter((fl: any) => fl.is_active == true);
    };
    let saveSchComit: any = {};
    let formData = new FormData();
    if (this.pageMode != 'Reschedule') {
      saveSchComit = { ...getSchComit };
      this.attachedFiles.forEach((file: any, index: number) => {
        formData.append("file", file.fileContent, file.fileName);
      });
      formData.append("data", JSON.stringify(saveSchComit));
    } else {
      let { meeting_date, start_time, end_time, action = 'R', meeting_id } = getSchComit;
      saveSchComit = { meeting_date: meeting_date, start_time: start_time, end_time: end_time, action: 'R', meeting_id: meeting_id };
    }
    let confirmScheduleMeet = await this._hqms.showConfirmMessage();
    if (confirmScheduleMeet) {
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnMeetingApi", this.pageMode != 'Reschedule' ? formData : saveSchComit);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Schedule Committee Meetings',
          detail: saveResult.message,
        });
        this.onClearClick();
        this.router.navigateByUrl('/schedule-commitee-meetings-dashboard');
      } else if (saveResult.status == 204 || saveResult.status == 501) {
        this._hqms.hqmsToasterService({
          severity: 'warn',
          summary: 'Schedule Committee Meetings',
          detail: saveResult.message,
        });
      }
    };
  }

  onClearClick() {
    this.uploadError1 = false;
    this.createSchMeeting.set({ ...JSON.parse(this.schMeetings) });
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
  }

  goBack(): void {
    this.router.navigateByUrl('/schedule-commitee-meetings-dashboard');
  }
}

