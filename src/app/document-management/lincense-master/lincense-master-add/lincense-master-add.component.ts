import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
interface createLicenseMaster {
  "action": any,
  "license_master_id": any,
  "license_name": any,
  "description": any,
  "category_type_id": any,
  "category_name": any,
  "renewal_frequency_months": any,
  "license_criteria": any,
  "is_active": boolean,
  "criteriaName": string
};
import { SelectModule } from 'primeng/select';
import { SharedModule } from '../../../shared/shared.module';
import { HqmsService } from '../../../services/hqms.service';
import { Validations } from '../../../validations';

@Component({
  selector: 'app-lincense-master-add',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, SharedModule],
  templateUrl: './lincense-master-add.component.html',
  styleUrl: './lincense-master-add.component.scss',
})
export class LincenseMasterAddComponent implements OnInit {
  private validations = inject(Validations);
  readonly FORM_NAME = 'LicenseMasterAddForm';
  public router = inject(Router);
  public pageMode = "NEW";
  public attachedFiles: any = [];

  public errorMsg: any = {
    license_name: '',
    category_type_id: '',
    renewal_frequency_months: '',
    description: '',
    criteriaName:''
  };
  public categoryTypeList = [];

  public licenseMasterr: any = JSON.stringify({
    "action": "I",
    "license_master_id": null,
    "license_name": null,
    "description": null,
    "category_type_id": null,
    "category_name": null,
    "renewal_frequency_months": null,
    "license_criteria": [],
    "is_active": true,
    "criteriaName": null,
  });
  public createLicenseMaster: any = signal<createLicenseMaster>({ ...JSON.parse(this.licenseMasterr) });

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.createLicenseMaster()[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  constructor(private location: Location, public _hqms: HqmsService, private activatedRoute: ActivatedRoute) { }

  async ngOnInit() {
    try {
      let getCategoryTypeList: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "LICENSECATGRY" });
      if (getCategoryTypeList.status == 200) {
        this.categoryTypeList = getCategoryTypeList.data.entities.LICENSECATGRY.values.map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id
        }))
      };

      let state = history.state;
      this.pageMode = state['data']['mode'];
      if (this.pageMode != 'NEW') {
        await this.editlicenseMaster(state['data']['id'])
      };
    } catch (e) { };
  }
  public activeCnt: number = 0;
  async editlicenseMaster(licenseMasterId: any) {
    try {
      let getLicenseMasterInfo: any = await this._hqms.customGetApiCall('GET', 'fnLicenseMasterApi',
        {
          "action": "U",
          "license_master_id": licenseMasterId
        });
      if (getLicenseMasterInfo.status == 200) {
        let editInfo = getLicenseMasterInfo['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.createLicenseMaster.set({
            "action": "U",
            "license_master_id": editInfo['license_master_id'],
            "license_name": editInfo['license_name'],
            "criteriaName": editInfo['criteriaName'],
            "description": editInfo['description'],
            "category_type_id": editInfo['category_type_id'],
            "category_name": editInfo['category_name'],
            "renewal_frequency_months": editInfo['renewal_frequency_months'],
            "license_criteria": editInfo['license_criteria'].map((lc, index: number) => ({ ...lc, is_edit_click: false,
            is_active : editInfo['is_active'] ? lc.is_active : true
            })),
            "is_active": editInfo['is_active']
          });
          this.activeCnt = editInfo['license_criteria'].filter((f) => editInfo['is_active'] ? f.is_active : true).length;
        }
      };
    } catch (e) {
    };
  }

  async onSubmitClick() {
    try {
      Object.keys(this.errorMsg).forEach((ctrl) => this.onGetErrorMsgs(ctrl));
      let isValid = this._hqms.showErrorSummary(this.errorMsg);
      if (isValid) {
        this._hqms.hqmsToasterService({
          key: 'license',
          severity: 'warn',
          summary: 'License Master',
          detail: 'Check the errors',
        });
        return;
      };
      let getCrt = JSON.parse(JSON.stringify(this.createLicenseMaster()));
      if (getCrt.license_criteria == 0) {
        this._hqms.hqmsToasterService({
          key: 'license',
          severity: 'warn',
          summary: 'License Master',
          detail: 'Atleast a license criteria is required',
        });
        return;
      };
      if (this.pageMode == 'NEW') {
        getCrt.license_criteria = getCrt.license_criteria.filter((actv: any) => actv.is_active == true);
      } else {
        getCrt.license_criteria = getCrt.license_criteria.filter((actv: any) =>
          actv.license_criteria_master_id != null && actv.is_active == true ||
          actv.license_criteria_master_id != null && actv.is_active == false ||
          actv.license_criteria_master_id == null && actv.is_active == true
        );
      }
      delete getCrt['criteriaName'];
      let formData = new FormData();
      this.attachedFiles.forEach((file: any, index: number) => {
        formData.append("file", file.fileContent, file.fileName);
      });
      formData.append("data", JSON.stringify(getCrt));
      let confirmLicenseMaster = await this._hqms.showConfirmMessage();
      if (confirmLicenseMaster) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnLicenseMasterApi", formData);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            severity: 'success',
            summary: 'License Master',
            detail: saveResult.message,
          });
          this.onClearClick();
          this.router.navigateByUrl('/license-master-dashboard');
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            severity: 'warn',
            summary: 'License Master',
            detail: saveResult.message,
          });
        }
      };
    } catch (e) {
    }
  }

  onClearClick() {
    this.activeCnt = 0;
    this.createLicenseMaster.set({ ...JSON.parse(this.licenseMasterr) });
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
  }

  goBack(): void {
    this.router.navigateByUrl('/license-master-dashboard');
  }

  onCriteriaAdd() {
    let writtenCrtieria: any = (this.createLicenseMaster().criteriaName || '').trim();
    if (writtenCrtieria == '') { return; };
    writtenCrtieria = JSON.parse(JSON.stringify(writtenCrtieria));
    this.createLicenseMaster().license_criteria.push(
      {
        "license_criteria_master_id": null,
        "criteria_name": writtenCrtieria,
        "is_active": true,
        "is_edit_click": false,
      }
    );
    this.createLicenseMaster().criteriaName = "";
    this.activeCnt = this.createLicenseMaster().license_criteria.filter((c) => c.is_active == true).length;
  }

  removeAddedItem(licence, index: any) {
    if (this.pageMode == 'NEW') {
      this.createLicenseMaster().license_criteria.splice(index, 1);
    } else {
      licence.is_active = false;
    };
    this.activeCnt = this.createLicenseMaster().license_criteria.length
  }


  editItem(lcnsCtrl: any, addIndex) {
    lcnsCtrl.criteria_name = lcnsCtrl.criteria_name.trim();
    lcnsCtrl.is_edit_click = !lcnsCtrl.is_edit_click;
    this.createLicenseMaster().license_criteria.forEach((el, index: number) => {
      if (index !== addIndex) {
        el.is_edit_click = false
      }
    }
    )
  }
}

