import { Component } from '@angular/core';

import { Router, RouterLink } from '@angular/router';
import { PatientFallRateReportComponent } from '../../../components/patient-fall-rate-report/patient-fall-rate-report.component';

@Component({
    selector: 'app-kpi-reports-details',
    imports: [ PatientFallRateReportComponent],
    templateUrl: './kpi-reports-details.component.html',
    styleUrl: './kpi-reports-details.component.scss'
})
export class KpiReportsDetailsComponent {
  constructor(private router: Router) {
           
  }

  // Navigation method
  goBack() {
    this.router.navigate(['/kpi-reports-dashboard']);
  }

  // Download method
  downloadReport() {
    console.log('Downloading KPI report...');
    // Implement download functionality
    alert('Downloading KPI Detail Report...');
  }
}
