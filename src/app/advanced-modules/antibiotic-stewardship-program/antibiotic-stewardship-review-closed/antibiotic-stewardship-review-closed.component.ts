import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
    selector: 'app-antibiotic-stewardship-review-closed',
    templateUrl: './antibiotic-stewardship-review-closed.component.html',
    styleUrl: './antibiotic-stewardship-review-closed.component.scss'
})
export class AntibioticStewardshipReviewClosedComponent {

  constructor(private location: Location) {}
    
  goBack(): void {
    this.location.back();
  } 

  ngAfterViewInit() {
    
  }

}
