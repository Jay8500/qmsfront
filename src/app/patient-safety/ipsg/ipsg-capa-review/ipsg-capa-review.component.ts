import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { Fancybox } from "@fancyapps/ui";

@Component({
    selector: 'app-ipsg-capa-review',
    imports: [RouterLink],
    templateUrl: './ipsg-capa-review.component.html',
    styleUrl: './ipsg-capa-review.component.scss'
})
export class IpsgCapaReviewComponent {
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
