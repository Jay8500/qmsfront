import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { VaccinationAccessService } from '../../../vaccination-management/vaccination-access.service';

// Version Control - one document: details, files, access control, approval (SRS 2.3 Steps 3, 5, 6).
// Approve / Reject is shown when the database says this user may act (can_approve); Submit when the
// document is Created / Rejected and the user may edit Version Control.
@Component({
  selector: 'app-version-control-details',
  imports: [SharedModule],
  templateUrl: './version-control-details.component.html',
  styleUrl: './version-control-details.component.scss'
})
export class VersionControlDetailsComponent implements OnInit {
  public router = inject(Router);
  private accessService = inject(VaccinationAccessService);
  public access = this.accessService.access('version-control-dashboard');

  public doc = signal<any>(null);
  public canSubmit = computed(() => !!this.doc()?.can_submit && this.access().access_mod);
  public canEdit = computed(() => !!this.doc()?.can_edit && this.access().access_mod);

  // Approve / Reject dialog
  public showDecision = signal(false);
  public decision: 'APPROVE' | 'REJECT' = 'APPROVE';
  public remarks = '';
  public saving = signal(false);

  constructor(private location: Location, public _hqms: HqmsService) { }

  goBack(): void {
    this.location.back();
  }

  async ngOnInit() {
    const id = history.state?.data?.id;
    if (id) await this.load(id);
  }

  async load(documentId: any) {
    try {
      const res: any = await this._hqms.customGetApiCall('GET', 'fnDocumentApi', { "action": "E", "document_id": documentId });
      if (res?.status == 200 && res.data?.length > 0 && res.data[0]['version_control']?.length > 0) {
        this.doc.set(res.data[0]['version_control'][0]);
      }
    } catch (e) { };
  }

  activeFiles() {
    return (this.doc()?.document_files || []).filter((f: any) => f.is_active);
  }

  openFile(file: any) {
    if (file?.fileOrImageUrl) window.open(file.fileOrImageUrl, '_blank');
  }

  statusClass(status: string) {
    switch (status) {
      case 'Approved': return 'badge-green';
      case 'Submitted':
      case 'L1 Approved':
      case 'Created': return 'badge-yellow';
      default: return 'badge-red';
    }
  }

  onEdit() {
    this.router.navigate(['/version-control-add'], { state: { data: { mode: 'EDIT', id: this.doc().document_id } } });
  }

  async onSubmitForApproval() {
    const ok = await this._hqms.showConfirmMessage('Send this document for approval? It cannot be edited while it is waiting.');
    if (!ok) return;
    await this.sendAction('SUBMIT', null);
  }

  openDecision(decision: 'APPROVE' | 'REJECT') {
    this.decision = decision;
    this.remarks = '';
    this.showDecision.set(true);
  }

  async onDecisionSave() {
    const remarks = (this.remarks || '').trim();
    if (this.decision == 'REJECT' && remarks == '') {
      this._hqms.hqmsToasterService({ severity: 'warn', summary: 'Version Control', detail: 'Rejection comments are required' });
      return;
    }
    const done = await this.sendAction(this.decision, remarks || null);
    if (done) this.showDecision.set(false);
  }

  private async sendAction(action: string, remarks: string | null) {
    this.saving.set(true);
    try {
      const res: any = await this._hqms.customSaveApiCall('POST', 'documentApprovalApi', {
        action, document_id: this.doc().document_id, remarks
      });
      if (res?.status == 200) {
        const version = res.data?.[0]?.version_no;
        this._hqms.hqmsToasterService({
          severity: 'success', summary: 'Version Control',
          detail: version ? `${res.message} - version v${version}` : res.message
        });
        await this.load(this.doc().document_id);
        return true;
      }
      this._hqms.hqmsToasterService({ severity: 'warn', summary: 'Version Control', detail: res?.message || 'Failed' });
      return false;
    } finally {
      this.saving.set(false);
    }
  }
}
