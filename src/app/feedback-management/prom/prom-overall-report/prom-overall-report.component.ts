import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';


@Component({
    selector: 'app-prom-overall-report',
    // imports: [RouterLink],
    templateUrl: './prom-overall-report.component.html',
    styleUrl: './prom-overall-report.component.scss'
})
export class PromOverallReportComponent {
  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  } 

  showFilter = false;
        
  filterToggle() {
    this.showFilter = !this.showFilter;
  }

}
