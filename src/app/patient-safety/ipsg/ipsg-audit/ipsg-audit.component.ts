import { Component, signal, QueryList, ViewChildren, inject, OnInit, ViewChild, computed } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { moveItemInArray, CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import * as XLSX from 'xlsx';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { Validations } from '../../../validations';

@Component({
    selector: 'app-ipsg-audit',
    imports: [CommonModule, FormsModule, ReactiveFormsModule, SelectModule,
     SharedModule,
      DragDropModule],
    templateUrl: './ipsg-audit.component.html',
    styleUrl: './ipsg-audit.component.scss'
})
export class IpsgAuditComponent implements OnInit {
  private validations = inject(Validations);
  readonly FORM_NAME = 'newAuditAddForm';
  public router = inject(Router);
  public pageMode = "NEW";
  public attachedFiles: any = [];
  public uhidList: any = [];
  public patientList: any = [];
  public cpTypeList: any = [];
  public departmentList: any = [];
  public errorMsg: any = { department_id: '',audit_date:'' };
  public ipsgAudits = {
    "action": "I",
    "status" : null,
    "ipsg_id" : null,
    "ipsg_audit_id" : null,
    "department_id": null,
    "audit_date": null,
    "sections" : []
  };
  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.ipsgAudits[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  constructor(private location: Location,
    public _hqms: HqmsService,
    private activatedRoute: ActivatedRoute
  ) { }

  async ngOnInit() {
    try {
      let getSrvrDt = await this._hqms.getServerDate('DATE');
      let departmentList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        { "flag": "DEPARTMENT" });
      if (departmentList.status == 200) {
        this.departmentList = departmentList.data.map((ele: any) => ({
          label: ele.department_name,
          value: ele.department_id,
        }))
      };
    } catch (e) { };
  }

  async onSubmitClick(ctrl) {
    try {
      // this.textAreaComponent.forEach((input) => input.markAsTouchedAndValidate());
      // this.textAreaComponent['_results'].forEach((res: any) => {
      //   if (res.hasError()) submitCnt++;
      // });
      // if (submitCnt != 0) {
      //   this._hqms.hqmsToasterService({
      //     key: 'IPSG',
      //     severity: 'warn',
      //     summary: 'IPSG Audits',
      //     detail: 'Check the errors',
      //   });
      //   return;
      // };
      let getResponse =  JSON.parse(JSON.stringify(this.ipsgAudits));
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
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnIpsgAuditApi", getResponse);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: 'IPSG',
            severity: 'success',
            summary: 'IPSG Audits',
            detail: saveResult.message,
          });
          this.onClearClick();
          this.router.navigateByUrl('/ipsg-dashboard');
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: 'IPSG',
            severity: 'warn',
            summary: 'IPSG Audits',
            detail: saveResult.message,
          });
        }
      };
    } catch (e) {
    }
  }

  onClearClick() {
   this.ipsgAudits = {
    "action": "I",
      "status" : null,
    "ipsg_id" : null,
    "department_id": null,
     "ipsg_audit_id" : null,
    "audit_date": null,
    "sections" : []
   };
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
  }

  goBack(): void {
    this.router.navigateByUrl('/ipsg-dashboard');
  }

  selectAnswer(qstn:any, ctrl:string){
    if(this.ipsgAudits.status == 'submitted'){
      return;
    }
    qstn.answer_text = ctrl;
    qstn.is_required = false;
  }

  async onConductAudit(){
    
   try{
    Object.keys(this.errorMsg).forEach((ctrl)=>this.onGetErrorMsgs(ctrl))
    let isValid=this._hqms.showErrorSummary(this.errorMsg)
    if(isValid){
      this._hqms.hqmsToasterService({
        key: 'newAudit',
        severity: 'warn',
        summary: 'Clinical Pathway Audits',
        detail: 'Check the errors',
      });
      return;
    }
    this.ipsgAudits["sections"] = [];
     this.ipsgAudits['ipsg_audit_id'] = null;
    let cndAdt: any = await this._hqms.customGetApiCall('GET', 'fnIpsgAuditApi',
    {
          "department_id": this.ipsgAudits.department_id,
          "audit_date":this.ipsgAudits.audit_date,
    });
    if (cndAdt.status == 200) {
      this.ipsgAudits['status'] = cndAdt.data[0]['status'];
      this.ipsgAudits['ipsg_audit_id'] = cndAdt.data[0]['ipsg_audit_id'];
      this.ipsgAudits['sections'] = cndAdt.data[0]['section'].map((sc) =>  ( {...sc, questions : sc.questions.map((qs)=>  ({...qs, answer_text : (qs.answer_text|| '').toUpperCase()   })      )   }  )   )
    };
   }catch(e){};
  }
}
