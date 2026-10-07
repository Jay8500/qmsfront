import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';


interface auditTable {
  id: number;
  surveyName: string;
  participants: string;
  fromDate: string;
  toDate: string;
  createdOn: string;
  totalParticipants: string;
  totalSatisfactory: string;
  status: string;
}

const COUNTRIES: auditTable[] = [
  {
    id: 1,
    surveyName: 'First_Quarter_2025',
    participants: 'All',
    fromDate: '20-06-2025',
    toDate: '28-06-2025',
    createdOn: '20-06-2025 07:25:00',
    totalParticipants: '100',
    totalSatisfactory: '72%',    
    status: 'Created',
  },
  {
    id: 2,
    surveyName: 'Second_Quarter_2025',
    participants: 'All',
    fromDate: '18-06-2025',
    toDate: '18-06-2025',
    createdOn: '18-06-2025 07:25:00',
    totalParticipants: '460',
    totalSatisfactory: '72%',    
    status: 'Created',
  },
  {
    id: 3,
    surveyName: 'Third_Quarter_2025',
    participants: 'HOD',
    fromDate: '16-06-2025',
    toDate: '16-06-2025',
    createdOn: '16-06-2025 07:25:00',
    totalParticipants: '322',
    totalSatisfactory: '65%',    
    status: 'Completed',
  },
  {
    id: 4,
    surveyName: 'Fourth_Quarter_2025',
    participants: 'All',
    fromDate: '15-06-2025',
    toDate: '15-06-2025',
    createdOn: '15-06-2025 07:25:00',
    totalParticipants: '400',
    totalSatisfactory: '80%',    
    status: 'In Progress',
  },
  {
    id: 5,
    surveyName: 'First_Quarter_2025',
    participants: 'All',
    fromDate: '12-06-2025',
    toDate: '12-06-2025',
    createdOn: '12-06-2025 07:25:00',
    totalParticipants: '200',
    totalSatisfactory: '45%',    
    status: 'Completed',
  },
  {
    id: 6,
    surveyName: 'Second_Quarter_2025',
    participants: 'All',
    fromDate: '08-05-2025',
    toDate: '10-05-2025',
    createdOn: '10-05-2025 07:25:00',
    totalParticipants: '365',
    totalSatisfactory: '78%',    
    status: 'Completed',
  },
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
    selector: 'app-employee-listing',
    imports: [RouterLink, CommonModule, NgbdSortableHeader, NgbTooltipModule],
    templateUrl: './employee-listing.component.html',
    styleUrl: './employee-listing.component.scss'
})
export class EmployeeListingComponent {
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
