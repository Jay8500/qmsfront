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
  status: string;
}

const COUNTRIES: auditTable[] = [
  {
    id: 1,
    auditID: '#7463736',
    department: 'Patient',
    auditor: 'ICU-2nd Floor',
    auditee: 'Anita Christina(3422)',
    auditDate: '07-04-2025 12:33:00',
    compliance: 'Power Supply Issue',
    status: 'Opened',
  },
  {
    id: 2,
    auditID: '#7463735',
    department: 'Attender',
    auditor: 'Blood Bank-1st Floor',
    auditee: 'Sivaraman Krishnan(3422)',
    auditDate: '07-04-2025 12:33:00',
    compliance: 'Lab Machine Not Working',
    status: 'Assigned To',
  },
  {
    id: 3,
    auditID: '#7463734',
    department: 'Staff',
    auditor: 'Bill Counter',
    auditee: 'Abinaya(3422)',
    auditDate: '07-04-2025 12:33:00',
    compliance: 'Printer Issue',
    status: 'Investigation',
  },
  {
    id: 4,
    auditID: '#7463733',
    department: 'Visitor',
    auditor: 'Entrance Gate-1',
    auditee: 'Ramesh Kumar(3422)',
    auditDate: '07-04-2025 12:33:00',
    compliance: 'Bike Parking Full',
    status: 'Closed',
  },
  {
    id: 5,
    auditID: '#7464120',
    department: 'Pediatrics',
    auditor: 'Mr.Mukesh Kumar(2856)',
    auditee: 'Anita Christina(3422)',
    auditDate: '07-04-2025 12:33:00',
    compliance: '83%',
    status: 'Closed',
  },

  {
    id: 6,
    auditID: '#7463720',
    department: 'Patient',
    auditor: 'ICU-2nd Floor',
    auditee: 'Anita Christina(3422)',
    auditDate: '07-04-2025 12:33:00',
    compliance: 'Power Supply Issue',
    status: 'Opened',
  },
  {
    id: 7,
    auditID: '#7463726',
    department: 'Attender',
    auditor: 'Blood Bank-1st Floor',
    auditee: 'Sivaraman Krishnan(3422)',
    auditDate: '07-04-2025 12:33:00',
    compliance: 'Lab Machine Not Working',
    status: 'Assigned To',
  },
  {
    id: 8,
    auditID: '#7463727',
    department: 'Staff',
    auditor: 'Bill Counter',
    auditee: 'Abinaya(3422)',
    auditDate: '07-04-2025 12:33:00',
    compliance: 'Printer Issue',
    status: 'Investigation',
  },
  {
    id: 9,
    auditID: '#7463728',
    department: 'Visitor',
    auditor: 'Entrance Gate-1',
    auditee: 'Ramesh Kumar(3422)',
    auditDate: '07-04-2025 12:33:00',
    compliance: 'Bike Parking Full',
    status: 'Closed',
  },
  {
    id: 10,
    auditID: '#7463727',
    department: 'Attender',
    auditor: 'Mr.Mukesh Kumar(2856)',
    auditee: 'Anita Christina(3422)',
    auditDate: '07-04-2025 12:33:00',
    compliance: '83%',
    status: 'Opened',
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
    selector: 'app-incident-listing',
    imports: [RouterLink, CommonModule, NgbdSortableHeader],
    templateUrl: './incident-listing.component.html',
    styleUrl: './incident-listing.component.scss'
})
export class IncidentListingComponent {

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