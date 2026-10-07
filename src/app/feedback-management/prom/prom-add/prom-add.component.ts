import { Component, inject, OnInit, SecurityContext } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { Validations } from '../../../validations';
@Component({
  selector: 'app-prom-add',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, SharedModule],
  templateUrl: './prom-add.component.html',
  styleUrl: './prom-add.component.scss'
})
export class PromAddComponent implements OnInit {
  readonly FORM_NAME = 'NewTrainingForm';
  public router: any = inject(Router);
  public validation=inject(Validations)
  public uhidList: any = [];
  public adminUnitList: any = [];
  public doctorList: any = [];
  public promTypeList: any = [];
  public promScoreList: any = [];
  public promEntry: any = {
    "action": "I",
    "patient_id": null,
    "age": null,
    "gender": null,
    "phone_no": null,
    "address": null,
    "prom_type_id": null,
    "admitted_unit_id": null,
    "doctor_id": null,
    "treatment_start_date": null,
    "treatment_end_date": null,
    "diagnosis": null,
    "room_no": null,
    "care_continuity_req": 'N',
    "status": null,
    "sections": [],
    "conduct_status": null
  };
  public errMsg:any={
    patient_id:'',
    prom_type_id:'',
    admitted_unit_id:'',
    doctor_id:"",
    diagnosis:'',
    treatment_start_date:''
  }

  onGetErrMsg(ctrl:any){
    let res=this.validation.validateField(
      this.FORM_NAME,ctrl,this.promEntry[ctrl]
    );
    this.errMsg[ctrl]=res?.message||''
  }

  constructor(private location: Location,
    public _hqms: HqmsService,
    private activatedRoute: ActivatedRoute
  ) { }

  async onPatientChange() {
    let fltrRc = this.uhidList.filter((c) => c.value === this.promEntry.patient_id);
    if (fltrRc.length > 0) {
      this.promEntry.gender = fltrRc[0]['gender'];
      this.promEntry.age = fltrRc[0]['age'];
      this.promEntry.phone_no = fltrRc[0]['phone_no'];
      this.promEntry.address = fltrRc[0]['address'];
    };
  }

  async onPromTypeChange() {
    await this.getTemplate(this.promEntry.prom_type_id);
  }

  async getTemplate(value: string) {
    try {
      let tmplte: any = await this._hqms.customGetApiCall('GET', 'fnPromMasterApi',
        {
          "action": 'e',
          "prom_type_id": value,
        });
      if (tmplte.status == 200) {
        this.promEntry['sections'] = tmplte.data[0]['sections'].map((sc: any) => ({
          ...sc, questions: sc.questions.map((qs: any) =>
            ({ ...qs, score: ((qs.score || '').toString() || '').toUpperCase(), score_type_id: (qs.score_type_id || null), score_code: (qs.score_code || null) }))
        }))
      };
    } catch (e) { };
  }

  goBack(): void {
    this.router.navigateByUrl('/prom-dashboard');
  }

  async ngOnInit() {
    try {
      let patientList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        { "flag": "PATIENT" });
      if (patientList.status == 200) {
        this.uhidList = patientList.data.map((ele: any) => ({
          label: ele.patient_name,
          value: ele.patient_id,
          gender: ele.gender,
          age: ele.age,
          phone_no: ele.phone_no,
          address: ele.address,
        }))
      };
      let dcInfo: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        { "flag": "DOCTOR" });
      if (dcInfo.status == 200) {
        this.doctorList = dcInfo.data.map((ele: any) => ({
          label: ele.doctor_name,
          value: ele.doctor_id,
        }))
      };
      let info: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "ADMITTEDUNIT | PROMTYPE | PROMSCORE" });
      if (info.status == 200) {
        this.adminUnitList = info.data['entities']['ADMITTEDUNIT']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id
        }))
        this.promTypeList = info.data['entities']['PROMTYPE']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id
        }))
        this.promScoreList = info.data['entities']['PROMSCORE']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id
        }))
      };
    } catch (e) {
    };
  }

  selectAnswer(qstn: any, ctrl: any) {
    qstn.score = ctrl['display_value'];
    qstn.score_type_id = ctrl['value'];
    qstn.score_code = ctrl['value_code'];
    qstn.is_required = false;
  }

  async onSubmitClick() {
    try {
      let getResponse: any = JSON.parse(JSON.stringify(this.promEntry));
      Object.keys(this.errMsg).forEach((ctrl:any)=>{this.onGetErrMsg(ctrl)})
      let isValid=this._hqms.showErrorSummary(this.errMsg);
      if (isValid) {
        this._hqms.hqmsToasterService({
          key: 'prem',
          severity: 'warn',
          summary: 'PREM Feedback',
          detail: 'Check the errors',
        });
        return;
      };
      getResponse.care_continuity_req = getResponse.care_continuity_req == 'Y' ? true : false;
      delete getResponse['age'];
      delete getResponse['gender'];
      delete getResponse['phone_no'];
      delete getResponse['address'];
      delete getResponse['department_id'];
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
      });
     
      let cnfrmProm = await this._hqms.showConfirmMessage();
      if (cnfrmProm) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnPromApi", getResponse);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: 'sc',
            severity: 'success',
            summary: 'PROM Feedback',
            detail: saveResult.message,
          });
          this.onClearClick();
          this.router.navigateByUrl('/prom-dashboard');
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: 'sc',
            severity: 'warn',
            summary: 'PROM Feedback',
            detail: saveResult.message,
          });
        }
      };
    } catch (e) {
    }
  }
  public clearErr = JSON.stringify(this.errMsg);

  onClearClick() {
    this.promEntry = {
      "action": "I",
      "patient_id": null,
      "age": null,
      "gender": null,
      "phone_no": null,
      "address": null,
      "prom_type_id": null,
      "admitted_unit_id": null,
      "doctor_id": null,
      "treatment_start_date": null,
      "treatment_end_date": null,
      "diagnosis": null,
      "room_no": null,
      "care_continuity_req": 'N',
      "status": null,
      "sections": [],
      "conduct_status": null
    };
    this.errMsg=JSON.stringify(this.clearErr)

  }
}
