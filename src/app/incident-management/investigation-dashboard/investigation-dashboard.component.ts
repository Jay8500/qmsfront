import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HqmsService } from '../../services/hqms.service';
import { SharedModule } from '../../shared/shared.module';
import { IncidentListComponent } from '../incident-list/incident-list.component';

// My Investigations: incidents waiting for the logged-in user - assigned for investigation (Investigation
// Officer), waiting for HOD review (Department Head), to assign / close (Quality Team) - plus the ones they
// handled before. Data: fn_incident_list_get (queue MINE / status filter).
@Component({
  selector: 'app-investigation-dashboard',
  standalone: true,
  imports: [SharedModule, IncidentListComponent],
  templateUrl: './investigation-dashboard.component.html',
  styleUrls: ['../../components/qms-ui/qms-ui.scss']
})
export class InvestigationDashboardComponent implements OnInit {
  private _hqms = inject(HqmsService);
  private router = inject(Router);

  public tab = signal<'MINE' | 'ALL'>('MINE');
  public rows = signal<any[]>([]);
  public loading = signal(false);

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      const res: any = await this._hqms.customGetApiCall('GET', 'incidentReportApi', {
        queue: this.tab() === 'MINE' ? 'MINE' : null, page_no: 1, page_size: 200
      });
      this.rows.set(res?.status == 200 && Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      this.rows.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async setTab(t: 'MINE' | 'ALL') {
    this.tab.set(t);
    await this.load();
  }

  open(r: any) {
    const page = r.status === 'Under Investigation' ? '/investigation' : '/incident-details';
    this.router.navigate([page], { state: { data: { mode: 'VIEW', id: r.incident_id } } });
  }
}
