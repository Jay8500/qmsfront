import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgApexchartsModule } from "ng-apexcharts";

import { UnitWiseReportsComponent } from '../../../components/unit-wise-reports/unit-wise-reports.component';
import { ReviewerRatingScoreComponent } from '../../../components/reviewer-rating-score/reviewer-rating-score.component';
import { SelfReviewerScoreComponent } from '../../../components/self-reviewer-score/self-reviewer-score.component';

@Component({
    selector: 'app-staff-competency-dashboard',
    imports: [RouterLink, NgApexchartsModule, UnitWiseReportsComponent, ReviewerRatingScoreComponent, SelfReviewerScoreComponent],
    templateUrl: './staff-competency-dashboard.component.html',
    styleUrl: './staff-competency-dashboard.component.scss'
})
export class StaffCompetencyDashboardComponent {

    showFilter = false;

    filterToggle() {
      this.showFilter = !this.showFilter;
    }

    // Filter Dropdown
  selectedRange: string = 'Last 30 Days';
  setRange(value: string) {
    this.selectedRange = value;
  }

}
