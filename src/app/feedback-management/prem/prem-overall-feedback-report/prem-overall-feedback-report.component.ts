import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
    selector: 'app-prem-overall-feedback-report',
    templateUrl: './prem-overall-feedback-report.component.html',
    styleUrl: './prem-overall-feedback-report.component.scss'
})
export class PremOverallFeedbackReportComponent {

  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  } 
  
}
