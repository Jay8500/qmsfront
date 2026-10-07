import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
interface createLicenseTracker {
  "action": any,
  "license_id": any,
  "license_master_id": any,
  "license_no": any,
  "provider_id": any,
  "assigned_employee_id": any,
  "issue_date": any,
  "expiry_date": any,
  "renewal_application_date": any,
  "is_active": boolean,
  "license_files": any,
  "license_criteria": any
  "criteriaText": string
};
import { SelectModule } from 'primeng/select';
import { SharedModule } from '../../../shared/shared.module';
import { HqmsService } from '../../../services/hqms.service';
import { Validations } from '../../../validations';

@Component({
  selector: 'app-license-tracker-add',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, FileUploadModule, SharedModule],
  templateUrl: './license-tracker-add.component.html',
  styleUrl: './license-tracker-add.component.scss',
})
export class LicenseTrackerAddComponent implements OnInit {
  private validations = inject(Validations);
  readonly FORM_NAME = 'LicenseTrackerAddForm';
  public router = inject(Router);
  public pageMode = "NEW";
  public attachedFiles: any = [];
  @ViewChild('sprtngDocs') sprtngDocs!: FileUpload;

  public errorMsg: any = {
    license_master_id: '',
    license_no: '',
    provider_id: '',
    assigned_employee_id: '',
    issue_date: '',
    expiry_date: '',
    renewal_application_date: '',
    criteriaText:''
  };
  public licenseNameList = [];
  public providerList = [];
  public assigningToList = [];
  public selectedFcltyType = signal(null);
  public renewal_frequency_months: any = null;
  public licenseTrackerr: any = JSON.stringify({
    "action": "I",
    "license_id": null,
    "license_master_id": null,
    "license_no": null,
    "provider_id": null,
    "assigned_employee_id": null,
    "issue_date": null,
    "expiry_date": null,
    "renewal_application_date": null,
    "is_active": true,
    "license_files": [],
    "license_criteria": [],
    "criteriaText": "",
  });
  public createLicenseTracker: any = signal<createLicenseTracker>({ ...JSON.parse(this.licenseTrackerr) });
  public setExpryMaxDt: any = null;

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.createLicenseTracker()[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  onLicenseChange() {
    this.onGetErrorMsgs('license_master_id');
    this.onLicenseSelect(this.createLicenseTracker().license_master_id);
  }

  onLicenseSelect(value: any) {
    if (!["", null].includes(value)) {
      if (this.pageMode == 'NEW') {
        this.renewal_frequency_months = null;
        this.setExpryMaxDt = null;
        this.createLicenseTracker().issue_date = null;
        this.createLicenseTracker().expiry_date = null;
        this.createLicenseTracker().renewal_application_date = null;
        this.createLicenseTracker().license_criteria = [];
      }
      if (this.licenseNameList.length > 0) {
        let findLicense: any = this.licenseNameList.filter((lc: any, lcIn) => lc.value == value);
        if (findLicense.length > 0) {
          this.renewal_frequency_months = findLicense[0]['renewal_frequency_months'];
          // if(this.pageMode=='NEW'){
          findLicense = findLicense[0]['license_criteria'].map((ele) => ({
            ...ele, is_active: true, isMapped: true, is_completed: false,
            license_criteria_master_id: null
          }));
          this.createLicenseTracker().license_criteria = findLicense;
          // }
          let getToday = new Date(this.getSrvrDt);
          this.setExpryMaxDt = new Date(getToday.setMonth(getToday.getMonth() + this.renewal_frequency_months)).toISOString().split('T')[0];
        };
      };
    };
  }

  public minDateSetter: any = signal(null);
  public getSrvrDt: any = null;
  constructor(private location: Location, public _hqms: HqmsService, private activatedRoute: ActivatedRoute) { }

  async ngOnInit() {
    try {
      this.getSrvrDt = await this._hqms.getServerDate('DATE');
      this.minDateSetter.set(this.getSrvrDt)
      let getLicenseNameList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        {
          "flag": "LICENSE"
        });
      if (getLicenseNameList.status == 200) {
        this.licenseNameList = getLicenseNameList.data.map((ele: any) => ({
          label: ele.license_name,
          value: ele.license_master_id,
          license_criteria: ele.license_criteria,
          renewal_frequency_months: ele.renewal_frequency_months
        }))
      };
      let getProviderList: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        {
          "entity_codes": "PROVIDER"
        });
      if (getProviderList.status == 200) {
        this.providerList = getProviderList.data.entities.PROVIDER.values.map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
        }))
      };
      let getFaculty: any = await this._hqms.customGetApiCall('GET', 'fnTrainingFacultyDropdownGetApi',
        {
          "faculty_type": "INTERNAL",
          "is_faculty": false
        });
      if (getFaculty.status == 200) {
        this.assigningToList = getFaculty.data.map((ele: any) => ({
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
        await this.editlicenseTracker(state['data']['id'])
      };
    } catch (e) { };
  }

  async editlicenseTracker(licenseId: any) {
    try {
      let getLicenseTrackerInfo: any = await this._hqms.customGetApiCall('GET', 'fnLicenseApi',
        {
          "action": "U",
          "license_id": licenseId
        });
      if (getLicenseTrackerInfo.status == 200) {
        let editInfo = getLicenseTrackerInfo['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.createLicenseTracker().license_criteria = [];
          let findLicense: any = [];
          this.onLicenseSelect(editInfo['license_master_id'])
          let license_files = editInfo['license_files'].length > 0 ? editInfo['license_files'] : [];
          this.createLicenseTracker.set({
            "action": "U",
            "license_id": editInfo['license_id'],
            "license_master_id": editInfo['license_master_id'],
            "license_no": editInfo['license_no'],
            "provider_id": editInfo['provider_id'],
            "assigned_employee_id": editInfo['assigned_employee_id'],
            "issue_date": editInfo['issue_date'],
            "expiry_date": editInfo['expiry_date'],
            "criteriaText": editInfo['criteriaText'],
            "renewal_application_date": editInfo['renewal_application_date'],
            "license_files": license_files,
            "license_criteria": editInfo['license_criteria'].map((lc, index: number) => ({ ...lc, is_edit_click: false, license_criteria_checklist_id: lc.license_criteria_checklist_id })),
            "is_active": editInfo['is_active']
          })

          // if (this.licenseNameList.length > 0) {
          //   let findLicense: any = this.licenseNameList.filter((lc: any, lcIn) =>
          //     lc.value == editInfo['license_master_id']);
          //   if (findLicense.length > 0) {
          //     this.renewal_frequency_months = findLicense[0]['renewal_frequency_months'];
          //     let getToday = new Date(this.getSrvrDt);
          //     this.setExpryMaxDt = new Date(getToday.setMonth(getToday.getMonth() + this.renewal_frequency_months)).toISOString().split('T')[0];
          //   };
          // };
        }
      };
    } catch (e) {
    };
  }

  getActiveimg(image: any) {
    let active = image.filter((im: any) => im.is_active == true);
    return active.length;
  }
  public uploadError1 = false;

  async  onFileSelect(thisFile: any, fileSelected: any, fileType: any, thisObj: any, maindata: any) {
    this.uploadError1 = false;
    if (!['application/pdf'].includes(fileSelected.files[0].type)) {
      this.uploadError1 = true;
      this._hqms.hqmsToasterService({
        key: 'license',
        severity: 'warn',
        summary: 'License Tracker',
        detail: 'Accepted Formats were .pdf',
      });
      return;
    };
    this.uploadError1 = false;
    thisObj.license_files.push(
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
    this.attachedFiles.push({
      "fileName": fileSelected.files[0].name,
      "fileContent": fileSelected.files[0]
    });
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
    try {
      Object.keys(this.errorMsg).forEach((ctrl) => this.onGetErrorMsgs(ctrl));
      let isValid = this._hqms.showErrorSummary(this.errorMsg);
      if (isValid || this.uploadError1) {
        this._hqms.hqmsToasterService({
          key: 'license',
          severity: 'warn',
          summary: 'License Tracker',
          detail: 'Check the errors',
        });
        return;
      };
      let getCrt = JSON.parse(JSON.stringify(this.createLicenseTracker()));
      if (getCrt.license_criteria == 0) {
        this._hqms.hqmsToasterService({
          key: 'license',
          severity: 'warn',
          summary: 'License Tracker',
          detail: 'Atleast a license criteria is required',
        });
        return;
      };
      if (this.pageMode == 'NEW') {
        getCrt.license_criteria = getCrt.license_criteria.filter((actv: any) => actv.is_active == true);
      } else {
        getCrt.license_criteria = getCrt.license_criteria.filter((actv: any) =>
          actv.license_criteria_checklist_id != null && actv.is_active == true ||
          actv.license_criteria_checklist_id != null && actv.is_active == false ||
          actv.license_criteria_checklist_id == null && actv.is_active == true
        );
      }
      delete getCrt['criteriaText'];
      let formData = new FormData();
      this.attachedFiles.forEach((file: any, index: number) => {
        formData.append("file", file.fileContent, file.fileName);
      });
      formData.append("data", JSON.stringify(getCrt));
      let confirmLicenseTracker = await this._hqms.showConfirmMessage();
      if (confirmLicenseTracker) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnLicenseApi", formData);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            severity: 'success',
            summary: 'License Tracker',
            detail: saveResult.message,
          });
          this.onClearClick();
          this.router.navigateByUrl('/license-tracker-dashboard');
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            severity: 'warn',
            summary: 'License Tracker',
            detail: saveResult.message,
          });
        }
      };
    } catch (e) {
    }
  }

  onClearClick() {
    this.uploadError1 = false;
    this.createLicenseTracker.set({ ...JSON.parse(this.licenseTrackerr) });
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
  }

  goBack(): void {
    this.router.navigateByUrl('/license-tracker-dashboard');
  }

  onCriteriaAdd() {
    let writtenCrtieria: any = (this.createLicenseTracker().criteriaText || '').trim();
    if (writtenCrtieria == '') { return; };
    writtenCrtieria = JSON.parse(JSON.stringify(writtenCrtieria));
    this.createLicenseTracker().license_criteria.push(
      {
        "license_criteria_checklist_id": null,
        "criteria_name": writtenCrtieria,
        "is_active": true,
        "is_completed": false,
        "is_edit_click": false,
        "isMapped": false
      }
    );
    this.createLicenseTracker().criteriaText = "";
  }

  removeAddedItem(licence, index: any) {
    if (this.pageMode == 'NEW') {
      this.createLicenseTracker().license_criteria.splice(index, 1);
    } else {
      licence.is_active = false;
    };
  }

  getActiveCheckList() {
    return this.createLicenseTracker().license_criteria.filter((fl: any) => fl.is_active == true);
  }

  getCompletedCount() {
    return this.getActiveCheckList().filter((fl: any) => fl.is_completed == true).length;
  }

  // Date picker limits need a Date; edit mode loads dates as 'YYYY-MM-DD' strings.
  toDate(value: any): Date | null {
    if ([null, undefined, ''].includes(value)) return null;
    const dt = value instanceof Date ? value : new Date(value);
    return isNaN(dt.getTime()) ? null : dt;
  }

  editItem(lcnsCtrl: any, addIndex) {
    lcnsCtrl.criteria_name = lcnsCtrl.criteria_name.trim();
    lcnsCtrl.is_edit_click = !lcnsCtrl.is_edit_click;
    this.createLicenseTracker().license_criteria.forEach((el, index: number) => {
      if (index !== addIndex) {
        el.is_edit_click = false
      }
    })
  }
}
