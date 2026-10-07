import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';


interface auditTable {
  id: number;
  training: string;
  mode: string;
  venue: string;
  fromTime: string;
  toTime: string;
}

const COUNTRIES: auditTable[] = [
  {
    id: 1,
    training: 'Basic Chiropractic Session',
    mode: 'Online',
    venue: 'Seminar Hall',
    fromTime: '09:00 am - 10:30 am',
    toTime: '12 Hrs'
  },
  {
    id: 2,
    training: 'Diet Plan Regularity',
    mode: 'Offline',
    venue: 'Manual',
    fromTime: '09:00 am - 10:30 am',
    toTime: '12 Hrs'
  },
  {
    id: 3,
    training: 'Patient Wellness',
    mode: 'Online',
    venue: 'Seminar Hall',
    fromTime: '09:00 am - 10:30 am',
    toTime: '12 Hrs'
  },
  {
    id: 4,
    training: 'Treatment Protocol',
    mode: 'Offline',
    venue: '2nd Floor - RD',
    fromTime: '09:00 am - 10:30 am',
    toTime: '12 Hrs'
  },
  {
    id: 5,
    training: 'Basic Chiropractic Session',
    mode: 'Online',
    venue: '2nd Floor - RD',
    fromTime: '09:00 am - 10:30 am',
    toTime: '12 Hrs'
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
    selector: 'app-attendance-listing',
    imports: [ NgbdSortableHeader],
    templateUrl: './attendance-listing.component.html'
})
export class AttendanceListingComponent {

  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }

  showFilter = false;

  filterToggle() {
    this.showFilter = !this.showFilter;
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

}
