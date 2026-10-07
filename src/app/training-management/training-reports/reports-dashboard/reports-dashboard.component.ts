import { Component, ViewChild, CUSTOM_ELEMENTS_SCHEMA, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, signal, inject, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../../../layout/header/header.component';
import { NgApexchartsModule } from "ng-apexcharts";
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ScoreWiseReportsComponent } from '../../../components/score-wise-reports/score-wise-reports.component';
// import { FacultyWiseReportsComponent } from '../../../components/faculty-wise-reports/faculty-wise-reports.component';
import { TrainingWiseReportsComponent } from '../../../components/training-wise-reports/training-wise-reports.component';

interface trainingTable {
  id: number;
  training_id: any;
  training_name: any;
  faculty_name: any;
  mode_of_training: any;
  period: any;
  batch: any;
  training_hours: any;
  status: any;
}

interface employeeTable {
  id: number;
  employee_id: any;
  employee_name: any;
  role: any;
  trainings_attended: any;
  total_certifications: any;
  last_attended: any;
}

export type SortColumn = keyof trainingTable | '';
export type SortColumn1 = keyof employeeTable | '';
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
  selector: 'app-reports-dashboard',
  imports: [NgApexchartsModule, CommonModule, NgbdSortableHeader, ScoreWiseReportsComponent,
    TrainingWiseReportsComponent, SelectModule, FormsModule, SharedModule],
  // FacultyWiseReportsComponent
  templateUrl: './reports-dashboard.component.html',
  styleUrl: './reports-dashboard.component.scss'
})
export class ReportsDashboardComponent implements OnInit {
  @ViewChild('scoreWiseRpt') scoreWiseRpt !: ScoreWiseReportsComponent;
  @ViewChild('scoreWiseRpts') scoreWiseRpts !: ScoreWiseReportsComponent;
  @ViewChild('areaChart') areaChart !: TrainingWiseReportsComponent;
  public trainingFilterss: any = JSON.stringify({
    training_name: null,
    faculty_name: null,
    mode_of_training: null,
    status: null,
  });
  public employeeFilterss: any = JSON.stringify({
    employee_name: null,
    role: null,
  });
  public trainingFilters = signal(JSON.parse(this.trainingFilterss));
  public employeeFilters = signal(JSON.parse(this.employeeFilterss));
  public trainingNameList: any = [];
  public facultyNameList: any = [];
  public modeOfTrainingList: any = [];
  public statusList: any = [];
  public employeeNameList: any = [];
  public roleList: any = [];
  public trainingGrid: trainingTable[] = [];
  public employeeGrid: employeeTable[] = [];
  public router = inject(Router);
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;
  selectedRange: string = 'Last 30 days';
  public copyData: any = [];
  public copyDataTwo: any = [];
  FORM_NAME = 'trainingRptGraphs';
  selectedScoreReport: string = '';
  selectedTrainingReport: string = 'Last Week';
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
      await this.setRange(this.selectedRange);
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
        await this.getScoreWiseRptChart(this.scoreReportOptions[0].value, 'NEW');
      };
      await this.getFcltyWiseRptChart();
      await this.onTrainingReportSelect(this.selectedTrainingReport)
      await this.getTrainingGrid();
      await this.getEmployeeGrid();
    } catch (e) { }
  }

  async getScoreWiseRptChart(slctdTraining: any, mode: any) {
    try {
      let getScoreWiseRptInfo: any = await this._hqms.customGetApiCall('GET', 'fnTrainingReportApi',
        {
          "training_id": slctdTraining,
          "flag": "SWR"//--Score Wise Report
        });
      if (getScoreWiseRptInfo.status == 200) { // label, value
        if (mode == 'NEW') {
          this.scoreWiseRpt.plotData(getScoreWiseRptInfo['data'], 'donut')//
        } else {
          this.scoreWiseRpt.updateSeries(getScoreWiseRptInfo['data'])//
        };
      }
    } catch (e) { }
  }

  async getFcltyWiseRptChart() {
    try {
      let getFcltyRptInfo: any = await this._hqms.customGetApiCall('GET', 'fnTrainingReportApi',
        {
          "flag": "FWR"
        });
      if (getFcltyRptInfo.status == 200) {
        this.scoreWiseRpts.plotData(getFcltyRptInfo['data'], 'pie')
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
      let chartInfo: any = await this._hqms.customGetApiCall('GET', 'fnTrainingReportApi',
        {
          "flag": "TWR",
          "from_dt": fromDt,
          "to_dt": toDate,
        });
      if (this.myChartMode == 'NEW') {
        this.areaChart.plotData(chartInfo['data'], 'Trainings')//
      } else {
        this.areaChart.updateSeries(chartInfo['data'], 'Trainings')//
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
      this[this.activeTab == 'training' ? 'trainingGrid' : 'employeeGrid'] =
        this.activeTab == 'training' ? this.copyData : this.copyDataTwo
    } else {
      this[this.activeTab == 'training' ? 'trainingGrid' : 'employeeGrid'] = [... this.activeTab == 'training' ? this.copyData : this.copyDataTwo].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  showEmployeeFilter = false;

  employeeFilterToggle() {
    this.showEmployeeFilter = !this.showEmployeeFilter;
  }

  // Methods to handle dropdown selections
  async onScoreReportSelect(option: any) {
    this.selectedScoreReport = option.label;
    await this.getScoreWiseRptChart(option.value, 'EDIT');
  }
  public date_range_chart: any = null;
  async onTrainingReportSelect(option: string) {
    this.selectedTrainingReport = option;
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
    await this.getTrainingWiseChart();
  }

  // Tab functionality
  activeTab: string = 'training';

  switchTab(tab: string) {
    this.activeTab = tab;
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
    total_training: 0,
    scheduled_trainings: 0,
    in_progress_percentage: 0,
    completed_percentage: 0,
    total_training_last_updated: null,
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
      let getTrainingStatsInfo: any = await this._hqms.customGetApiCall('GET', 'fnTrainingReportsDashboardStats',
        {
          "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
          "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (getTrainingStatsInfo.status == 200) {
        getTrainingStatsInfo = getTrainingStatsInfo['data'][0];
        this.stats.set({
          total_training: getTrainingStatsInfo.total_training,
          scheduled_trainings: getTrainingStatsInfo.scheduled_trainings,
          in_progress_percentage: getTrainingStatsInfo.in_progress_percentage,
          completed_percentage: getTrainingStatsInfo.completed_percentage,
          total_training_last_updated: getTrainingStatsInfo.total_training_last_updated,
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
      this.trainingGrid = [];
      let totalCnt = 0;
      let getTrainingList: any = await this._hqms.customGetApiCall('GET', 'fnTrainingWiseReportGet',
        {
          page_no: pageNo,
          page_size: pageSize,
        });
      if (getTrainingList.status == 200) {
        let sourcedData: any = [];
        totalCnt = getTrainingList.data[0]['total_row_cnt'];
        getTrainingList.data.forEach((traininngPrp: any, index: number) => {
          let createTraining: any = {
            id: index + 1,
            batch: traininngPrp.batch,
            status: traininngPrp.status,
            faculty_name: traininngPrp.faculty_name,
            training_name: traininngPrp.training_name,
            period: traininngPrp.training_period,
            training_hours: traininngPrp.total_training_hours,
            mode_of_training: traininngPrp.mode_of_training,
            training_schedule_id: traininngPrp.training_schedule_id,
            created_by: traininngPrp.created_by,
            created_at: traininngPrp.created_at,
            updated_by: traininngPrp.updated_by,
            updated_at: traininngPrp.updated_at,
          };
          sourcedData.push(createTraining);
        });
        this.trainingGrid = [...sourcedData];
        this.copyData = [...sourcedData];
        this.trainingNameList = [...new Set(sourcedData.map((item: any) => item.training_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.facultyNameList = [...new Set(sourcedData.map((item: any) => item.faculty_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.modeOfTrainingList = [...new Set(sourcedData.map((item: any) => item.mode_of_training))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.statusList = [...new Set(sourcedData.map((item: any) => item.status))].map((name, index) => ({
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

  async getEmployeeGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators2();
      this.employeeGrid = [];
      let totalCnt = 0;
      let getEmployeeList: any = await this._hqms.customGetApiCall('GET', 'fnTrainingEmployeeReportGet',
        {
          page_no: pageNo,
          page_size: pageSize,
        });
      if (getEmployeeList.status == 200) {
        let sourcedData: any = [];
        totalCnt = getEmployeeList.data[0]['total_row_cnt'];
        getEmployeeList.data.forEach((employeePrp: any, index: number) => {
          let createEmployee: any = {
            id: index + 1,
            employee_id: employeePrp.employee_id,
            employee_name: employeePrp.employee_name,
            role: employeePrp.role,
            trainings_attended: employeePrp.trainings_attended,
            total_certifications: employeePrp.total_certifications,
            training_hours: employeePrp.training_hours,
            last_attended: employeePrp.last_attended,
            status: employeePrp.status,
          };
          sourcedData.push(createEmployee);
        });
        this.employeeGrid = [...sourcedData];
        this.copyDataTwo = [...sourcedData];
        this.employeeNameList = [...new Set(sourcedData.map((item: any) => item.employee_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.roleList = [...new Set(sourcedData.map((item: any) => item.role))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.pageNators2.update(current => ({
          ...current,
          totalItems: Math.ceil(totalCnt / pageSize),
          totalPages: Math.ceil(totalCnt / pageSize)
        }));
      };
    } catch (e) { };
  }

  onFilterClick() {
    let trainfilters = this.trainingFilters();
    this.trainingGrid = this.copyData.filter((fl: any) => {
      let training_name = !trainfilters.training_name || fl['training_name'] === trainfilters.training_name;
      let faculty_name = !trainfilters.faculty_name || fl['faculty_name'] === trainfilters.faculty_name;
      let mode_of_training = !trainfilters.mode_of_training || fl['mode_of_training'] === trainfilters.mode_of_training;
      let status = !trainfilters.status || fl['status'] === trainfilters.status;
      return training_name && faculty_name && mode_of_training && status;
    });
  }

  onFilterClick1() {
    let empfilters = this.employeeFilters();
    this.employeeGrid = this.copyDataTwo.filter((fl: any) => {
      let employee_name = !empfilters.employee_name || fl['employee_name'] === empfilters.employee_name;
      let role = !empfilters.role || fl['role'] === empfilters.role;
      return employee_name && role;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.trainingFilters.set(JSON.parse(this.trainingFilterss));
      this.trainingGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  async onFilterClear1(event: any) {
    if (event == null) {
      this.employeeFilters.set(JSON.parse(this.employeeFilterss));
      this.employeeGrid = [...this.copyDataTwo];
    } else {
      this.onFilterClick1();
    }
  }

  // async onDelete(trainiPrp: any) {
  //   let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${trainiPrp.mode_of_training}`);
  //   if (confirm) {
  //     let savePayload = {
  //       action: "D",
  //       "training_id": trainiPrp.training_id
  //     }
  //     var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnAttendanceWriteApi", savePayload);
  //     if (saveResult.status == 200) {
  //       this._hqms.hqmsToasterService({
  //         severity: 'success',
  //         summary: 'Training Reports',
  //         detail: saveResult.message,
  //       });
  //       this.trainingGrid = [...this.copyData.filter((fl: any) => fl.training_id != trainiPrp.training_id)];
  //     };
  //   };
  // }

  onPageRoute(pageMode: string, prps: any, ctrl: string) {
    try {
      this.router.navigate(
        [
          ctrl == 'training' ? '/reports-details' : '/training-report-employee-details'
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: prps == null ? null : prps
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

  public pageNators2 = signal({
    pageNo: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  readonly pageNumbers1 = computed(() => {
    let pages = this.pageNators1().totalPages;
    return Array.from({ length: pages }, (_, i) => i + 1);
  })

  readonly pageNumbers2 = computed(() => {
    let pages = this.pageNators2().totalPages;
    return Array.from({ length: pages }, (_, i) => i + 1);
  })

  async changePage1(newDisplayPage: number) {
    this.pageNators1.update(prev => ({ ...prev, pageNo: newDisplayPage }));
    await this.getTrainingGrid();
  }

  async changePage2(newDisplayPage: number) {
    this.pageNators2.update(prev => ({ ...prev, pageNo: newDisplayPage }));
    await this.getEmployeeGrid();
  }

}
