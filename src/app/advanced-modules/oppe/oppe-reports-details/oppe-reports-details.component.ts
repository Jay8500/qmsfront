import { Component} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

import { OppePerformanceReportsComponent } from '../../../components/oppe-performance-reports/oppe-performance-reports.component';
import { PerformanceOverYearsComponent } from '../../../components/performance-over-years/performance-over-years.component';
import { ComparisonReportsComponent } from '../../../components/comparison-reports/comparison-reports.component';

@Component({
    selector: 'app-oppe-reports-details',
    imports: [OppePerformanceReportsComponent, PerformanceOverYearsComponent, ComparisonReportsComponent],
    templateUrl: './oppe-reports-details.component.html',
    styleUrl: './oppe-reports-details.component.scss'
})
export class OppeReportsDetailsComponent {

  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
