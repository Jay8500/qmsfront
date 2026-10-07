import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { Location } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { SharedModule } from '../../../shared/shared.module';
import { VaccinationAccessService } from '../../../vaccination-management/vaccination-access.service';

@Component({
  selector: 'app-mou-tracker-details',
  imports: [SharedModule],
  templateUrl: './mou-tracker-details.component.html',
})
export class MouTrackerDetailsComponent implements OnInit {
  public santizer = inject(DomSanitizer)

  // Access flags of the MoU Tracker screen (same list as the side menu)
  private accessService = inject(VaccinationAccessService);
  public access = this.accessService.access('mou-tracker-dashboard');
  public canCancel = computed(() => this.access().access_mod && ['Active', 'Expired'].includes(this.readOnlyMou().status));

  public readOnlyMou: any = signal({
    "action": "I",
    "mou_id": null,
    "mou_no": null,
    "partner_org": null,
    "agreement_date": null,
    "expiry_date": null,
    "updated_at": null,
    "mou_files": [],
    "is_active": true,
    "status": null,
    "days_to_expiry": null,
    "service_details": null,
    "authorized_person": null,
    "owner_name": null,
    "department_name": null,
    "cancelled_at": null,
    "cancelled_by": null,
    "cancel_reason": null,
  })

  public showCancel = signal(false);
  public cancelReason = '';

  constructor(private location: Location, public _hqms: HqmsService, ) { }

  async ngOnInit() {
    try {
      let state = history.state;
      if (state ?.data) {
        await this.editmouTracker(state['data']['id'])
      };
    } catch (e) { }
  }

  async editmouTracker(mouId: any) {
    try {
      let getMouListEdit: any = await this._hqms.customGetApiCall('GET', 'fnMouGetDetailApi',
        {
          "action": "U",
          "mou_id": mouId,
        });
      if (getMouListEdit.status == 200) {
        let editInfo = getMouListEdit['data'];
        if (editInfo.length > 0) {
          editInfo = editInfo[0];
          this.readOnlyMou.set({
            "action": "U",
            "mou_id": editInfo.mou_id,
            "mou_no": editInfo.mou_no,
            "partner_org": editInfo.partner_org,
            "agreement_date": editInfo.agreement_date,
            "expiry_date": editInfo.expiry_date,
            "updated_at": editInfo.updated_at,
            "mou_files": editInfo['mou_files'].length > 0 ? editInfo['mou_files'].map((ele) => ({
              ...ele,
              fileOrImageUrl: ele.fileOrImageUrl != null ? this.santizer.bypassSecurityTrustResourceUrl(ele.fileOrImageUrl) : null
            })) : [],
            "is_active": editInfo.is_active,
            "status": editInfo.status,
            "days_to_expiry": editInfo.days_to_expiry,
            "service_details": editInfo.service_details,
            "authorized_person": editInfo.authorized_person,
            "owner_name": editInfo.owner_name,
            "department_name": editInfo.department_name,
            "cancelled_at": editInfo.cancelled_at,
            "cancelled_by": editInfo.cancelled_by,
            "cancel_reason": editInfo.cancel_reason,
          });
        };
      };
    } catch (e) {
    };
  }

  statusClass(status: string) {
    return status === 'Active' ? 'badge-green' : (status === 'Cancelled' ? 'badge-yellow' : 'badge-red');
  }

  openCancel() {
    this.cancelReason = '';
    this.showCancel.set(true);
  }

  async onCancelSave() {
    const reason = (this.cancelReason || '').trim();
    if (reason == '') {
      this._hqms.hqmsToasterService({ severity: 'warn', summary: 'Cancel MoU', detail: 'Enter the reason for cancelling' });
      return;
    }
    const ok = await this._hqms.showConfirmMessage('Cancel this MoU? It stays on record as Cancelled and cannot be edited.');
    if (!ok) return;
    const saveResult: any = await this._hqms.customSaveApiCall("POST", "fnMouGetDetailApi", {
      action: 'C',
      mou_id: this.readOnlyMou().mou_id,
      cancel_reason: reason
    });
    if (saveResult?.status == 200) {
      this._hqms.hqmsToasterService({ severity: 'success', summary: 'Cancel MoU', detail: saveResult.message });
      this.showCancel.set(false);
      await this.editmouTracker(this.readOnlyMou().mou_id);
    } else {
      this._hqms.hqmsToasterService({ severity: 'warn', summary: 'Cancel MoU', detail: saveResult?.message });
    }
  }

  goBack(): void {
    this.location.back();
  }
}
