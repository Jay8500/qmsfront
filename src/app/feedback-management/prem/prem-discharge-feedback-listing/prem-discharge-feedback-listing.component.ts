import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

interface auditTable {
  id: number;
  auditID: string;
  department: string;
  suggestions: string;
  compliance: string;
  auditDate: string;
  status: string;
}

const COUNTRIES: auditTable[] = [
  {
    id: 1,
    auditID: '#7463736',
    department: 'ICU',
    suggestions: 'Staff behavior was unprofessional and made me uncomfortable.',
    compliance: 'Staff behavior was unprofessional and made me uncomfortable.',
    auditDate: '07-04-2025 12:33:00',
    status: 'Resolved',
  },
  {
    id: 2,
    auditID: '#746377',
    department: 'ICU',
    suggestions: 'Staff behavior was unprofessional and made me uncomfortable.',
    compliance: 'Staff behavior was unprofessional and made me uncomfortable.',
    auditDate: '07-04-2025 12:33:00',
    status: 'Resolved',
  },
  {
    id: 3,
    auditID: '#7463738',
    department: 'ICU',
    suggestions: 'Staff behavior was unprofessional and made me uncomfortable.',
    compliance: 'Staff behavior was unprofessional and made me uncomfortable.',
    auditDate: '07-04-2025 12:33:00',
    status: 'Review',
  },
  {
    id: 4,
    auditID: '#7463739',
    department: 'ICU',
    suggestions: 'Staff behavior was unprofessional and made me uncomfortable.',
    compliance: 'Staff behavior was unprofessional and made me uncomfortable.',
    auditDate: '07-04-2025 12:33:00',
    status: 'Resolved',
  },
  {
    id: 5,
    auditID: '#746310',
    department: 'ICU',
    suggestions: 'Staff behavior was unprofessional and made me uncomfortable.',
    compliance: 'Staff behavior was unprofessional and made me uncomfortable.',
    auditDate: '07-04-2025 12:33:00',
    status: 'Resolved',
  },
  {
    id: 6,
    auditID: '#7463713',
    department: 'ICU',
    suggestions: 'Staff behavior was unprofessional and made me uncomfortable.',
    compliance: 'Staff behavior was unprofessional and made me uncomfortable.',
    auditDate: '07-04-2025 12:33:00',
    status: 'Resolved',
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
    selector: 'app-prem-discharge-feedback-listing',
    imports: [RouterLink, CommonModule, NgbdSortableHeader, NgbTooltipModule],
    templateUrl: './prem-discharge-feedback-listing.component.html',
    styleUrl: './prem-discharge-feedback-listing.component.scss'
})
export class PremDischargeFeedbackListingComponent {
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
