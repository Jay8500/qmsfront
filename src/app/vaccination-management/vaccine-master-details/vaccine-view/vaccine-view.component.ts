import { Component, signal, OnInit, inject, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { doseCompletionPct } from '../vaccine-details/vaccine-details.component';
import { VaccinationCertificateService } from '../../vaccination-certificate.service';
import { VaccinationAccessService } from '../../vaccination-access.service';
import { AefiReportDialogComponent } from '../../aefi/aefi-report-dialog/aefi-report-dialog.component';
import { PolicyLinkComponent } from '../../policy/policy-link/policy-link.component';

@Component({
  selector: 'app-vaccine-view',
  imports: [CommonModule, SharedModule, AefiReportDialogComponent, PolicyLinkComponent],
  templateUrl: './vaccine-view.component.html',
})
export class VaccineViewComponent implements OnInit {
  private router = inject(Router);
  public certificateService = inject(VaccinationCertificateService);
  // Report AEFI (SRS 2.x7) uses the AEFI Register document's add access.
  public aefiAccess = inject(VaccinationAccessService).access('vaccination-aefi');
  @ViewChild('aefiDialog') aefiDialog!: AefiReportDialogComponent;
  public showAefiDialog = false;
  // Correct record (SRS 2.x11): shown with Vaccination Details edit access; the server allows Admin / Quality only.
  public detailsAccess = inject(VaccinationAccessService).access('vaccine-details');
  public showCorrection = false;
  public correction: any = {};
  public correctionDoses: any[] = [];
  private correctionDoseRows: any[] = [];
  public correctionReasons: any[] = [];
  public staffList: any[] = [];
  public correctionErr = '';
  public todayIso = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  // 'MY' when opened from My Vaccines (employee's own record), otherwise from Vaccination Details.
  public viewMode: string = 'VIEW';
  private backUrl: string = '/vaccine-details';
  public readOnlyVaccineView: any = signal({
    "vaccination_administration_id": null,
    "employee_code": null,
    "user_display_name": null,
    "vaccine_name": null,
    "department_name": null,
    "dosage": null,
    "dose_completion_pct": null,
    "last_vaccinated_date": null,
    "next_vaccine_dt": null,
    "next_vaccine_status": null,
    "status": null,
    "vaccinated_by": null,
    "brand_name": null,
    "batch_no": null,
    "brand_batch_no": null,
    "campaign_name": null,
    "venue_name": null,
    "time_slot": null,
    "missed_reason": null,
    "missed_notes": null,
    "decision_reason": null,
    "decision_notes": null,
    "consent_taken": null,
    "is_corrected": null,
  })

  constructor(public _hqms: HqmsService) { }

  async ngOnInit() {
    try {
      let state = history.state;
      if (state?.data) {
        this.viewMode = state['data']['mode'] || 'VIEW';
        this.backUrl = state['data']['back'] || (this.viewMode == 'MY' ? '/my-vaccines' : '/vaccine-details');
        await this.getVaccineView(state['data']['id'])
      };
    } catch (e) { }
  }

  async getVaccineView(vaccinationAdministrationId: any) {
    try {
      let params: any = { "vaccination_administration_id": vaccinationAdministrationId };
      if (this.viewMode == 'MY') params['my_records'] = 'Y';
      let info: any = await this._hqms.customGetApiCall('GET', 'fnVaccinationDetailsGet', params);
      if (info.status == 200 && info['data'].length > 0) {
        let rec = info['data'][0];
        this.readOnlyVaccineView.set({
          "vaccination_administration_id": rec.vaccination_administration_id,
          "employee_code": rec.employee_code,
          "user_display_name": rec.user_display_name,
          "vaccine_name": rec.vaccine_name,
          "department_name": rec.department_name,
          "dosage": rec.dosage,
          "dose_completion_pct": doseCompletionPct(rec),
          "last_vaccinated_date": rec.last_vaccinated_date,
          "next_vaccine_dt": rec.next_vaccine_dt,
          "next_vaccine_status": rec.next_vaccine_status,
          "status": rec.status || rec.next_vaccine_status,
          "vaccinated_by": rec.vaccinated_by || rec.administered_by_name,
          "brand_name": rec.brand_name,
          "batch_no": rec.batch_no,
          "brand_batch_no": rec.brand_batch_no,
          "campaign_name": rec.campaign_name,
          "venue_name": rec.venue_name,
          "time_slot": rec.time_slot,
          "missed_reason": rec.missed_reason,
          "missed_notes": rec.missed_notes,
          "decision_reason": rec.decision_reason,
          "decision_notes": rec.decision_notes,
          "consent_taken": rec.consent_taken,
          "is_corrected": rec.is_corrected,
        });
      };
    } catch (e) {
    };
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'Completed': return 'badge-green';
      case 'Partially Done': return 'badge-yellow';
      case 'Missed': return 'badge-red';
      default: return 'badge-yellow';
    }
  }

  onReportAefi() {
    let rec = this.readOnlyVaccineView();
    this.aefiDialog.openNew(rec.vaccination_administration_id, `${rec.user_display_name} — ${rec.vaccine_name}`, true);
  }

  async openCorrection() {
    this.correctionErr = '';
    let doses: any = await this._hqms.customGetApiCall('GET', 'vaccinationAefiApi',
      { "flag": "DOSES", "vaccination_administration_id": this.readOnlyVaccineView().vaccination_administration_id });
    this.correctionDoseRows = doses?.status == 200 ? doses.data : [];
    this.correctionDoses = this.correctionDoseRows.map((d: any) => ({ label: `Dose ${d.dose_label} — ${d.administered_at}`, value: d.vaccination_administration_id }));
    if (!this.correctionReasons.length) {
      let ent: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi', { "entity_codes": "VACCCORRRSN" });
      this.correctionReasons = (ent?.data?.['entities']?.['VACCCORRRSN']?.['values'] || []).map((v: any) => ({ label: v.display_value, value: v.entity_value_id }));
      let staff: any = await this._hqms.customGetApiCall('GET', 'vaccinationStaffListApi', {});
      this.staffList = staff?.status == 200 ? staff.data.map((s: any) => ({ label: s.employee_name, value: s.employee_id })) : [];
    }
    this.correction = { vaccination_administration_id: this.correctionDoses[this.correctionDoses.length - 1]?.value || null,
      correction_reason_id: null, correction_notes: null };
    this.onCorrectionDose();
    this.showCorrection = true;
  }

  // Pre-fill with the dose's current values.
  onCorrectionDose() {
    let dose = this.correctionDoseRows.find((d: any) => d.vaccination_administration_id === this.correction.vaccination_administration_id);
    this.correction.administered_at = dose?.administered_date || null;
    this.correction.brand_name = dose?.brand_name || null;
    this.correction.batch_no = dose?.batch_no || null;
    this.correction.administered_by = dose?.administered_by || null;
  }

  async onCorrectionSave() {
    if (!this.correction.vaccination_administration_id) { this.correctionErr = 'Select the dose.'; return; }
    if (!this.correction.correction_reason_id) { this.correctionErr = 'Correction reason is required.'; return; }
    if (!String(this.correction.correction_notes || '').trim()) { this.correctionErr = 'Comment is required.'; return; }
    if (this.correction.administered_at && this.correction.administered_at > this.todayIso) { this.correctionErr = 'Date cannot be in the future.'; return; }
    let confirm = await this._hqms.showConfirmMessage('Save this correction? It is kept in the audit trail.');
    if (!confirm) return;
    let result: any = await this._hqms.customSaveApiCall('POST', 'vaccinationCorrectionApi', this.correction);
    this._hqms.hqmsToasterService({ severity: result?.status == 200 ? 'success' : 'warn', summary: 'Correction', detail: result?.message || 'Save failed.' });
    if (result?.status == 200) {
      this.showCorrection = false;
      await this.getVaccineView(this.readOnlyVaccineView().vaccination_administration_id);
    }
  }

  async onDownloadCertificate() {
    await this.certificateService.download(this.readOnlyVaccineView().vaccination_administration_id, this.viewMode == 'MY');
  }

  goBack(): void {
    this.router.navigateByUrl(this.backUrl);
  }
}
