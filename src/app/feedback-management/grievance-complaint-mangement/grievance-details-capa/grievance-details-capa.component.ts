import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { Fancybox } from "@fancyapps/ui";

@Component({
    selector: 'app-grievance-details-capa',
    imports: [RouterLink],
    templateUrl: './grievance-details-capa.component.html',
    styleUrl: './grievance-details-capa.component.scss'
})
export class GrievanceDetailsCapaComponent {

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
