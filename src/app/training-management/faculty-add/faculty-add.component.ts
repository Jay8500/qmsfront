import { Component, signal, QueryList, ViewChild, ViewChildren, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
interface createFaculty {
  "action": any,
  "faculty_type_id": any,
  "faculty_id": any,
  "faculty_name": any,
  "department_id": any,
  "department_name": any,
  "specialization_id": any,
  "designation_name": any,
  "contact_email": any,
  "qualification": any, // anon
  "experience_year": any,// anon
  "credential_type_id": any,// anon
  "credential_issued_by": any,// anon
  "credential_valid_from": any,// anon
  "credential_valid_to": any,// anon
  "is_faculty": any,
  "signature_file": [],
  "is_active": boolean,
};
import { HqmsService } from '../../services/hqms.service';
import { Validations } from '../../validations';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-faculty-add',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, FileUploadModule, SharedModule],
  templateUrl: './faculty-add.component.html',
  styleUrl: './faculty-add.component.scss'
})
export class FacultyAddComponent implements OnInit {
  private validations = inject(Validations);
  readonly FORM_NAME = 'FacultyForm';
  public router = inject(Router);
  public pageMode = "NEW";
  public attachedFiles: any = [];
  public selectedFacultyType: any = null;
  @ViewChild('upCoverPage') upCoverPage!: FileUpload;

  public errorMsg: any = { faculty_type_id: '', faculty_id: '', faculty_name: '' };
  public facultyTypeList = [];
  public facultyNameList = [];
  public facultyDesigList = [];
  public selectedFcltyType = signal(null);
  public intialFaculty: any = JSON.stringify({
    "action": "I", //INSERT
    "faculty_type_id": null, //  INTERNAL OR EXTERNAL
    "faculty_id": null,      //  INTERNAL
    "faculty_name": null,   //   EX
    "department_id": null,
    "department_name": null,
    "specialization_id": null,
    "designation_name": null,
    "contact_email": null,
    "qualification": null,
    "experience_year": null,
    "credential_type_id": null,
    "credential_issued_by": null,
    "credential_valid_from": null,
    "credential_valid_to": null,
    "is_faculty": true,
    "signature_file": [],
    "is_active": true,
  });

  public createFaculty = signal<createFaculty>({ ...JSON.parse(this.intialFaculty) });

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.createFaculty()[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  async onFacultyTypeChange() {
    this.onGetErrorMsgs('faculty_type_id');
    let value = this.createFaculty().faculty_type_id;
    this.createFaculty().specialization_id = null; // internal
    this.createFaculty().designation_name = null; // external
    this.createFaculty().faculty_id = null;
    this.createFaculty().faculty_name = null;
    this.createFaculty().signature_file = [];
    if (!["", null].includes(value)) {
      if (this.facultyTypeList.length > 0) {
        this.selectedFcltyType.set(this.facultyTypeList.filter((fl: any) => fl.value == value)[0]["value_code"])
        await this.onGetFaculty()
      };
    };
  }

  onFacultyChange() {
    this.onGetErrorMsgs('faculty_id');
    let value = this.createFaculty().faculty_id;
    if (![null, ''].includes(value)) {
      this.createFaculty().designation_name = this.facultyNameList.filter((desig: any) => desig.value == value)[0]['designation_name']
    }
  }

  constructor(private location: Location, public _hqms: HqmsService, private activatedRoute: ActivatedRoute) { }

  async ngOnInit() {
    try {
      let getFacultyType: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "FACULTYTYPE" });
      if (getFacultyType.status == 200) {
        this.facultyTypeList = getFacultyType.data.entities.FACULTYTYPE.values.map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code
        }))
      };
      let state = history.state;
      this.pageMode = state['data']['mode'];
      if (this.pageMode != 'NEW') {
        await this.editFaculty(state['data']['id'])
      };
    } catch (e) {
    };
  }

  async editFaculty(facultyId: any) {
    try {
      let getFacultyListEdit: any = await this._hqms.customGetApiCall('GET', 'fnFacultyGetApi',
        {
          "action": "U",
          "faculty_id": facultyId,
          "is_faculty": true
        });
      if (getFacultyListEdit.status == 200) {
        let editInfo = getFacultyListEdit['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.selectedFcltyType.set(this.facultyTypeList.filter((fl: any) => fl.value == editInfo.faculty_type_id)[0]["value_code"]);
          if (this.selectedFcltyType() == 'INTERNAL') {
            await this.onGetFaculty();
          };
          let signature_file = editInfo['signature_file'].length > 0 ? editInfo['signature_file'] : [];
          this.createFaculty.set({
            "action": "U", //INSERT
            "faculty_type_id": editInfo.faculty_type_id, //  INTERNAL OR EXTERNAL
            "faculty_id": editInfo.faculty_id,      //  INTERNAL
            "faculty_name": editInfo.faculty_name,   //   EX
            "department_id": editInfo.department_id,
            "department_name": editInfo.department_name,
            "specialization_id": editInfo.specialization_id,
            "designation_name": editInfo.designation_name,
            "contact_email": editInfo.contact_email,
            "qualification": editInfo.qualification,
            "experience_year": editInfo.experience_year,
            "credential_type_id": editInfo.credential_type_id,
            "credential_issued_by": editInfo.credential_issued_by,
            "credential_valid_from": editInfo.credential_valid_from,
            "credential_valid_to": editInfo.credential_valid_to,
            "is_faculty": editInfo.is_faculty,
            "signature_file": signature_file,
            "is_active": editInfo.is_active,
          });
        }
      };
    } catch (e) {
    };
  }

  getCoverPageActiveimg(image: any) {
    let active = image.filter((im: any) => im.is_active == true);
    return active.length;
  }
  public uploadError1 = false;

  async  onCoverPageFileSelect(thisFile: any, fileSelected: any, fileType: any, thisObj: any, maindata: any) {
    this.uploadError1 = false;
    if (['application/pdf'].includes(fileSelected.files[0].type)) {
      this.uploadError1 = true;
      this._hqms.hqmsToasterService({
        key: 'faculty',
        severity: 'warn',
        summary: 'Faculty - Signature',
        detail: 'Accepted Formats were .png/.jpeg',
      });
      setTimeout(() => {
        thisFile.clear();
        this.uploadError1 = false;
      }, 3000);
      return;
    }
    this.uploadError1 = false;
    thisObj.signature_file.push(
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
    Object.keys(this.errorMsg).forEach((ctrl) => this.onGetErrorMsgs(ctrl));
    let isValid = this._hqms.showErrorSummary(this.errorMsg);
    if (isValid || this.uploadError1) {
      this._hqms.hqmsToasterService({
        key: 'faculty',
        severity: 'warn',
        summary: 'Faculty',
        detail: 'Check the errors',
      });
      return;
    };
    let faculty = JSON.parse(JSON.stringify(this.createFaculty()));

    if (this.pageMode == 'NEW') {
      faculty['signature_file'] = faculty['signature_file'].filter((fl: any) => fl.is_active == true);
    };
    delete faculty['specialization_id']; // internal
    let formData = new FormData();
    this.attachedFiles.forEach((file: any, index: number) => {
      formData.append("file", file.fileContent, file.fileName);
    });
    formData.append("data", JSON.stringify(faculty));
    let confirmCreateFaculty = await this._hqms.showConfirmMessage();
    if (confirmCreateFaculty) {
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "facultyWriteApi", formData);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Faculty',
          detail: saveResult.message,
        });
        this.onClearClick();
        this.router.navigateByUrl('/faculty-dashboard');
      } else if (saveResult.status == 204 || saveResult.status == 501) {
        this._hqms.hqmsToasterService({
          severity: 'warn',
          summary: 'Faculty',
          detail: saveResult.message,
        });
      }
    };
  }

  onClearClick() {
    this.uploadError1 = false;
    this.createFaculty.set({ ...JSON.parse(this.intialFaculty) });
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
    this.selectedFcltyType.set(null);
  }

  goBack(): void {
    this.router.navigateByUrl('/faculty-dashboard');
  }

  async onGetFaculty() {
    try {
      this.facultyNameList = [];
      let getFaculty: any = await this._hqms.customGetApiCall('GET', 'fnTrainingFacultyDropdownGetApi',
        {
          "faculty_type": this.selectedFcltyType(),
          "is_faculty": this.selectedFcltyType() == 'INTERNAL' ? false : true
        });
      if (getFaculty.status == 200) {
        this.facultyNameList = getFaculty.data.map((ele: any) => ({
          label: ele.name,
          value: ele.id,
          value_code: ele.value_code,
          faculty_type: ele.faculty_type,
          department_id: ele.department_id,
          department_name: ele.department_name,
          designation_name: ele.designation_name,
        }))
      };
    } catch (e) { };
  }
}
