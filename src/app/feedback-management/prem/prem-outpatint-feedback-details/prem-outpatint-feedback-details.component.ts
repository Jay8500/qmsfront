import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
    selector: 'app-prem-outpatint-feedback-details',
    // imports: [RouterLink],
    templateUrl: './prem-outpatint-feedback-details.component.html',
    styleUrl: './prem-outpatint-feedback-details.component.scss'
})
export class PremOutpatintFeedbackDetailsComponent {

  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  } 
}
