import { Location, CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, signal, inject, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DatePipe } from '@angular/common';

interface reportDetailTable {
  id: number;
  report_id: any;
  employee_name: any;
  department_role: any;
  pre_assessment_score: any;
  post_assessment_score: any;
  total_score: any;
  attendance: any;
  status: any;
  fb_questions: any;
};

export type SortColumn = '';
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
  selector: 'app-reports-details',
  imports: [CommonModule, FormsModule, NgbdSortableHeader, SelectModule, SharedModule],
  templateUrl: './reports-details.component.html',
})
export class ReportsDetailsComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    employee_name: null,
    department_role: null,
    status: null,
  });
  public reportFilters = signal(JSON.parse(this.intialFilters));
  public empNameList: any = [];
  public departList: any = [];
  public statusList: any = [];
  public reportDetGrid: reportDetailTable[] = [];
  public router = inject(Router);
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;
  public copyData: any = [];
  public params: any = {};
  constructor(public _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe, private location: Location) { }

  onSort({ column, direction }: SortEvent) {
    // resetting other headers
    for (const header of this.headers) {
      if (header.sortable !== column) {
        header.direction = '';
      }
    }
    // sorting data
    if (direction === '' || column === '') {
      this.readOnlyReport().fb_questions = this.readOnlyReport().fb_questions;
    } else {
      this.readOnlyReport().fb_questions = [... this.readOnlyReport().fb_questions].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  public readOnlyReport: any = signal({
    "action": "v",
    "report_id": null,
    "training_name": null,
    "faculty_name": null,
    "mode_of_training": null,
    "venue_name": null,
    "training_period": null,
    "time": null,
    "status": null,
    "fb_questions": [],
  })

  async ngOnInit() {
    try {
      let state = history.state;
        await this.getTrainingViews(state['data']['id']);
    } catch (e) { };
  }


  onFilterClick() {
    let filters = this.reportFilters();
    this.reportDetGrid = this.copyData.filter((fl: any) => {
      let employee_name = !filters.employee_name || fl['employee_name'] === filters.employee_name;
      let department_role = !filters.department_role || fl['department_role'] === filters.department_role;
      let status = !filters.status || fl['status'] === filters.status;
      return employee_name && department_role && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.reportFilters.set(JSON.parse(this.intialFilters));
      this.reportDetGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }


  goBack(): void {
    this.location.back();
  }


  //Previous Code
  public trainingGrid: any = [];
  public pageMode: string = 'VIEW';

  showFeedbackDetails = false;

  toggleFeedbackDetails() {
    this.showFeedbackDetails = !this.showFeedbackDetails;
  }

  async getTrainingViews(trainingSchId: string) {
    try {
      this.trainingGrid = [];
      let info: any = await this._hqms.customGetApiCall('GET', 'fnTrainingWiseReportGet',
        {
          "training_schedule_id": trainingSchId
        });
      if (info.status == 200) {
         this.readOnlyReport.set({
            "action": "v",
            "training_name": info.data[0]['training_name'],
            "faculty_name": info.data[0]['faculty_name'],
            "mode_of_training": info.data[0]['mode_of_training'],
            "venue_name": info.data[0]['venue_name'],
            "from_dt": info.data[0]['from_dt'],
            "to_dt": info.data[0]['to_dt'],
            "status": info.data[0]['status'],
            "fb_questions": info.data[0]['fb_questions'],
            "training_period": info.data[0]['training_period'],
            "time": info.data[0]['total_training_hours'],
            "attendees": info.data[0]['attendees'],
          });
        // this.empNameList = [...new Set(sourcedData[0].attendees.map((item: any) => item.employee_name))].map((name, index) => ({
        //   label: name,
        //   value: name
        // }));
        // this.departList = [...new Set(sourcedData[0].attendees.map((item: any) => item.department_role))].map((name, index) => ({
        //   label: name,
        //   value: name
        // }));
        // this.statusList = [...new Set(sourcedData[0].attendees.map((item: any) => item.status))].map((name, index) => ({
        //   label: name,
        //   value: name
        // }));
      };
    } catch (e) {
    };
  }

}
