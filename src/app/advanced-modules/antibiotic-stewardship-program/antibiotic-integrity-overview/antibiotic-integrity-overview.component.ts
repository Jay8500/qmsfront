import { Component } from '@angular/core';

import { Location } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-antibiotic-integrity-overview',
    imports: [NgbTooltipModule],
    templateUrl: './antibiotic-integrity-overview.component.html',
    styleUrl: './antibiotic-integrity-overview.component.scss'
})
export class AntibioticIntegrityOverviewComponent {
  showFilter: boolean = false;

  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }

  filterToggle(): void {
    this.showFilter = !this.showFilter;
  }
}
