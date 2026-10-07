import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { HqmsService } from '../../../services/hqms.service';
import { Validations } from '../../../validations';
import { VaccinationAccessService } from '../../vaccination-access.service';
@Component({
  selector: 'app-vaccine-schedule-add',
  standalone: true,
  imports: [CommonModule, SelectModule, FormsModule, SharedModule],
  templateUrl: './vaccine-schedule-add.component.html',
  styleUrl: '../../vaccination-forms.scss',
  providers: [DatePipe]
})
export class VaccineScheduleAddComponent implements OnInit {
  private validations = inject(Validations);
  public access = inject(VaccinationAccessService).access('vaccine-schedule-dashboard');
  readonly FORM_NAME = 'schVaccneSch';
  public router: any = inject(Router);
  public pageMode = "NEW";
  public minDateSetter: any = signal(null);
  public errorMsg: any = {
    campaign_name: '',
    vaccine_id: '',
    venue_id: '',
    start_date: '',
    end_date: '',
    capacity: '',
    target: '',
  };
  public aciveVaccinesList: any = [];
  public venuesList: any = [];
  public departmentList: any = [];
  public roleList: any = [];
  public schVaccine: any = {
    "action": "I",
    "vaccination_campaign_id": null,
    "campaign_name": null,
    "vaccine_id": null,
    "venue_id": null,
    "start_date": null,
    "end_date": null,
    "capacity": null,
    "dept_ids": [],
    "role_ids": [],
    "employee_ids": [],
    "is_active": true
  };
  public clearrSchVaccne = JSON.stringify(this.schVaccine);

  // Target Scope (SRS 2.2 v0.2): employees of the chosen departments, optionally narrowed by role.
  public employees = signal<any[]>([]);
  public employeeSearch = signal('');
  public selectedEmployees = signal<string[]>([]);
  public filteredEmployees = computed(() => {
    let text = this.employeeSearch().trim().toLowerCase();
    return this.employees().filter((emp) => !text
      || (emp.employee_name || '').toLowerCase().includes(text)
      || (emp.department_name || '').toLowerCase().includes(text));
  });
  // SRS 2.2 v0.2: warn (not block) when more employees are selected than the capacity.
  capacityExceeded(): boolean {
    let capacity = parseInt(this.schVaccine.capacity, 10);
    return capacity > 0 && this.selectedEmployees().length > capacity;
  }
  public loadingEmployees = false;

  constructor(public _hqms: HqmsService, public _datePipe: DatePipe) { }

  canSave(): boolean {
    if (this.pageMode == 'VIEW') return false;
    return this.pageMode == 'NEW' ? this.access().access_add : this.access().access_mod;
  }

  onGetErrorMsgs(ctrl: any) {
    const result = this.validations.validateField(this.FORM_NAME, ctrl, this.schVaccine[ctrl]);
    this.errorMsg[ctrl] = result?.message || '';
    if (!this.errorMsg[ctrl]) {
      if (ctrl == 'start_date') this.errorMsg[ctrl] = this.checkStartDate();
      if (ctrl == 'end_date') this.errorMsg[ctrl] = this.checkEndDate();
    }
  }

  // SRS 2.2: Vaccination Date cannot be in the past (new schedules).
  private checkStartDate(): string {
    if (this.pageMode != 'NEW' || !this.schVaccine.start_date || !this.minDateSetter()) return '';
    let start = this._datePipe.transform(this.schVaccine.start_date, 'yyyy-MM-dd') || '';
    let today = this._datePipe.transform(this.minDateSetter(), 'yyyy-MM-dd') || '';
    return start < today ? 'Vaccination Date cannot be in the past.' : '';
  }

  // SRS 2.2: To Time must follow From Time.
  private checkEndDate(): string {
    if (!this.schVaccine.start_date || !this.schVaccine.end_date) return '';
    return new Date(this.schVaccine.end_date) <= new Date(this.schVaccine.start_date)
      ? 'To Date & Time must be after From Date & Time.' : '';
  }

  async ngOnInit() {
    let getSrvrDt = await this._hqms.getServerDate('DATE');
    this.minDateSetter.set(getSrvrDt);
    let vccInfo: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
      {
        "flag": "VACCN_MASTR"
      });
    if (vccInfo.status == 200) {
      this.aciveVaccinesList = vccInfo.data.map((ele: any) => ({
        label: ele.vaccine_name,
        value: ele.vaccine_id
      }))
    };

    let venueInfo: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
      { "entity_codes": "VENUE" });
    if (venueInfo.status == 200) {
      this.venuesList = venueInfo.data.entities.VENUE.values.map((ele: any) => ({
        label: ele.display_value,
        value: ele.entity_value_id,
      }))
    };
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
    let state = history.state;
    this.pageMode = state?.['data']?.['mode'] || 'NEW';
    if (this.pageMode != 'NEW') {
      await this.editVccnSch(state['data']['id'])
    };
  }

  async editVccnSch(vaccinationCampaignId: any) {
    try {
      let info: any = await this._hqms.customGetApiCall('GET', 'schVaccine',
        {
          "vaccination_campaign_id": vaccinationCampaignId
        });
      if (info.status == 200) {
        let editInfo = info['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.schVaccine.action = "U";
          this.schVaccine.vaccination_campaign_id = editInfo.vaccination_campaign_id;
          this.schVaccine.campaign_name = editInfo.campaign_name;
          this.schVaccine.vaccine_id = editInfo.vaccine_id;
          this.schVaccine.venue_id = editInfo.venue_id;
          this.schVaccine.start_date = this.toInputDateTime(editInfo.start_date);
          this.schVaccine.end_date = this.toInputDateTime(editInfo.end_date);
          this.schVaccine.capacity = editInfo.capacity;
          this.schVaccine.is_active = editInfo.is_active;
          this.schVaccine.dept_ids = editInfo.dept_ids || [];
          this.schVaccine.role_ids = editInfo.role_ids || [];
          await this.loadEmployees();
          this.selectedEmployees.set(editInfo.employee_ids || []);
        }
      }
    } catch (e) {
    };
  }

  // datetime-local inputs need "yyyy-MM-ddTHH:mm".
  private toInputDateTime(value: any): any {
    if (!value) return null;
    let dt = new Date(value);
    return isNaN(dt.getTime()) ? value : this._datePipe.transform(dt, "yyyy-MM-dd'T'HH:mm");
  }

  async onScopeChange() {
    this.errorMsg['target'] = '';
    await this.loadEmployees();
    // Keep only selected employees that still belong to the chosen departments / roles.
    let allowed = new Set(this.employees().map((emp) => emp.employee_id));
    this.selectedEmployees.set(this.selectedEmployees().filter((id) => allowed.has(id)));
  }

  async loadEmployees() {
    this.loadingEmployees = true;
    try {
      let byId = new Map<string, any>();
      for (const deptId of this.schVaccine.dept_ids || []) {
        let info: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
          { "flag": "EMPLOYEE", "reference_type": "DEPT", "reference_type_id": deptId });
        if (info?.status == 200) {
          let deptName = this.departmentList.find((d: any) => d.value === deptId)?.label || '';
          info.data.forEach((emp: any) => byId.set(emp.employee_id, { ...emp, department_id: deptId, department_name: deptName }));
        }
      }
      if ((this.schVaccine.role_ids || []).length > 0) {
        let inRoles = new Set<string>();
        for (const roleId of this.schVaccine.role_ids) {
          let info: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
            { "flag": "EMPLOYEE", "reference_type": "ROLE", "reference_type_id": roleId });
          if (info?.status == 200) info.data.forEach((emp: any) => inRoles.add(emp.employee_id));
        }
        byId.forEach((_, id) => { if (!inRoles.has(id)) byId.delete(id); });
      }
      this.employees.set([...byId.values()].sort((a, b) => (a.employee_name || '').localeCompare(b.employee_name || '')));
    } catch (e) {
      this.employees.set([]);
    } finally {
      this.loadingEmployees = false;
    }
  }

  isSelected(emp: any): boolean {
    return this.selectedEmployees().includes(emp.employee_id);
  }

  toggleEmployee(emp: any, checked: boolean) {
    let ids = this.selectedEmployees().filter((id) => id !== emp.employee_id);
    if (checked) ids.push(emp.employee_id);
    this.selectedEmployees.set(ids);
    this.errorMsg['target'] = '';
  }

  // Select all / none within the current search result.
  allFilteredSelected(): boolean {
    let list = this.filteredEmployees();
    return list.length > 0 && list.every((emp) => this.isSelected(emp));
  }

  toggleAllFiltered(checked: boolean) {
    let filteredIds = this.filteredEmployees().map((emp) => emp.employee_id);
    let others = this.selectedEmployees().filter((id) => !filteredIds.includes(id));
    this.selectedEmployees.set(checked ? [...others, ...filteredIds] : others);
    this.errorMsg['target'] = '';
  }

  async onSubmitClick() {
    if (!this.canSave()) return;
    Object.keys(this.errorMsg).filter((ctrl) => ctrl != 'target').forEach((ctrl) => this.onGetErrorMsgs(ctrl));
    // SRS 2.2 v0.2: at least 1 department or 1 employee.
    this.errorMsg['target'] = (this.schVaccine.dept_ids.length == 0 && this.selectedEmployees().length == 0)
      ? 'Select at least one Department or Employee.' : '';
    let isValid = this._hqms.showErrorSummary(this.errorMsg);
    if (isValid) {
      this._hqms.hqmsToasterService({
        key: 'vccne',
        severity: 'warn',
        summary: 'Vaccine Schedule',
        detail: 'Check the errors',
      });
      return;
    };

    let vccSchn = JSON.parse(JSON.stringify(this.schVaccine));
    vccSchn['start_date'] = this._datePipe.transform(new Date(vccSchn['start_date']), 'yyyy-MM-dd HH:mm');
    vccSchn['end_date'] = this._datePipe.transform(new Date(vccSchn['end_date']), 'yyyy-MM-dd HH:mm');
    vccSchn['employee_ids'] = this.selectedEmployees();
    let message = this.capacityExceeded()
      ? `${this.selectedEmployees().length} employees are selected but capacity is ${this.schVaccine.capacity}. Save anyway?`
      : undefined;
    let cnfrmSch = await this._hqms.showConfirmMessage(message);
    if (cnfrmSch) {
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "schVaccine", vccSchn);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          key: 'vccne',
          severity: 'success',
          summary: 'Vaccine Schedule',
          detail: saveResult.message,
        });
        this.onClearClick();
        this.router.navigateByUrl('/vaccine-schedule-dashboard');
      } else if (saveResult.status == 204 || saveResult.status == 501) {
        this._hqms.hqmsToasterService({
          key: 'vccne',
          severity: 'warn',
          summary: 'Vaccine Schedule',
          detail: saveResult.message,
        });
      }
    };
  }

  onClearClick() {
    this.schVaccine = JSON.parse(this.clearrSchVaccne);
    this.employees.set([]);
    this.selectedEmployees.set([]);
    this.employeeSearch.set('');
    Object.keys(this.errorMsg).forEach((key) => (this.errorMsg[key] = ''));
  }

  goBack(): void {
    this.router.navigateByUrl('/vaccine-schedule-dashboard');
  }
}
