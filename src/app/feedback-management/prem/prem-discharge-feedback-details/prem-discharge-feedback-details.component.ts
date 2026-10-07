import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
    selector: 'app-prem-discharge-feedback-details',
    // imports: [RouterLink],
    templateUrl: './prem-discharge-feedback-details.component.html',
    styleUrl: './prem-discharge-feedback-details.component.scss'
})
export class PremDischargeFeedbackDetailsComponent {

  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  } 
}
