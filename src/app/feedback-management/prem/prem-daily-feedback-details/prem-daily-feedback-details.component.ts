import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
    selector: 'app-prem-daily-feedback-details',
    // imports: [RouterLink],
    templateUrl: './prem-daily-feedback-details.component.html',
    styleUrl: './prem-daily-feedback-details.component.scss'
})
export class PremDailyFeedbackDetailsComponent {
  
  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  } 
  
}
