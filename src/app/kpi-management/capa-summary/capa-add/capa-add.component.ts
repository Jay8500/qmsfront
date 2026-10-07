import { Component } from '@angular/core';

import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-capa-add',
    imports: [ FormsModule],
    templateUrl: './capa-add.component.html',
    styleUrl: './capa-add.component.scss'
})
export class CapaAddComponent {
  
  constructor(private router: Router) {
    console.log('Initial selectedOptionEntry:', this.selectedOptionEntry);
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

  selectedOptionEntry: string = 'dataMultiple';

  // Method to handle radio button selection change
  onDataEntryChange(option: string) {
    this.selectedOptionEntry = option;
    console.log('Selected data entry option:', option);
  }

}
