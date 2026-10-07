import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
import { QmsFilePickerComponent } from '../../components/qms-ui/qms-file-picker.component';

// Report Incident (SRS 2.1, 2.7-2.9): the form shows the fields of the chosen report form
// (General / Blood Transfusion Reaction / Adverse Drug Reaction / Medical Error) and of whom it happened to
// (Hospital Staff / Patient / Visitor / Other). Saved by fn_incident_report_write; not editable after submit.
@Component({
  selector: 'app-incident-add',
  standalone: true,
  imports: [SharedModule, QmsFilePickerComponent],
  templateUrl: './incident-add.component.html',
  styleUrls: ['./incident-add.component.scss', '../../components/qms-ui/qms-ui.scss']
})
export class IncidentAddComponent implements OnInit {
  private _hqms = inject(HqmsService);
  private router = inject(Router);
  @ViewChild('picker') picker!: QmsFilePickerComponent;

  public forms = [
    { code: 'GENERAL', label: 'General Incident', icon: 'pi-exclamation-triangle' },
    { code: 'BLOOD_TRANSFUSION', label: 'Blood Transfusion Reaction', icon: 'pi-heart' },
    { code: 'ADR', label: 'Adverse Drug Reaction', icon: 'pi-box' },
    { code: 'MEDICAL_ERROR', label: 'Medical Error', icon: 'pi-times-circle' },
  ];
  public lists: any = {};
  public happenedList: any[] = [];
  public staffList: any[] = [];
  public departmentList: any[] = [];
  public pastDays = 30;
  public maxFiles = 5;
  public minDate: Date = new Date();
  public maxDate: Date = new Date();
  public saving = signal(false);
  public genderList = ['Male', 'Female', 'Other'].map((g) => ({ label: g, value: g }));

  public model: any = this.blank();

  blank() {
    return {
      report_form: 'GENERAL',
      happened_to_id: null,
      incd_happnd_ref_id: null,
      incd_happnd_ref_name: '',
      patient_uhid: '', patient_name: '', patient_age: null, patient_gender: null,
      incident_type_id: null, incident_location_id: null, department_id: null,
      incident_date: new Date(),
      incident_description: '', reason_for_incident: '', immediate_action_taken: '',
      bt: { consultant: '', components: [], pre_temp: '', pre_pulse: '', pre_bp: '', post_temp: '', post_pulse: '', post_bp: '', symptoms: [], reaction_notes: '', doctor: '' },
      adr: { event_time: null, medicines: [{ drug: '', batch: '', dose: '', route: '', frequency: '' }], action: null, outcome: null, severity: [], reporter_contact: '' },
      me: { error_type: null, error_stage: null, factors: [], outcome: null }
    };
  }

  async ngOnInit() {
    try {
      const codes = ['INCIDENT_TYPE', 'INCIDENTHAPPENTO', 'INCIDENT_LOC', 'INC_REASON_TPL', 'INC_ACTION_TPL', 'BLOOD_COMPONENT',
        'TRANSFUSION_SYMPTOM', 'ADR_ACTION', 'ADR_OUTCOME', 'ADR_SEVERITY', 'MED_ERROR_TYPE', 'MED_ERROR_STAGE',
        'MED_ERROR_FACTOR', 'MED_ERROR_OUTCOME'];
      const res: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi', { entity_codes: codes.join(' | ') });
      if (res?.status == 200) {
        codes.forEach((c) => {
          this.lists[c] = (res.data.entities[c]?.values || []).map((v: any) => ({ label: v.display_value, value: v.entity_value_id, code: v.value_code }));
        });
        this.happenedList = this.lists.INCIDENTHAPPENTO || [];
      }
      const staff: any = await this._hqms.customGetApiCall('GET', 'vaccinationStaffListApi', {});
      if (staff?.status == 200) {
        this.staffList = staff.data.filter((s: any) => !!s.employee_id).map((s: any) => ({
          label: s.department_name ? `${s.employee_name} (${s.department_name})` : s.employee_name, value: s.employee_id
        }));
      }
      const dept: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet', { flag: 'DEPARTMENT' }, true);
      if (dept?.status == 200) this.departmentList = dept.data.map((d: any) => ({ label: d.department_name, value: d.department_id }));
      const rules: any = await this._hqms.customGetApiCall('GET', 'incidentRuleApi', {});
      if (rules?.status == 200 && rules.data?.length) {
        this.pastDays = rules.data[0].settings?.past_date_days || 30;
        this.maxFiles = rules.data[0].settings?.max_files || 5;
      }
    } catch (e) { }
    const today = new Date();
    this.maxDate = today;
    this.minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - this.pastDays);
  }

  happenedName(id: any) {
    return this.happenedList.find((h) => h.value === id)?.label || '';
  }

  needsPatient() {
    return this.happenedName(this.model.happened_to_id) === 'Patient' || ['BLOOD_TRANSFUSION', 'ADR'].includes(this.model.report_form);
  }

  len(t: any) {
    return (t || '').trim().length;
  }

  useTemplate(field: 'reason_for_incident' | 'immediate_action_taken', tplId: any) {
    const list = field === 'reason_for_incident' ? this.lists.INC_REASON_TPL : this.lists.INC_ACTION_TPL;
    const text = (list || []).find((t: any) => t.value === tplId)?.label;
    if (!text) return;
    const cur = (this.model[field] || '').trim();
    this.model[field] = cur ? `${cur}\n${text}` : text;
  }

  addMedicine() {
    this.model.adr.medicines.push({ drug: '', batch: '', dose: '', route: '', frequency: '' });
  }

  removeMedicine(i: number) {
    this.model.adr.medicines.splice(i, 1);
  }

  private pad(n: number) { return String(n).padStart(2, '0'); }

  // local 'YYYY-MM-DDTHH:mm:00' (no UTC shift)
  private localStamp(d: any) {
    if (!d) return null;
    const x = d instanceof Date ? d : new Date(d);
    if (isNaN(x.getTime())) return null;
    return `${x.getFullYear()}-${this.pad(x.getMonth() + 1)}-${this.pad(x.getDate())}T${this.pad(x.getHours())}:${this.pad(x.getMinutes())}:00`;
  }

  private labels(listCode: string, ids: any[]) {
    return (ids || []).map((id) => (this.lists[listCode] || []).find((l: any) => l.value === id)?.label).filter(Boolean);
  }

  private label(listCode: string, id: any) {
    return (this.lists[listCode] || []).find((l: any) => l.value === id)?.label || null;
  }

  // fields of the chosen report form, stored in incident.form_details
  private formDetails() {
    const m = this.model;
    if (m.report_form === 'BLOOD_TRANSFUSION') {
      return {
        consultant: m.bt.consultant, components: this.labels('BLOOD_COMPONENT', m.bt.components),
        pre_vitals: { temp: m.bt.pre_temp, pulse: m.bt.pre_pulse, bp: m.bt.pre_bp },
        post_vitals: { temp: m.bt.post_temp, pulse: m.bt.post_pulse, bp: m.bt.post_bp },
        symptoms: this.labels('TRANSFUSION_SYMPTOM', m.bt.symptoms), reaction_notes: m.bt.reaction_notes, doctor: m.bt.doctor
      };
    }
    if (m.report_form === 'ADR') {
      return {
        event_time: this.localStamp(m.adr.event_time),
        medicines: m.adr.medicines.filter((x: any) => (x.drug || '').trim()),
        action: this.label('ADR_ACTION', m.adr.action), outcome: this.label('ADR_OUTCOME', m.adr.outcome),
        severity: this.labels('ADR_SEVERITY', m.adr.severity), reporter_contact: m.adr.reporter_contact
      };
    }
    if (m.report_form === 'MEDICAL_ERROR') {
      return {
        error_type: this.label('MED_ERROR_TYPE', m.me.error_type), error_stage: this.label('MED_ERROR_STAGE', m.me.error_stage),
        factors: this.labels('MED_ERROR_FACTOR', m.me.factors), outcome: this.label('MED_ERROR_OUTCOME', m.me.outcome)
      };
    }
    return {};
  }

  private problems(): string[] {
    const m = this.model;
    const p: string[] = [];
    const who = this.happenedName(m.happened_to_id);
    if (!m.happened_to_id) p.push('Select whom the incident happened to');
    if (who === 'Hospital Staff' && !m.incd_happnd_ref_id) p.push('Select the staff member');
    if ((who === 'Visitor' || who === 'Other') && !this.len(m.incd_happnd_ref_name)) p.push('Enter the name of the person');
    if (this.needsPatient() && (!this.len(m.patient_name) || !this.len(m.patient_uhid))) p.push('Enter the patient name and UHID');
    if (!m.incident_type_id) p.push('Select the Incident Type');
    if (!m.incident_location_id) p.push('Select the Location');
    if (!m.department_id) p.push('Select the Department');
    if (!m.incident_date) p.push('Enter the incident date and time');
    if (this.len(m.incident_description) < 100) p.push(`Incident Description must be at least 100 characters (now ${this.len(m.incident_description)})`);
    if (!this.len(m.reason_for_incident)) p.push('Enter the Reason for the incident');
    if (!this.len(m.immediate_action_taken)) p.push('Enter the Immediate Action taken');
    if (m.report_form === 'BLOOD_TRANSFUSION' && !m.bt.components.length) p.push('Select the blood component(s) issued');
    if (m.report_form === 'ADR' && !m.adr.medicines.some((x: any) => (x.drug || '').trim())) p.push('Enter at least one suspected medicine');
    if (m.report_form === 'MEDICAL_ERROR' && (!m.me.error_type || !m.me.error_stage)) p.push('Select the error type and stage');
    return p;
  }

  async onSubmit() {
    const p = this.problems();
    if (p.length) {
      this._hqms.hqmsToasterService({ severity: 'warn', summary: 'Report Incident', detail: p[0] + (p.length > 1 ? ` (+${p.length - 1} more)` : '') });
      return;
    }
    const m = this.model;
    const payload = {
      report_form: m.report_form,
      happened_to_id: m.happened_to_id,
      incd_happnd_ref_id: m.incd_happnd_ref_id,
      incd_happnd_ref_name: (m.incd_happnd_ref_name || '').trim(),
      patient_uhid: (m.patient_uhid || '').trim(), patient_name: (m.patient_name || '').trim(),
      patient_age: m.patient_age, patient_gender: m.patient_gender,
      incident_type_id: m.incident_type_id, incident_location_id: m.incident_location_id, department_id: m.department_id,
      reported_at: this.localStamp(m.incident_date),
      incident_description: m.incident_description.trim(),
      reason_for_incident: m.reason_for_incident.trim(),
      immediate_action_taken: m.immediate_action_taken.trim(),
      form_details: this.formDetails(),
      evidence_documents: this.picker?.meta() || []
    };
    const ok = await this._hqms.showConfirmMessage('Submit this incident? It cannot be edited after submission.');
    if (!ok) return;
    const form = new FormData();
    this.picker?.appendTo(form);
    form.append('data', JSON.stringify(payload));
    this.saving.set(true);
    try {
      const res: any = await this._hqms.customSaveApiCall('POST', 'incidentReportApi', form);
      if (res?.status == 200) {
        this._hqms.hqmsToasterService({ severity: 'success', summary: 'Report Incident', detail: res.message });
        const id = res.data?.[0]?.incident_id;
        this.router.navigate([id ? '/incident-details' : '/incident-dashboard'], { state: { data: { mode: 'VIEW', id } } });
      } else {
        this._hqms.hqmsToasterService({ severity: 'warn', summary: 'Report Incident', detail: res?.message || 'Not saved' });
      }
    } finally {
      this.saving.set(false);
    }
  }

  onClear() {
    this.model = this.blank();
    this.picker?.clear();
  }

  goBack() {
    this.router.navigateByUrl('/incident-dashboard');
  }
}
