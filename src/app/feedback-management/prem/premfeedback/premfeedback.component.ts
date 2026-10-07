import { Component, signal, QueryList, ViewChildren, inject, OnInit, ViewChild, computed } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { Validations } from '../../../validations';
@Component({
  selector: 'app-premfeedback',
  imports: [CommonModule, FormsModule, SelectModule,
    SharedModule,
  ],
  templateUrl: './premfeedback.component.html',
  styleUrl: './premfeedback.component.scss',
})
export class PremfeedbackComponent implements OnInit {
  private validations = inject(Validations);
  readonly FORM_NAME = 'premfeedback';
  public router = inject(Router);
  public pageMode = "NEW";
  public patientList: any = [];
  public departmentList: any = [];
  public premMstrList: any = [];
  public issueTypeList: any = [];
  public errorMsg: any = {
    prem_type_id: '',
    patient_id: '',
    department_id: '',
    issue_type_id: '',
    description: '',
  };
  public premFeedbck: any = {
    "action": "I",
    "is_active": true,
    "prem_feedback_id": null,
    "patient_id": null,
    "prem_type_id": null,
    "department_id": null,
    "issue_type_id": null,
    "description": null,
    "response": [],
    "is_appreciation": false,
    "appreciation_desc": null,
    "is_suggestions": false,
    "suggestions_desc": null,
    "is_compliance": false,
    "compliance_desc": null,
  };
  public selectedPremType: string = '';
  public surveyScorsLst: any = [];

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.premFeedbck[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }
  async onPremTypeChange() {
    this.onGetErrorMsgs('prem_type_id');
    this.premFeedbck["action"] = "I";
    this.premFeedbck["is_active"] = true;
    this.premFeedbck["prem_feedback_id"] = null;
    this.premFeedbck["patient_id"] = null;
    this.premFeedbck["department_id"] = null;
    this.premFeedbck["issue_type_id"] = null;
    this.premFeedbck["description"] = null;
    this.premFeedbck["response"] = [];
    this.premFeedbck["is_appreciation"] = false;
    this.premFeedbck["appreciation_desc"] = null;
    this.premFeedbck["is_suggestions"] = false;
    this.premFeedbck["suggestions_desc"] = null;
    this.premFeedbck["is_compliance"] = false;
    this.premFeedbck["compliance_desc"] = null;
    if (this.premFeedbck.prem_type_id != null) {
      let getValCode = this.premMstrList.filter((mstr) => mstr.value == this.premFeedbck.prem_type_id);
      if (getValCode.length > 0) {
        this.selectedPremType = getValCode[0]['value_code'];
      };
      await this.getPremTmplts(this.premFeedbck.prem_type_id)
    }
  }

  constructor(private location: Location,
    public _hqms: HqmsService,
    private activatedRoute: ActivatedRoute
  ) { }

  async ngOnInit() {
    try {
      let getSrvrDt = await this._hqms.getServerDate('DATE');
      let info: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "PREMTYPE | PREMDSSCORE | PREMISSUES" });
      if (info.status == 200) {
        this.premMstrList = info.data['entities']['PREMTYPE']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code,
        }));
        this.surveyScorsLst = info.data['entities']['PREMDSSCORE']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code,
        }));
        this.issueTypeList = info.data['entities']['PREMISSUES']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code,
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

  async getPremTmplts(param: any) {
    try {
      this.premFeedbck['response'] = [];
      let info: any = await this._hqms.customGetApiCall('GET', 'fnPremTemplateApi', {
        prem_type_id: param
      }
      );
      if (info.status == 200) {
        let mstrInfo = info['data'];
        if (mstrInfo.length > 0) {
          if (this.selectedPremType == 'OPFB') {
            this.premFeedbck['response'] = mstrInfo[0]['questions']
          } else {
            this.premFeedbck['response'] = mstrInfo[0]['sections']
          }
        };
      };
    } catch (e) {
    };
  }


  selectAnswer(qstn: any, ctrl: any, sctn: any) {
    qstn.score = ctrl['label'];
    qstn.score_type_id = ctrl['value'];
    qstn.score_code = ctrl['value_code'];
    qstn.is_required = false;
  }

  async onSubmitClick() {
    try {
      let prmFeedbck = JSON.parse(JSON.stringify(this.premFeedbck));
       Object.keys(this.errorMsg).forEach((ctrl) => this.onGetErrorMsgs(ctrl));
        let isValid = this._hqms.showErrorSummary(this.errorMsg);
        if (isValid) {
          this._hqms.hqmsToasterService({
            key: 'prem',
            severity: 'warn',
            summary: 'PREM Feedback',
            detail: 'Check the errors',
          });
          return;
        delete prmFeedbck['response'];
        delete prmFeedbck['is_appreciation'];
        delete prmFeedbck['appreciation_desc'];
        delete prmFeedbck['is_suggestions'];
        delete prmFeedbck['suggestions_desc'];
        delete prmFeedbck['is_compliance'];
        delete prmFeedbck['compliance_desc'];
      };
      if (this.selectedPremType == 'OPFB') {
        delete prmFeedbck['description'];
        delete prmFeedbck['issue_type_id'];
        prmFeedbck['questions'] = prmFeedbck['response'].map((ele) =>
          ({
            question_id: ele.question_id, is_mandatory: ele.is_mandatory,
            ques_order: ele.ques_order, score: ele.score, score_type_id: ele.score_type_id
          }))
        delete prmFeedbck['response'];
      };
      if (this.selectedPremType == 'DSFB') {
        prmFeedbck['sections'] = prmFeedbck['response'];
        delete prmFeedbck['description'];
        delete prmFeedbck['issue_type_id'];
        delete prmFeedbck['response'];
        prmFeedbck['sections'].forEach((scn) => {
          delete scn.loc_id;
          delete scn.org_id;
          delete scn.status;
          delete scn.created_at;
          delete scn.created_by;
          delete scn.updated_at;
          delete scn.updated_by;
          delete scn.section_name;
          delete scn.created_by_id;
          delete scn.updated_by_id;
          delete scn.section_description;
          scn['questions'].forEach((qstn) => {
            delete qstn['loc_id'];
            delete qstn['org_id'];
            delete qstn['status'];
            delete qstn['created_at'];
            delete qstn['created_by'];
            delete qstn['updated_at'];
            delete qstn['updated_by'];
            delete qstn['is_evidence'];
            delete qstn['options_json'];
            delete qstn['created_by_id'];
            delete qstn['question_text'];
            delete qstn['question_type'];
            delete qstn['updated_by_id'];
            delete qstn['is_not_applicable'];
            delete qstn['is_required'];
          });
        })
      };
      let prFdbckCfrm = await this._hqms.showConfirmMessage();
      if (prFdbckCfrm) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnPremFeedbckApi", prmFeedbck);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: 'feedbc',
            severity: 'success',
            summary: 'PREM Feedback',
            detail: saveResult.message,
          });
          this.onClearClick();
          this.router.navigateByUrl('/prem-daily-feedbacks');
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: 'feedbc',
            severity: 'warn',
            summary: 'PREM Feedback',
            detail: saveResult.message,
          });
        }
      };
    } catch (e) {
    }
  }

  onClearClick() {
    this.premFeedbck = {
      "action": "I",
      "is_active": true,
      "prem_feedback_id": null,
      "patient_id": null,
      "prem_type_id": null,
      "department_id": null,
      "issue_type_id": null,
      "description": null,
      "response": [],
      "is_appreciation": false,
      "appreciation_desc": null,
      "is_suggestions": false,
      "suggestions_desc": null,
      "is_compliance": false,
      "compliance_desc": null,
    };
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
  }

  goBack(): void {
    this.router.navigateByUrl('/prem-daily-feedbacks');
  }
}

