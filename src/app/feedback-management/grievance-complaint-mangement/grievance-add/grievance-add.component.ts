import { Component, signal, inject, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
interface createGrievance {
  "action": any,
  "complaint_id": any,
  'employee_id': any,
  'role_id': any,
  'complaint_type_id': any,
  'description': any,
  'immediate_action': any,
  'happened_on': any,
  "support_documents": any,
  "is_active": boolean,
};
import { SelectModule } from 'primeng/select';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { ImageViewerComponent } from '../../../components/imageviewer/imageviewer.component';
import { Validations } from '../../../validations';

@Component({
  selector: 'app-grievance-add',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, FileUploadModule, SharedModule, ImageViewerComponent],
  templateUrl: './grievance-add.component.html',
  styleUrl: './grievance-add.component.scss'
})
export class GrievanceAddComponent implements OnInit {
  @ViewChild('sprtngDocs') sprtngDocs!: FileUpload;
  @ViewChild('imgView') imgView!: ImageViewerComponent;
  private validations = inject(Validations);
  readonly FORM_NAME = 'GrievanceAddForm';
  public router = inject(Router);
  public pageMode = "NEW";
  public attachedFiles: any = [];
  public minDateSetter: any = signal(null);
  public errorMsg: any = {
    employee_id: '',
    role_id: '',
    complaint_type_id: '',
    description: '',
    immediate_action: '',
    happened_on: '',
  };
  public empNameIDList = [];
  public roleList = [];
  public typeofCompliantList = [];

  public grievance: any = JSON.stringify({
    "action": "I",
    "complaint_id": null,
    'employee_id': null,
    'role_id': null,
    'complaint_type_id': null,
    'description': null,
    'immediate_action': null,
    'happened_on': null,
    "support_documents": [],
    "is_active": true,
  });
  public createGrievance = signal<createGrievance>({ ...JSON.parse(this.grievance) });

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.createGrievance()[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
    console.log("Result JSon",JSON.stringify(result))
  }

  constructor(private location: Location,
    public _hqms: HqmsService,
    private activatedRoute: ActivatedRoute
  ) { }

  async ngOnInit() {
    try {
      let getSrvrDt = await this._hqms.getServerDate('DATE');
      this.minDateSetter.set(getSrvrDt)
      let getEmpNameID: any = await this._hqms.customGetApiCall('GET', 'fnTrainingFacultyDropdownGetApi',
        {
          "faculty_type": "INTERNAL",
          "is_faculty": false
        });
      if (getEmpNameID.status == 200) {
        this.empNameIDList = getEmpNameID.data.map((ele: any) => ({
          label: ele.name,
          value: ele.id,
          value_code: ele.value_code,
          faculty_type: ele.faculty_type,
          department_id: ele.department_id,
          department_name: ele.department_name,
          specialization_name: ele.specialization_name,
        }));
      };
      let getRole: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        {
          "flag": 'ROLE'
        });
      if (getRole.status == 200) {
        this.roleList = getRole.data.map((ele: any) => ({
          label: ele.role_name,
          value: ele.role_id,
        }));
      }
      let getTypeofCompliant: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "FBCOMPTYPE" });
      if (getTypeofCompliant.status == 200) {
        this.typeofCompliantList = getTypeofCompliant.data.entities.FBCOMPTYPE.values.map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id
        }))
      }; 

      let state = history.state;
      this.pageMode = state['data']['mode'];
      if (this.pageMode != 'NEW') {
        await this.editGrievance(state['data']['id'])
      };
    } catch (e) { };
  }

  async editGrievance(complaintId: any) {
    try {
      let getGrievanceListEdit: any = await this._hqms.customGetApiCall('GET', 'fnComplaintApi',
        {
          "action": "U",
          "complaint_id": complaintId,
          "is_active": true
        });
      if (getGrievanceListEdit.status == 200) {
        let editInfo = getGrievanceListEdit['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          let support_documents = editInfo['support_documents'].length > 0 ? editInfo['support_documents'].map((ele: any) => ({ ...ele, is_viewed: false })) : [];
          this.createGrievance.set({
            "action": "U", //INSERT
            "complaint_id": editInfo.complaint_id,
            'employee_id': editInfo.employee_id,
            'role_id': editInfo.role_id,
            'complaint_type_id': editInfo.complaint_type_id,
            'description': editInfo.description,
            'immediate_action': editInfo.immediate_action,
            'happened_on': editInfo.happened_on,
            "support_documents": support_documents,
            "is_active": editInfo.is_active,
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
  public uploadError1 = false;

  async  onFileSelect(thisFile: any, fileSelected: any, fileType: any, thisObj: any, maindata: any) {
    this.uploadError1 = false;
    if (!['application/pdf'].includes(fileSelected.files[0].type)) {
      this.uploadError1 = true;
      this._hqms.hqmsToasterService({
        key: 'grievance',
        severity: 'warn',
        summary: 'Raise a Compliant - Attach Document',
        detail: 'Accepted Formats were .pdf',
      });
      setTimeout(() => {
        thisFile.clear();
        this.uploadError1 = false;
      }, 3000);
      return;
    }
    this.uploadError1 = false;
    thisObj.support_documents.push(
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
        key: 'grievance',
        severity: 'warn',
        summary: 'Raise a Compliant',
        detail: 'Check the errors',
      });
      return;
    };
    let formData = new FormData();
    this.attachedFiles.forEach((file: any, index: number) => {
      formData.append("file", file.fileContent, file.fileName);
    });
    formData.append("data", JSON.stringify(this.createGrievance()));
    let confirmGrievance = await this._hqms.showConfirmMessage();
    if (confirmGrievance) {
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnComplaintApi", formData);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          key: 'grievance',
          severity: 'success',
          summary: 'Raise a Compliant',
          detail: saveResult.message,
        });
        this.onClearClick();
        this.router.navigateByUrl('/grievance-dashboard');
      } else if (saveResult.status == 204 || saveResult.status == 501) {
        this._hqms.hqmsToasterService({
          key: 'grievance',
          severity: 'warn',
          summary: 'Raise a Compliant',
          detail: saveResult.message,
        });
      }
    };
  }

  onClearClick() {
    this.uploadError1 = false;
    this.createGrievance.set({ ...JSON.parse(this.grievance) });
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
  }

  goBack(): void {
    this.router.navigateByUrl('/grievance-dashboard');
  }

  onViewClick(getImageInfo: any) {
    getImageInfo['is_viewed'] = !getImageInfo['is_viewed']
    this.imgView.showImage(getImageInfo['fileOrImageUrl'], getImageInfo['file_type'], false, true);
  }
}
