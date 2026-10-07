import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
    selector: 'app-antibiotic-stewardship-review-under-review',
    imports: [RouterLink],
    templateUrl: './antibiotic-stewardship-review-under-review.component.html',
    styleUrl: './antibiotic-stewardship-review-under-review.component.scss'
})
export class AntibioticStewardshipReviewUnderReviewComponent {

  constructor(private location: Location) {}
    
  goBack(): void {
    this.location.back();
  } 

  ngAfterViewInit() {
    
  }

  
}
