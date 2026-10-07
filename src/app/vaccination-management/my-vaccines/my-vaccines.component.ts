import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
import { doseCompletionPct } from '../vaccine-master-details/vaccine-details/vaccine-details.component';
import { VaccinationCertificateService } from '../vaccination-certificate.service';
import { HistoryRecordDialogComponent } from '../history/history-record-dialog/history-record-dialog.component';
import { PolicyLinkComponent } from '../policy/policy-link/policy-link.component';

// SRS 2.4 My Vaccines: the logged-in employee's own vaccinations (read-only).
// The server returns only the session user's records when my_records = 'Y'.
@Component({
  selector: 'app-my-vaccines',
  imports: [CommonModule, FormsModule, SharedModule, HistoryRecordDialogComponent, PolicyLinkComponent],
  templateUrl: './my-vaccines.component.html'
})
export class MyVaccinesComponent implements OnInit {
  private _hqms = inject(HqmsService);
  private router = inject(Router);
  public certificateService = inject(VaccinationCertificateService);
  // Previous vaccinations sent for approval (SRS 2.x5)
  @ViewChild('recordDialog') recordDialog!: HistoryRecordDialogComponent;
  public showRecordDialog = false;
  public previousRecords: any[] = [];
  public statusTabs: string[] = ['All', 'Scheduled', 'Partially Done', 'Missed', 'Exempt', 'Declined', 'Completed'];
  public selectedTab = signal('All');
  public records = signal<any[]>([]);
  public loading = true;
  public visibleRecords = computed(() => {
    let tab = this.selectedTab();
    return tab === 'All' ? this.records() : this.records().filter((rec) => rec.status === tab);
  });
  public counts = computed(() => {
    let byStatus: { [status: string]: number } = {};
    this.records().forEach((rec) => byStatus[rec.status] = (byStatus[rec.status] || 0) + 1);
    return byStatus;
  });

  async ngOnInit() {
    this.loadPreviousRecords();
    try {
      let info: any = await this._hqms.customGetApiCall('GET', 'fnVaccinationDetailsGet', {
        "my_records": "Y",
        "page_no": 1,
        "page_size": 500
      });
      if (info?.status == 200) {
        this.records.set(info.data.map((rec: any) => ({
          vaccination_administration_id: rec.vaccination_administration_id,
          vaccine_name: rec.vaccine_name,
          scheduled_date: rec.scheduled_date || rec.next_vaccine_dt || rec.last_vaccinated_date,
          time_slot: rec.time_slot,
          venue_name: rec.venue_name,
          dosage: rec.dosage,
          dose_completion_pct: doseCompletionPct(rec),
          status: this.toSeriesStatus(rec.next_vaccine_status || rec.status),
        })));
      }
    } catch (e) {
    } finally {
      this.loading = false;
    }
  }

  async loadPreviousRecords() {
    try {
      let info: any = await this._hqms.customGetApiCall('GET', 'vaccinationHistoryApi', { "my_records": "Y" });
      this.previousRecords = info?.status == 200 ? info.data : [];
    } catch (e) { }
  }

  onAddPrevious() {
    this.recordDialog.open('MY');
  }

  async onRecordClosed(saved: boolean) {
    if (saved) await this.loadPreviousRecords();
  }

  // The SRS shows "Scheduled" where the administration record says "Pending".
  private toSeriesStatus(status: string): string {
    return status === 'Pending' ? 'Scheduled' : (status || 'Scheduled');
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'Completed': return 'badge-green';
      case 'Missed': return 'badge-red';
      case 'Declined': return 'badge-red';
      default: return 'badge-yellow';
    }
  }

  async onDownloadCertificate(rec: any) {
    await this.certificateService.download(rec.vaccination_administration_id, true);
  }

  onOpen(rec: any) {
    this.router.navigate(['/vaccine-view'], {
      state: {
        data: {
          mode: 'MY',
          id: rec.vaccination_administration_id,
          back: '/my-vaccines'
        }
      }
    });
  }
}
