import { Component, signal, QueryList, ViewChildren, inject, OnInit, ViewChild, computed } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import {Validations} from '../../validations'
import { moveItemInArray, CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
@Component({
  selector: 'app-survey-response',
  imports: [CommonModule, FormsModule, SelectModule,
    SharedModule,
    DragDropModule],
  templateUrl: './survey-response.component.html',
})
export class SurveyResponseComponent implements OnInit {
  readonly FORM_NAME = 'scsurvey';
  public validations=inject(Validations)
  public router = inject(Router);
  public pageMode = "NEW";
  public attachedFiles: any = [];
  public uhidList: any = [];
  public patientList: any = [];
  public cpTypeList: any = [];
  public surveyList: any = [];
  public ess_survey_id: any = null;
  public scRspnse: any = {
    "action": "I",
    "ess_survey_id": null,
    "remarks": null,
    "questions": []
  };
  public errMsg:any={
    ess_survey_id:''
  }
  onGetErrMsg(ctrl:any){
    let res=this.validations.validateField(this.FORM_NAME,ctrl,this.scRspnse[ctrl]);
    this.errMsg[ctrl]=res?.message || ''
  }
  public surveyScorsLst: any = [];

  onSurveyChange() {
    this.scRspnse["questions"] = [];
  }

  constructor(private location: Location,
    public _hqms: HqmsService,
    private activatedRoute: ActivatedRoute
  ) { }

  async ngOnInit() {
    try {
      let srvyinfo: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        { "flag": "ESS" });
      if (srvyinfo.status == 200) {
        this.surveyList = srvyinfo.data.map((ele: any) => ({
          label: ele.survey_name,
          value: ele.ess_survey_id,
        }))
      };

      let scList: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "ESSSCORE" });
      if (scList.status == 200) {
        this.surveyScorsLst = scList.data.entities.ESSSCORE.values.map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code,
        }));
      };                                                                                                          
    } catch (e) { };
  }

  async onSubmitClick() {
    try {
      let getResponse: any = JSON.parse(JSON.stringify(this.scRspnse));
      Object.keys(this.errMsg).forEach((ctrl)=>{this.onGetErrMsg(ctrl)});
      let isValid = this._hqms.showErrorSummary(this.errMsg);
      if (isValid) {
        this._hqms.hqmsToasterService({
          key: "appWkflw",
          severity: "warn",
          summary: "Survey",
          detail: "Check the errors",
        });
        return;
      }
        getResponse['questions'].forEach(qstns => {
          delete qstns.created_at;
          delete qstns.created_by;
          delete qstns.created_by_id;
          delete qstns.is_evidence;
          delete qstns.is_mandatory;
          delete qstns.is_not_applicable;
          delete qstns.loc_id;
          delete qstns.options_json;
          delete qstns.ques_order;
          delete qstns.question_text;
          delete qstns.question_type;
          delete qstns.status;
          delete qstns.updated_at;
          delete qstns.updated_by;
          delete qstns.updated_by_id;
        });

      let cnfrmSrvy = await this._hqms.showConfirmMessage();
      if (cnfrmSrvy) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnEssSRViewCapaReviewApi", getResponse);
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
      "ess_survey_id": null,
      "remarks": null,
      "questions": []
    };
  }

  selectAnswer(qstn: any, ctrl: any, sctn: any) {
    qstn.score = ctrl['label'];
    qstn.score_type_id = ctrl['value'];
    qstn.score_code = ctrl['value_code'];
    qstn.is_required = false;
  }

  async onConductSurvey() {
    try {
      if (this.scRspnse.ess_survey_id == null) {
        this._hqms.hqmsToasterService({
          key: 'sc',
          severity: 'warn',
          summary: 'Survey',
          detail: 'Select a survey',
        });
        return;
      };
      this.scRspnse["questions"] = [];
      let cndAdt: any = await this._hqms.customGetApiCall('GET', 'fnEssSurveyApi',
        {
          "ess_survey_id": this.scRspnse.ess_survey_id,
        });
      if (cndAdt.status == 200) {
        this.scRspnse['questions'] = cndAdt.data[0]['questions'].map((qs: any) =>
          ({ ...qs, score: ((qs.score||'').toString() || '').toUpperCase(), score_type_id: (qs.score_type_id || null), score_code: (qs.score_code || null) }))

      };
    } catch (e) {
      console.log("e ",e)
    };
  }
}
