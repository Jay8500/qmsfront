import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { Fancybox } from "@fancyapps/ui";

@Component({
    selector: 'app-clinical-pathway-audit',
    imports: [RouterLink],
    templateUrl: './clinical-pathway-audit.component.html',
    styleUrl: './clinical-pathway-audit.component.scss'
})
export class ClinicalPathwayAuditComponent {
  
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
