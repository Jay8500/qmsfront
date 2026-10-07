import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { HqmsService } from '../../../services/hqms.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SharedModule } from '../../../shared/shared.module';
import { Validations } from '../../../validations';
@Component({
  selector: 'app-provider-master-add',
  imports: [CommonModule, FormsModule, SelectModule, SharedModule],
  templateUrl: './provider-master-add.component.html',
  styleUrl: './provider-master-add.component.scss',
})
export class ProviderMasterAddComponent implements OnInit {
  private validations = inject(Validations);
  public errorMsg: any = {
    provider_name: '',
    provider_type_id: '',
    contact_person: '',
    mobile_no1: '',
    email_id: '',
    web_url: '',
    description: '',
    address:''
  };
  public providerTypeList: any = [];
  public router = inject(Router);
  readonly FORM_NAME = 'PROVIDERS';
  public pageMode = 'NEW';
  public crtAdt: any = JSON.stringify({
    "action": "I", //INSERT
    "provider_id": null,
    "provider_name": null,
    "description": null,
    "provider_type_id": null,
    "provider_type": null,
    "contact_person": null,
    "mobile_no1": null,
    "mobile_no2": null,
    "email_id": null,
    "web_url": null,
    "address": null,
    "is_active": true
  });
  public providerMaster: any = signal({ ...JSON.parse(this.crtAdt) });
  private fieldValidity = signal<Record<any, boolean>>({});

  constructor(private location: Location, public _hqms: HqmsService, ) { }

  goBack(): void {
    this.location.back();
  }

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.providerMaster()[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  async ngOnInit() {
    let adtCat: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
      { "entity_codes": "PVDRTYPE" });
    if (adtCat.status == 200) {
      this.providerTypeList = adtCat.data.entities.PVDRTYPE.values.map((ele: any) => ({
        label: ele.display_value,
        value: ele.entity_value_id
      }))
    };
    let state = history.state;
    if (state ?.data) {
      this.pageMode = state['data']['mode'];
      if (this.pageMode != 'NEW') {
        await this.editAudit(state['data']['id'])
      };
    }
  }

  async editAudit(provider_id: any) {
    try {
      let getAuditInfo: any = await this._hqms.customGetApiCall('GET', 'fnProviderApi',
        {
          "provider_id": provider_id
        });
      if (getAuditInfo.status == 200) {
        let editInfo = getAuditInfo['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.providerMaster.set({
            "action": "U",
            "provider_id": editInfo['provider_id'],
            "provider_name": editInfo['provider_name'],
            "provider_type_id": editInfo['provider_type_id'],
            "contact_person": editInfo['contact_person'],
            "mobile_no1": editInfo['mobile_no1'],
            "email_id": editInfo['email_id'],
            "is_active": editInfo['is_active'],
            "web_url": editInfo['web_url'],
            "description": editInfo['description'],
            "address": editInfo['address']
          });
        };
      };
    } catch (e) { };
  }

  async onSubmitClick() {
    try {
      Object.keys(this.errorMsg).forEach((ctrl) => this.onGetErrorMsgs(ctrl));
      let isValid = this._hqms.showErrorSummary(this.errorMsg);
      if (isValid) {
        this._hqms.hqmsToasterService({
          key: 'Provider',
          severity: 'warn',
          summary: 'Provider',
          detail: 'Check the errors',
        });
        return;
      };
      let gePrvdr = JSON.parse(JSON.stringify(this.providerMaster()));
      let confirmAssessment = await this._hqms.showConfirmMessage();
      if (confirmAssessment) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnProviderApi", gePrvdr);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: 'provider',
            severity: 'success',
            summary: 'Provider',
            detail: saveResult.message,
          });
          this.onClearClick();
          this.router.navigateByUrl('/provider-master-dashboard');
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: 'provider',
            severity: 'warn',
            summary: 'Provider',
            detail: saveResult.message,
          });
        }
      };
    } catch (e) {
    }
  }

  onClearClick() {
    this.providerMaster.set({ ...JSON.parse(this.crtAdt) });
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
  }

}

