import { Component, signal, QueryList, ViewChildren, inject, OnInit, ViewChild, computed } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { moveItemInArray, CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import * as XLSX from 'xlsx';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { Validations } from '../../../validations';
@Component({
  selector: 'app-scsurvey',
  imports: [CommonModule, FormsModule, SelectModule,
     SharedModule,
      DragDropModule],
  templateUrl: './scsurvey.component.html',
  styleUrl: './scsurvey.component.scss',
})
export class ScsurveyComponent implements OnInit {
  private validations = inject(Validations);
  readonly FORM_NAME = 'scsurvey';
  public router = inject(Router);
  public pageMode = "NEW";
  public attachedFiles: any = [];
  public uhidList: any = [];
  public patientList: any = [];
  public cpTypeList: any = [];
  public surveyList: any = [];
  public errorMsg: any = { survey_id: '' };
  public survey_id:any= null;
  public scRspnse :any= {
    "action": "I",
    "survey_id" : null,
    "remarks" : null,
    "sections" : []
  };
  public surveyScorsLst:any = [];

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.scRspnse[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  onSurveyChange() {
    this.onGetErrorMsgs('survey_id');
    this.scRspnse["sections"] = [];
  }

  constructor(private location: Location,
    public _hqms: HqmsService,
    private activatedRoute: ActivatedRoute
  ) { }

  async ngOnInit() {
    try {
      let srvyinfo: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        { "flag": "PSS" });
      if (srvyinfo.status == 200) {
        this.surveyList = srvyinfo.data.map((ele: any) => ({
          label: ele.survey_name,
          value: ele.survey_id,
        }))
      };

        let scList: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "SURVEYSCORE" });
      if (scList.status == 200) {
        this.surveyScorsLst = scList.data.entities.SURVEYSCORE.values.map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code,
        }));
      };
    } catch (e) { };
  }

  async onSubmitClick() {
    try {
      let getResponse:any =  JSON.parse(JSON.stringify(this.scRspnse));
       getResponse['sections'].forEach(sctn => {
         delete sctn.created_at;
         delete sctn.created_by;
         delete sctn.created_by_id;
         delete sctn.loc_id;
         delete sctn.org_id;
         delete sctn.sec_order;
         delete sctn.section_description;
         delete sctn.section_name;
         delete sctn.status;
         delete sctn.updated_at;
         delete sctn.updated_by;
         delete sctn.updated_by_id;
         sctn['questions'].forEach(qstns => {
          delete  qstns.created_at;
          delete  qstns.created_by;
          delete  qstns.created_by_id;
          delete  qstns.is_evidence;
          delete  qstns.is_mandatory;
          delete  qstns.is_not_applicable;
          delete  qstns.loc_id;
          delete  qstns.options_json;
          delete  qstns.ques_order;
          delete  qstns.question_text;
          delete  qstns.question_type;
          delete  qstns.status;
          delete  qstns.updated_at;
          delete  qstns.updated_by;
          delete  qstns.updated_by_id;
         });
       });
      let cnfrmSrvy = await this._hqms.showConfirmMessage();
      if (cnfrmSrvy) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnSCresponseApi", getResponse);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: 'sc',
            severity: 'success',
            summary: 'SC Survey',
            detail: saveResult.message,
          });
          this.onClearClick();
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: 'sc',
            severity: 'warn',
            summary: 'SC Survey',
            detail: saveResult.message,
          });
        }
      };
    } catch (e) {
    }
  }

  onClearClick() {
   this.scRspnse = {
     "action": "I",
    "survey_id" : null,
    "remarks" : null,
    "sections" : []
   };
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
  }

  selectAnswer(qstn:any, ctrl:any,sctn:any){
    qstn.score = ctrl['label'];
    qstn.score_type_id = ctrl['value'];
    qstn.score_code = ctrl['value_code'];
    qstn.is_required = false;
  }

  async onConductSurvey(){
   try{
    if(this.scRspnse.survey_id == null){
      this._hqms.hqmsToasterService({
            key: 'sc',
            severity: 'warn',
            summary: 'Survey',
            detail: 'Select a survey',
          });
      return;
    };
    this.scRspnse["sections"] = [];
    let cndAdt: any = await this._hqms.customGetApiCall('GET', 'fnSCresponseApi',
    {
          "survey_id": this.scRspnse.survey_id,
    });
    if (cndAdt.status == 200) {
      this.scRspnse['remarks'] = cndAdt.data[0]['remarks'];
      this.scRspnse['sections'] = cndAdt.data[0]['section'].map((sc:any) =>  ( {...sc  , questions : sc.questions.map((qs:any)=>
       ({...qs, score : ((qs.score||'').toString() || '').toUpperCase() , score_type_id : (qs.score_type_id||null), score_code : (qs.score_code||null)   })      )   }  )   )
    };
   }catch(e){

   };
  }
}
