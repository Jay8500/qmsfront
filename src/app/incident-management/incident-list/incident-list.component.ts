import { Component, input, output } from '@angular/core';
import { AppDatePipe } from '../../pipes/app-date.pipe';

// Incident rows (fn_incident_list_get): table on desktop, cards on phones. Click opens the incident.
@Component({
  selector: 'app-incident-list',
  standalone: true,
  imports: [AppDatePipe],
  template: `
    <div class="qms-table-wrap table-responsive">
      <table class="qms-table">
        <thead>
          <tr>
            <th>Incident</th>
            <th>Date</th>
            <th>Type</th>
            <th>Happened To</th>
            <th>Department / Location</th>
            <th>Status</th>
            <th>With</th>
            <th class="text-end">Open</th>
          </tr>
        </thead>
        <tbody>
          @for (r of rows(); track r.incident_id) {
          <tr class="clickable" (click)="open.emit(r)">
            <td><strong>{{ r.incident_code }}</strong>
              @if (r.report_form && r.report_form !== 'GENERAL') { <small class="d-block text-muted">{{ formName(r.report_form) }}</small> }
              @if (r.risk_numbers) { <small class="d-block text-danger"><i class="pi pi-link"></i> {{ r.risk_numbers }}</small> }
            </td>
            <td>{{ r.incident_date | appDate }}</td>
            <td>{{ r.incident_type }}</td>
            <td>{{ r.happened_to }}@if (r.happened_to_name) { <small class="d-block text-muted">{{ r.happened_to_name }}</small> }</td>
            <td>{{ r.department || '-' }}<small class="d-block text-muted">{{ r.location }}</small></td>
            <td><span class="qms-chip" [attr.data-s]="r.status">{{ r.status }}</span>
              @if (r.days_open !== null && r.days_open !== undefined) { <small class="d-block text-muted">{{ r.days_open }} d open</small> }
            </td>
            <td>{{ r.pending_with || '-' }}</td>
            <td class="text-end"><i class="pi pi-chevron-right"></i></td>
          </tr>
          } @empty {
          <tr><td colspan="8" class="text-center text-muted py-4">{{ loading() ? 'Loading ...' : 'No incidents' }}</td></tr>
          }
        </tbody>
      </table>
    </div>
    <div class="qms-list-cards">
      @for (r of rows(); track r.incident_id) {
      <div class="qms-list-card" (click)="open.emit(r)">
        <div class="top">
          <strong>{{ r.incident_code }}</strong>
          <span class="qms-chip" [attr.data-s]="r.status">{{ r.status }}</span>
        </div>
        <div>{{ r.incident_type }} · {{ r.happened_to }}</div>
        <div class="meta">{{ r.incident_date | appDate }} · {{ r.department || r.location }}@if (r.pending_with) { · with {{ r.pending_with }} }</div>
      </div>
      } @empty {
      <div class="qms-empty">{{ loading() ? 'Loading ...' : 'No incidents' }}</div>
      }
    </div>
  `,
  styleUrls: ['../../components/qms-ui/qms-ui.scss']
})
export class IncidentListComponent {
  rows = input<any[]>([]);
  loading = input<boolean>(false);
  open = output<any>();

  formName(code: string) {
    return ({ BLOOD_TRANSFUSION: 'Blood Transfusion Reaction', ADR: 'Adverse Drug Reaction', MEDICAL_ERROR: 'Medical Error' } as any)[code] || code;
  }
}
