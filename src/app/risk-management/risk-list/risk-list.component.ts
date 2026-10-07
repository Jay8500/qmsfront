import { Component, input, output } from '@angular/core';
import { AppDatePipe } from '../../pipes/app-date.pipe';

// Risk register rows (fn_risk_list_get): table on desktop, cards on phones. Click opens the risk.
@Component({
  selector: 'app-risk-list',
  standalone: true,
  imports: [AppDatePipe],
  template: `
    <div class="qms-table-wrap table-responsive">
      <table class="qms-table">
        <thead>
          <tr>
            <th>Risk</th><th>Date</th><th>Type</th><th>Department / Location</th><th>Score</th><th>Status</th><th>Owners</th><th class="text-end">Open</th>
          </tr>
        </thead>
        <tbody>
          @for (r of rows(); track r.risk_id) {
          <tr class="clickable" (click)="open.emit(r)">
            <td><strong>{{ r.risk_number }}</strong>
              @if (r.source === 'INCIDENT_RULE') { <small class="d-block text-danger"><i class="pi pi-replay"></i> auto from incidents ({{ r.linked_incidents }})</small> }
              @else if (r.source === 'INCIDENT_ESCALATION') { <small class="d-block text-muted"><i class="pi pi-arrow-up-right"></i> escalated incident</small> }
            </td>
            <td>{{ r.date_of_risk | appDate:'date' }}</td>
            <td>{{ r.risk_type }}</td>
            <td>{{ r.department || '-' }}<small class="d-block text-muted">{{ r.location }}</small></td>
            <td>@if (r.score) { <span class="qms-chip" [attr.data-l]="r.risk_level">{{ r.score }} · {{ r.risk_level }}</span> } @else { <span class="text-muted">-</span> }</td>
            <td><span class="qms-chip" [attr.data-s]="r.status">{{ r.status }}</span>
              @if (r.overdue) { <small class="d-block text-danger">overdue</small> }</td>
            <td><small>{{ r.owners || '-' }}</small></td>
            <td class="text-end"><i class="pi pi-chevron-right"></i></td>
          </tr>
          } @empty {
          <tr><td colspan="8" class="text-center text-muted py-4">{{ loading() ? 'Loading ...' : 'No risks' }}</td></tr>
          }
        </tbody>
      </table>
    </div>
    <div class="qms-list-cards">
      @for (r of rows(); track r.risk_id) {
      <div class="qms-list-card" (click)="open.emit(r)">
        <div class="top">
          <strong>{{ r.risk_number }}</strong>
          <span class="qms-chip" [attr.data-s]="r.status">{{ r.status }}</span>
        </div>
        <div>{{ r.risk_type }}@if (r.score) { · <span class="qms-chip" [attr.data-l]="r.risk_level">{{ r.score }}</span> }</div>
        <div class="meta">{{ r.date_of_risk | appDate:'date' }} · {{ r.department }}@if (r.overdue) { · <span class="text-danger">overdue</span> }</div>
      </div>
      } @empty {
      <div class="qms-empty">{{ loading() ? 'Loading ...' : 'No risks' }}</div>
      }
    </div>
  `,
  styleUrls: ['../../components/qms-ui/qms-ui.scss']
})
export class RiskListComponent {
  rows = input<any[]>([]);
  loading = input<boolean>(false);
  open = output<any>();
}
