import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';

interface auditTable {
  id: number;
  auditID: string;
  department: string;
  auditor: string;
  auditee: string;
  auditDate: string;
  compliance: string;
  impact: string;
  status: string;
}

const COUNTRIES: auditTable[] = [
  {
    id: 1,
    auditID: '#7463736',
    department: 'Operational',
    auditor: 'ICU-2nd Floor',
    auditee: 'Anita Christina(3422)',
    auditDate: '07-04-2025 12:33:00',
    compliance: '-',
    impact: 'High',
    status: 'Reported',
  },
  {
    id: 2,
    auditID: '#746372',
    department: 'Financial',
    auditor: 'Billing Counter',
    auditee: 'Sivaraman Krishnan(3422)',
    auditDate: '07-04-2025 12:33:00',
    compliance: '-',
    impact: 'Medium',
    status: 'In Review',
  },
  {
    id: 3,
    auditID: '#7463730',
    department: 'Environmental',
    auditor: 'ICU-2nd Floor',
    auditee: 'Abinaya(3422)',
    auditDate: '07-04-2025 12:33:00',
    compliance: '-',
    impact: 'High',
    status: 'Closed',
  },
  {
    id: 4,
    auditID: '#7463736',
    department: 'Operational',
    auditor: 'ICU-2nd Floor',
    auditee: 'Anita Christina(3422)',
    auditDate: '07-04-2025 12:33:00',
    compliance: '-',
    impact: 'High',
    status: 'Reported',
  },
  {
    id: 5,
    auditID: '#746372',
    department: 'Financial',
    auditor: 'Billing Counter',
    auditee: 'Sivaraman Krishnan(3422)',
    auditDate: '07-04-2025 12:33:00',
    compliance: '-',
    impact: 'Medium',
    status: 'In Review',
  },
  {
    id: 6,
    auditID: '#7463730',
    department: 'Environmental',
    auditor: 'ICU-2nd Floor',
    auditee: 'Abinaya(3422)',
    auditDate: '07-04-2025 12:33:00',
    compliance: '-',
    impact: 'High',
    status: 'Closed',
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
    selector: 'app-risk-listing',
    imports: [RouterLink, CommonModule, NgbdSortableHeader],
    templateUrl: './risk-listing.component.html',
    styleUrl: './risk-listing.component.scss'
})
export class RiskListingComponent {
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
