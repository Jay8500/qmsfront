import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

interface auditTable {
  role: string;
  remarks: string;
  feedback: string;
}

export type SortColumn = keyof auditTable | '';
export type SortDirection = 'asc' | 'desc' | '';
const rotate: { [key: string]: SortDirection } = { asc: 'desc', desc: '', '': 'asc' };

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
    selector: 'app-employee-survey-capa',
    imports: [RouterLink, NgbdSortableHeader, NgbTooltipModule],
    templateUrl: './employee-survey-capa.component.html',
    styleUrl: './employee-survey-capa.component.scss'
})
export class EmployeeSurveyCapaComponent {

  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
            
    constructor(private location: Location) {}
  
    goBack(): void {
      this.location.back();
    }
  
    showFilter = false;
  
    filterToggle() {
      this.showFilter = !this.showFilter;
    }
  
    onSort({ column, direction }: SortEvent) {
      // resetting other headers
      for (const header of this.headers) {
        if (header.sortable !== column) {
          header.direction = '';
        }
      }
    }

    showRemarks = false;

    toggleRemarks() {
      this.showRemarks = !this.showRemarks;
    }
    
}
