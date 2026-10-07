import { Component, signal, inject, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';

interface createCommittee {
  "action": any,
  "committee_id": any,
  "committee_type_id": any,
  "committee_name": any,
  "chair_person_id": any,
  "co_chair_person_id": any,
  "co_ordinator_id": any,
  "agenda_entry_type_id": any,
  "remainder_frequency_id": any,
  "agenda_for_approval_id": any,
  "agenda_approver_user_id": any,
  "mom_for_approval_id": any,
  "mom_approver_user_id": any,
  "committee_members": [],
  "tor_files": [],
  "is_active": boolean,
};
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { ImageViewerComponent } from '../../../components/imageviewer/imageviewer.component';
import { Validations } from '../../../validations';

@Component({
  selector: 'app-committee-add',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SelectModule, MultiSelectModule, FileUploadModule, SharedModule],
  templateUrl: './committee-add.component.html'
})
export class CommitteeAddComponent implements OnInit {
  @ViewChild('upCoverPage') upCoverPage!: FileUpload;
  @ViewChild('imgView') imgView!: ImageViewerComponent;
  readonly FORM_NAME = 'CommitteeAddForm';
  private validations = inject(Validations);
  public router = inject(Router);
  public pageMode = "NEW";
  public attachedFiles: any = [];
  public errorMsg: any = {
    committee_name: '',
    chair_person_id: '',
    co_chair_person_id: '',
    co_ordinator_id: '',
    committee_members: '',
    agenda_entry_type_id: '',
    remainder_frequency_id: '',
    agenda_approver_user_id: '',
    mom_approver_user_id: '',
  };
  public committeeTypeList: any = [];
  public agendaApprovalList: any = [];
  public momApprovalList: any = [];
  public chairPersonList: any = [];
  public cochairPersonList: any = [];
  public coordinatorList: any = [];
  public committeeMembersList: any = [];
  public agendaEntryTypeList: any = [];
  public remainFrequencyList: any = [];
  public agendaApproverList: any = [];
  public momApproverList: any = [];
  public isAgendaApproval = '';
  public isMomApproval = '';

  public committeeAdd: any = JSON.stringify({
    "action": "I",
    "committee_id": null,
    "committee_type_id": null,
    "committee_name": null,
    "chair_person_id": null,
    "co_chair_person_id": null,
    "co_ordinator_id": null,
    "agenda_entry_type_id": null,
    "remainder_frequency_id": null,
    "agenda_for_approval_id": null,
    "agenda_approver_user_id": null,
    "mom_for_approval_id": null,
    "mom_approver_user_id": null,
    "committee_members": [],
    "tor_files": [],
    "is_active": true,
  });
  public createCommittee = signal<createCommittee>({ ...JSON.parse(this.committeeAdd) });

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.createCommittee()[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  constructor(private location: Location, public _hqms: HqmsService, private activatedRoute: ActivatedRoute) { }

  async ngOnInit() {
    try {
      let info: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "COMMITTEETYPE | AGENDAAPRVL | MOMAPRVL | AGENDAENTRYTYPE | FREQUENCY" });
      if (info.status == 200) {
        this.committeeTypeList = info.data['entities']['COMMITTEETYPE']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code,
          sort_order: ele.sort_order,
        }));
        this.agendaApprovalList = info.data['entities']['AGENDAAPRVL']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code,
          sort_order: ele.sort_order,
        }));
        this.momApprovalList = info.data['entities']['MOMAPRVL']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code,
          sort_order: ele.sort_order,
        }));
        this.agendaEntryTypeList = info.data['entities']['AGENDAENTRYTYPE']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code,
          sort_order: ele.sort_order,
        }));
        this.remainFrequencyList = info.data['entities']['FREQUENCY']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code,
          sort_order: ele.sort_order,
        }))
      };

      //chairPersonList
      let chairPersonList: any = await this._hqms.customGetApiCall('GET', 'fnTrainingFacultyDropdownGetApi',
        {
          "faculty_type": "INTERNAL",
          "is_faculty": false
        });
      if (chairPersonList.status == 200) {
        this.chairPersonList = chairPersonList.data.map((ele: any) => ({
          label: ele.name,
          value: ele.id,
          value_code: ele.value_code,
          faculty_type: ele.faculty_type,
          department_id: ele.department_id,
          department_name: ele.department_name,
          specialization_name: ele.specialization_name,
        }));
      };
      //cochairPersonList
      let cochairPersonList: any = await this._hqms.customGetApiCall('GET', 'fnTrainingFacultyDropdownGetApi',
        {
          "faculty_type": "INTERNAL",
          "is_faculty": false
        });
      if (cochairPersonList.status == 200) {
        this.cochairPersonList = cochairPersonList.data.map((ele: any) => ({
          label: ele.name,
          value: ele.id,
          value_code: ele.value_code,
          faculty_type: ele.faculty_type,
          department_id: ele.department_id,
          department_name: ele.department_name,
          specialization_name: ele.specialization_name,
        }));
      };
      //coordinatorList
      let coordinatorList: any = await this._hqms.customGetApiCall('GET', 'fnTrainingFacultyDropdownGetApi',
        {
          "faculty_type": "INTERNAL",
          "is_faculty": false
        });
      if (coordinatorList.status == 200) {
        this.coordinatorList = coordinatorList.data.map((ele: any) => ({
          label: ele.name,
          value: ele.id,
          value_code: ele.value_code,
          faculty_type: ele.faculty_type,
          department_id: ele.department_id,
          department_name: ele.department_name,
          specialization_name: ele.specialization_name,
        }));
      };
      //committeeMembersList
      let committeeMembersList: any = await this._hqms.customGetApiCall('GET', 'fnTrainingFacultyDropdownGetApi',
        {
          "faculty_type": "INTERNAL",
          "is_faculty": false
        });
      if (committeeMembersList.status == 200) {
        this.committeeMembersList = committeeMembersList.data.map((ele: any) => ({
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
        await this.editCommittee(state['data']['id'])
      };
    } catch (e) { };
  }

  async editCommittee(committeeId: any) {
    try {
      let getCommitteeEdit: any = await this._hqms.customGetApiCall('GET', 'fnCommitteeApi',
        {
          "action": "U",
          "committee_id": committeeId,
          "is_active": true
        });
      if (getCommitteeEdit.status == 200) {
        let editInfo = getCommitteeEdit['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          let committee_members = editInfo['committee_members'].length > 0 ? editInfo['committee_members'].map((ele) => (ele.committee_user_id)) : [];
          let tor_files = editInfo['tor_files'].length > 0 ? editInfo['tor_files'] : [];
          // agenda
          let yesOrNoList = this.agendaApprovalList.filter((fl) =>
            fl.value == editInfo.agenda_for_approval_id);
          if (yesOrNoList.length > 0) {
            this.onAgendaClick(yesOrNoList[0]['value_code']);
          };
          // mom
          let momList = this.momApprovalList.filter((fl) =>
            fl.value == editInfo.mom_for_approval_id);
          if (momList.length > 0) {
            this.onMomClick(momList[0]['value_code']);
          };
          this.createCommittee.set({
            "action": "U", //INSERT
            "committee_id": editInfo.committee_id,
            "committee_type_id": editInfo.committee_type_id,
            "committee_name": editInfo.committee_name,
            "chair_person_id": editInfo.chair_person_id,
            "co_chair_person_id": editInfo.co_chair_person_id,
            "co_ordinator_id": editInfo.co_ordinator_id,
            "agenda_entry_type_id": editInfo.agenda_entry_type_id,
            "remainder_frequency_id": editInfo.remainder_frequency_id,
            "agenda_for_approval_id": editInfo.agenda_for_approval_id,// AGENDA YES OR NO
            "agenda_approver_user_id": editInfo.agenda_approver_user_id,
            "mom_for_approval_id": editInfo.mom_for_approval_id,// MOM YES OR NO
            "mom_approver_user_id": editInfo.mom_approver_user_id,
            "committee_members": committee_members,
            "tor_files": tor_files,
            "is_active": editInfo.is_active,
          });
          this.isAgendaApproval = this.agendaApprovalList.filter((ty) => ty.value == editInfo['agenda_for_approval_id'])[0]['value_code']
          this.isMomApproval = this.momApprovalList.filter((ty) => ty.value == editInfo['mom_for_approval_id'])[0]['value_code']
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
        key: 'committee',
        severity: 'warn',
        summary: 'Manage Committee - Term of Reference (TOR)',
        detail: 'Accepted Formats were .png/.jpeg',
      });
      setTimeout(() => {
        thisFile.clear();
        this.uploadError1 = false;
      }, 3000);
      return;
    };
    this.uploadError1 = false;
    thisObj.tor_files.push(
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
      this.upCoverPage.clear();
    };
  }

  async onSubmitClick() {
    Object.keys(this.errorMsg).forEach((ctrl) => {
      if (ctrl == 'agenda_approver_user_id' && this.isAgendaApproval != 'YES') return;
      if (ctrl == 'mom_approver_user_id' && this.isMomApproval != 'YES') return;
      this.onGetErrorMsgs(ctrl);
    });
    let isValid = this._hqms.showErrorSummary(this.errorMsg);
    if (isValid || this.uploadError1) {
      this._hqms.hqmsToasterService({
        key: 'committee',
        severity: 'warn',
        summary: 'Manage Committee',
        detail: 'Check the errors',
      });
      return;
    };
    let formData = new FormData();
    this.attachedFiles.forEach((file: any, index: number) => {
      formData.append("file", file.fileContent, file.fileName);
    });
    formData.append("data", JSON.stringify(this.createCommittee()));
    let confirmCommittee = await this._hqms.showConfirmMessage();
    if (confirmCommittee) {
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnCommitteeApi", formData);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Manage Committee',
          detail: saveResult.message,
        });
        this.onClearClick();
        this.router.navigateByUrl('/committee-dashboard');
      } else if (saveResult.status == 204 || saveResult.status == 501) {
        this._hqms.hqmsToasterService({
          severity: 'warn',
          summary: 'Manage Committee',
          detail: saveResult.message,
        });
      }
    };
  }

  onClearClick() {
    this.uploadError1 = false;
    this.createCommittee.set({ ...JSON.parse(this.committeeAdd) });
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
    this.isAgendaApproval = '';
    this.isMomApproval = '';
  }

  goBack(): void {
    this.router.navigateByUrl('/committee-dashboard');
  }

  async onAgendaClick(type: string) {
    this.createCommittee().agenda_for_approval_id = null;
    this.errorMsg['agenda_approver_user_id'] = '';
    this.isAgendaApproval = type;
    await this.getAgendaClick(type);
    this.attachedFiles = [];
  }

  async getAgendaClick(type: string) {
    let agendaApproverList: any = await this._hqms.customGetApiCall('GET', 'fnTrainingFacultyDropdownGetApi',
      {
        "faculty_type": "INTERNAL",
        "is_faculty": false
      });
    if (agendaApproverList.status == 200) {
      this.agendaApproverList = agendaApproverList.data.map((ele: any) => ({
        label: ele.name,
        value: ele.id,
        value_code: ele.value_code,
        faculty_type: ele.faculty_type,
        department_id: ele.department_id,
        department_name: ele.department_name,
        specialization_name: ele.specialization_name,
      }));
    };
  }

  async onMomClick(type: string) {
    this.createCommittee().mom_for_approval_id = null;
    this.errorMsg['mom_approver_user_id'] = '';
    this.isMomApproval = type;
    await this.getMomClick(type);
    this.attachedFiles = [];
  }

  async getMomClick(type: string) {
    let momApproverList: any = await this._hqms.customGetApiCall('GET', 'fnTrainingFacultyDropdownGetApi',
      {
        "faculty_type": "INTERNAL",
        "is_faculty": false
      });
    if (momApproverList.status == 200) {
      this.momApproverList = momApproverList.data.map((ele: any) => ({
        label: ele.name,
        value: ele.id,
        value_code: ele.value_code,
        faculty_type: ele.faculty_type,
        department_id: ele.department_id,
        department_name: ele.department_name,
        specialization_name: ele.specialization_name,
      }));
    };
  }

}
