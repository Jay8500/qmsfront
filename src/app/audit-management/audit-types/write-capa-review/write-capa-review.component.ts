import { Component, OnInit, signal, ViewChildren, QueryList, inject } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { Fancybox } from "@fancyapps/ui";
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';

@Component({
  selector: 'app-write-capa-review',
  imports: [CommonModule, SharedModule, FileUploadModule],
  templateUrl: './write-capa-review.component.html',
})
export class WriteCapaReviewComponent implements OnInit {
  @ViewChildren('upCoverPage') upCoverPage!: FileUpload;
  public router = inject(Router);
  public attachedFiles: any = [];
  public conducAudit: any = signal({});
  public apprvlsList = [];
  public is_history_drawer: boolean =false;
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
        await this.getApprovalList();
      }
    } catch (e) { };
  }


  async getApprovalList(){
    try{
          let info: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "APPRVLVLSTS" });
      if (info.status == 200) {
        this.apprvlsList = info.data.entities.APPRVLVLSTS.values.map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
          severity : ele.display_value == 'Approved' ? 'success' : 'danger'
        }))
      };
    }catch(e){};
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
            "audit_type_id": editInfo.audit_type_id,
            "department_id": editInfo.department_id,
            "total_row_cnt": editInfo.total_row_cnt,
            "audit_type_name": editInfo.audit_type_name,
            "department_name": editInfo.department_name,
            "audit_compliance": editInfo.audit_compliance,
            "source_module_id": editInfo.source_module_id,
            "audit_location_id": editInfo.audit_location_id,
            "audit_template_id": editInfo.audit_template_id,
            "evidence_documents": editInfo.evidence_documents,
            "source_module_type": editInfo.source_module_type,
            "audit_location_name": editInfo.audit_location_name,
            "audit_template_code": editInfo.audit_template_code,
            "schedule_id": editInfo.schedule_id,
            "can_approve" : editInfo.can_approve,
            "capa_details" : editInfo.capa_details != null ? editInfo.capa_details  : [],
            "approval_workflow_level" :editInfo.approval_workflow_level,
            "is_self_approved" :editInfo.is_self_approved,
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

  onClear() {
    this.uploadError1 = false;
  }

    async onStatusUpdate(agndStatus:any){
      let getInfo = this.conducAudit();
      let adtApprvl: any = {
        action : "L",
        approve_status_id : agndStatus,// approve or reject
        schedule_id : getInfo.schedule_id,
        audit_template_id : getInfo.audit_template_id,
        is_agree :  getInfo.is_agree,
        approval_remarks :  getInfo.approval_remarks,
        is_self_approved :  getInfo.is_self_approved,
        capa_id : getInfo.capa_details[0]['capa_id']
      };

      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnConductAuditGetApi", adtApprvl);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Audit Approval',
          detail: saveResult.message,
        });
        this.router.navigateByUrl('/audit-type-dashboard');
      } else if (saveResult.status == 204 || saveResult.status == 501) {
        this._hqms.hqmsToasterService({
          severity: 'warn',
            summary: 'Audit Approval',
          detail: saveResult.message,
        });
      }
  }
}
