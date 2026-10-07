import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { HqmsService } from '../../../services/hqms.service';
import { VaccinationAccessService } from '../../vaccination-access.service';
import { HistoryRecordDialogComponent } from '../history-record-dialog/history-record-dialog.component';

// History Approvals (SRS 2.x5): previous vaccinations sent by employees from My Vaccines.
// Quality / Admin / HR approve (the dose becomes Completed, source HISTORY) or reject with a reason,
// and HR can add a record for an employee (approved at once). Data: vaccinationHistoryApi.
@Component({
  selector: 'app-history-approvals',
  imports: [CommonModule, SharedModule, HistoryRecordDialogComponent],
  templateUrl: './history-approvals.component.html',
  styleUrls: ['../../vaccination-forms.scss']
})
export class HistoryApprovalsComponent implements OnInit {
  private _hqms = inject(HqmsService);
  public access = inject(VaccinationAccessService).access('vaccination-history');
  @ViewChild('recordDialog') recordDialog!: HistoryRecordDialogComponent;
  readonly TABS = ['Pending', 'Approved', 'Rejected'];
  public tab = 'Pending';
  public rows: any[] = [];
  public loading = false;
  public searchText = '';
  public showRecordDialog = false;
  // Reject dialog
  public showReject = false;
  public rejectRow: any = null;
  public rejectReason = '';
  public rejectErr = '';

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading = true;
    try {
      let info: any = await this._hqms.customGetApiCall('GET', 'vaccinationHistoryApi', { "status": this.tab });
      this.rows = info?.status == 200 ? info.data : [];
    } catch (e) {
    } finally {
      this.loading = false;
    }
  }

  async onTab(tab: string) {
    this.tab = tab;
    await this.load();
  }

  visibleRows(): any[] {
    let text = this.searchText.trim().toLowerCase();
    if (!text) return this.rows;
    return this.rows.filter((r) => [r.request_no, r.employee_name, r.employee_code, r.vaccine_name, r.issuer, r.batch_no]
      .some((v) => String(v || '').toLowerCase().includes(text)));
  }

  canDecide(row: any): boolean {
    return row.status === 'Pending' && this.access().access_mod && !row.is_own;
  }

  async onApprove(row: any) {
    let confirm = await this._hqms.showConfirmMessage(
      `Approve ${row.request_no}? ${row.employee_name}'s ${row.vaccine_name} dose ${row.dose_no} (${row.vaccination_date}) will be recorded as completed.`);
    if (!confirm) return;
    await this.decide({ action: 'APPROVE', vaccination_history_request_id: row.vaccination_history_request_id });
  }

  onReject(row: any) {
    this.rejectRow = row;
    this.rejectReason = '';
    this.rejectErr = '';
    this.showReject = true;
  }

  async onRejectSave() {
    if (!this.rejectReason.trim()) {
      this.rejectErr = 'Reason is required.';
      return;
    }
    this.showReject = false;
    await this.decide({ action: 'REJECT', vaccination_history_request_id: this.rejectRow.vaccination_history_request_id, reject_reason: this.rejectReason.trim() });
  }

  private async decide(payload: any) {
    let result: any = await this._hqms.customSaveApiCall('POST', 'vaccinationHistoryApi', payload);
    this._hqms.hqmsToasterService({
      severity: result?.status == 200 ? 'success' : 'warn',
      summary: 'Vaccination History',
      detail: result?.message || 'Save failed.',
    });
    if (result?.status == 200) await this.load();
  }

  onAddRecord() {
    this.recordDialog.open('HR');
  }

  async onRecordClosed(saved: boolean) {
    if (saved) await this.load();
  }
}
