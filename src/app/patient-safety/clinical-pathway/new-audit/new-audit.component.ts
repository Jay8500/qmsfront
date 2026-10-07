import { Component, signal, inject, OnInit, ViewChild, computed } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { moveItemInArray, CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { ImageViewerComponent } from '../../../components/imageviewer/imageviewer.component';
import { Validations } from '../../../validations';

@Component({
  selector: 'app-new-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SelectModule, FileUploadModule, SharedModule, DragDropModule],
  templateUrl: './new-audit.component.html',
})
export class NewAuditComponent implements OnInit {
  @ViewChild('upCoverPage') upCoverPage!: FileUpload;
  @ViewChild('imgView') imgView!: ImageViewerComponent;
  @ViewChild('postAss') postAssess!: FileUpload;
  @ViewChild('preAssess') preAssess!: FileUpload;
  private validations = inject(Validations);
  readonly FORM_NAME = 'newAuditAddForm';
  public router = inject(Router);
  public pageMode = "NEW";
  public attachedFiles: any = [];
  public uhidList: any = [];
  public patientList: any = [];
  public cpTypeList: any = [];
  public departmentList: any = [];
  public consultantList: any = [];
  public errorMsg: any = {
    patient_id: '',
    cp_master_id: '',
    department_id: '',
    consultant_id: '',
    admission_date: '',
    surgery_date: '',
    discharge_date: '',
    remarks:''
  };
  public newAuditt: any = JSON.stringify({
    "action": "I",
    "cp_audit_id": null,
    "uhid": null,
    "patient_id": null,
    "cp_master_id": null,
    "department_id": null,
    "consultant_id": null,
    "admission_date": null,
    "surgery_date": null,
    "discharge_date": null,
    "status": null,
    "discharge_form": [],
    "sections": [],
    "is_active": true,//Not Given (DB)
    "section_documents": [],//From Clinical Pathway
    "track_trash": [], //From Clinical Pathway
    "remarks" : null
  });
  public createCPAudits = signal<any>({ ...JSON.parse(this.newAuditt) });
  public uploadError1 = false;

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.createCPAudits()[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  async onCpTypeChange() {
    this.onGetErrorMsgs('cp_master_id');
    await this.getCPtypeRspns(this.createCPAudits().cp_master_id);
  }

  constructor(private location: Location,
    public _hqms: HqmsService,
    private activatedRoute: ActivatedRoute
  ) { }

  async ngOnInit() {
    try {
      let getSrvrDt = await this._hqms.getServerDate('DATE');
      let uhidList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        { "flag": "PATIENT" });
      if (uhidList.status == 200) {
        this.uhidList = uhidList.data.map((ele: any) => ({
          label: ele.uhid,
          value: ele.patient_id,
        }))
      };
      let patientList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        { "flag": "PATIENT" });
      if (patientList.status == 200) {
        this.patientList = patientList.data.map((ele: any) => ({
          label: ele.patient_name,
          value: ele.patient_id,
        }))
      };
      let cpTypeList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        { "flag": "CP" });
      if (cpTypeList.status == 200) {
        this.cpTypeList = cpTypeList.data.map((ele: any) => ({
          label: ele.cp_name,
          value: ele.cp_master_id,
        }))
      };
      let departmentList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        { "flag": "DEPARTMENT" });
      if (departmentList.status == 200) {
        this.departmentList = departmentList.data.map((ele: any) => ({
          label: ele.department_name,
          value: ele.department_id,
        }))
      };
      let consultantList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        { "flag": "DOCTOR" });
      if (consultantList.status == 200) {
        this.consultantList = consultantList.data.map((ele: any) => ({
          label: ele.doctor_name,
          value: ele.doctor_id,
        }))
      };
      let state = history.state;
      this.pageMode = state['data']['mode'];
      if (this.pageMode != 'NEW') {
        await this.editNewAudit(state['data']['id'])
      };
    } catch (e) { };
  }

  async editNewAudit(cpAdtId: any) {
    try {
      let info: any = await this._hqms.customGetApiCall('GET','fnCpAuditApi',
        {
          "cp_audit_id": cpAdtId,
        });
      if (info.status == 200) {
        let editInfo:any = info['data'][0];
         this.createCPAudits.set({
           "action": "I",
            "cp_audit_id": editInfo['cp_audit_id'],
            "uhid": editInfo['uhid'],
            "patient_id": editInfo['patient_id'],
            "cp_master_id": editInfo['cp_master_id'],
            "department_id": editInfo['department_id'],
            "consultant_id": editInfo['consultant_id'],
            "admission_date": editInfo['admission_date'],
            "surgery_date": editInfo['surgery_date'],
            "discharge_date": editInfo['discharge_date'],
            "status": editInfo['status'],
            "discharge_form": [],
            "remarks": editInfo['remarks'],
            "sections": editInfo.sections.map((sc) =>  ( {...sc, questions : sc.questions.map((qs)=>  ({...qs, answer_text : qs.answer_text.toUpperCase()   })      )   }  )   )   ,
            "is_active": editInfo['is_active'],//Not Given (DB)
            "section_documents": [],//From Clinical Pathway
            "track_trash": [] //From Clinical Pathway
         })
      };
    } catch (e) {
    };
  }

  getCoverPageActiveimg(image: any) {
    let active = image.filter((im: any) => im.is_active == true);
    return active.length;
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
    thisObj.discharge_form.push(
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
      this.upCoverPage.clear();
    };
  }

  async onSubmitClick(ctrl) {
    try {
      Object.keys(this.errorMsg).forEach((c) => this.onGetErrorMsgs(c));
      let isValid = this._hqms.showErrorSummary(this.errorMsg);
      if (isValid || this.uploadError1) {
        this._hqms.hqmsToasterService({
          key: 'newAudit',
          severity: 'warn',
          summary: 'Clinical Pathway Audits',
          detail: 'Check the errors',
        });
        return;
      };
      let getResponse =  JSON.parse(JSON.stringify(this.createCPAudits()));
      getResponse.status = ctrl;
      let cnt = 0;
      getResponse.sections.forEach((sc)=> {
        sc.questions.forEach((qstn)=> {
          if(qstn.is_mandatory){
            if(['',null].includes(qstn.answer_text)){
            qstn.is_required = true;
            cnt++;
            }else{
              qstn.is_required = false;
              cnt--;
            }
          }else{
            qstn.is_required = false;
            cnt--;
          };
          qstn.answer_text = qstn.answer_text.toLowerCase();
        })
      });
      if(cnt > 0 ){
        this._hqms.hqmsToasterService({
          key: 'audit',
          severity: 'warn',
          summary: 'Responses required',
          detail: 'Check the errors',
        });
        return;
      };
			getResponse["is_active"] =  true;
			getResponse["action"] =  "I";
      getResponse['sections'] = getResponse['sections'].map((ele) =>
       ({
          section_id : ele.section_id ,
          questions :  ele.questions.map((qstn) =>
            (
              {
                question_id : qstn.question_id,
                answer_text : qstn.answer_text,
                remarks : qstn.remarks||null
              }
            )
          )
        }));

      let confirmNewAuditt = await this._hqms.showConfirmMessage();
      if (confirmNewAuditt) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST","fnCpAuditApi", getResponse);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: 'newAudit',
            severity: 'success',
            summary: 'Clinical Pathway Audits',
            detail: saveResult.message,
          });
          this.onClearClick();
          this.router.navigateByUrl('/clinical-dashboard');
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: 'newAudit',
            severity: 'warn',
            summary: 'Clinical Pathway Audits',
            detail: saveResult.message,
          });
        }
      };
    } catch (e) {
    }
  }

  onClearClick() {
    this.uploadError1 = false;
    this.uploadError2 = false;
    this.createCPAudits.set({ ...JSON.parse(this.newAuditt) });
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
  }

  goBack(): void {
    this.router.navigateByUrl('/clinical-dashboard');
  }

  async getCPtypeRspns(cp_master_id: any) {
    try {
      this.createCPAudits().sections = [];
      let edifInfo: any = await this._hqms.customGetApiCall('GET','fnCpMasterWrite',
        {
          "cp_master_id": cp_master_id
        });
      if (edifInfo.status == 200) {
          // this.createCPAudits().department_id = info['department_id']
        this.createCPAudits().sections =  edifInfo['data'][0]['sections']
      };
    } catch (e) {
    };
  }

  selectAnswer(qstn:any, ctrl:string){
    qstn.answer_text = ctrl;
    qstn.is_required = false;
  }
}
