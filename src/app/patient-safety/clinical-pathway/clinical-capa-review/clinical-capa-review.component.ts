import { Component,OnInit ,inject} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Location,CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import { Validations } from '../../../validations';
@Component({
    selector: 'app-clinical-capa-review',
      imports : [CommonModule,FormsModule,SharedModule,FileUploadModule],

    templateUrl: './clinical-capa-review.component.html',
    styleUrl: './clinical-capa-review.component.scss'
})
export class ClinicalCapaReviewComponent implements OnInit{
  private validations = inject(Validations);
  public router = inject(Router);
  public FORM_NAME = 'reviewcapa';
  public attachedFiles:any = [];
  public createCPAudits = {
    action :"K",
    patient_name:null,
    status:null,
    cp_type_name:null,
    doa_name:null,
    cp_audit_id:null,
    dos_name:null,
    dod_name:null,
    consultant_name:null,
    sections:[],
    compliance:null,
    displayCol:null,
    discharge_form:[],
    write_capa:null,
    action_taken:null,
    evidences : [],
    "capa_id": null,
    "reviewer_comments": null,
    "is_agree": false,
    capa_details : []
  };
  public errorMsg: any = { reviewer_comments: '' };

  constructor(private location: Location,public _hqms: HqmsService,) {}

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.createCPAudits[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  goBack(): void {
     this.router.navigateByUrl('/clinical-dashboard');
  }

  async ngOnInit(){
     let state = history.state;
     await this.readOnlyData(state['data']['id'])
  }

  async readOnlyData(cpAdtId: any) {
    try {
      let info: any = await this._hqms.customGetApiCall('GET', 'fnCpAuditApi',
        {
          "cp_audit_id": cpAdtId,
        });
      if (info.status == 200) {
        let editInfo:any = info['data'][0];
        this.createCPAudits["patient_name"] = editInfo.patient_name;
        this.createCPAudits["cp_audit_id"] = editInfo.cp_audit_id;
        this.createCPAudits["status"] = editInfo.status;
         this.createCPAudits["cp_type_name"] = editInfo.cp_type_name;
         this.createCPAudits["doa_name"] = editInfo.doa_name;
          this.createCPAudits["capa_details"] = editInfo.capa_details;
          this.createCPAudits["dos_name"] = editInfo.dos_name;
          this.createCPAudits["dod_name"] = editInfo.dod_name;
          this.createCPAudits["consultant_name"] = editInfo.consultant_name;
          this.createCPAudits["compliance"] = editInfo.compliance;
          this.createCPAudits["displayCol"] = editInfo.compliance;
          this.createCPAudits["discharge_form"] = editInfo.discharge_form;
           this.createCPAudits["sections"]= editInfo.sections.map((sc) =>  ( {...sc, questions : sc.questions.map((qs)=>  ({...qs, answer_text : qs.answer_text.toUpperCase()   })      )   }  )   );

      };
    } catch (e) {
    };
  }

  getComplianceClass(compliance: any): any {
    if (compliance > 0) {
      if (compliance < 45) {
        return 'text-danger';   // red
      } else if (compliance >= 45 && compliance < 75) {
        return 'text-warning';  // orange
      } else {
        return 'text-success';  // green
      }
    }
  }
  public uploadError2 = false;

  async  onCoverPageFileSelect(thisFile: any, fileSelected: any, fileType: any, thisObj: any, maindata: any) {
    this.uploadError2 = false;
    if (['application/pdf'].includes(fileSelected.files[0].type)) {
      this.uploadError2 = true;
      this._hqms.hqmsToasterService({
        key: 'newAudit',
        severity: 'warn',
        summary: 'Clinical Pathway Audits - Discharge Form',
        detail: 'Accepted Formats were .png/.jpeg',
      });
      setTimeout(() => {
        thisFile.clear();
        this.uploadError2 = false;
      }, 3000);
      return;
    };
    this.uploadError2 = false;
    thisObj.evidences.push(
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
      this.uploadError2 = false;
      doc.is_active = false;
      let thisFileName = doc.upload_file_name;
      let thisFileIndex: any = -1;
      this.attachedFiles.forEach((aFile: any, aIndex: number) => {
        if (aFile.fileName == thisFileName) thisFileIndex = aIndex;
      });
      if (thisFileIndex >= 0) {
        this.attachedFiles.splice(thisFileIndex, 1);
      };
    };
  }

  async onSubmitClick() {
    try {
      Object.keys(this.errorMsg).forEach((ctrl) => this.onGetErrorMsgs(ctrl));
      let isValid = this._hqms.showErrorSummary(this.errorMsg);
      if (isValid) {
        this._hqms.hqmsToasterService({
          severity: 'warn', key: 'Capa',
          summary: 'Review Capa',
          detail: 'Check the errors',
        });
        return;
      };

     let cpDts = JSON.parse(JSON.stringify(this.createCPAudits));
      let reviewCapa = {
        "action": "K",
        "capa_id":cpDts['capa_details'][0]['capa_id'],
        "cp_audit_id":cpDts['cp_audit_id'],
        "reviewer_comments": cpDts.reviewer_comments,
        "is_agree":cpDts.is_agree,
      };
      let cnfrm = await this._hqms.showConfirmMessage();
      if (cnfrm) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnCapaActionApi",reviewCapa);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            severity: 'success', key: 'Capa',
            summary: 'Review Capa',
            detail: saveResult.message,
          });

          this.router.navigateByUrl('/clinical-dashboard');
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            severity: 'warn', key: 'Capa',
            summary: 'Review Capa',
            detail: saveResult.message,
          });
        }
      };
    } catch (e) {
    };
  }

  onClear() {
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
   this.createCPAudits = {
    action :"K",
    patient_name:null,
    status:null,
    cp_type_name:null,
    doa_name:null,
    cp_audit_id:null,
    dos_name:null,
    dod_name:null,
    consultant_name:null,
    sections:[],
    compliance:null,
    displayCol:null,
    discharge_form:[],
    write_capa:null,
    action_taken:null,
    evidences : [],
    "capa_id": null,
    "reviewer_comments": null,
    "is_agree": false,
    capa_details : []
  };
  }

}
