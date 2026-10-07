import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PatientFallRateReportComponent } from '../../../components/patient-fall-rate-report/patient-fall-rate-report.component';

@Component({
    selector: 'app-write-capa-common',
    imports: [FormsModule, PatientFallRateReportComponent],
    templateUrl: './write-capa-common.component.html',
    styleUrl: './write-capa-common.component.scss'
})
export class WriteCapaCommonComponent {

  constructor(private router: Router) {
           
  }  

  // Navigation method
  goBack() {
    this.router.navigate(['/capa-dashboard']);
  }

  // Form methods
  clearForm() {
    // Reset all form fields to default values
    const form = document.querySelector('form');
    if (form) {
      form.reset();
    }
  }

  onSubmit() {
    console.log('Form submitted');
    // Navigate back to dashboard after submission
    this.router.navigate(['/capa-dashboard']);
  }

}
