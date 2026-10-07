import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
interface assessmentTable {
  id: number;
  assessment_id: any;
  training_name: string;
  assessment_type: any;
  total_score: any;
  total_questions: any;
  pass_mark: any;
  created_at: any;
  modified_at: any;
  status: string;
}
export type SortColumn = keyof assessmentTable | '';
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
  selector: 'app-assessment-dashboard',
  imports: [CommonModule, NgbdSortableHeader, SelectModule, FormsModule, SharedModule],
  templateUrl: './assessment-dashboard.component.html'
})
export class AssessmentDashboardComponent implements OnInit {
  public intialFilters: any = JSON.stringify({
    training_name: null,
    assessment_type: null,
    status: null,
  });
  public assessmentFilters = signal({ ...JSON.parse(this.intialFilters) });
  public trainingNameList: any = [];
  public assessmentList: any = [];
  public statusList: any = [];
  public assessmenttGrid: any = [];
  public router = inject(Router);
  public params: any = {};
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;

  // Filter Dropdown
  selectedRange: string = 'Last 30 days';
  public copyData: any = [];

  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
      await this.setRange(this.selectedRange);
      await this.getAssessmentGrid();
    } catch (e) { }
  }

  onSort({ column, direction }: SortEvent) {
    // resetting other headers
    for (const header of this.headers) {
      if (header.sortable !== column) {
        header.direction = '';
      }
    }
    // sorting data
    if (direction === '' || column === '') {
      this.assessmenttGrid = this.assessmenttGrid;
    } else {
      this.assessmenttGrid = [...this.assessmenttGrid].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  public date_range: any = null;
  async setRange(value: string) {
    this.selectedRange = value;
    let getSrvrDt: any = await this._hqms.getServerDate('DATE');
    let today: any = new Date(getSrvrDt);
    let endDateToday: any = new Date();
    let prev7Day: any = null;
    this.date_range = null;
    this.selectedRange = value;
    switch (value) {
      case 'Last 7 days':
        prev7Day = new Date(today.setDate(today.getDate() - 7));
        this.date_range = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 30 days':
        prev7Day = new Date(today.setDate(today.getDate() - 30));
        this.date_range = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last Month':
        let firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        let lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        this.date_range = `${this._datePipe.transform(firstDayLastMonth, "dd-MMM-yyyy")} - ${this._datePipe.transform(lastDayLastMonth, "dd-MMM-yyyy")}`;
        break;
      case 'Last 6 Months':
        prev7Day = new Date(today.setDate(today.getDate() - 180));
        this.date_range = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last Year':
        prev7Day = new Date(today.setDate(today.getDate() - 365));
        this.date_range = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
    };
    await this.getAssessmentStats();
  }

  public initailStats = JSON.stringify({
    no_of_training: 0,
    no_of_faculty: 0,
    average_questions: 0,
    average_pass_mark: 0,
    no_of_training_last_updated: null,
    no_of_faculty_last_updated: null,
    average_questions_last_updated: null,
    average_pass_mark_last_updated: null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getAssessmentStats() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      this.assessmenttGrid = [];
      let getAssessmentStats: any = await this._hqms.customGetApiCall('GET', 'fnTrainingScheduleDashboardStatsGet',
        {
          "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
          "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (getAssessmentStats.status == 200) {
        getAssessmentStats = getAssessmentStats['data'][0];
        this.stats.set({
          no_of_training: getAssessmentStats.total_training,
          no_of_faculty: getAssessmentStats.total_faculty,
          average_questions: getAssessmentStats.avg_questions_per_assessment,
          average_pass_mark: getAssessmentStats.avg_pass_mark_percent,
          no_of_training_last_updated: getAssessmentStats.total_training_last_updated,
          no_of_faculty_last_updated: getAssessmentStats.total_faculty_last_updated,
          average_questions_last_updated: getAssessmentStats.avg_questions_last_updated,
          average_pass_mark_last_updated: getAssessmentStats.avg_pass_mark_percent_last_updated
        })
      };
    } catch (e) { };
  }

  async getAssessmentGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.assessmenttGrid = [];
      let totalCnt = 0;
      let flag = {
        "only_active": true
      }
      this.params = { ...flag }
      let getAssessmentList: any = await this._hqms.customGetApiCall('GET', 'assessmentApi',
        flag);
      if (getAssessmentList.status == 200) {
        let sourcedData: any = [];
        totalCnt = getAssessmentList.data[0]['table_row_cnt'];
        getAssessmentList.data.forEach((assessments: any, index: number) => {
          let createAssessments: any = {
            id: index + 1,
            assessment_template_id: assessments.assessment_template_id,
            training_name: assessments.training_name,
            assessment_type: assessments.assessment_type_name,
            total_score: assessments.total_score,
            total_questions: assessments.total_questions,
            pass_mark: assessments.pass_mark,
            created_by: assessments.created_by,
            created_at: assessments.created_at,
            updated_by: assessments.updated_by,
            updated_at: assessments.updated_at,
            status: assessments.status,
          };
          sourcedData.push(createAssessments);
        });
        this.assessmenttGrid = [...sourcedData];
        this.copyData = [...sourcedData];

        this.trainingNameList = [...new Set(sourcedData.map((item: any) => item.training_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.assessmentList = [...new Set(sourcedData.map((item: any) => item.assessment_type))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.statusList = [...new Set(sourcedData.map((item: any) => item.status))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.pageNators.update(current => ({
          ...current,
          totalItems: Math.ceil(totalCnt / pageSize),
          totalPages: Math.ceil(totalCnt / pageSize)
        }));
      };
    } catch (e) { };
  }

  onFilterClick() {
    let filters = this.assessmentFilters();
    this.assessmenttGrid = this.copyData.filter((fl: any) => {
      let training_name = !filters.training_name || fl['training_name'] === filters.training_name;
      let assessment_type = !filters.assessment_type || fl['assessment_type'] === filters.assessment_type;
      let status = !filters.status || fl['status'] === filters.status;
      return training_name && assessment_type && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.assessmentFilters.set(JSON.parse(this.intialFilters));
      this.assessmenttGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, assessment: any) {
    try {
      // if (assessment != null) {
      //   if (assessment['status'] == 'Inactive') {
      //     this._hqms.hqmsToasterService({
      //       severity: 'success',
      //       summary: 'Assessment',
      //       detail: 'Inactive record not for edit',
      //     });
      //     return;
      //   };
      // };
      this.router.navigate(
        [
          pageMode == 'VIEW' ? '/assessment-details' : '/add-assessment',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: assessment == null ? null : assessment.assessment_template_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(assessment: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${assessment.training_name}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "training_id": assessment.training_id,
        "assessment_template_id": assessment.assessment_template_id,
        // "assessment_id": assessment.assessment_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "assessmentApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Training',
          detail: saveResult.message,
        });
        // this.assessmenttGrid = [...this.copyData.filter((fl: any) => fl.assessment_template_id != assessment.assessment_template_id)];
        this.assessmenttGrid.forEach((ele: any) => {
          if (ele.assessment_template_id == assessment.assessment_template_id) {
            ele['status'] = 'Inactive';
          };
        });
      };
    };
  }

  public pageNators = signal({
    pageNo: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  readonly pageNumbers = computed(() => {
    let pages = this.pageNators().totalPages;
    return Array.from({ length: pages }, (_, i) => i + 1);
  })

  async changePage(newDisplayPage: number) {
    this.pageNators.update(prev => ({ ...prev, pageNo: newDisplayPage }));
    await this.assessmenttGrid();
  }
}
