import { Component } from '@angular/core';

import { Router, RouterLink } from '@angular/router';

@Component({
    selector: 'app-reports-nominee-view',
    templateUrl: './reports-nominee-view.component.html',
    styleUrl: './reports-nominee-view.component.scss'
})
export class ReportsNomineeViewComponent {

  constructor(private router: Router) {
             
    }
  
    // Navigation method
    goBack() {
      this.router.navigate(['/schedule-committee-meetings-dashboard']);
    }
  
    // Download method
    downloadReport() {
      console.log('Downloading meeting report...');
      // Implement download functionality
      alert('Downloading Meeting Report...');
    }
    
}
