import { Component,OnInit, signal,ViewChildren,QueryList, inject } from '@angular/core';
import { RouterLink,Router } from '@angular/router';
import { Location,CommonModule } from '@angular/common';
import { Fancybox } from "@fancyapps/ui";
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
@Component({
    selector: 'app-audit-type-create',
    imports: [ CommonModule,SharedModule],
    templateUrl: './audit-type-create.component.html',
})
export class AuditTypeCreateComponent implements OnInit{
  public router = inject(Router);
  public conducAudit :any = signal(
       {
            "loc_id": "22222222-2222-2222-2222-222222222222",
            "org_id": "11111111-1111-1111-1111-111111111111",
            "status": "",
            "schedule_id": null,
            "sections": [
            ],
            "is_active": true,
            "audit_date":null,
            "audit_name": null,
            "auditee_id": null,
            "auditor_id":null,
            "audit_title": null,
            "auditee_name": null,
            "auditor_name": null,
            "capa_details": [
            ],
            "audit_type_id":null,
            "department_id": null,
            "total_row_cnt": null,
            "audit_type_name": null,
            "department_name": null,
            "audit_compliance": null,
            "source_module_id": null,
            "audit_location_id": null,
            "audit_template_id": null,
            "evidence_documents": [

            ],
            "source_module_type": null,
            "audit_location_name":null,
            "audit_template_code": null
        }
  )
  constructor(private location: Location,public _hqms: HqmsService,) {}

  goBack(): void {
    this.location.back();
  }

  ngAfterViewInit() {
    Fancybox.bind('[data-fancybox="gallery"]', {
      // Optional customization
    });
  }

  async ngOnInit(){
    try{
      let state = history.state;
      if(state?.data){
        await this.editAudit(state['data']['id'])
      }
    }catch(e){};
  }

  async editAudit(schedule_id: any) {
    try {
      let getAuditInfo: any = await this._hqms.customGetApiCall('GET', 'fnConductAuditGetApi',
        {

            "schedule_id": schedule_id

        });
      if (getAuditInfo.status == 200) {
        let editInfo = getAuditInfo['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.conducAudit.set({
            "loc_id": "22222222-2222-2222-2222-222222222222",
            "org_id": "11111111-1111-1111-1111-111111111111",
            "status": editInfo.status,
            "sections": editInfo.sections.filter(sec=>sec.is_active == true).map((ele:any, ind:number) => ({...ele, secIn : ind+1,
            questions : ele.questions.map((qs) => ( {...qs, is_required :false} ) ) })),
            "is_active": editInfo.is_active,
            "audit_date":editInfo.audit_date,
            "audit_name": editInfo.audit_name,
            "auditee_id": editInfo.auditee_id,
            "auditor_id":editInfo.auditor_id,
            "audit_title": editInfo.audit_title,
            "auditee_name": editInfo.auditee_name,
            "auditor_name": editInfo.auditor_name,
            "capa_details": editInfo.capa_details,
            "audit_type_id":editInfo.audit_type_id,
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
            "audit_location_name":editInfo.audit_location_name,
            "audit_template_code": editInfo.audit_template_code,
            "schedule_id": editInfo.schedule_id
          });
        };
      };
    } catch (e) {
    };
  }

  selectAnswer(qstn:any, ctrl:string){
    qstn.answer_text = ctrl;
    qstn.is_required = false;
  }

 async onSubmitClick(ctrl:string){
   try{
    if(ctrl == 'Draft'){
    let allQstns = this.conducAudit().sections.flatMap(sc=> sc.questions);
    let hasAtlst = allQstns.some(qstn =>qstn.answer_text &&  qstn.answer_text.trim() !== '');
    if(hasAtlst==false){
     this._hqms.hqmsToasterService({
        key: 'audit',
        severity: 'warn',
        summary: 'Draft',
        detail: 'Atleast one reponse is required',
      });
      return;
    }
    }else{
     let cnt = 0;
     this.conducAudit().sections.forEach((sc)=> {
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
      }
    }

     let getResponse =  JSON.parse(JSON.stringify(this.conducAudit()));

			getResponse["is_active"] =  true;
			getResponse["action"] =  "I";
      getResponse['conduct_audit_status'] = ctrl;
      getResponse['sections'] = getResponse['sections'].map((ele) =>
       ({
          section_id : ele.section_id ,
          questions :  ele.questions.map((qstn) =>
            (
              {
                question_id : qstn.question_id,
                answer_text : qstn.answer_text,
                remarks : qstn.remarks
              }
            )
          )
          }));

      delete getResponse['audit_compliance'];
      delete getResponse['audit_date'];
      delete getResponse['audit_name'];
      delete getResponse['audit_location_name'];
      delete getResponse['auditor_name'];
      delete getResponse['auditee_name'];
      delete getResponse['capa_details'];
      delete getResponse['audit_type_id'];
      delete getResponse['department_id'];
      delete getResponse['total_row_cnt'];
      delete getResponse['audit_type_name'];
      delete getResponse['department_name'];
      delete getResponse['audit_compliance'];
      delete getResponse['source_module_id'];
      delete getResponse['audit_location_id'];
      delete getResponse['evidence_documents'];
      delete getResponse['source_module_type'];
      delete getResponse['audit_location_name'];
      delete getResponse['audit_template_code'];

    let cnfrm = await this._hqms.showConfirmMessage();
    if (cnfrm) {
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnConductAuditGetApi", getResponse);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',  key: 'audit',
          summary: 'Conduct Audit',
          detail: saveResult.message,
        });
        this.router.navigateByUrl('/audit-type-dashboard');
      } else if (saveResult.status == 204|| saveResult.status == 501) {
        this._hqms.hqmsToasterService({
          severity: 'warn',
          summary: 'Conduct Audit',
          detail: saveResult.message,
        });
      }
    };
   }catch(e){};
  }

  onClear(){
     this.conducAudit().sections.forEach((el)=>
       el.questions.forEach((qstn:any)=>{
          qstn.answer_text = '';
          qstn.remarks = '';
          qstn.is_required = false;
        })
     )
  }
}
