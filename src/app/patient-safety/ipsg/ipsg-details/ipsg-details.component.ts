import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { Fancybox } from "@fancyapps/ui";

@Component({
    selector: 'app-ipsg-details',
    templateUrl: './ipsg-details.component.html',
    styleUrl: './ipsg-details.component.scss'
})
export class IpsgDetailsComponent {
  
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
