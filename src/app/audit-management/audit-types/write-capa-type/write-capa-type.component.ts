import { Component, OnInit, signal, ViewChildren, QueryList, inject } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { Fancybox } from "@fancyapps/ui";
import { HqmsService } from '../../../services/hqms.service';
import { Validations } from '../../../validations';
import { SharedModule } from '../../../shared/shared.module';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';

@Component({
  selector: 'app-write-capa-type',
  imports: [CommonModule, SharedModule, FileUploadModule],
  templateUrl: './write-capa-type.component.html',
  styleUrl: './write-capa-type.component.scss'
})
export class WriteCapaTypeComponent implements OnInit {
  private validations = inject(Validations);
  @ViewChildren('upCoverPage') upCoverPage!: FileUpload;
  public errorMsg: any = { description: '', action_taken: '' };

  public router = inject(Router);
  public writeCapa = {
    "action": "k",
    "capa_id": null,
    "is_active": true,
    "description": null,
    "action_taken": null,
    "capa_status_id": null,
    "evidence_documents": []
  }
  public attachedFiles: any = [];
  public conducAudit: any = signal(
    {
      "status": "",
      "schedule_id": null,
      "sections": [
        // {
        //     "status": "Inactive",
        //     "is_active": false,
        //     "questions": [
        //         {
        //             "status": "Active",
        //             "remarks": "yes",
        //             "is_active": true,
        //             "created_at": "12-02-2026 14:43:32",
        //             "created_by": null,
        //             "updated_at": null,
        //             "updated_by": null,
        //             "answer_text": "yes",
        //             "answer_type": "MCQ_SINGLE",
        //             "display_seq": 1,
        //             "question_id": "b3970fb5-ed03-4e54-af08-7e32cf02b4d2",
        //             "options_json": null,
        //             "created_by_id": "29dc6be0-3a09-4762-8f6f-a5955b281416",
        //             "question_text": "What does BLS stand for?",
        //             "updated_by_id": null
        //         }
        //     ],
        //     "created_at": "12-02-2026 14:43:32",
        //     "created_by": null,
        //     "section_id": "b6f69cf0-78af-4610-ab62-bc34c42f6f83",
        //     "sort_order": 1,
        //     "updated_at": "17-02-2026 12:11:35",
        //     "updated_by": null,
        //     "section_name": "Safety Protocols",
        //     "created_by_id": "29dc6be0-3a09-4762-8f6f-a5955b281416",
        //     "updated_by_id": "29dc6be0-3a09-4762-8f6f-a5955b281416",
        //     "audit_template_id": "859f10f6-55a1-4495-a92a-69855296e2b7",
        //     "section_description": "General safety compliance"
        // },
        // {
        //     "status": "Inactive",
        //     "is_active": false,
        //     "questions": [
        //         {
        //             "status": "Active",
        //             "remarks": "yes",
        //             "is_active": true,
        //             "created_at": "12-02-2026 14:43:32",
        //             "created_by": null,
        //             "updated_at": null,
        //             "updated_by": null,
        //             "answer_text": "yes",
        //             "answer_type": "TRUE_FALSE",
        //             "display_seq": 1,
        //             "question_id": "a2015bb5-e6a7-4a88-8bb7-2b312f124537",
        //             "options_json": null,
        //             "created_by_id": "29dc6be0-3a09-4762-8f6f-a5955b281416",
        //             "question_text": "BLS is used during cardiac arrest.",
        //             "updated_by_id": null
        //         },
        //         {
        //             "status": "Active",
        //             "remarks": "yes",
        //             "is_active": true,
        //             "created_at": "12-02-2026 14:43:32",
        //             "created_by": null,
        //             "updated_at": null,
        //             "updated_by": null,
        //             "answer_text": "no",
        //             "answer_type": "MCQ_SINGLE",
        //             "display_seq": 2,
        //             "question_id": "144c7d3c-18ee-47da-8bde-fb130eb39641",
        //             "options_json": null,
        //             "created_by_id": "29dc6be0-3a09-4762-8f6f-a5955b281416",
        //             "question_text": "What is the correct compression ratio for adults?",
        //             "updated_by_id": null
        //         }
        //     ],
        //     "created_at": "12-02-2026 14:43:32",
        //     "created_by": null,
        //     "section_id": "d72995ec-9ea2-497b-8526-c9a1294fc4ba",
        //     "sort_order": 2,
        //     "updated_at": "17-02-2026 12:11:35",
        //     "updated_by": null,
        //     "section_name": "Equipment Maintenance",
        //     "created_by_id": "29dc6be0-3a09-4762-8f6f-a5955b281416",
        //     "updated_by_id": "29dc6be0-3a09-4762-8f6f-a5955b281416",
        //     "audit_template_id": "859f10f6-55a1-4495-a92a-69855296e2b7",
        //     "section_description": "Maintenance & calibration checks"
        // }
      ],
      "is_active": true,
      "audit_date": null,
      "audit_name": null,
      "auditee_id": null,
      "auditor_id": null,
      "audit_title": null,
      "auditee_name": null,
      "auditor_name": null,
      "capa_details": [
        {
          "capa_id": null,
          "capa_type": null,
          "is_active": false,
          "created_at": null,
          "created_by": null,
          "updated_at": null,
          "updated_by": null,
          "capa_status": null,
          "description": null,
          "reviewer_at": null,
          "reviewer_by": null,
          "action_taken": null,
          "created_by_id": null,
          "updated_by_id": null,
          "capa_status_id": null,
          "reviewer_by_id": null,
          "corrective_action": null,
          "evidence_file_ids": [
          ],
          "preventive_action": null,
          "reviewer_comments": null,
          "orgcapa_findings_id": null,
          "reason_for_deviation": null
        }
      ],
      "audit_type_id": null,
      "department_id": null,
      "total_row_cnt": null,
      "audit_type_name": null,
      "department_name": null,
      "audit_compliance": null,
      "audit_location_id": null,
      "audit_template_id": null,
      "evidence_documents": [
        // {
        //     "file_id": "4c026993-a2ba-4b5c-af12-7eb5171d31bf",
        //     "file_name": "hrview-logo.png",
        //     "file_size": 79368,
        //     "file_type": "image/png",
        //     "is_active": true,
        //     "storage_path": "sabASDJH",
        //     "fileOrImageUrl": null,
        //     "fileType": null
        // },
        // {
        //     "file_id": "f6a202a2-ad9f-4867-81b2-755cd4306649",
        //     "file_name": "hrview1-logo.png",
        //     "file_size": 79369,
        //     "file_type": "image1/png",
        //     "is_active": true,
        //     "storage_path": "abcds",
        //     "fileOrImageUrl": null,
        //     "fileType": null
        // }
      ],
      "audit_location_name": null,
      "audit_template_code": null
    }
  )
  constructor(private location: Location, public _hqms: HqmsService, private activatedRoute: ActivatedRoute) { }

  goBack(): void {
    this.router.navigateByUrl('/audit-type-dashboard')
  }

  ngAfterViewInit() {
    Fancybox.bind('[data-fancybox="gallery"]', {
      // Optional customization
    });
  }

  async ngOnInit() {
    try {
      let state = history.state;
      if (state ?.data) {
        await this.editAudit(state['data']['id'])
      }
    } catch (e) { };
  }

  public qstnCnt = 0;
  async editAudit(schedule_id: any) {
    try {
      this.qstnCnt = 0;
      let getAuditInfo: any = await this._hqms.customGetApiCall('GET', 'fnConductAuditGetApi',
        {
          "schedule_id": schedule_id
        });
      if (getAuditInfo.status == 200) {
        let editInfo = getAuditInfo['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          editInfo['sections'].forEach((ele) => {
            this.qstnCnt = this.qstnCnt + ele['questions'].length
          })
          this.conducAudit.set({
            "status": editInfo.status,
            "sections": editInfo.sections.map((ele: any, ind: number) => ({ ...ele, secIn: ind + 1 })),
            "is_active": true,
            "audit_date": editInfo.audit_date,
            "audit_name": editInfo.audit_name,
            "auditee_id": editInfo.auditee_id,
            "auditor_id": editInfo.auditor_id,
            "audit_title": editInfo.audit_title,
            "auditee_name": editInfo.auditee_name,
            "auditor_name": editInfo.auditor_name,
            "capa_details": editInfo.capa_details,
            "audit_type_id": editInfo.audit_type_id,
            "department_id": editInfo.department_id,
            "total_row_cnt": editInfo.total_row_cnt,
            "audit_type_name": editInfo.audit_type_name,
            "department_name": editInfo.department_name,
            "audit_compliance": editInfo.audit_compliance,
            "audit_location_id": editInfo.audit_location_id,
            "audit_template_id": editInfo.audit_template_id,
            "evidence_documents": editInfo.evidence_documents,
            "audit_location_name": editInfo.audit_location_name,
            "audit_template_code": editInfo.audit_template_code,
            "schedule_id": editInfo.schedule_id
          });
        };
      };
    } catch (e) {
    };
  }
  FORM_NAME = 'AUDITCAPA'
  selectAnswer(qstn: any, ctrl: string) {
    qstn.answer_text = ctrl;
  }

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.writeCapa[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  async onSubmitClick() {
    try {
      Object.keys(this.errorMsg).forEach((ctrl) => this.onGetErrorMsgs(ctrl));
      let isValid = this._hqms.showErrorSummary(this.errorMsg);
      if (isValid || this.uploadError1) {
        this._hqms.hqmsToasterService({
          key: 'Capa',
          severity: 'warn',
          summary: 'Audit Capa',
          detail: 'Check the errors',
        });
        return;
      };

      let { audit_template_id, schedule_id } = JSON.parse(JSON.stringify(this.conducAudit()));
      this.writeCapa["audit_template_id"] = audit_template_id;
      this.writeCapa["schedule_id"] = schedule_id;
      if (this.writeCapa.capa_id == null) {
        this.writeCapa['evidence_documents'] =
          this.writeCapa['evidence_documents'].filter((fl: any) => fl.is_active == true);
      };
      let formData = new FormData();
      this.attachedFiles.forEach((file: any, index: number) => {
        formData.append("file", file.fileContent, file.fileName);
      });
      formData.append("data", JSON.stringify(this.writeCapa));
      let cnfrm = await this._hqms.showConfirmMessage();
      if (cnfrm) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnConductAuditGetApi", formData);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            severity: 'success', key: 'Capa',
            summary: 'Audit Capa',
            detail: saveResult.message,
          });
          this.router.navigateByUrl('/audit-type-dashboard');
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            severity: 'warn', key: 'Capa',
            summary: 'Audit Capa',
            detail: saveResult.message,
          });
        }
      };
    } catch (e) {
    };
  }


  onClear() {
    this.uploadError1 = false;
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
    this.writeCapa = {
      "action": "K",
      "capa_id": null,
      "is_active": true,
      "description": null,
      "action_taken": null,
      "capa_status_id": null,
      "evidence_documents": []
    }
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
        severity: 'warn',
        summary: 'Audit Capa',
        detail: 'Accepted Formats were .png/.jpeg',
      });
      setTimeout(() => {
        thisFile.clear();
        this.uploadError1 = false;
      }, 3000);
      return;
    };
    this.uploadError1 = false;
    thisObj.evidence_documents.push(
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

}
