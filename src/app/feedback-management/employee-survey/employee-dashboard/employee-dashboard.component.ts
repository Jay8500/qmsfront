import { Component, ViewChild, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SatisfactionReportComponent } from '../../../components/satisfaction-report/satisfaction-report.component';
import { HqmsService } from '../../../services/hqms.service';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';
import { ScoreWiseReportsComponent } from '../../../components/score-wise-reports/score-wise-reports.component';
import { TrainingWiseReportsComponent } from '../../../components/training-wise-reports/training-wise-reports.component';
// import { HeaderComponent } from '../../../components/header/header.component';
// import { NgApexchartsModule, ChartComponent } from "ng-apexcharts";
// import { ComparisonBarchartComponent } from '../../../components/comparison-barchart/comparison-barchart.component';
// import { ReportPiechartComponent } from '../../../components/report-piechart/report-piechart.component';
// import { ParticipantsReportComponent } from '../../../components/participants-report/participants-report.component';
// import { RolewiseFeedbacksComponent } from '../../../components/rolewise-feedbacks/rolewise-feedbacks.component';

interface essTable {
  id: number;
  ess_survey_id: any;
  survey_name: any;
  participants_type_name: any;
  from_date: any;
  to_date: any;
  created_at: any;
  total_participants_cnt: any;
  total_satisfactory_cnt: any;
  status: any;
}
export type SortColumn = keyof essTable | '';
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
  selector: 'app-employee-dashboard',
  imports: [CommonModule, NgbdSortableHeader, SelectModule, FormsModule, SharedModule, SatisfactionReportComponent, TrainingWiseReportsComponent, ScoreWiseReportsComponent
  ],
  // RolewiseFeedbacksComponent,ParticipantsReportComponent
  templateUrl: './employee-dashboard.component.html',
  styleUrl: './employee-dashboard.component.scss',
})
export class EmployeeDashboardComponent {
  @ViewChild('scoreWiseRpt') scoreWiseRpt !: ScoreWiseReportsComponent;
  @ViewChild('satisfactionRpt') satisfactionRpt !: SatisfactionReportComponent;
  @ViewChild('prtcpntChrt') prtcpntChrt !: TrainingWiseReportsComponent;
  public router = inject(Router);
  public intialFilters: any = JSON.stringify({
    survey_name: null,
    participants_type_name: null,
    status: null
  });
  public essFilters = signal(JSON.parse(this.intialFilters));
  public surveyNameList: any = [];
  public participantsList: any = [];
  public statusList: any = [];
  selectedRange: string = 'Last 30 days';
  public essGrid: any = [];
  public copyData: any = [];
  slctdPrtcpnt: string = 'Last Week';
  slctdSatfctn: string = 'Last Week';
  public myChartMode = 'NEW';
  partcpntOptns = [
    'Last Week',
    'Last 1 Month',
    'Last 6 Months',
    'Last Year'
  ];
  satisfctnOptns = [
    'Last Week',
    'Last 1 Month',
    'Last 6 Months',
    'Last Year'
  ];
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
      this.essGrid = this.essGrid;
    } else {
      this.essGrid = [...this.essGrid].sort((a, b) => {
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
      await this.roleWiseFdbckCharts();
      await this.stsonParticipantsRptSlct(this.slctdSatfctn);
      await this.onParticipantsRptSlct(this.slctdPrtcpnt);
    } catch (e) { }
  }

  async roleWiseFdbckCharts() {
    try {
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnFbEssCharts',
        {
          "flag": "RWF"
        });
      if (adChrt.status == 200) {
        this.scoreWiseRpt.plotData(adChrt['data'], 'donut')//
      }
    } catch (e) { }
  }

  public date_range_chart: any = null;
  async onParticipantsRptSlct(option: string) {
    this.slctdPrtcpnt = option;
    let getSrvrDt: any = await this._hqms.getServerDate('DATE');
    let today: any = new Date(getSrvrDt);
    let endDateToday: any = new Date();
    let prev7Day: any = null;
    this.date_range_chart = null;
    switch (option) {
      case 'Last Week':
        prev7Day = new Date(today.setDate(today.getDate() - 7));
        this.date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 1 Month':
        this.myChartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 30));
        this.date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 6 Months':
        this.myChartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 180));
        this.date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last Year':
        this.myChartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 365));
        this.date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
    };
    await this.prticipntRptCharts();
  }

  async prticipntRptCharts() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range_chart != null) {
        let dates = this.date_range_chart.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnFbEssCharts',
        {
          "flag": "PR",
          "from_dt": fromDt,
          "toDate": toDate,
        });
      if (this.myChartMode == 'NEW') {
        this.prtcpntChrt.plotData(adChrt['data'], 'Participants');
      } else {
        this.prtcpntChrt.updateSeries(adChrt['data'], 'Participants');
      }
    } catch (e) { }
  }

  async satisfactionCharts() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range_chart != null) {
        let dates = this.date_range_chart.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnFbEssCharts',
        {
          "flag": "SR",
          "from_dt": fromDt,
          "toDate": toDate,
        });
      if (this.myChartMode == 'NEW') {
        this.satisfactionRpt.plotData(adChrt['data']);
      } else {
        this.satisfactionRpt.updateSeries(adChrt['data']);
      };
    } catch (e) { }
  }

  public stsdate_range_chart: any = null;
  async stsonParticipantsRptSlct(option: string) {
    this.slctdSatfctn = option;
    let getSrvrDt: any = await this._hqms.getServerDate('DATE');
    let today: any = new Date(getSrvrDt);
    let endDateToday: any = new Date();
    let prev7Day: any = null;
    this.stsdate_range_chart = null;
    switch (option) {
      case 'Last Week':
        prev7Day = new Date(today.setDate(today.getDate() - 7));
        this.stsdate_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 1 Month':
        this.myChartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 30));
        this.stsdate_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 6 Months':
        this.myChartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 180));
        this.stsdate_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last Year':
        this.myChartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 365));
        this.stsdate_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
    };
    await this.satisfactionCharts();
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
    await this.getEssStats();
    await this.getEssGrid();
  }

  public initailStats = JSON.stringify({
    "overall_surveys_cnt": 0,
    "emp_surveys_cnt": 0,
    "satisfactory_rate": 0,
    "completed_surveys_cnt": 0,
    "overall_surveys_last_updated": null,
    "emp_surveys_last_updated": null,
    "satisfactory_rate_last_updated": null,
    "completed_surveys_last_updated": null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getEssStats() {
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
      let statInfo: any = await this._hqms.customGetApiCall('GET', 'fnEssSurveyDashboardGet', statsParam);
      if (statInfo.status == 200) {
        this.stats.set({
          "overall_surveys_cnt": statInfo['data'].overall_surveys_cnt || 0,
          "emp_surveys_cnt": statInfo['data'].emp_surveys_cnt || 0,
          "satisfactory_rate": statInfo['data'].satisfactory_rate || 0,
          "completed_surveys_cnt": statInfo['data'].completed_surveys_cnt || 0,
          "overall_surveys_last_updated": statInfo['data'].overall_surveys_last_updated,
          "emp_surveys_last_updated": statInfo['data'].emp_surveys_last_updated,
          "satisfactory_rate_last_updated": statInfo['data'].satisfactory_rate_last_updated,
          "completed_surveys_last_updated": statInfo['data'].completed_surveys_last_updated,
        })
      };
    } catch (e) {
    };
  }

  onFilterClick() {
    let filters = this.essFilters();
    this.essGrid = this.copyData.filter((fl: any) => {
      let survey_name = !filters.survey_name || fl['survey_name'] === filters.survey_name;
      let participants_type_name = !filters.participants_type_name || fl['participants_type_name'] === filters.participants_type_name;
      let status = !filters.status || fl['status'] === filters.status;
      return survey_name && participants_type_name && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.essFilters.set(JSON.parse(this.intialFilters));
      this.essGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, essDashboard: any) {
    try {
      this.router.navigate(
        [
          pageMode == 'VIEW' ? '/employee-details' : (pageMode == 'NEW') ? '/employee-survey-add' : '/employee-survey-capa',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: essDashboard == null ? null : essDashboard.ess_survey_id
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

  async getEssGrid() {
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
      this.essGrid = [];
      let flags: any = {
        // "page_no": pageNo,
        // "page_size": pageSize,
        // "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
        // "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
      }
      this.params = { ...flags }
      let essInfo: any = await this._hqms.customGetApiCall('GET', 'fnEssSurveyApi', this.params);
      if (essInfo.status == 200) {
        let sourcedData: any = [];
        totalCnt = essInfo.data[0]['total_row_cnt'];
        essInfo.data.forEach((adtInfo: any, index: number) => {
          let crtEssGrid: any = {
            id: index + 1,
            ess_survey_id: adtInfo.ess_survey_id,
            survey_name: adtInfo.survey_name,
            participants_type_name: adtInfo.participants_type_name,
            from_date: adtInfo.from_date,
            to_date: adtInfo.to_date,
            total_participants_cnt: adtInfo.total_participants_cnt,
            total_satisfactory_cnt: adtInfo.total_satisfactory_cnt,
            status: adtInfo.status,
            created_by: adtInfo.created_by,
            created_at: adtInfo.created_at,
            updated_by: adtInfo.updated_by,
            updated_at: adtInfo.updated_at,
          };
          sourcedData.push(crtEssGrid);
        });
        this.essGrid = [...sourcedData];
        this.copyData = [...sourcedData];
        this.surveyNameList = [...new Set(sourcedData.map((item: any) => item.survey_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.participantsList = [...new Set(sourcedData.map((item: any) => item.participants_type_name))].map((name, index) => ({
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
    await this.getEssGrid();
  }

}

