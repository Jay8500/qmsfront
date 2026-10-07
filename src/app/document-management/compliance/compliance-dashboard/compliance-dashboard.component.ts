import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../../layout/header/header.component';
import { CommonModule } from '@angular/common';

interface auditTable {
  id: number;
  compliance: string;
  provider: string;
  department: string;
  createdOn: string;
  lastModified: string;
  status: string;
}

const COUNTRIES: auditTable[] = [
  {
    id: 1,
    compliance: 'Hand Hygiene',
    provider: 'WHO',
    department: 'ICU',
    createdOn: '07-04-2025',
    lastModified: '07-04-2025 12:33:00',
    status: 'Active'
  },
  {
    id: 2,
    compliance: 'Operational',
    provider: 'NABH',
    department: 'Emergency',
    createdOn: '07-04-2025',
    lastModified: '07-04-2025 12:33:00',
    status: 'Expired'
  },
  {
    id: 3,
    compliance: 'Technical',
    provider: 'HIPAA',
    department: 'Nursing',
    createdOn: '07-04-2025',
    lastModified: '07-04-2025 12:33:00',
    status: 'Active'
  },
  {
    id: 4,
    compliance: 'Regulatory',
    provider: 'HIPAA',
    department: 'Radiology',
    createdOn: '07-04-2025',
    lastModified: '07-04-2025 12:33:00',
    status: 'Active'
  },
  {
    id: 5,
    compliance: 'Hand Hygiene',
    provider: 'WHO',
    department: 'Nursing',
    createdOn: '07-04-2025',
    lastModified: '07-04-2025 12:33:00',
    status: 'Expired'
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
    selector: 'app-compliance-dashboard',
    imports: [RouterLink, CommonModule, NgbdSortableHeader],
    templateUrl: './compliance-dashboard.component.html',
    styleUrl: './compliance-dashboard.component.scss'
})
export class ComplianceDashboardComponent {

  constructor() {

    }

    @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
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
