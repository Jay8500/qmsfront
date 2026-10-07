import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

interface auditTable {
  id: number;
  mouNo: string;
  organization: string;
  agreement: string;
  expiry: string;
  documents: string;
  status: string;
}

const COUNTRIES: auditTable[] = [
  {
    id: 1,
    mouNo: '2025-9089248',
    organization: 'LIFO Technologies',
    agreement: '07-04-2025',
    expiry: '07-04-2026',
    documents: 'NABH_MoU_Certificate_20256546.pdf',
    status: 'Expired'
  },
  {
    id: 2,
    mouNo: '2025-9089248',
    organization: 'Global Hospital',
    agreement: '07-04-2025',
    expiry: '07-04-2026',
    documents: 'NABH_MoU_Certificate_20256546.pdf',
    status: 'Expired'
  },
  {
    id: 3,
    mouNo: '2025-9089248',
    organization: 'Suvarna Technosoft',
    agreement: '07-04-2025',
    expiry: '07-04-2026',
    documents: 'NABH_MoU_Certificate_20256546.pdf',
    status: 'Active'
  },
  {
    id: 4,
    mouNo: '2025-9089248',
    organization: 'Kanmani Pharma Co',
    agreement: '07-04-2025',
    expiry: '07-04-2026',
    documents: 'NABH_MoU_Certificate_20256546.pdf',
    status: 'Expired'
  },
  {
    id: 5,
    mouNo: '2025-9089248',
    organization: 'Soft Teche',
    agreement: '07-04-2025',
    expiry: '07-04-2026',
    documents: 'NABH_MoU_Certificate_20256546.pdf',
    status: 'Active'
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
    selector: 'app-mou-tracker-listing',
    imports: [RouterLink, CommonModule, NgbdSortableHeader, NgbTooltipModule],
    templateUrl: './mou-tracker-listing.component.html',
})
export class MouTrackerListingComponent {

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
