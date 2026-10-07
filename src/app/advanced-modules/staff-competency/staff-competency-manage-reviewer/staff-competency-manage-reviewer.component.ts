import { Component} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';


@Component({
    selector: 'app-staff-competency-manage-reviewer',
    // imports: [RouterLink, DecimalPipe],
    templateUrl: './staff-competency-manage-reviewer.component.html',
    styleUrl: './staff-competency-manage-reviewer.component.scss'
})
export class StaffCompetencyManageReviewerComponent {

  constructor(private location: Location) {}
      
    goBack(): void {
      this.location.back();
    }
  
    showFilter = false;
  
    filterToggle() {
      this.showFilter = !this.showFilter;
    }
}
