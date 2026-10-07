import { Component, QueryList, signal, ViewChildren, OnInit, inject } from '@angular/core';
import { HqmsService } from '../../../services/hqms.service';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Validations } from '../../../validations';
import { SharedModule } from '../../../shared/shared.module';
@Component({
  selector: 'app-category-master-add',
  imports: [FormsModule, SharedModule],
  templateUrl: './category-master-add.component.html',
})
export class CategoryMasterAddComponent implements OnInit {
  private validations = inject(Validations);
  public router = inject(Router);
  readonly FORM_NAME = 'CATAGORYMASTRS';
  public pageMode = 'NEW';
  public catMstr: any = JSON.stringify({
    "action": "I", //INSERT
    "category_id": null,
    "category_name": null,
    "catgegory_short_code": null,
    "description": null,
    "is_active": true
  });
  public categoryMaster: any = signal({ ...JSON.parse(this.catMstr) });
  public errorMsg: any = {
    category_name: '', catgegory_short_code: '', description: '',
  };

  constructor(private location: Location, public _hqms: HqmsService, ) { }

  goBack(): void {
    this.location.back();
  }

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.categoryMaster()[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
  }

  async ngOnInit() {
    let state = history.state;
    if (state ?.data) {
      this.pageMode = state['data']['mode'];
      if (this.pageMode != 'NEW') {
        await this.editCatMstr(state['data']['id'])
      };
    }
  }

  async editCatMstr(category_id: any) {
    try {
      let getCatMstrInfo: any = await this._hqms.customGetApiCall('GET', 'fnKpiCategoryApi',
        {
          "category_id": category_id
        });
      if (getCatMstrInfo.status == 200) {
        let editInfo = getCatMstrInfo['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.categoryMaster.set({
            "action": "U",
            "category_id": editInfo['category_id'],
            "category_name": editInfo['category_name'],
            "catgegory_short_code": editInfo['catgegory_short_code'],
            "description": editInfo['description'],
            "is_active": editInfo['is_active'],
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
          key: 'Category Master',
          severity: 'warn',
          summary: 'Category Master',
          detail: 'Check the errors',
        });
        return;
      };
      let gePrvdr = JSON.parse(JSON.stringify(this.categoryMaster()));
      let confirmAssessment = await this._hqms.showConfirmMessage();
      if (confirmAssessment) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnKpiCategoryApi", gePrvdr);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: 'categoryMaster',
            severity: 'success',
            summary: 'Category Master',
            detail: saveResult.message,
          });
          this.onClearClick();
          this.router.navigateByUrl('/category-master-dashboard');
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: 'categoryMaster',
            severity: 'warn',
            summary: 'Category Master',
            detail: saveResult.message,
          });
        }
      };
    } catch (e) {
    }
  }

  onClearClick() {
    this.categoryMaster.set({ ...JSON.parse(this.catMstr) });
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
  }
}
