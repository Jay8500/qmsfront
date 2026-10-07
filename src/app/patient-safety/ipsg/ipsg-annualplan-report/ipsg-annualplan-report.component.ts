import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router'; 


@Component({
    selector: 'app-ipsg-annualplan-report',
    templateUrl: './ipsg-annualplan-report.component.html',
    styleUrl: './ipsg-annualplan-report.component.scss'
})
export class IpsgAnnualplanReportComponent {
  
  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }

}
