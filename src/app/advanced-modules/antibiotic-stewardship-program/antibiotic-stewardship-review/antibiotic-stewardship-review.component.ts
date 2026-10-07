import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
    selector: 'app-antibiotic-stewardship-review',
    imports: [RouterLink],
    templateUrl: './antibiotic-stewardship-review.component.html',
    styleUrl: './antibiotic-stewardship-review.component.scss'
})
export class AntibioticStewardshipReviewComponent {
  
  constructor(private location: Location) {}
    
  goBack(): void {
    this.location.back();
  } 

  ngAfterViewInit() {
    
  }
  
}
