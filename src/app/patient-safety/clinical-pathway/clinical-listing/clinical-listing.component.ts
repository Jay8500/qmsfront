import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

interface auditTable {
  id: number;
  uhID: string;
  cpType: string;
  consultant: string;
  doa: string;
  dos: string;
  dod: string;
  compliance: string;
  status: string;
}

const COUNTRIES: auditTable[] = [
  {
    id: 1,
    uhID: 'Ayesha Khan #214534643',
    cpType: 'CABG',
    consultant: 'Dr. Mukesh Kumar(2856)',
    doa: '07-04-2025',
    dos: '07-04-2025',
    dod: '07-04-2025',
    compliance: '80%',
    status: 'Draft'
  },
  {
    id: 2,
    uhID: 'Vinita Sharma #214534646',
    cpType: 'TKR',
    consultant: 'Dr. Karthkeyan(2888)',
    doa: '07-04-2025',
    dos: '07-04-2025',
    dod: '07-04-2025',
    compliance: '80%',
    status: 'Submitted'
  },
  {
    id: 3,
    uhID: 'Ajaykumar #214534640',
    cpType: 'Dialysis',
    consultant: 'Dr. Vinoth(2832)',
    doa: '07-04-2025',
    dos: '07-04-2025',
    dod: '07-04-2025',
    compliance: '80%',
    status: 'Submitted'
  },
  {
    id: 4,
    uhID: 'Karthikeyan #214534635',
    cpType: 'Chemotherapy',
    consultant: 'Dr. Selva Kumar(2835)',
    doa: '07-04-2025',
    dos: '07-04-2025',
    dod: '07-04-2025',
    compliance: '80%',
    status: 'Draft'
  },
  {
    id: 5,
    uhID: 'Gayathiri #214534640',
    cpType: 'Stroke',
    consultant: 'Dr. Kaviya (2845)',
    doa: '07-04-2025',
    dos: '07-04-2025',
    dod: '07-04-2025',
    compliance: '80%',
    status: 'Draft'
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
    selector: 'app-clinical-listing',
    imports: [RouterLink, CommonModule, NgbdSortableHeader, NgbTooltipModule],
    templateUrl: './clinical-listing.component.html',
    styleUrl: './clinical-listing.component.scss'
})
export class ClinicalListingComponent {
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
