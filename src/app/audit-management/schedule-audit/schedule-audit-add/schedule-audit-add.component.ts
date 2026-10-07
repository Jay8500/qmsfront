import { Component, OnInit, signal, inject, ViewChildren, QueryList } from '@angular/core';
import { HqmsService } from '../../../services/hqms.service';
import { Validations } from '../../../validations';
import { Router, ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import { DatePipe } from '@angular/common';
interface scheduleAuditModel {
  action: string,
  audit_type_id: any;
  audit_template_id: any;
  department_id: any;
  location_id: any;
  auditor_id: any;
  auditee_id: any;
  audit_date: any;
  prev_date: any;
  audit_title: any;
  patient_details: any;
  supporting_documents: any;
  schedule_id: any;
  // is_active:any;
}
@Component({
  selector: 'app-schedule-audit-add',
  imports: [FormsModule, SharedModule, FileUploadModule],
  templateUrl: './schedule-audit-add.component.html',
})
export class ScheduleAuditAddComponent implements OnInit {
  private validations = inject(Validations);
  @ViewChildren('upCoverPage') upCoverPage!: FileUpload;
  readonly FORM_NAME = 'scheduleAudit';
  public errorMsg: any = {
    audit_template_id: '', department_id: '', location_id: '', auditor_id: '', auditee_id: '',
    audit_date: '', audit_title: '', patient_id: '', treating_consultant_id: '', specialty_id: '',
    encounter_type_id: '', record_source_id: '', diagnosis: '', additional_comments: '',
  };
  selectedAuditType: string = 'GENERAL'; // Default to General
  public pageMode = 'NEW';
  public auditTypeList: any = [];
  public auditsList: any = [];
  public departmentList: any = [];
  public locationsList: any = [];
  public auditorList: any = [];
  public auditeeList: any = [];
  public attachedFiles: any = [];
  public patientsList: any = [];
  public treatingCnsltntList: any = [];
  public encounterTypeList: any = [];
  public recordSourceList: any = [];
  public specalityList: any = [];
  public schAdt: any = JSON.stringify({
    action: "I", //INSERT
    audit_type_id: null,
    audit_template_id: null,
    department_id: null,
    location_id: null,
    auditor_id: null,
    auditee_id: null,
    audit_date: null,
    prev_date: null,
    audit_title: "",
    patient_details: {
      patient_id: null,
      patient_uhid: null,
      treating_consultant_id: null,
      specialty_id: null,
      encounter_type_id: null,
      record_source_id: null,
      diagnosis: null,
      additional_comments: null,
      consent_present: true,
    },
    supporting_documents: [],
    schedule_id: null,
  });
  public scheduleAudit: any = signal<scheduleAuditModel>({ ...JSON.parse(this.schAdt) });
  public minDateSetter: any = signal(null);

  constructor(private router: Router, private location: Location, public _hqms: HqmsService, public _datePipe: DatePipe) {
  }

  async ngOnInit() {
    let getSrvrDt = await this._hqms.getServerDate('DATE');
    this.minDateSetter.set(getSrvrDt)
    let info: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
      { "entity_codes": "AUDIT_TYPE | ENCOUNTER_TYPE | RECORD_SOURCE" }, true);
    if (info.status == 200) {
      this.auditTypeList = info.data['entities']['AUDIT_TYPE']['values'].map((ele: any) => ({
        label: ele.display_value,
        value: ele.entity_value_id,
        value_code: ele.value_code,
        sort_order: ele.sort_order,
      }));
      this.encounterTypeList = info.data['entities']['ENCOUNTER_TYPE']['values'].map((ele: any) => ({
        label: ele.display_value,
        value: ele.entity_value_id,
        value_code: ele.value_code,
        sort_order: ele.sort_order,
      }));
      this.recordSourceList = info.data['entities']['RECORD_SOURCE']['values'].map((ele: any) => ({
        label: ele.display_value,
        value: ele.entity_value_id,
        value_code: ele.value_code,
        sort_order: ele.sort_order,
      }))
    };
  
    let spcltyList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
      {
        "flag": "SPECIALITY"
      }, true);
    if (spcltyList.status == 200) {
      this.specalityList = spcltyList.data.map((ele: any) => ({
        label: ele.specialty_name,
        value: ele.speciality_id
      }))
    };
    let dprtmntLst: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
      {
        "flag": "DEPARTMENT"
      }, true);
    if (dprtmntLst.status == 200) {
      this.departmentList = dprtmntLst.data.map((ele: any) => ({
        label: ele.department_name,
        value: ele.department_id
      }))
    };
    let locList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
      {
        "flag": "AUDIT_LOCATION"
      }, true);
    if (locList.status == 200) {
      this.locationsList = locList.data.map((ele: any) => ({
        label: ele.location_name,
        value: ele.audit_location_id
      }))
    };
    let patnList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
      {
        "flag": "PATIENT"
      }, true);
    if (patnList.status == 200) {
      this.patientsList = patnList.data.map((ele: any) => ({
        label: ele.patient_name,
        value: ele.patient_id
      }))
    };
    let trtngCnsltnt: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
      {
        "flag": "DOCTOR"
      }, true);
    if (trtngCnsltnt.status == 200) {
      this.treatingCnsltntList = trtngCnsltnt.data.map((ele: any) => ({
        label: ele.doctor_name,
        value: ele.doctor_id
      }))
    };
    let getFaculty: any = await this._hqms.customGetApiCall('GET', 'fnTrainingFacultyDropdownGetApi',
      {
        "faculty_type": "INTERNAL",
        "is_faculty": false
      }, true);
    if (getFaculty.status == 200) {
      this.auditorList = getFaculty.data.map((ele: any) => ({
        label: ele.name,
        value: ele.id,
        value_code: ele.value_code,
        faculty_type: ele.faculty_type,
        department_id: ele.department_id,
        department_name: ele.department_name,
        specialization_name: ele.specialization_name,
      }));
    };
    let state = history.state;
    this.pageMode = state['data']['mode'];
    if (this.pageMode != 'NEW') {
      await this.editSchAudit(state['data']['id'])
    };
  }

  async onTypeSelect(ctrl: any) {
    try {
      this.auditsList = [];
      let auditList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        {
          "flag": "AUDIT",
          audit_type_id: ctrl
        }, true);
      if (auditList.status == 200) {
        this.auditsList = auditList.data.map((ele: any) => ({
          label: ele.audit_name,
          value: ele.audit_template_id
        }))
      };
    } catch (e) { };
  }

  async getAuiteeList() {
    try {
      this.auditeeList = [];
      let adtees: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        {
          "reference_type": "DEPT",
          "reference_type_id": this.scheduleAudit().department_id,
          "flag": "EMPLOYEE"
        }, true);
      if (adtees.status == 200) {
        this.auditeeList = adtees.data.map((ele: any) => ({
          label: ele.employee_name,
          value: ele.employee_id
        }))
      };
    } catch (e) {
    };
  }

  async editSchAudit(schId: any) {
    try {
      let editInfo: any = await this._hqms.customGetApiCall('GET', 'fnAuditScheduleApi',
        {
          "schedule_id": schId
        });
      if (editInfo.status == 200) {
        let editInfos = editInfo['data'];
        if (editInfos.length > 0) {
          editInfos = editInfos[0];

          await this.onTypeSelect(this.auditTypeList.filter((fl) => fl.value == editInfos.audit_type_id)[0])
          let supporting_documents = [];
          supporting_documents = editInfos['supporting_documents'].length > 0 ?
            editInfos['supporting_documents'] : [];
          this.onAuditTypeChange(this.auditTypeList.filter((fl) =>
            fl.value == editInfos.audit_type_id)[0]);
          let incAdtByOne = new Date(editInfos.audit_date);
          incAdtByOne.setDate(incAdtByOne.getDate() + 1);
          let nextDt = incAdtByOne.toISOString().split('T')[0];
          this.minDateSetter.set(nextDt)
          this.scheduleAudit.set({
            action: "U", //INSERT
            audit_type_id: editInfos.audit_type_id,
            audit_template_id: editInfos.audit_template_id,
            department_id: editInfos.department_id,
            location_id: editInfos.audit_location_id,
            auditor_id: editInfos.auditor_id,
            auditee_id: editInfos.auditee_id,
            audit_date: ['VIEW', 'EDIT'].includes(this.pageMode) ? editInfos.audit_date : null,
            prev_date: editInfos.audit_date,
            audit_title: editInfos.audit_title,
            schedule_id: editInfos.schedule_id,
            patient_details: {
              patient_id: editInfos.patient_details.length == 0 ? null : editInfos.patient_details[0]['patient_id'],
              patient_uhid: editInfos.patient_details.length == 0 ? null : editInfos.patient_details[0]['patient_uhid'],
              treating_consultant_id: editInfos.patient_details.length == 0 ? null : editInfos.patient_details[0]['treating_consultant_id'],
              specialty_id: editInfos.patient_details.length == 0 ? null : editInfos.patient_details[0]['specialty_id'],
              encounter_type_id: editInfos.patient_details.length == 0 ? null : editInfos.patient_details[0]['encounter_type_id'],
              record_source_id: editInfos.patient_details.length == 0 ? null : editInfos.patient_details[0]['record_source_id'],
              diagnosis: editInfos.patient_details.length == 0 ? null : editInfos.patient_details[0]['diagnosis'],
              additional_comments: editInfos.patient_details.length == 0 ? null : editInfos.patient_details[0]['additional_comments'],
              consent_present: editInfos.patient_details.length == 0 ? null : editInfos.patient_details[0]['consent_present']
            },
            supporting_documents: supporting_documents
          });
          await this.getAuiteeList();
        }
      };
    } catch (e) {
      console.log(e, "dshfdhd")
    };
  }

  goBack() {
    this.router.navigate(['/schedule-audit-dashboard']);
  }

  async onAuditTypeChange(auditType: any) {
    try {
      this.selectedAuditType = auditType['value_code'];
      if (auditType == 'GENERAL') {
        this.scheduleAudit.set({
          action: this.pageMode == 'NEW' ? "I" : "U", //INSERT
          audit_type_id: null,
          audit_template_id: null,
          department_id: null,
          location_id: null,
          auditor_id: null,
          auditee_id: null,
          audit_date: null,
          audit_title: "",
          patient_details: {
            patient_id: null,
            patient_uhid: null,
            treating_consultant_id: null,
            specialty_id: null,
            encounter_type_id: null,
            record_source_id: null,
            diagnosis: null,
            additional_comments: null,
            consent_present: true,
          },
          supporting_documents: [],
        })
      }
      await this.onTypeSelect(auditType['value'])
    } catch (e) {
    }
  }



  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.scheduleAudit()[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  onGetPatientErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.scheduleAudit().patient_details[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  async onDepartmentChange() {
    this.onGetErrorMsgs('department_id');
    if (this.scheduleAudit().department_id != null) {
      await this.getAuiteeList();
    };
  }

  public uploadError1 = false;

  async  onCoverPageFileSelect(thisFile: any, fileSelected: any, fileType: any, thisObj: any, maindata: any) {
    this.uploadError1 = false;
    if (['application/pdf'].includes(fileSelected.files[0].type) ||
      ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(fileSelected.files[0].type)) {
      this.uploadError1 = true;
      this._hqms.hqmsToasterService({
        key: 'scheduleAudit',
        severity: 'warn',
        summary: 'Supporting Documents',
        detail: 'Accepted Formats were .png/.jpeg',
      });
      setTimeout(() => {
        thisFile.clear();
        this.uploadError1 = false;
      }, 3000);
      return;
    };
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
      });
    this.attachedFiles.push({ "fileName": fileSelected.files[0].name, "fileContent": fileSelected.files[0] });
    thisFile.clear();
  }

  async removeCoverPageImage(doc: any, imgIndex: any) {
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
      this.upCoverPage.clear();
    }
  }

  async onSubmitClick() {
    let isValid = false;
    const patientFields = ['patient_id', 'treating_consultant_id', 'specialty_id', 'encounter_type_id', 'record_source_id', 'diagnosis', 'additional_comments'];
    if (this.pageMode == 'Reschedule') {
      this.onGetErrorMsgs('audit_date');
      isValid = this.errorMsg['audit_date'] != '';
    } else {
      Object.keys(this.errorMsg).forEach((ctrl) => {
        if (patientFields.includes(ctrl)) {
          if (this.selectedAuditType === 'PATIENT') this.onGetPatientErrorMsgs(ctrl);
          else this.errorMsg[ctrl] = '';
        } else if (ctrl === 'auditee_id') {
          if (this.selectedAuditType !== 'PATIENT') this.onGetErrorMsgs(ctrl);
          else this.errorMsg[ctrl] = '';
        } else {
          this.onGetErrorMsgs(ctrl);
        }
      });
      isValid = this._hqms.showErrorSummary(this.errorMsg);
    };
    if (isValid || this.uploadError1) {
      this._hqms.hqmsToasterService({
        key: 'scheduleAudit',
        severity: 'warn',
        summary: 'Schedule Audit',
        detail: 'Check the errors',
      });
      return;
    };
    let getSchaudit = JSON.parse(JSON.stringify(this.scheduleAudit()));
    if (this.pageMode == 'NEW') {
      getSchaudit['supporting_documents'] = getSchaudit['supporting_documents'].filter((fl: any) => fl.is_active == true);
    };
    let saveSch: any = {};
    let formData = new FormData();
    if (this.pageMode != 'Reschedule') {
      saveSch = { ...getSchaudit };
      this.attachedFiles.forEach((file: any, index: number) => {
        formData.append("file", file.fileContent, file.fileName);
      });
      formData.append("data", JSON.stringify(saveSch));
    } else {
      let { audit_date, action = 'R', schedule_id } = getSchaudit;
      saveSch = { audit_date: audit_date, action: 'R', schedule_id: schedule_id };
    }
    let cnfrmSchAdit = await this._hqms.showConfirmMessage();
    if (cnfrmSchAdit) {
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnAuditScheduleApi", this.pageMode != 'Reschedule' ? formData : saveSch);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Schedule Audit',
          detail: saveResult.message,
        });
        this.onClearClick();
        this.router.navigateByUrl('/schedule-audit-dashboard');
      } else if (saveResult.status == 204 || saveResult.status == 501) {
        this._hqms.hqmsToasterService({
          severity: 'warn',
          summary: 'Schedule Audit',
          detail: saveResult.message,
        });
      }
    };
  }

  onClearClick() {
    this.uploadError1 = false;
    this.scheduleAudit.set({ ...JSON.parse(this.schAdt) });
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
  }
}
