import { Component, ViewChild, CUSTOM_ELEMENTS_SCHEMA, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, inject, signal, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../../../layout/header/header.component';
import { NgApexchartsModule, ChartComponent } from "ng-apexcharts";
import { ComparisonBarchartComponent } from '../../../components/comparison-barchart/comparison-barchart.component';
import { ReportPiechartComponent } from '../../../components/report-piechart/report-piechart.component';
import { CommonModule } from '@angular/common';
import { TypeRiskchartComponent } from '../../../components/type-riskchart/type-riskchart.component';
import { OverallRiskchartComponent } from '../../../components/overall-riskchart/overall-riskchart.component';
import { RolewiseFeedbacksComponent } from '../../../components/rolewise-feedbacks/rolewise-feedbacks.component';
import { SatisfactionReportComponent } from '../../../components/satisfaction-report/satisfaction-report.component';
import { DissatisfactionReportComponent } from '../../../components/dissatisfaction-report/dissatisfaction-report.component';
import { DepartmentRiskComponent } from '../../../components/department-risk/department-risk.component';
import { ComplaintsNumberComponent } from '../../../components/complaints-number/complaints-number.component';
import { GrievanceComplaintTypeComponent } from '../../../components/grievance-complaint-type/grievance-complaint-type.component';
import { ParticipantsReportComponent } from '../../../components/participants-report/participants-report.component';
import { HqmsService } from '../../../services/hqms.service';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';
import { ScoreWiseReportsComponent } from '../../../components/score-wise-reports/score-wise-reports.component';
import { TrainingWiseReportsComponent } from '../../../components/training-wise-reports/training-wise-reports.component';

interface grievanceTable {
  id: number;
  complaint_id: any;
  full_name: any;
  role_name: any;
  complaint_type_name: any;
  description: any;
  happened_on: any;
  status: any;
}

export type SortColumn = keyof grievanceTable | '';
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
  selector: 'app-grievance-dashboard',
  imports: [CommonModule, NgbdSortableHeader, SelectModule, FormsModule, SharedModule, ScoreWiseReportsComponent, TrainingWiseReportsComponent,
    GrievanceComplaintTypeComponent],
  templateUrl: './grievance-dashboard.component.html',
  styleUrl: './grievance-dashboard.component.scss',
})
export class GrievanceDashboardComponent {
  @ViewChild("chart") chart!: ChartComponent;
  @ViewChild('scoreWiseRpts') scoreWiseRpts !: ScoreWiseReportsComponent;
  @ViewChild('areaChart') areaChart !: TrainingWiseReportsComponent;
  @ViewChild('complaintType') complaintType !: GrievanceComplaintTypeComponent;
  public router = inject(Router);
  public intialFilters: any = JSON.stringify({
    full_name: null,
    role_name: null,
    complaint_type_name: null,
    status: null
  });
  public grievanceFilters = signal(JSON.parse(this.intialFilters));
  public empProfileList: any = [];
  public roleList: any = [];
  public compliantTypeList: any = [];
  public statusList: any = [];
  selectedRange: string = 'Last 30 days';
  public grievanceGrid: any = [];
  public copyData: any = [];
  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) {
  }
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;

  showFilter = false;
  onSort({ column, direction }: SortEvent) {
    // resetting other headers
    for (const header of this.headers) {
      if (header.sortable !== column) {
        header.direction = '';
      }
    }
    // sorting data
    if (direction === '' || column === '') {
      this.grievanceGrid = this.grievanceGrid;
    } else {
      this.grievanceGrid = [...this.grievanceGrid].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  // Filter toggle
  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  async ngOnInit() {
    try {
      await this.setRange(this.selectedRange);
      await this.depWiseComplaints();
      await this.noOfComplaints();
      await this.complaintTypeCharts();
    } catch (e) { }
  }

  async depWiseComplaints() {
    try {
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnFbComplaintCharts',
        {
          "flag": "DWC"
        });
      if (adChrt.status == 200) {
        this.scoreWiseRpts.plotData(adChrt['data'], 'pie')
      }
    } catch (e) { }
  }

  async noOfComplaints() {
    try {
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnFbComplaintCharts',
        {
          "flag": "NOC"
        });
      if (adChrt.status == 200) {
        this.areaChart.plotData(adChrt['data'], 'Complaints');
      }
    } catch (e) { }
  }

  async complaintTypeCharts() {
    try {
      let cType: any = await this._hqms.customGetApiCall('GET', 'fnFbComplaintCharts',
        {
          "flag": "TOC"
        });
      if (cType.status == 200) {
        this.complaintType.plotData(cType['data']);
      };
    } catch (e) { }
  }

  public date_range: any = null;
  async setRange(value: string) {
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
    await this.getGrievanceStats();
    await this.getGrievanceGrid();
  }

  public initailStats = JSON.stringify({
    "total_emp_cnt": 0,
    "active_compliants_cnt": 0,
    "closed_compliants_cnt": 0,
    "overall_complaints_cnt": 0,
    "total_emp_last_updated": null,
    "active_compliants_last_updated": null,
    "closed_compliants_last_updated": null,
    "overall_complaints_last_updated": null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getGrievanceStats() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      let statsParam = {
        "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
        "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
      };
      let statInfo: any = await this._hqms.customGetApiCall('GET', 'fnFbComplaintDashboardStats', statsParam);
      if (statInfo.status == 200) {
        this.stats.set({
          "total_emp_cnt": statInfo['data'][0].total_emp_cnt || 0,
          "active_compliants_cnt": statInfo['data'][0].active_compliants_cnt || 0,
          "closed_compliants_cnt": statInfo['data'][0].closed_compliants_cnt || 0,
          "overall_complaints_cnt": statInfo['data'][0].overall_complaints_cnt || 0,
          "total_emp_last_updated": statInfo['data'][0].total_emp_last_updated,
          "active_compliants_last_updated": statInfo['data'][0].active_compliants_last_updated,
          "closed_compliants_last_updated": statInfo['data'][0].closed_compliants_last_updated,
          "overall_complaints_last_updated": statInfo['data'][0].overall_complaints_last_updated,
        })
      };
    } catch (e) {
    };
  }

  onFilterClick() {
    let filters = this.grievanceFilters();
    this.grievanceGrid = this.copyData.filter((fl: any) => {
      let full_name = !filters.full_name || fl['full_name'] === filters.full_name;
      let role_name = !filters.role_name || fl['role_name'] === filters.role_name;
      let complaint_type_name = !filters.complaint_type_name || fl['complaint_type_name'] === filters.complaint_type_name;
      let status = !filters.status || fl['status'] === filters.status;
      return full_name && role_name && complaint_type_name && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.grievanceFilters.set(JSON.parse(this.intialFilters));
      this.grievanceGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, grievanceDashboard: any) {
    try {
      this.router.navigate(
        [
          pageMode == 'VIEW' ? '/grievance-view' : (pageMode == 'NEW') ? '/grievance-add' : '/grievance-details',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: grievanceDashboard == null ? null : grievanceDashboard.complaint_id
            }
          }
        },
      );
    } catch (e) { };
  }


  public pageNators = signal({
    pageNo: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  readonly pageNumbers = computed(() => {
    let pages = this.pageNators().totalItems;
    return Array.from({ length: pages }, (_, i) => i + 1);
  })
  public params: any = {}

  async getGrievanceGrid() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      let totalCnt = 0;
      let { pageNo, pageSize } = this.pageNators();
      this.grievanceGrid = [];
      let flags: any = {
        // "page_no": pageNo,
        // "page_size": pageSize,
        // "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
        // "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
      }
      this.params = { ...flags }
      let essInfo: any = await this._hqms.customGetApiCall('GET', 'fnComplaintApi', this.params);
      if (essInfo.status == 200) {
        let sourcedData: any = [];
        totalCnt = essInfo.data[0]['total_row_cnt'];
        essInfo.data.forEach((adtInfo: any, index: number) => {
          let crtEssGrid: any = {
            id: index + 1,
            complaint_id: adtInfo.complaint_id,
            full_name: adtInfo.full_name,
            role_name: adtInfo.role_name,
            complaint_type_name: adtInfo.complaint_type_name,
            description: adtInfo.description,
            happened_on: adtInfo.happened_on,
            created_by: adtInfo.created_by,
            created_at: adtInfo.created_at,
            updated_at: adtInfo.updated_at,
            updated_by: adtInfo.updated_by,
            status: adtInfo.status,
          };
          sourcedData.push(crtEssGrid);
        });
        this.grievanceGrid = [...sourcedData];
        this.copyData = [...sourcedData];
        this.empProfileList = [...new Set(sourcedData.map((item: any) => item.full_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.roleList = [...new Set(sourcedData.map((item: any) => item.role_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.compliantTypeList = [...new Set(sourcedData.map((item: any) => item.complaint_type_name))].map((name, index) => ({
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
    } catch (e) {

    };
  }

  async changePage(newDisplayPage: number) {
    this.pageNators.update(prev => ({ ...prev, pageNo: newDisplayPage }));
    await this.getGrievanceGrid();
  }
}
