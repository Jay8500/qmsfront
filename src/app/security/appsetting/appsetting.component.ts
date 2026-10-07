import { Component, QueryList, signal, ViewChildren, OnInit, inject, computed } from '@angular/core';
import { HqmsService } from '../../services/hqms.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import {Validations} from '../../validations'
@Component({
  selector: 'app-appsetting',
  imports: [FormsModule,SharedModule],
  templateUrl: './appsetting.component.html',
  styleUrl: './appsetting.component.scss',
})
export class AppsettingComponent implements OnInit {
  public providerTypeList: any = [];
  public FORM_NAME="APPSETTINGS"
  public router = inject(Router);
  public pageMode = 'NEW';
  public initialAppStngs: any = JSON.stringify({
    action: "I", //INSERT
    application_setting_id: null,
    date_format_id: null,
    idle_timeout_minutes_id: null,
    is_active: true
  });
  public validations=inject(Validations)
  public appStngs: any = { ...JSON.parse(this.initialAppStngs) };
  public errorMsg:any = {
    date_format_id:"",
    idle_timeout_minutes_id:"",
  }
  public dateFormatsList:any = [];
  public idleTimeList:any = [];
  constructor(private location: Location, public _hqms: HqmsService) { }

  goBack(): void {
    this.location.back();
  }

  onGetErrorMsgs(ctrl:any){
    let result=this.validations.validateField(
      this.FORM_NAME,
      ctrl,
      this.appStngs[ctrl]
    );
    this.errorMsg[ctrl]=result?.message || ""
  }

  async ngOnInit() {
       let info: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
      { "entity_codes": "APP_DATE_FORMATS|IDLETIMEOUT" });
     if (info.status == 200) {
      this.dateFormatsList = info.data['entities']['APP_DATE_FORMATS']?.['values'].map((ele: any) => ({
        label: ele.display_value,
        value: ele.entity_value_id,
        value_code: ele.value_code
      }));
      this.idleTimeList = info.data['entities']['IDLETIMEOUT']?.['values'].map((ele: any) => ({
        label: ele.display_value,
        value: ele.entity_value_id,
        value_code: ele.value_code
      }));

    };
    await this.getAppSettings();
  }

  async getAppSettings() {
    try {
      let info: any = await this._hqms.customGetApiCall('GET', 'fnAppStngsApi', {
        action : "A"
      });
      if (info.status == 200) {
        if(info.data.length > 0){

          this.pageMode = 'EDIT';
          this.appStngs['action'] = 'U';
          this.appStngs['application_setting_id'] = info['data'][0]['application_setting_id'];
          this.appStngs['date_format_id']= info['data'][0]['date_format_id'];
          this.appStngs['idle_timeout_minutes_id']= info['data'][0]['idle_timeout_minutes_id'];
          this.appStngs['is_active']= info['data'][0]['is_active'];
        }
      };
    } catch (e) { };
  }

  async onSubmitClick() {
    try {
      Object.keys(this.errorMsg).forEach((ctrl)=>{this.onGetErrorMsgs(ctrl)});
      let isValid =  this._hqms.showErrorSummary(this.errorMsg);
      if(isValid){
         this._hqms.hqmsToasterService({
          key: 'rle',
          severity: 'warn',
          summary: 'Application Settings',
          detail: 'Check the errors',
        });
         return
      };
      let appStngs = JSON.parse(JSON.stringify(this.appStngs));
      let cnfrmStngs = await this._hqms.showConfirmMessage();
      if (cnfrmStngs) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnAppStngsApi", appStngs);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: 'stngs',
            severity: 'success',
            summary: 'Application Setting',
            detail: saveResult.message,
          });
          // the saved date format applies at once to every appDate on the screens (no new login needed)
          this.onSetFormat(null);
         await this.ngOnInit();
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: 'stngs',
            severity: 'warn',
            summary: 'Application Setting',
            detail: saveResult.message,
          });
        }
      };
    } catch (e) {
    }
  }
  // onClear(){
  //   this.appStngs.set(JSON.parse{...this.errorMsg})
  // }

  onSetFormat(event:any){
   let getValue = this.dateFormatsList.filter(f => f.value === this.appStngs['date_format_id'])
   if(getValue.length > 0){
      this._hqms.setDateFormat(getValue[0]['value_code'])
   };
  }
}