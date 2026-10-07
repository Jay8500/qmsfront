import { Component } from '@angular/core';

import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-staff-competency-listing',
    templateUrl: './staff-competency-listing.component.html',
    styleUrl: './staff-competency-listing.component.scss'
})
export class StaffCompetencyListingComponent {

 constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }


  downloadReport() {
    // Handle download report
    console.log('Download report clicked');
  }
}
