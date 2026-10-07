import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

interface auditTable {
  id: number;
  auditID: string;
  role: string;
  complaintType: string;
  complaintDescription: string;
  happenOn: string;
  status: string;
}

const COUNTRIES: auditTable[] = [
  {
    id: 1,
    auditID: 'Ayesha Khan #214534643',
    role: 'Nurse',
    complaintType: 'Rude Behavior',
    complaintDescription: 'My HOD was really rude to me even if i completed my task on time i dont know what the hell is wrong with him to me being dedicated to my work',
    happenOn: '20-04-2025 07:25:00',
    status: 'Opened'
  },
  {
    id: 2,
    auditID: 'Karthikeyan #74637094360',
    role: 'Nurse',
    complaintType: 'Rude Behavior',
    complaintDescription: 'I need a privacy while i operate, The co-worker of mine is so annoying i just want to concentrate in saving the patient so consider my compliant and take action - Name: Ramesh, assistant anesthetic',
    happenOn: '20-04-2025 07:25:00',
    status: 'Opened'
  },
  {
    id: 3,
    auditID: 'Santhosh #74637094358',
    role: 'Surgeon',
    complaintType: 'Facility',
    complaintDescription: 'In my department there is a rat damaging all the appliances but the supervisor is blaming me for that please enquiry about the happenings and give me justice',
    happenOn: '20-04-2025 07:25:00',
    status: 'Opened'
  },
  {
    id: 4,
    auditID: 'Selvakumar #7463709435',
    role: 'Kellnerin',
    complaintType: 'Misunderstanding',
    complaintDescription: 'I need a privacy while i operate, The co-worker of mine is so annoying i just want to concentrate in saving the patient so consider my compliant and take action - Name: Ramesh, assistant anesthetic',
    happenOn: '20-04-2025 07:25:00',
    status: 'Closed'
  },
  {
    id: 5,
    auditID: 'Kamlesh #74637094345',
    role: 'Lab Technician',
    complaintType: 'Facility',
    complaintDescription: 'My HOD was really rude to me even if i completed my task on time i dont know what the hell is wrong with him to me being dedicated to my work',
    happenOn: '20-04-2025 07:25:00',
    status: 'Closed'
  }
];

export type SortColumn = keyof auditTable | '';
export type SortDirection = 'asc' | 'desc' | '';
const rotate: { [key: string]: SortDirection } = { asc: 'desc', desc: '', '': 'asc' };

const compare = (v1: string | number, v2: string | number) => (v1 < v2 ? -1 : v1 > v2 ? 1 : 0);

export interface SortEvent {
  column: SortColumn;
  direction: SortDirection;
}

@Directive({
  selector: 'th[sortable]',
  standalone: true,
  host: {
    '[class.asc]': 'direction === "asc"',
    '[class.desc]': 'direction === "desc"',
    '(click)': 'rotate()',
  },
})
export class NgbdSortableHeader {
  @Input() sortable: SortColumn = '';
  @Input() direction: SortDirection = '';
  @Output() sort = new EventEmitter<SortEvent>();

  rotate() {
    this.direction = rotate[this.direction];
    this.sort.emit({ column: this.sortable, direction: this.direction });
  }
}

@Component({
    selector: 'app-grievance-listing',
    imports: [RouterLink, CommonModule, NgbdSortableHeader, NgbTooltipModule],
    templateUrl: './grievance-listing.component.html',
    styleUrl: './grievance-listing.component.scss'
})
export class GrievanceListingComponent {
  getLiArray(): any[] {
        return new Array(5); // Always show 5 circles
      }
      
  getSelectedCount(status: string): number {
    switch (status) {
      case 'Reported':
        return 5; // danger - red
      case 'In Review':
        return 3; // warning - orange
      case 'Closed':
        return 2; // success - green
      default:
        return 0; // default blue
    }
  }
  
  getImpactClass(status: string): string {
    switch (status) {
      case 'Reported':
        return 'danger';
      case 'In Review':
        return 'warning';
      case 'Closed':
        return 'success';
      default:
        return '';
    }
  }

  getImpactLabel(status: string): string {
    switch (status) {
      case 'Reported':
        return 'High';
      case 'In Review':
        return 'Medium';
      case 'Closed':
        return 'Low';
      default:
        return 'Unknown';
    }
  }
  

  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
    
      constructor(private location: Location) {}
    
      goBack(): void {
        this.location.back();
      }
    
      showFilter = false;
    
      filterToggle() {
        this.showFilter = !this.showFilter;
      }
    
      countries = COUNTRIES;
    
      onSort({ column, direction }: SortEvent) {
        // resetting other headers
        for (const header of this.headers) {
          if (header.sortable !== column) {
            header.direction = '';
          }
        }
    
        // sorting countries
        if (direction === '' || column === '') {
          this.countries = COUNTRIES;
        } else {
          this.countries = [...COUNTRIES].sort((a, b) => {
            const res = compare(a[column], b[column]);
            return direction === 'asc' ? res : -res;
          });
        }
      }
}
