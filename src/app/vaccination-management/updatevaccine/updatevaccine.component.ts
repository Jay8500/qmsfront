import { Component, Directive, EventEmitter, signal, Input, Output, OnInit, QueryList, ViewChild, ViewChildren, inject } from '@angular/core';
import { Location, CommonModule, DatePipe } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { HqmsService } from '../../services/hqms.service';
import { Validations } from '../../validations';
import { VaccinationAccessService } from '../vaccination-access.service';
import { AefiReportDialogComponent } from '../aefi/aefi-report-dialog/aefi-report-dialog.component';

export type SortColumn = string;
export type SortDirection = 'asc' | 'desc' | '';
const rotate: { [key: string]: SortDirection } = { asc: 'desc', desc: '', '': 'asc' };
const compare = (v1: string | number, v2: string | number) => (v1 < v2 ? -1 : v1 > v2 ? 1 : 0);
export interface SortEvent {
  column: SortColumn;
  direction: SortDirection;
}
@Directive({
  selector: 'th[sortable]',
  standalone: true,
  host: {
    '[class.asc]': 'direction === "asc"',
    '[class.desc]': 'direction === "desc"',
    '(click)': 'rotate()',
  },
})
export class NgbdSortableHeader {
  @Input() sortable: SortColumn = '';
  @Input() direction: SortDirection = '';
  @Output() sort = new EventEmitter<SortEvent>();
  rotate() {
    this.direction = rotate[this.direction];
    this.sort.emit({ column: this.sortable, direction: this.direction });
  }
}

// SRS 2.x3 Missed Reason list; used when the VACCMISSEDRSN entity is not configured yet.
const DEFAULT_MISSED_REASONS = ['On Leave', 'Sick/Contraindicated', 'Stock-Out', 'Clinic Closed', 'Refused', 'Scheduling Conflict', 'Other'];

@Component({
  selector: 'app-updatevaccine',
  imports: [CommonModule, NgbdSortableHeader, SharedModule, SelectModule, FormsModule, AefiReportDialogComponent],
  templateUrl: './updatevaccine.component.html',
  styleUrls: ['./updatevaccine.component.scss', '../vaccination-forms.scss'],
  providers: [DatePipe]
})
export class UpdatevaccineComponent implements OnInit {
  readonly FORM_NAME = 'VaccineAdminForm';
  readonly MISSED_FORM = 'VaccineMissedForm';
  readonly STATUS_TABS = ['Pending', 'Missed', 'Exempt', 'Declined', 'Completed', 'All'];
  readonly DECISION_FORM = 'VaccineDecisionForm';
  // Attachments (SRS 2.x1 / 2.x9): PDF / JPG / PNG up to 5 MB.
  readonly FILE_TYPES = ['pdf', 'jpg', 'jpeg', 'png'];
  readonly FILE_MAX_BYTES = 5 * 1024 * 1024;
  public validations = inject(Validations);
  public access = inject(VaccinationAccessService).access('update-vaccine');
  // Reporting an AEFI uses the AEFI Register document's add access.
  public aefiAccess = inject(VaccinationAccessService).access('vaccination-aefi');
  @ViewChild('aefiDialog') aefiDialog!: AefiReportDialogComponent;
  public showAefiDialog = false;
  public selectedVaccine = signal<any>(null);
  public sctOpt: string = "Pending";
  public searchText: string = '';
  public scheduledVaccineList: any = [];
  public employeeList: any = [];
  public missedReasonList: any = [];
  public rescheduleList: any = [];
  public today: string = '';
  public selectedDc: any = {
    "action": "U",
    "batch_no": null,
    "vaccine_det_id": null,
    "vaccination_campaign_id": null,
    "gap_days": null,
    "age_group": null,
    "route_id": null,
    "route_name": null,
    "vaccine_id": null,
    "dosage_unit": null,
    "dosage_value": null,
    "vaccine_code": null,
    "campaign_name": null,
    "capacity": null,
    "dose_label": null,
    "venue_name": null,
    "schedule_start_dt": null,
    "schedule_end_dt": null,
    "copEmps": [],
  };
  public clearInfo = JSON.stringify(this.selectedDc);
  // Shared details for this vaccination session (SRS 2.3): applied to every row marked Completed.
  public adminInfo: any = {
    "administered_at": null,
    "administered_by": null,
    "brand_name": null,
    "batch_no": null,
    // Execution & consent (SRS 2.x9): consent is required to mark anyone Completed.
    "admin_mode_id": null,
    "site_provider": null,
    "observer_id": null,
    "observation_start": null,   // HH:mm on the vaccination date
    "observation_end": null,
    "consent_taken": false,
  };
  public consentFile: File | null = null;
  public adminModeList: any[] = [];
  public decisionReasonList: any[] = [];
  public errMsg: any = {
    selectedVaccine: '',
    administered_at: '',
    administered_by: '',
    brand_name: '',
    batch_no: '',
    consent_taken: '',
    consent_file: '',
    observation_end: '',
  };
  // Row selection for bulk actions (vaccination_administration_id)
  public selectedIds = new Set<string>();

  // Missed Reason dialog (SRS 2.x3) — one or many rows
  public showMissedDialog = false;
  public missedRows: any[] = [];
  public missedInfo: any = { missed_reason_id: null, missed_notes: null, reschedule_campaign_id: null };
  public missedErr: any = { missed_reason_id: '', missed_notes: '' };

  // Exempt / Declined dialog (SRS 2.x1) — one or many employees
  public showDecisionDialog = false;
  public decisionStatus: string = 'Exempt';
  public decisionRows: any[] = [];
  public decisionInfo: any = { decision_reason_id: null, decision_notes: null, file: null };
  public decisionErr: any = { decision_reason_id: '', decision_notes: '', file: '' };

  constructor(private location: Location, public _hqms: HqmsService, public _datePipe: DatePipe) { }

  canSave(): boolean {
    return this.access().access_add || this.access().access_mod;
  }

  // AEFI on a completed dose (SRS 2.x7).
  onReportAefi(emp: any) {
    let vaccine = this.scheduledVaccineList.find((v: any) => v.value === this.selectedVaccine())?.label || '';
    this.aefiDialog.openNew(emp.vaccination_administration_id, `${emp.full_name} — ${vaccine} Dose ${this.selectedDc.dose_label}`, false);
  }

  goBack(): void {
    this.location.back();
  }

  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  onSort({ column, direction }: SortEvent) {
    for (const header of this.headers) {
      if (header.sortable !== column) {
        header.direction = '';
      }
    }
    if (direction !== '' && column !== '') {
      this.selectedDc.copEmps = [...this.selectedDc.copEmps].sort((a: any, b: any) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  onGetErrMsg(ctrl: any) {
    let value = ctrl == 'selectedVaccine' ? this.selectedVaccine() : this.adminInfo[ctrl];
    const result = this.validations.validateField(this.FORM_NAME, ctrl, value);
    this.errMsg[ctrl] = result?.message || '';
    if (!this.errMsg[ctrl] && ctrl == 'administered_at' && value && value > this.today) {
      this.errMsg[ctrl] = 'Vaccination Date cannot be in the future.';
    }
  }

  async ngOnInit() {
    try {
      this.today = this._datePipe.transform(await this._hqms.getServerDate('DATE'), 'yyyy-MM-dd') || '';
      this.adminInfo.administered_at = this.today;
      let schVccns: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        {
          "flag": "SCHD_VACCN"
        });
      if (schVccns.status == 200) {
        // One entry per vaccine (the list has one row per scheduled campaign).
        let seen = new Set<string>();
        this.scheduledVaccineList = schVccns.data
          .filter((ele: any) => !seen.has(ele.vaccine_id) && seen.add(ele.vaccine_id))
          .map((ele: any) => ({
            label: ele.vaccine_name,
            value: ele.vaccine_id,
          }))
      };
      // "Vaccinated By" = staff who administer the vaccine (SRS: HIMS employee list, nurse data):
      // every active user with a role at this location (fn_vaccination_staff_list_get).
      let emps: any = await this._hqms.customGetApiCall('GET', 'vaccinationStaffListApi', {});
      if (emps?.status == 200) {
        this.employeeList = emps.data.map((ele: any) => ({
          label: ele.employee_name,
          value: ele.employee_id,
        }));
      };
      let reasons: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "VACCMISSEDRSN|VACCDECISIONRSN|VACCADMINMODE" });
      let entities: any = reasons?.status == 200 ? (reasons.data?.['entities'] || {}) : {};
      let reasonValues: any[] = entities['VACCMISSEDRSN']?.['values'] || [];
      this.missedReasonList = reasonValues.length > 0
        ? reasonValues.map((ele: any) => ({ label: ele.display_value, value: ele.entity_value_id }))
        : DEFAULT_MISSED_REASONS.map((name) => ({ label: name, value: name }));
      this.decisionReasonList = (entities['VACCDECISIONRSN']?.['values'] || [])
        .map((ele: any) => ({ label: ele.display_value, value: ele.entity_value_id, code: ele.value_code }));
      this.adminModeList = (entities['VACCADMINMODE']?.['values'] || [])
        .map((ele: any) => ({ label: ele.display_value, value: ele.entity_value_id, code: ele.value_code }));
      // Default mode: On-site.
      this.adminInfo.admin_mode_id = this.adminModeList.find((m: any) => m.code === 'ONSITE')?.value || null;
    } catch (e) {
    }
  }

  async onVaccineChange() {
    this.onGetErrMsg('selectedVaccine');
    this.selectedDc = JSON.parse(this.clearInfo);
    this.selectedIds.clear();
    this.searchText = '';
    this.adminRows = [];
    this.scheduleOptions = [];
    this.doseOptions = [];
    this.selectedCampaignId = null;
    this.selectedDetId = null;
    if (this.selectedVaccine() != null) {
      await this.getEmployees(this.selectedVaccine());
    };
  }

  // ---- Schedule (campaign) and Dose of the chosen vaccine ----
  // fn_vaccine_administration_get returns one row per scheduled campaign × dose, each with its staff.
  public adminRows: any[] = [];
  public scheduleOptions: any[] = [];
  public doseOptions: any[] = [];
  public selectedCampaignId: any = null;
  public selectedDetId: any = null;

  private dateText(value: any): string {
    return this._datePipe.transform(value, 'dd-MMM-yyyy') || '-';
  }

  onScheduleChange() {
    this.buildDoseOptions(null);
    this.applyRow();
  }

  onDoseChange() {
    this.applyRow();
  }

  // Doses of the selected campaign; keeps the given dose, else the first dose with people still Pending.
  private buildDoseOptions(keepDetId: any) {
    let rows = this.adminRows.filter((row: any) => row.vaccination_campaign_id === this.selectedCampaignId);
    this.doseOptions = rows.map((row: any) => ({
      label: `Dose ${row.dose_label}` + (row.gap_days && row.gap_days !== '0' ? ` (after ${row.gap_days} days)` : ''),
      value: row.vaccine_det_id,
    }));
    let keep = rows.find((row: any) => row.vaccine_det_id === keepDetId);
    let firstOpen = rows.find((row: any) => (row.employees || []).some((emp: any) => emp.status === 'Pending'));
    this.selectedDetId = (keep || firstOpen || rows[0])?.vaccine_det_id || null;
  }

  async getEmployees(vaccineId: any) {
    try {
      let keepCampaign = this.selectedCampaignId;
      let keepDet = this.selectedDetId;
      this.selectedDc = JSON.parse(this.clearInfo);
      this.selectedIds.clear();
      this.adminRows = [];
      let info: any = await this._hqms.customGetApiCall('GET', 'fnVaccineAdministrationApi',
        {
          "vaccine_id": vaccineId,
        });
      if (info.status == 200 && info['data'].length > 0) {
        this.adminRows = info['data'];
        let campaigns = new Map<string, any>();
        this.adminRows.forEach((row: any) => {
          if (!campaigns.has(row.vaccination_campaign_id)) campaigns.set(row.vaccination_campaign_id, row);
        });
        this.scheduleOptions = [...campaigns.values()].map((row: any) => ({
          label: `${row.campaign_name} (${this.dateText(row.schedule_start_dt)} – ${this.dateText(row.schedule_end_dt)})`,
          value: row.vaccination_campaign_id,
          start: row.schedule_start_dt,
          end: row.schedule_end_dt,
        }));
        // Default: the campaign running today, else the next one, else the latest.
        let running = this.scheduleOptions.find((op: any) => op.start <= this.today && op.end >= this.today);
        let next = [...this.scheduleOptions].filter((op: any) => op.start > this.today).sort((a: any, b: any) => a.start.localeCompare(b.start))[0];
        let keep = this.scheduleOptions.find((op: any) => op.value === keepCampaign);
        this.selectedCampaignId = (keep || running || next || this.scheduleOptions[0]).value;
        this.buildDoseOptions(keep ? keepDet : null);
        this.applyRow();
      };
    } catch (e) { };
  }

  // Shows the staff of the selected campaign + dose.
  applyRow() {
    this.selectedDc = JSON.parse(this.clearInfo);
    this.selectedIds.clear();
    let editInfo = this.adminRows.find((row: any) => row.vaccination_campaign_id === this.selectedCampaignId
      && row.vaccine_det_id === this.selectedDetId);
    if (editInfo) {
      this.selectedDc.batch_no = editInfo['batch_no'];
      this.selectedDc.gap_days = editInfo['gap_days'];
      this.selectedDc.age_group = editInfo['age_group'];
      this.selectedDc.route_id = editInfo['route_id'];
      this.selectedDc.route_name = editInfo.route_name;
      this.selectedDc.vaccine_id = editInfo.vaccine_id;
      this.selectedDc.dosage_unit = editInfo.dosage_unit;
      this.selectedDc.dosage_value = editInfo.dosage_value;
      this.selectedDc.vaccine_code = editInfo.vaccine_code;
      this.selectedDc.campaign_name = editInfo.campaign_name;
      this.selectedDc.vaccine_det_id = editInfo.vaccine_det_id;
      this.selectedDc.capacity = editInfo.capacity;
      this.selectedDc.vaccination_campaign_id = editInfo.vaccination_campaign_id || null;
      this.selectedDc.dose_label = editInfo.dose_label;
      this.selectedDc.venue_name = editInfo.venue_name;
      this.selectedDc.schedule_start_dt = editInfo.schedule_start_dt;
      this.selectedDc.schedule_end_dt = editInfo.schedule_end_dt;
      this.selectedDc.copEmps = (editInfo.employees || []).map((emp: any) => ({
        ...emp,
        status: emp.status || 'Pending',
        new_status: emp.status || 'Pending',
        missed_reason_id: emp.missed_reason_id || null,
        missed_notes: emp.missed_notes || null,
        reschedule_campaign_id: null,
      }));
      this.adminInfo.batch_no = this.adminInfo.batch_no || editInfo['batch_no'] || null;
      this.loadRescheduleList();
    };
  }

  // Other campaigns of the same vaccine that have not ended, for the quick re-schedule in the Missed dialog.
  loadRescheduleList() {
    this.rescheduleList = this.scheduleOptions
      .filter((op: any) => op.value !== this.selectedCampaignId && op.end >= this.today)
      .map((op: any) => ({ label: op.label, value: op.value }));
  }

  // ---- List: tabs (by current status), search, counts ----
  statusCount(status: string): number {
    let rows: any[] = this.selectedDc.copEmps;
    return status === 'All' ? rows.length : rows.filter((emp: any) => emp.status === status).length;
  }

  visibleRows(): any[] {
    let text = this.searchText.trim().toLowerCase();
    return this.selectedDc.copEmps.filter((emp: any) =>
      (this.sctOpt === 'All' || emp.status === this.sctOpt)
      && (!text || (emp.full_name || '').toLowerCase().includes(text) || (emp.employee_code || '').toLowerCase().includes(text)));
  }

  onTabChange(tab: string) {
    this.sctOpt = tab;
    this.selectedIds.clear();
  }

  // ---- Selection for bulk actions ----
  isSelectable(emp: any): boolean {
    return !this.isRowLocked(emp);
  }

  isSelected(emp: any): boolean {
    return this.selectedIds.has(emp.vaccination_administration_id);
  }

  toggleRow(emp: any, checked: boolean) {
    if (checked) this.selectedIds.add(emp.vaccination_administration_id);
    else this.selectedIds.delete(emp.vaccination_administration_id);
  }

  allVisibleSelected(): boolean {
    let rows = this.visibleRows().filter((emp) => this.isSelectable(emp));
    return rows.length > 0 && rows.every((emp) => this.isSelected(emp));
  }

  toggleAllVisible(checked: boolean) {
    this.visibleRows().filter((emp) => this.isSelectable(emp)).forEach((emp) => this.toggleRow(emp, checked));
  }

  // Completed rows are final here; corrections are an Admin/Quality action (SRS 2.x11).
  isRowLocked(emp: any): boolean {
    return emp.status === 'Completed' || !this.canSave();
  }

  // ---- Status changes ----
  setRowStatus(emp: any, status: string) {
    if (this.isRowLocked(emp)) return;
    emp.new_status = status;
    if (status !== 'Missed') this.clearMissed(emp);
    if (status !== 'Exempt' && status !== 'Declined') this.clearDecision(emp);
    if (status === 'Missed') this.openMissedDialog([emp]);
    if (status === 'Exempt' || status === 'Declined') this.openDecisionDialog([emp], status);
  }

  undoRow(emp: any) {
    emp.new_status = emp.status;
    this.clearMissed(emp);
    this.clearDecision(emp);
  }

  private clearMissed(emp: any) {
    emp.missed_reason_id = null;
    emp.missed_notes = null;
    emp.reschedule_campaign_id = null;
  }

  private clearDecision(emp: any) {
    emp.decision_reason_id = null;
    emp.decision_notes = null;
    emp.decision_file = null;
  }

  // "Declined" only where the dose allows the employee to decline (Vaccine Master: Allow Decision).
  canDecline(emp: any): boolean {
    return !!emp.allow_decision;
  }

  bulkSet(status: string) {
    let rows = this.selectedDc.copEmps.filter((emp: any) => this.isSelected(emp) && !this.isRowLocked(emp));
    if (rows.length == 0) return;
    rows.forEach((emp: any) => {
      emp.new_status = status;
      if (status !== 'Missed') this.clearMissed(emp);
      if (status !== 'Exempt' && status !== 'Declined') this.clearDecision(emp);
    });
    if (status === 'Missed') this.openMissedDialog(rows);
    if (status === 'Exempt') this.openDecisionDialog(rows, status);
    this.selectedIds.clear();
  }

  // ---- Exempt / Declined dialog (SRS 2.x1) ----
  openDecisionDialog(rows: any[], status: string) {
    this.decisionRows = rows;
    this.decisionStatus = status;
    let first = rows[0] || {};
    this.decisionInfo = {
      decision_reason_id: rows.length == 1 ? first.decision_reason_id || null : null,
      decision_notes: rows.length == 1 ? first.decision_notes || null : null,
      file: rows.length == 1 ? first.decision_file || null : null,
    };
    this.decisionErr = { decision_reason_id: '', decision_notes: '', file: '' };
    this.showDecisionDialog = true;
  }

  isOtherDecisionReason(): boolean {
    let reason = this.decisionReasonList.find((r: any) => r.value === this.decisionInfo.decision_reason_id);
    return reason?.code === 'OTHER';
  }

  // Returns an error message, or '' when the file is allowed.
  fileError(file: File | null): string {
    if (!file) return '';
    let extension = (file.name.split('.').pop() || '').toLowerCase();
    if (!this.FILE_TYPES.includes(extension)) return 'Only PDF, JPG or PNG files are allowed.';
    if (file.size > this.FILE_MAX_BYTES) return 'The file can be up to 5 MB.';
    return '';
  }

  onDecisionFile(event: any) {
    let file: File | null = event?.target?.files?.[0] || null;
    this.decisionErr.file = this.fileError(file);
    this.decisionInfo.file = this.decisionErr.file ? null : file;
    if (event?.target) event.target.value = '';
  }

  onDecisionSave() {
    this.decisionErr.decision_reason_id = this.validations.validateField(this.DECISION_FORM, 'decision_reason_id', this.decisionInfo.decision_reason_id)?.message || '';
    this.decisionErr.decision_notes = this.isOtherDecisionReason()
      ? (this.validations.validateField(this.DECISION_FORM, 'decision_notes', this.decisionInfo.decision_notes)?.message || '')
      : (String(this.decisionInfo.decision_notes || '').length > 500 ? 'Notes can have up to 500 characters.' : '');
    if (this.decisionErr.decision_reason_id || this.decisionErr.decision_notes || this.decisionErr.file) return;
    this.decisionRows.forEach((emp: any) => {
      emp.decision_reason_id = this.decisionInfo.decision_reason_id;
      emp.decision_notes = this.decisionInfo.decision_notes;
      emp.decision_file = this.decisionInfo.file;
    });
    this.decisionRows = [];
    this.showDecisionDialog = false;
  }

  // Closing without a reason puts those rows back to their previous status.
  onDecisionHide() {
    this.decisionRows.forEach((emp: any) => {
      if (!emp.decision_reason_id) emp.new_status = emp.status;
    });
    this.decisionRows = [];
  }

  decisionReasonLabel(emp: any): string {
    return this.decisionReasonList.find((r: any) => r.value === emp.decision_reason_id)?.label || emp.decision_reason || '';
  }

  // ---- Consent file (SRS 2.x9) ----
  onConsentFile(event: any) {
    let file: File | null = event?.target?.files?.[0] || null;
    this.errMsg['consent_file'] = this.fileError(file);
    this.consentFile = this.errMsg['consent_file'] ? null : file;
    if (event?.target) event.target.value = '';
  }

  // 'HH:mm' on the vaccination date → ISO (UTC) for the server.
  private toIsoTime(date: string, time: string | null): string | null {
    if (!date || !time) return null;
    let value = new Date(`${date}T${time}`);
    return isNaN(value.getTime()) ? null : value.toISOString();
  }

  private fileObject(file: File): any {
    return {
      file_id: null,
      file_name: file.name,
      file_type: (file.name.split('.').pop() || '').toLowerCase(),
      file_size: file.size,
      storage_path: null,
      is_active: true,
      upload_file_name: file.name,
    };
  }

  openMissedDialog(rows: any[]) {
    this.missedRows = rows;
    let first = rows[0] || {};
    this.missedInfo = {
      missed_reason_id: rows.length == 1 ? first.missed_reason_id || null : null,
      missed_notes: rows.length == 1 ? first.missed_notes || null : null,
      reschedule_campaign_id: rows.length == 1 ? first.reschedule_campaign_id || null : null,
    };
    this.missedErr = { missed_reason_id: '', missed_notes: '' };
    this.showMissedDialog = true;
  }

  isOtherReason(): boolean {
    let reason = this.missedReasonList.find((r: any) => r.value === this.missedInfo.missed_reason_id);
    return (reason?.label || '').toLowerCase() === 'other';
  }

  onMissedSave() {
    this.missedErr.missed_reason_id = this.validations.validateField(this.MISSED_FORM, 'missed_reason_id', this.missedInfo.missed_reason_id)?.message || '';
    this.missedErr.missed_notes = this.isOtherReason()
      ? (this.validations.validateField(this.MISSED_FORM, 'missed_notes', this.missedInfo.missed_notes)?.message || '')
      : '';
    if (this.missedErr.missed_reason_id || this.missedErr.missed_notes) return;
    this.missedRows.forEach((emp: any) => {
      emp.missed_reason_id = this.missedInfo.missed_reason_id;
      emp.missed_notes = this.missedInfo.missed_notes;
      emp.reschedule_campaign_id = this.missedInfo.reschedule_campaign_id;
    });
    this.missedRows = [];
    this.showMissedDialog = false;
  }

  // Closing the dialog without a reason puts those rows back to their previous status.
  onMissedHide() {
    this.missedRows.forEach((emp: any) => {
      if (!emp.missed_reason_id) emp.new_status = emp.status;
    });
    this.missedRows = [];
  }

  missedReasonLabel(emp: any): string {
    return this.missedReasonList.find((r: any) => r.value === emp.missed_reason_id)?.label || '';
  }

  changedRows(): any[] {
    return this.selectedDc.copEmps.filter((emp: any) => emp.new_status !== emp.status);
  }

  needsAdminInfo(): boolean {
    return this.changedRows().some((emp: any) => emp.new_status === 'Completed');
  }

  async onSubmitClick() {
    try {
      if (!this.canSave()) return;
      let changed = this.changedRows();
      this.onGetErrMsg('selectedVaccine');
      let needsAdminInfo = this.needsAdminInfo();
      ['administered_at', 'administered_by', 'brand_name', 'batch_no'].forEach((ctrl) => {
        if (needsAdminInfo) this.onGetErrMsg(ctrl);
        else this.errMsg[ctrl] = '';
      });
      // SRS 2.x9: consent is required for completion; observation end after start.
      this.errMsg['consent_taken'] = needsAdminInfo && !this.adminInfo.consent_taken ? 'Consent must be taken before marking Completed.' : '';
      this.errMsg['observation_end'] = needsAdminInfo && this.adminInfo.observation_start && this.adminInfo.observation_end
        && this.adminInfo.observation_end < this.adminInfo.observation_start ? 'Observation end must be after the start.' : '';
      let isValid = this._hqms.showErrorSummary(this.errMsg);
      if (isValid) {
        this._hqms.hqmsToasterService({
          severity: 'warn',
          summary: 'Vaccine Administration',
          detail: 'Check the errors',
        });
        return;
      };
      if (changed.length == 0) {
        this._hqms.hqmsToasterService({
          severity: 'warn',
          summary: 'Vaccine Administration',
          detail: 'No status was changed.',
        });
        return;
      }
      let missingReason = changed.filter((emp: any) => emp.new_status === 'Missed' && !emp.missed_reason_id);
      if (missingReason.length > 0) {
        this.openMissedDialog(missingReason);
        return;
      }
      let missingDecision = changed.filter((emp: any) => (emp.new_status === 'Exempt' || emp.new_status === 'Declined') && !emp.decision_reason_id);
      if (missingDecision.length > 0) {
        this.openDecisionDialog(missingDecision, missingDecision[0].new_status);
        return;
      }
      let isDecision = (emp: any) => emp.new_status === 'Exempt' || emp.new_status === 'Declined';
      let files: File[] = [];
      let payload: any = {
        "action": "U",
        "vaccine_id": this.selectedDc.vaccine_id,
        "vaccine_det_id": this.selectedDc.vaccine_det_id,
        "vaccination_campaign_id": this.selectedDc.vaccination_campaign_id,
        "administered_at": needsAdminInfo ? this.adminInfo.administered_at : null,
        "administered_by": needsAdminInfo ? this.adminInfo.administered_by : null,
        "brand_name": needsAdminInfo ? this.adminInfo.brand_name : null,
        "batch_no": needsAdminInfo ? this.adminInfo.batch_no : null,
        "admin_mode_id": needsAdminInfo ? this.adminInfo.admin_mode_id : null,
        "site_provider": needsAdminInfo ? this.adminInfo.site_provider : null,
        "observer_id": needsAdminInfo ? this.adminInfo.observer_id : null,
        "observation_start": needsAdminInfo ? this.toIsoTime(this.adminInfo.administered_at, this.adminInfo.observation_start) : null,
        "observation_end": needsAdminInfo ? this.toIsoTime(this.adminInfo.administered_at, this.adminInfo.observation_end) : null,
        "consent_taken": needsAdminInfo ? !!this.adminInfo.consent_taken : null,
        "consent_documents": needsAdminInfo && this.consentFile ? [this.fileObject(this.consentFile)] : [],
        "employees": changed.map((emp: any) => ({
          "vaccination_administration_id": emp.vaccination_administration_id,
          "employee_id": emp.employee_id,
          "status": emp.new_status,
          "is_vaccinated": emp.new_status === 'Completed',
          "missed_reason_id": emp.new_status === 'Missed' ? emp.missed_reason_id : null,
          "missed_notes": emp.new_status === 'Missed' ? emp.missed_notes : null,
          "reschedule_campaign_id": emp.new_status === 'Missed' ? emp.reschedule_campaign_id : null,
          "decision_reason_id": isDecision(emp) ? emp.decision_reason_id : null,
          "decision_notes": isDecision(emp) ? emp.decision_notes : null,
          "decision_documents": isDecision(emp) && emp.decision_file ? [this.fileObject(emp.decision_file)] : [],
        })),
      };
      if (needsAdminInfo && this.consentFile) files.push(this.consentFile);
      changed.forEach((emp: any) => {
        if (isDecision(emp) && emp.decision_file && !files.some((fl) => fl.name === emp.decision_file.name)) files.push(emp.decision_file);
      });
      let count = (status: string) => changed.filter((emp: any) => emp.new_status === status).length;
      let completed = count('Completed');
      let missed = count('Missed');
      let exempt = count('Exempt');
      let declined = count('Declined');
      let cnfrmVccne = await this._hqms.showConfirmMessage(
        `Save ${changed.length} change(s)? ${completed} Completed, ${missed} Missed, ${exempt} Exempt, ${declined} Declined, ${changed.length - completed - missed - exempt - declined} back to Pending.`);
      if (cnfrmVccne) {
        // With attachments the backend needs multipart (files + "data"), like the other modules' uploads.
        let body: any = payload;
        if (files.length > 0) {
          body = new FormData();
          files.forEach((file) => body.append("file", file, file.name));
          body.append("data", JSON.stringify(payload));
        }
        var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnVaccineAdministrationApi", body);
        if (saveResult.status == 200) {
          this._hqms.hqmsToasterService({
            severity: 'success',
            summary: 'Vaccine Administration',
            detail: saveResult.message,
          });
          this.consentFile = null;
          await this.getEmployees(this.selectedVaccine());
        } else if (saveResult.status == 204 || saveResult.status == 501) {
          this._hqms.hqmsToasterService({
            severity: 'warn',
            summary: 'Vaccine Administration',
            detail: saveResult.message,
          });
        }
      };
    } catch (e) {
    }
  }

  onClearClick() {
    this.selectedVaccine.set(null);
    this.selectedDc = JSON.parse(this.clearInfo);
    this.adminRows = [];
    this.scheduleOptions = [];
    this.doseOptions = [];
    this.selectedCampaignId = null;
    this.selectedDetId = null;
    this.rescheduleList = [];
    this.selectedIds.clear();
    this.searchText = '';
    this.adminInfo = {
      administered_at: this.today, administered_by: null, brand_name: null, batch_no: null,
      admin_mode_id: this.adminModeList.find((m: any) => m.code === 'ONSITE')?.value || null,
      site_provider: null, observer_id: null, observation_start: null, observation_end: null, consent_taken: false,
    };
    this.consentFile = null;
    Object.keys(this.errMsg).forEach((key) => (this.errMsg[key] = ''));
    this.sctOpt = "Pending";
  }
}
