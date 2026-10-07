import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { Fancybox } from "@fancyapps/ui";

@Component({
    selector: 'app-grievance-details',
    imports: [RouterLink],
    templateUrl: './grievance-details.component.html',
    styleUrl: './grievance-details.component.scss'
})
export class GrievanceDetailsComponent {

  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }

  ngAfterViewInit() {
    Fancybox.bind('[data-fancybox="gallery"]', {
      // Optional customization
    });
  }
  
} 
