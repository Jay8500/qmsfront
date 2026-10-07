import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
    selector: 'app-compliance-details',
    // imports: [RouterLink],
    templateUrl: './compliance-details.component.html',
    styleUrl: './compliance-details.component.scss'
})
export class ComplianceDetailsComponent {

  constructor(private location: Location) {}
  
  goBack(): void {
    this.location.back();
  } 

  ngAfterViewInit() {
    
  }

}
