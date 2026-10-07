import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { Fancybox } from "@fancyapps/ui";

@Component({
    selector: 'app-audits-details',
    // imports: [RouterLink],
    templateUrl: './audits-details.component.html',
})

export class AuditsDetailsComponent {

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
