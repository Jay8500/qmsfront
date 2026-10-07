import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

interface antibioticTable {
  id: number;
  uhid: string;
  age: string;
  diagnosis: string;
  consultant: string;
  antibioticsGiven: string;
  consultantsJustification: string;
  dateOfEntry: string;
  status: string;
}

const ANTIBIOTIC_DATA: antibioticTable[] = [
  {
    id: 1,
    uhid: 'Seetha Lakshmi #7463736',
    age: '36 / F',
    diagnosis: 'Leg Fracture - Accident',
    consultant: 'Kamaraj (32421)',
    antibioticsGiven: 'CARBAPENEM 0.25ml',
    consultantsJustification: 'Based on Culture report',
    dateOfEntry: '15-07-2025',
    status: 'Pending'
  },
  {
    id: 2,
    uhid: 'Lawrence Kannan #7463709',
    age: '48 / M',
    diagnosis: 'Pacemaker Replacement',
    consultant: 'Nagesh (23422)',
    antibioticsGiven: 'COLISTIN / POLYMYXIN B 0.15ml',
    consultantsJustification: 'Failed narrow spectrum antibiotics',
    dateOfEntry: '12-07-2025',
    status: 'Under Review'
  },
  {
    id: 3,
    uhid: 'Joseph Kracken Smith #7463736',
    age: '36 / F',
    diagnosis: 'Knee Displacement - Accident',
    consultant: 'Adhitya (35921)',
    antibioticsGiven: 'AMPHOTERICIN B 0.50ml',
    consultantsJustification: 'Septic Shock / Sepsis',
    dateOfEntry: '10-07-2025',
    status: 'Closed'
  },
  {
    id: 4,
    uhid: 'Marie Curie #7463709',
    age: '48 / M',
    diagnosis: 'Pacemaker Replacement',
    consultant: 'Yugesh (32556)',
    antibioticsGiven: 'VANCOMYCIN / TEICOPLANIN 0.15ml',
    consultantsJustification: 'Others - Side Effects are High',
    dateOfEntry: '05-07-2025',
    status: 'Closed'
  },
  {
    id: 5,
    uhid: 'Kamika Singh #7463736',
    age: '22 / F',
    diagnosis: 'Crushed shoulder boulder',
    consultant: 'Adhitya (35921)',
    antibioticsGiven: 'AMPHOTERICIN B 0.20ml',
    consultantsJustification: 'Septic Shock / Sepsis',
    dateOfEntry: '12-06-2025',
    status: 'Under Review'
  }
];

export type SortColumn = keyof antibioticTable | '';
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
    selector: 'app-antibiotic-stewardship-dashboard',
    imports: [CommonModule, NgbdSortableHeader, RouterLink],
    templateUrl: './antibiotic-stewardship-dashboard.component.html',
    styleUrl: './antibiotic-stewardship-dashboard.component.scss'
})
export class AntibioticStewardshipDashboardComponent {
  constructor(private router: Router) {
           
  }
    
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  antibioticData = ANTIBIOTIC_DATA;
  
  onSort({ column, direction }: SortEvent) {
    // resetting other headers
    for (const header of this.headers) {
      if (header.sortable !== column) {
        header.direction = '';
      }
    }

    // sorting data
    if (direction === '' || column === '') {
      this.antibioticData = ANTIBIOTIC_DATA;
    } else {
      this.antibioticData = [...ANTIBIOTIC_DATA].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  showFilter = false;
  
  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  // Navigation methods based on status
  viewDetails(item: antibioticTable) {
    console.log('View Details clicked for:', item.uhid, 'Status:', item.status);
    switch(item.status) {
      case 'Pending':
        this.router.navigate(['/antibiotic-stewardship-review'], { 
          queryParams: { uhid: item.uhid, status: item.status }
        });
        break;
      case 'Under Review':
        this.router.navigate(['/antibiotic-stewardship-review-under-review'], { 
          queryParams: { uhid: item.uhid, status: item.status }
        });
        break;
      case 'Closed':
        this.router.navigate(['/antibiotic-stewardship-review-closed'], { 
          queryParams: { uhid: item.uhid, status: item.status }
        });
        break;
      default:
        console.warn('Unknown status:', item.status);
    }
  }

  editItem(item: antibioticTable) {
    console.log('Action clicked for:', item.uhid, 'Status:', item.status);
    // For edit, we can use the same routing logic or a different approach
    switch(item.status) {
      case 'Pending':
        this.router.navigate(['/antibiotic-stewardship-review'], { 
          queryParams: { uhid: item.uhid, status: item.status, mode: 'edit' }
        });
        break;
      case 'Under Review':
        this.router.navigate(['/antibiotic-stewardship-review-under-review'], { 
          queryParams: { uhid: item.uhid, status: item.status, mode: 'edit' }
        });
        break;
      case 'Closed':
        this.router.navigate(['/antibiotic-stewardship-review-closed'], { 
          queryParams: { uhid: item.uhid, status: item.status, mode: 'view-report' }
        });
        break;
      default:
        console.warn('Unknown status:', item.status);
    }
  }

  // Helper method to get status-specific action text
  getActionText(status: string): string {
    switch(status) {
      case 'Pending':
        return 'Edit';
      case 'Under Review':
        return 'Update Review';
      case 'Closed':
        return 'View Report';
      default:
        return 'Edit';
    }
  }

  // Helper method to get status-specific icon
  getActionIcon(status: string): string {
    switch(status) {
      case 'Pending':
        return 'lucide:edit';
      case 'Under Review':
        return 'lucide:edit';
      case 'Closed':
        return 'lucide:file-text';
      default:
        return 'lucide:edit';
    }
  }

  // Filter Dropdown
  selectedRange: string = 'Last 30 Days';
  setRange(value: string) {
    this.selectedRange = value;
  }
}
