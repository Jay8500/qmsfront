import { Component, CUSTOM_ELEMENTS_SCHEMA,  Directive, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header.component';
import { ComparisonBarchartComponent } from '../../components/comparison-barchart/comparison-barchart.component';
import { ReportPiechartComponent } from '../../components/report-piechart/report-piechart.component';
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
		department: 'Blood Bank',
		auditor: 'Mr.Mukesh Kumar(2856)',
		auditee: 'Anita Christina(3422)',
    auditDate: '07-04-2025 12:33:00',
    compliance: '83%',
    status: 'Draft',
	},
  {
		id: 2,
		auditID: '#7463854',
		department: 'ICU',
		auditor: 'Mr.Mukesh Kumar(2856)',
		auditee: 'Anita Christina(3422)',
    auditDate: '07-04-2025 12:33:00',
    compliance: '83%',
    status: 'Submitted',
	},
  {
		id: 3,
		auditID: '#7463987',
		department: 'Surgery',
		auditor: 'Mr.Mukesh Kumar(2856)',
		auditee: 'Anita Christina(3422)',
    auditDate: '07-04-2025 12:33:00',
    compliance: '83%',
    status: 'Submitted',
	},
  {
		id: 4,
		auditID: '#7464012',
		department: 'Radiology',
		auditor: 'Mr.Mukesh Kumar(2856)',
		auditee: 'Anita Christina(3422)',
    auditDate: '07-04-2025 12:33:00',
    compliance: '83%',
    status: 'Submitted',
	},
  {
		id: 5,
		auditID: '#7464120',
		department: 'Pediatrics',
		auditor: 'Mr.Mukesh Kumar(2856)',
		auditee: 'Anita Christina(3422)',
    auditDate: '07-04-2025 12:33:00',
    compliance: '83%',
    status: 'Draft',
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
    selector: 'app-audits-dashboard',
    imports: [RouterLink, ComparisonBarchartComponent, ReportPiechartComponent, CommonModule, NgbdSortableHeader],
    templateUrl: './audits-dashboard.component.html',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AuditsDashboardComponent {

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
