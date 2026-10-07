import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

interface auditTable {
  id: number;
  auditID: string;
  age: string;
  room: string;
  unit: string;
  diagnosis: string;
  period: string;
  care: string
  type: string
}

const COUNTRIES: auditTable[] = [
  {
    id: 1,
    auditID: 'Thangamani #7463736',
    age: '36 / F',
    room: '102',
    unit: 'Orthopedic',
    diagnosis: 'Leg Fracture - Accident',
    period: '07-04-2025 to 07-04-2025',
    care: 'Yes',
    type: 'General'
  },
  {
    id: 2,
    auditID: 'Thangamani #7463736',
    age: '36 / F',
    room: '102',
    unit: 'Orthopedic',
    diagnosis: 'Leg Fracture - Accident',
    period: '07-04-2025 to 07-04-2025',
    care: 'Yes',
    type: 'General'
  },
  {
    id: 3,
    auditID: 'Thangamani #7463736',
    age: '36 / F',
    room: '102',
    unit: 'Orthopedic',
    diagnosis: 'Leg Fracture - Accident',
    period: '07-04-2025 to 07-04-2025',
    care: 'Yes',
    type: 'General'
  },
  {
    id: 4,
    auditID: 'Thangamani #7463736',
    age: '36 / F',
    room: '102',
    unit: 'Orthopedic',
    diagnosis: 'Leg Fracture - Accident',
    period: '07-04-2025 to 07-04-2025',
    care: 'No',
    type: 'General'
  },
  {
    id: 5,
    auditID: 'Thangamani #7463736',
    age: '36 / F',
    room: '102',
    unit: 'Orthopedic',
    diagnosis: 'Leg Fracture - Accident',
    period: '07-04-2025 to 07-04-2025',
    care: 'No',
    type: 'General'
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
    selector: 'app-prom-listing',
    imports: [RouterLink, NgbdSortableHeader, NgbTooltipModule],
    templateUrl: './prom-listing.component.html',
    styleUrl: './prom-listing.component.scss'
})

export class PromListingComponent {
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
