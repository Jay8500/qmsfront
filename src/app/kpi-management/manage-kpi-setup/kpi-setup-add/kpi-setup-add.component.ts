import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-kpi-setup-add',
  imports: [FormsModule, NgbTooltip],
  templateUrl: './kpi-setup-add.component.html',
  styleUrl: './kpi-setup-add.component.scss'
})
export class KpiSetupAddComponent {
  selectedOptioneBenchmark: string = 'Internal';

  constructor(private router: Router) {
  }

  goBack() {
    this.router.navigate(['/kpi-dashboard']);
  }

  clearForm() {
    // Simple form clear - reset all form fields
    const form = document.querySelector('form');
    if (form) {
      form.reset();
    }
    // Reset benchmark selection to default
    this.selectedOptioneBenchmark = 'Internal';
  }

  onSubmit() {
    // Simple form submission
    console.log('Form submitted');
    console.log('Selected Benchmark:', this.selectedOptioneBenchmark);
    alert('KPI created successfully!');
    this.router.navigate(['/kpi-dashboard']);
  }
}
