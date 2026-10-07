import { Component, signal, inject, OnInit, ViewChild, computed } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { Validations } from '../../../validations';
@Component({
    selector: 'app-care-continuity-add',
    imports: [CommonModule, FormsModule, FileUploadModule, SharedModule, SelectModule],
    templateUrl: './care-continuity-add.component.html',
    styleUrl: './care-continuity-add.component.scss'
})
export class CareContinuityAddComponent implements OnInit{
  @ViewChild('preAssess') preAssess!: FileUpload;
  private validations = inject(Validations);
  public attachedFiles: any = [];
  readonly FORM_NAME = 'careContinuityForm';
  public router = inject(Router);
  public errorMsg: any = {
    procedure_id: '',
    surgery_date: '',
    discharge_date: '',
    next_checkup_date: '',
    visited_dt: '',
  };
  public surgeryList:any = [];
  public ccMaster:any = {
          "action": "I",
          "treatment_period": "I",
           "uhid": null,
            "loc_id": null,
            "org_id":null,
            "room_no": null,
            "sections": [],
            "diagnosis": null,
            "doctor_id":null,
            "is_active": true,
            "tenant_id":null,
            "created_at":null,
            "created_by": null,
            "patient_id": null,
            "updated_at": null,
            "updated_by": null,
            "patient_name": null,
            "procedure_id": null,
            "prom_type_id": null,
            "surgery_date": null,
            "created_by_id": null,
            "department_id": null,
            "total_row_cnt": null,
            "updated_by_id": null,
            "discharge_date": null,
            "admitted_unit_id": null,
            "prom_feedback_id":null,
            "treatment_end_date": null,
            "care_continuity_req": false,
            "treatment_start_date":null,
            "status":null,
            "phone_no" : null,
            "admitted_unit" : null,
            "doctor_name" : null,
            "next_checkup_date" : null,
            "visited_dt" : null,
            "complication" : null,
  };

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.ccMaster[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  constructor(private location: Location,
    public _hqms: HqmsService,
    private activatedRoute: ActivatedRoute
  ) { }

  goBack(): void {
    this.router.navigateByUrl('/prom-dashboard');
  }

  async ngOnInit() {
    try {
      let getSrvrDt = await this._hqms.getServerDate('DATE');
      let surgeryList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        { "flag": "PM" });
      if (surgeryList.status == 200) {
        this.surgeryList = surgeryList.data.map((ele: any) => ({
          label: ele.procedure_name,
          value: ele.procedure_id,
          code: ele.procedure_code,
        }))
      };
      let state = history.state;
      await this.careContinuityGet(state['data']['id']);
    } catch (e) { };
  }

  async careContinuityGet(promIf) {
    try{
      let info: any = await this._hqms.customGetApiCall('GET', 'fnCareContinuityApi',
      { "prom_feedback_id": promIf });
      if (info.status == 200) {
        this.ccMaster = {...info.data[0]}
      }
    }catch(e){};
  }

  async onSubmitClick(){
   try{
      Object.keys(this.errorMsg).forEach((ctrl) => this.onGetErrorMsgs(ctrl));
      let isValid = this._hqms.showErrorSummary(this.errorMsg);
      if (isValid) {
        this._hqms.hqmsToasterService({
          key: 'newAudit',
          severity: 'warn',
          summary: 'Clinical Pathway Audits',
          detail: 'Check the errors',
        });
        return;
      };
      let ccAdd = JSON.parse(JSON.stringify(this.ccMaster));
      ccAdd['action'] = 'I';
      let cnfrm = await this._hqms.showConfirmMessage();
      if (cnfrm) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST","fnCareContinuityApi", ccAdd);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: 'cc',
            severity: 'success',
            summary: 'Care Continuity',
            detail: saveResult.message,
          });
           this.router.navigateByUrl('/prom-dashboard');
           this.onClearClick();
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: 'cc',
            severity: 'warn',
            summary: 'Care Continuity',
            detail: saveResult.message,
          });
        }
      };
   }catch(e){}
  }

  onClearClick(){
   this.ccMaster = {
          "action": "I",
           "uhid": null,
            "loc_id": null,
            "org_id":null,
            "room_no": null,
            "sections": [],
            "diagnosis": null,
            "doctor_id":null,
            "is_active": true,
            "tenant_id":null,
            "created_at":null,
            "created_by": null,
            "patient_id": null,
            "updated_at": null,
            "updated_by": null,
            "patient_name": null,
            "procedure_id": null,
            "prom_type_id": null,
            "surgery_date": null,
            "created_by_id": null,
            "department_id": null,
            "total_row_cnt": null,
            "updated_by_id": null,
            "discharge_date": null,
            "admitted_unit_id": null,
            "prom_feedback_id":null,
            "treatment_end_date": null,
            "care_continuity_req": false,
            "treatment_start_date":null,
            "status":null,
            "phone_no" : null,
            "admitted_unit" : null,
            "doctor_name" : null,
  };
  Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
  }

  selectAnswer(qstn:any, ctrl:string){
    qstn.answer_text = ctrl;
    qstn.is_required = false;
  }
}
