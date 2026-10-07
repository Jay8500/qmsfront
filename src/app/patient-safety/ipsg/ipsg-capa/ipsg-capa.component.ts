import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { Fancybox } from "@fancyapps/ui";

@Component({
    selector: 'app-ipsg-capa',
    imports: [RouterLink],
    templateUrl: './ipsg-capa.component.html',
    styleUrl: './ipsg-capa.component.scss'
})
export class IpsgCapaComponent {
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
