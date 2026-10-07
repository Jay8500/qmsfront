import { Component, ViewChild, CUSTOM_ELEMENTS_SCHEMA, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, signal, inject, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgApexchartsModule, ChartComponent } from "ng-apexcharts";
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart,
  ApexLegend,
  ApexFill,
  ApexStroke,
  ApexDataLabels
} from "ng-apexcharts";
import { TrainingWiseReportsComponent } from '../../../components/training-wise-reports/training-wise-reports.component';
import { ScoreWiseReportsComponent } from '../../../components/score-wise-reports/score-wise-reports.component';
export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  responsive: ApexResponsive[];
  colors: string[];
  legend: ApexLegend;
  fill: ApexFill;
  stroke?: ApexStroke;
  dataLabels?: ApexDataLabels;
};

interface trainingFeedbackTable {
  id: number;
  training_id: any;
  training_name: any;
  faculty_name: any;
  total_no_of_fbs: any;
  score: any;
  feedback_dt: any;
}

export type SortColumn = keyof trainingFeedbackTable | '';
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
  selector: 'app-feedback-dashboard',
  imports: [NgApexchartsModule, CommonModule, NgbdSortableHeader,
    TrainingWiseReportsComponent, ScoreWiseReportsComponent, SelectModule, FormsModule, SharedModule],
  templateUrl: './feedback-dashboard.component.html',
  styleUrl: './feedback-dashboard.component.scss'
})
export class FeedbackDashboardComponent implements OnInit {
  @ViewChild('areaChart') areaChart !: TrainingWiseReportsComponent;
  @ViewChild('fWseRpts') fWseRpts !: ScoreWiseReportsComponent;
  @ViewChild('scoreWiseRpt') scoreWiseRpt !: ScoreWiseReportsComponent;
  public feedbackFilterss: any = JSON.stringify({
    training_name: null,
    faculty_name: null,
    score: null,
  });
  public feedbackFilters = signal(JSON.parse(this.feedbackFilterss));
  public feedbackReportOptions: any = [
    'Last Week',
    'Last 1 Month',
    'Last 6 Months',
    'Last Year'];
      periodText: string = 'Last Week';
  public trainingNameList: any = [];
  public facultyNameList: any = [];
  public scoreList: any = [];
  public trainFeedbackGrid: trainingFeedbackTable[] = [];
  public router = inject(Router);
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;
  selectedRange: string = 'Last 30 days';
  public params: any = {};
  public copyData: any = [];
  // FORM_NAME = 'trainingRptGraphs';//
  selectedScoreReport: string = '';
  selectedFeedbkReport: string = 'Last Week';
  scoreReportOptions: any = [];
  trainingReportOptions = [
    'Last Week',
    'Last 1 Month',
    'Last 6 Months',
    'Last Year'
  ];
  constructor(public _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }
  public myChartMode = 'NEW';
  async ngOnInit() {
    try {
      // first chart
      await this.peridChartInfo(this.periodText)
      //second chart
      await this.getRFacultyWiseChart();
      // third chart
      await this.getTrainingList();
      await this.getScoreWiseRptChart(this.scoreReportOptions[0].value, 'NEW');
      await this.getTrainingGrid();
    } catch (e) { }
  }

  async getTrainingList(){
    let trainingList: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        {
          "flag": "TRAINING"
        });
      if (trainingList.status == 200) {
        this.scoreReportOptions = trainingList.data.map((ele: any) => ({
          label: ele.training_name,
          value: ele.training_id
        }));
        this.selectedScoreReport = this.scoreReportOptions[0].label;

      };
  }

  async getRFacultyWiseChart() {
    try {
      let getFcltyRptInfo: any = await this._hqms.customGetApiCall('GET', 'fnTrainingFeedbackCharts',
        {
          "flag": "FWS"
        });
      if (getFcltyRptInfo.status == 200) {
        this.fWseRpts.plotData(getFcltyRptInfo['data'], 'pie')
      }
    } catch (e) { }
  }

  async getTrainingWiseChart() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range_chart != null) {
        let dates = this.date_range_chart.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      let chartInfo: any = await this._hqms.customGetApiCall('GET', 'fnTrainingFeedbackCharts',
        {
          "flag": "TFR",
          "from_dt": fromDt,
          "to_dt": toDate,
        });
      if (this.myChartMode == 'NEW') {
        this.areaChart.plotData(chartInfo['data'], 'Feedback')
      } else {
        this.areaChart.updateSeries(chartInfo['data'], 'Feedback')
      }
    } catch (e) { }
  }

  onSort({ column, direction }: SortEvent) {
    // resetting other headers
    for (const header of this.headers) {
      if (header.sortable !== column) {
        header.direction = '';
      }
    }

    // sorting Data
    if (direction === '' || column === '') {
      this.trainFeedbackGrid = this.trainFeedbackGrid;
    } else {
      this.trainFeedbackGrid = [...this.trainFeedbackGrid].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  // Methods to handle dropdown selections
  async onScoreReportSelect(option: any) {
    this.selectedScoreReport = option.label;
    await this.getScoreWiseRptChart(option.value, 'EDIT');
  }
  public date_range_chart: any = null;

  async onTrainingReportSelect(option: string) {
    this.selectedFeedbkReport = option;
    let getSrvrDt: any = await this._hqms.getServerDate('DATE');
    let today: any = new Date(getSrvrDt);
    let endDateToday: any = new Date(getSrvrDt);
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
    await this.getTrainingWiseChart();
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
    await this.getTrainingStats();
  }

  public initailStats = JSON.stringify({
    count: 0,
    scheduled_trainings: 0,
    in_progress_percentage: 0,
    completed_percentage: 0,
    last_updated: null,
    scheduled_trainings_last_updated: null,
    in_progress_percentage_last_updated: null,
    completed_percentage_last_updated: null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getTrainingStats() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      this.trainFeedbackGrid = [];
      let getTrainingStatsInfo: any = await this._hqms.customGetApiCall('GET', 'fnTrainingFeedbackDashboardStats',
        {
          "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
          "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (getTrainingStatsInfo.status == 200) {
        getTrainingStatsInfo = getTrainingStatsInfo['data'][0];
        this.stats.set({
          count: getTrainingStatsInfo.count,
          scheduled_trainings: 0,
          in_progress_percentage: 0,
          completed_percentage: 0,
          last_updated: getTrainingStatsInfo.last_updated,
          scheduled_trainings_last_updated: getTrainingStatsInfo.scheduled_trainings_last_updated,
          in_progress_percentage_last_updated: getTrainingStatsInfo.in_progress_percentage_last_updated,
          completed_percentage_last_updated: getTrainingStatsInfo.completed_percentage_last_updated
        })
      };
    } catch (e) { };
  }

  async getTrainingGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators1();
      let fromDt = null;
      let toDate = null;
      this.trainFeedbackGrid = [];
      let totalCnt = 0;
      let info: any = await this._hqms.customGetApiCall('GET', 'fnTrainingFeedbackListApi',
        {
          // "training_id": trainingFeedbackTable.training_id,
          "action": "g",
          "page_no": pageNo,
          "page_size": pageSize,
          "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
          "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (info.status == 200) {
        let sourcedData: any = [];
        totalCnt = info.data[0]['total_row_cnt'];
        info.data.forEach((traininngPrp: any, index: number) => {
          let createTraining: any = {
            id: index + 1,
            training_id: traininngPrp.training_id,
            training_name: traininngPrp.training_name,
            faculty_name: traininngPrp.faculty_name,
            total_no_of_fbs: traininngPrp.total_no_of_fbs,
            score: traininngPrp.score,
            feedback_dt: traininngPrp.feedback_dt,
            created_by: traininngPrp.created_by,
            created_at: traininngPrp.created_at,
            updated_by: traininngPrp.updated_by,
            updated_at: traininngPrp.updated_at,
          };
          sourcedData.push(createTraining);
        });
        this.trainFeedbackGrid = [...sourcedData];
        this.copyData = [...sourcedData];
        this.trainingNameList = [...new Set(sourcedData.map((item: any) => item.training_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.facultyNameList = [...new Set(sourcedData.map((item: any) => item.faculty_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.scoreList = [...new Set(sourcedData.map((item: any) => item.score))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.pageNators1.update(current => ({
          ...current,
          totalItems: Math.ceil(totalCnt / pageSize),
          totalPages: Math.ceil(totalCnt / pageSize)
        }));
      };
    } catch (e) { };
  }

  onFilterClick() {
    let trainfilters = this.feedbackFilters();
    this.trainFeedbackGrid = this.copyData.filter((fl: any) => {
      let training_name = !trainfilters.training_name || fl['training_name'] === trainfilters.training_name;
      let faculty_name = !trainfilters.faculty_name || fl['faculty_name'] === trainfilters.faculty_name;
      let score = !trainfilters.score || fl['score'] === trainfilters.score;
      return training_name && faculty_name && score;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.feedbackFilters.set(JSON.parse(this.feedbackFilterss));
      this.trainFeedbackGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, feedbackProp: any) {
    try {
      this.router.navigate(
        [
          '/feedback-details',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: feedbackProp == null ? null : feedbackProp.training_id
            }
          }
        },
      );
    } catch (e) { };
  }

  public pageNators1 = signal({
    pageNo: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  readonly pageNumbers1 = computed(() => {
    let pages = this.pageNators1().totalPages;
    return Array.from({ length: pages }, (_, i) => i + 1);
  })

  async changePage1(newDisplayPage: number) {
    this.pageNators1.update(prev => ({ ...prev, pageNo: newDisplayPage }));
    await this.getTrainingGrid();
  }

  async peridChartInfo(option: string) {
    this.selectedFeedbkReport = option;
    let getSrvrDt: any = await this._hqms.getServerDate('DATE');
    let today: any = new Date(getSrvrDt);
    let endDateToday: any = new Date(getSrvrDt);
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
   await this.getTrainingWiseChart();
  }

  async getScoreWiseRptChart(slctdTraining: any, mode: any) {
    try {
      let getScoreWiseRptInfo: any = await this._hqms.customGetApiCall('GET', 'fnTrainingFeedbackCharts',
        {
          "training_id": slctdTraining,
          "flag": "SWR"//--Score Wise Report
        });
      if (getScoreWiseRptInfo.status == 200) { // label, value
        if (mode == 'NEW') {
          this.scoreWiseRpt.plotData(getScoreWiseRptInfo['data'], 'donut')
        } else {
          this.scoreWiseRpt.updateSeries(getScoreWiseRptInfo['data'])
        };
      }
    } catch (e) { }
  }
}
