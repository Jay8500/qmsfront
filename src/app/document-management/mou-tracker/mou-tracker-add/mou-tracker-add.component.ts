import { Component, signal, inject, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
interface createMouTracker {
  "action": any,
  "mou_id": any,
  "mou_no": any,
  "partner_org": any,
  "agreement_date": any,
  "expiry_date": any,
  "mou_files": [],
  "is_active": boolean,
  "service_details"?: any,
  "authorized_person"?: any,
  "owner_employee_id"?: any,
  "department_id"?: any,
};
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { ImageViewerComponent } from '../../../components/imageviewer/imageviewer.component';
import { Validations } from '../../../validations';

@Component({
  selector: 'app-mou-tracker-add',
  standalone: true,
  imports: [CommonModule, FormsModule, FileUploadModule, SharedModule],
  templateUrl: './mou-tracker-add.component.html',
  styleUrl: './mou-tracker-add.component.scss'
})
export class MouTrackerAddComponent implements OnInit {
  @ViewChild('sprtngDocs') sprtngDocs!: FileUpload;
  @ViewChild('imgView') imgView!: ImageViewerComponent;
  private validations = inject(Validations);
  readonly FORM_NAME = 'MouTrackerAddForm';
  public router = inject(Router);
  public pageMode = "NEW";
  public attachedFiles: any = [];
  public minDateSetter: any = signal(null);
  public errorMsg: any = {
    mou_no: '',
    partner_org: '',
    agreement_date: '',
    expiry_date: '',
  };
  public mouTrackerr: any = JSON.stringify({
    "action": "I",
    "mou_id": null,
    "mou_no": null,
    "partner_org": null,
    "agreement_date": null,
    "expiry_date": null,
    "mou_files": [],
    "is_active": true,
    "service_details": null,
    "authorized_person": null,
    "owner_employee_id": null,
    "department_id": null,
  });
  public staffList: any[] = [];
  public departmentList: any[] = [];
  public createMouTracker = signal<createMouTracker>({ ...JSON.parse(this.mouTrackerr) });

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.createMouTracker()[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  constructor(private location: Location,
    public _hqms: HqmsService,
    private activatedRoute: ActivatedRoute
  ) { }

  async ngOnInit() {
    try {
      let getSrvrDt = await this._hqms.getServerDate('DATE');
      this.minDateSetter.set(getSrvrDt)
      await this.loadLists();
      let state = history.state;
      this.pageMode = state['data']['mode'];
      if (this.pageMode != 'NEW') {
        await this.editmouTracker(state['data']['id'])
      };
    } catch (e) { };
  }

  async editmouTracker(mouId: any) {
    try {
      let getMouListEdit: any = await this._hqms.customGetApiCall('GET', 'fnMouGetDetailApi',
        {
          "action": "U",
          "mou_id": mouId,
          "is_active": true
        });
      if (getMouListEdit.status == 200) {
        let editInfo = getMouListEdit['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          let mou_files = editInfo['mou_files'].length > 0 ? editInfo['mou_files'].map((ele: any) => ({ ...ele, is_viewed: false })) : [];
          this.createMouTracker.set({
            "action": "U", //INSERT
            "mou_id": editInfo.mou_id,
            "mou_no": editInfo.mou_no,
            "partner_org": editInfo.partner_org,
            "agreement_date": editInfo.agreement_date,
            "expiry_date": editInfo.expiry_date,
            "mou_files": mou_files,
            "is_active": editInfo.is_active,
            "service_details": editInfo.service_details,
            "authorized_person": editInfo.authorized_person,
            "owner_employee_id": editInfo.owner_employee_id,
            "department_id": editInfo.department_id,
          })
        }
      };
    } catch (e) {
    };
  }

  // Owner = any active staff user at this location; departments from the common list
  async loadLists() {
    try {
      const staff: any = await this._hqms.customGetApiCall('GET', 'vaccinationStaffListApi', {});
      if (staff?.status == 200 && Array.isArray(staff.data)) {
        this.staffList = staff.data.filter((ele: any) => !!ele.employee_id).map((ele: any) => ({
          label: ele.department_name ? `${ele.employee_name} (${ele.department_name})` : ele.employee_name,
          value: ele.employee_id,
        }));
      }
      const dept: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet', { "flag": 'DEPARTMENT' });
      if (dept?.status == 200 && Array.isArray(dept.data)) {
        this.departmentList = dept.data.map((ele: any) => ({ label: ele.department_name, value: ele.department_id }));
      }
    } catch (e) { }
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
        key: 'mou',
        severity: 'warn',
        summary: 'Mou Tracker - Attach Document',
        detail: 'Accepted Formats were .pdf',
      });
      setTimeout(() => {
        thisFile.clear();
        this.uploadError1 = false;
      }, 3000);
      return;
    }
    this.uploadError1 = false;
    thisObj.mou_files.push(
      {
        file_id: null,
        file_name: fileSelected.files[0].name,
        file_type: fileSelected.files[0].type, // "JPG"
        file_size: fileSelected.files[0].size,
        storage_path: null,
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
    Object.keys(this.errorMsg).forEach((ctrl) => this.onGetErrorMsgs(ctrl));
    let isValid = this._hqms.showErrorSummary(this.errorMsg);
    if (isValid || this.uploadError1) {
      this._hqms.hqmsToasterService({
        key: 'mou',
        severity: 'warn',
        summary: 'MOU Tracker',
        detail: 'Check the errors',
      });
      return;
    };
    let formData = new FormData();
    this.attachedFiles.forEach((file: any, index: number) => {
      formData.append("file", file.fileContent, file.fileName);
    });
    formData.append("data", JSON.stringify(this.createMouTracker()));
    let confirmMouTracker = await this._hqms.showConfirmMessage();
    if (confirmMouTracker) {
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnMouGetDetailApi", formData);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'MOU Tracker',
          detail: saveResult.message,
        });
        this.onClearClick();
        this.router.navigateByUrl('/mou-tracker-dashboard');
      } else if (saveResult.status == 204 || saveResult.status == 501) {
        this._hqms.hqmsToasterService({
          severity: 'warn',
          summary: 'MOU Tracker',
          detail: saveResult.message,
        });
      }
    };
  }

  onClearClick() {
    this.uploadError1 = false;
    this.createMouTracker.set({ ...JSON.parse(this.mouTrackerr) });
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
  }

  goBack(): void {
    this.router.navigateByUrl('/mou-tracker-dashboard');
  }

  onViewClick(getImageInfo: any) {
    getImageInfo['is_viewed'] = !getImageInfo['is_viewed']
    this.imgView.showImage(getImageInfo['fileOrImageUrl'], getImageInfo['file_type'], false, true);
  }
}
