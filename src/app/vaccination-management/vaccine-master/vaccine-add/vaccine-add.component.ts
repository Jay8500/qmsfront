import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HqmsService } from '../../../services/hqms.service';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { SharedModule } from '../../../shared/shared.module';
import { Validations } from '../../../validations';
import { VaccinationAccessService } from '../../vaccination-access.service';
@Component({
  selector: 'app-vaccine-add',
  imports: [FormsModule, CommonModule, SharedModule, SelectModule, MultiSelectModule],
  templateUrl: './vaccine-add.component.html',
  styleUrl: '../../vaccination-forms.scss'
})
export class VaccineAddComponent implements OnInit {
  private validations = inject(Validations);
  public access = inject(VaccinationAccessService).access('vaccine-master-dashboard');
  public errorMsg: any = {
    vaccine_name: '',
    manufacture_name: '',
  };
  public router = inject(Router);
  readonly FORM_NAME = 'VaccinationMasterForm';
  public routeList: any = [];
  public dosageList: any = [];
  public dosageUnitList: any = [];
  public recurrenceList: any = [];
  public gapList: any = [];
  public ageGrpList: any = [];
  public depOrRolesList: any = [];
  public departmentList: any = [];
  public roleList: any = [];
  public pageMode: string = 'NEW';
  public createVaccine: any = {
    "action": "I",
    "vaccine_id": null,
    "vaccine_name": null,
    "manufacturer_master_id": null,
    "manufacture_name": null,
    "vaccine_cd": null,
    "manufacture_cd": null,
    "is_active": true,
    "gap_days_error": null,
    "configurations": []
  };
  public temporaryCfng: any = [];
  public clearVccne: any = JSON.stringify(this.createVaccine);

  onGetErrorMsgs(ctrl: any, item?: any) {
    if (item) {
      const value = (ctrl == 'department' || ctrl == 'role') ? item.target_source_id : item[ctrl];
      const result = this.validations.validateField(this.FORM_NAME, ctrl, value);
      item[ctrl + '_error'] = result?.message || '';
    } else {
      const result = this.validations.validateField(this.FORM_NAME, ctrl, this.createVaccine[ctrl]);
      this.errorMsg[ctrl] = result?.message || '';
    }
  }

  constructor(private location: Location, public _hqms: HqmsService) { }

  // Submit is allowed for NEW with access_add and for EDIT with access_mod.
  canSave(): boolean {
    if (this.pageMode == 'VIEW') return false;
    return this.pageMode == 'NEW' ? this.access().access_add : this.access().access_mod;
  }

  async ngOnInit() {
    try {
      let info: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "ROUTE| UNIT| DOSAGE| GAPDAYS| AGEGROUP| RECURRENCE| VACINAPLCTYPE| DOSAGECONFIG" });
      if (info.status == 200) {
        this.routeList = info.data['entities']['ROUTE']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id
        }));
        this.dosageUnitList = info.data['entities']['UNIT']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id
        }));
        this.dosageList = info.data['entities']['DOSAGE']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id
        }));
        this.gapList = info.data['entities']['GAPDAYS']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id
        }));
        this.ageGrpList = info.data['entities']['AGEGROUP']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id
        }));
        this.recurrenceList = info.data['entities']['RECURRENCE']['values'].map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id
        }));
        this.depOrRolesList = info.data['entities']['VACINAPLCTYPE']['values'].map((ele: any, index: number) => ({
          ind: index + 1,
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code
        }));
        // One block per dose sequence configured in the DOSAGECONFIG entity (SRS: up to 4 doses).
        let dosesInfo = info.data['entities']['DOSAGECONFIG']['values'].map((ele: any, index: number) => ({
          vaccine_det_id: null,
          "dosage_sequence": ele.entity_value_id,
          "dosage_label": ele.display_value,
          "sequence": index + 1,
          "route_id": null,
          "dosage_value": null,
          "dosage_unit": null,
          "gap_days": index === 0 ? this.getFilteredGapsList(0)[0]?.['value'] ?? null : null,
          "age_group_id": null,
          "recurrence_interval": null,
          "target_id": null,
          "target_source_id": [],
          "is_mandatory": false,
          "allow_decisions": false,
          "reminder_days": null,
          "batch_no": null,
          "is_active": index === 0,
        }));
        this.createVaccine['configurations'] = dosesInfo;
        this.temporaryCfng = JSON.stringify(dosesInfo);
      };
      // Both lists are loaded up front so each dose can target Department or Role independently.
      await this.loadTargetLists();
      let state = history.state;
      this.pageMode = state?.['data']?.['mode'] || 'NEW';
      if (this.pageMode != 'NEW') {
        await this.editVaccine(state['data']['id'])
      };
    } catch (e) { };
  }

  async loadTargetLists() {
    try {
      let depts: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet', { "flag": "DEPARTMENT" });
      if (depts.status == 200) {
        this.departmentList = depts.data.map((ele: any) => ({
          label: ele.department_name,
          value: ele.department_id,
        }));
      };
      let roles: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet', { "flag": "ROLE" });
      if (roles.status == 200) {
        this.roleList = roles.data.map((ele: any) => ({
          label: ele.role_name,
          value: ele.role_id,
        }));
      };
    } catch (e) { }
  }

  // 'DEPARTMENT' | 'ROLE' | null for one dose, from its selected target_id.
  targetCode(dose: any): string | null {
    return this.depOrRolesList.find((fl: any) => fl.value === dose.target_id)?.value_code || null;
  }

  onTargetChange(dose: any) {
    dose.target_source_id = [];
    dose.department_error = '';
    dose.role_error = '';
  }

  async editVaccine(id: any) {
    try {
      let vccne: any = await this._hqms.customGetApiCall('GET', 'vaccineMasterApi',
        {
          "vaccine_id": id
        });
      if (vccne.status == 200) {
        let editInfo = vccne['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.createVaccine['action'] = 'U';
          this.createVaccine['vaccine_id'] = editInfo['vaccine_id'];
          this.createVaccine['vaccine_name'] = editInfo['vaccine_name'];
          this.createVaccine['manufacturer_master_id'] = editInfo['manufacturer_master_id'];
          this.createVaccine['manufacture_name'] = editInfo['manufacture_name'];
          this.createVaccine['vaccine_cd'] = editInfo['vaccine_cd'];
          this.createVaccine['manufacture_cd'] = editInfo['manufacture_cd'];
          this.createVaccine['is_active'] = editInfo['is_active'];
          for (const ele of this.createVaccine['configurations']) {
            let saved = (editInfo['configurations'] || []).find((ed: any) => ed.dosage_sequence_id == ele.dosage_sequence);
            if (saved) {
              ele["vaccine_det_id"] = saved['vaccine_det_id'];
              ele["route_id"] = saved['route_id'];
              ele["dosage_value"] = saved['dosage_value_id'];
              ele["dosage_unit"] = saved['dosage_unit_id'];
              ele["gap_days"] = saved['gap_days_id'];
              ele["age_group_id"] = saved['age_group_id'];
              ele["recurrence_interval"] = saved['recurrence_interval_id'];
              ele["target_id"] = saved['target_id'];
              ele["target_source_id"] = saved['target_source_id'] || [];
              ele["is_mandatory"] = saved['is_mandatory'];
              ele["allow_decisions"] = saved['allow_decision'];
              ele["is_active"] = true;
              ele["reminder_days"] = saved['reminder_days'];
              ele["batch_no"] = saved['batch_no'];
            };
          };
        };
      };
    } catch (e) {
    };
  }

  goBack(): void {
    this.location.back();
  }

  onAddDose(dosePrp: any) {
    let nextDose = this.createVaccine.configurations.find((d: any) => !d.is_active);
    if (nextDose) {
      nextDose.is_active = true;
      nextDose["route_id"] = null;
      nextDose["batch_no"] = null;
      nextDose["dosage_value"] = null;
      nextDose["dosage_unit"] = null;
      nextDose["recurrence_interval"] = null;
      nextDose["age_group_id"] = null;
      nextDose["reminder_days"] = null;
      nextDose["target_source_id"] = [];
      nextDose["target_id"] = null;
      nextDose["is_mandatory"] = false;
      nextDose["allow_decisions"] = false;
      nextDose["gap_days"] = null;
    }
  }

  onDeletDose(dosePrp: any, index: number) {
    if (index > 0) {
      let dose = this.createVaccine.configurations[index];
      dose.batch_no = null;
      dose.route_id = null;
      dose.dosage_value = null;
      dose.dosage_unit = null;
      dose.recurrence_interval = null;
      dose.age_group_id = null;
      dose.reminder_days = null;
      dose.gap_days = null;
      dose.target_id = null;
      dose.target_source_id = [];
      dose.is_mandatory = false;
      dose.allow_decisions = false;
      dose.is_active = false;
    }
  }

  async onSubmitClick() {
    try {
      if (!this.canSave()) return;
      Object.keys(this.errorMsg).forEach((ctrl) => this.onGetErrorMsgs(ctrl));
      let isValid = this._hqms.showErrorSummary(this.errorMsg);
      let hasConfigErrors = false;
      const doseFields = ['batch_no', 'route_id', 'dosage_value', 'dosage_unit', 'gap_days', 'recurrence_interval', 'age_group_id', 'reminder_days'];
      this.createVaccine.configurations.forEach((item: any) => {
        if (!item.is_active) return;
        doseFields.forEach((ctrl) => this.onGetErrorMsgs(ctrl, item));
        item['target_id_error'] = item.target_id == null ? 'Department or Role is required.' : '';
        item['department_error'] = '';
        item['role_error'] = '';
        let code = this.targetCode(item);
        if (code === 'DEPARTMENT') this.onGetErrorMsgs('department', item);
        if (code === 'ROLE') this.onGetErrorMsgs('role', item);
        [...doseFields, 'target_id', 'department', 'role'].forEach((ctrl) => {
          if (item[ctrl + '_error']) hasConfigErrors = true;
        });
      });
      if (isValid || hasConfigErrors) {
        this._hqms.hqmsToasterService({
          key: 'vac',
          severity: 'warn',
          summary: 'Vaccine',
          detail: 'Check the errors',
        });
        return;
      };
      let getVaccine = JSON.parse(JSON.stringify(this.createVaccine));
      getVaccine.configurations = getVaccine.configurations.filter((fl: any) => fl.is_active == true);
      if (getVaccine.configurations.length == 0) {
        this._hqms.hqmsToasterService({
          key: 'vac',
          severity: 'warn',
          summary: 'Vaccine',
          detail: 'Configuration is required.',
        });
        return;
      };
      let cnfrmVaccine = await this._hqms.showConfirmMessage();
      if (cnfrmVaccine) {
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "vaccineMasterApi", getVaccine);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            key: 'vac',
            severity: 'success',
            summary: 'Vaccine',
            detail: saveResult.message,
          });
          this.onClearClick();
          this.router.navigateByUrl('/vaccine-master-dashboard');
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            key: 'vac',
            severity: 'warn',
            summary: 'Vaccine',
            detail: saveResult.message,
          });
        }
      };
    } catch (e) {
    }
  }

  onClearClick() {
    this.createVaccine = JSON.parse(this.clearVccne);
    this.createVaccine.configurations = JSON.parse(this.temporaryCfng);
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
  }

  // The add (+) icon shows on the last active dose while more dose sequences are available.
  isLastActiveVisible(currentIndex: number): boolean {
    let activeConfigs = this.createVaccine.configurations.filter(((c: any) => c.is_active));
    let lastActiveItem = activeConfigs[activeConfigs.length - 1];
    let isLast = this.createVaccine.configurations[currentIndex].dosage_sequence === lastActiveItem.dosage_sequence;
    let canAddmore = activeConfigs.length < this.createVaccine.configurations.length;
    return isLast && canAddmore;
  }

  getFilteredGapsList(index: number) {
    if (index === 0) {
      return this.gapList.filter((g: any) => parseInt(g.label) === 0);
    } else {
      return this.gapList.filter((g: any) => parseInt(g.label) > 0);
    }
  }
}
