import { Component, ViewChild, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ComparisonBarchartComponent } from '../../../components/comparison-barchart/comparison-barchart.component';
import { ScoreWiseReportsComponent } from '../../../components/score-wise-reports/score-wise-reports.component';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';
// import { CareContinuityReportComponent } from '../../../components/care-continuity-report/care-continuity-report.component';
// import { PositiveCriticalFeedbacksComponent } from '../../../components/positive-critical-feedbacks/positive-critical-feedbacks.component';
// import { RolewiseFeedbacksComponent } from '../../../components/rolewise-feedbacks/rolewise-feedbacks.component';
// import { SatisfactionReportComponent } from '../../../components/satisfaction-report/satisfaction-report.component';
// import { ParticipantsReportComponent } from '../../../components/participants-report/participants-report.component';
// import { DoctorFeedbacksComponent } from '../../../components/doctor-feedbacks/doctor-feedbacks.component';
// import { HeaderComponent } from '../../../components/header/header.component';
// import { FeedbackTypeComponent } from '../../../components/feedback-type/feedback-type.component';

interface promTable {
  id: number;
  uhid: any;
  patient_name: any;
  age: any;
  room: any;
  unit: any;
  diagnosis: any;
  period: any;
  care: any
  type: any
}

export type SortColumn = keyof promTable | '';
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
  selector: 'app-prom-dashboard',
  imports: [NgbdSortableHeader, CommonModule, SelectModule, FormsModule, SharedModule, ScoreWiseReportsComponent, ComparisonBarchartComponent],
  // PositiveCriticalFeedbacksComponent, CareContinuityReportComponent, FeedbackTypeComponent
  templateUrl: './prom-dashboard.component.html',
  styleUrl: './prom-dashboard.component.scss',
})
export class PromDashboardComponent {
  @ViewChild('scoreWiseRpt') scoreWiseRpt !: ScoreWiseReportsComponent;
  @ViewChild('rCCRpt') rCCRpt !: ComparisonBarchartComponent;
  @ViewChild('CCRpt') CCRpt !: ComparisonBarchartComponent;
  public router = inject(Router);
  public intialFilters: any = JSON.stringify({
    uhid: null,
    patient_name: null,
    room: null,
    unit: null,
    type: null
  });
  public promFilters = signal(JSON.parse(this.intialFilters));
  public uhidList: any = [];
  public patientNameList: any = [];
  public roomList: any = [];
  public unitList: any = [];
  public typeList: any = [];
  selectedRange: string = 'Last 30 days';
  public promGrid: any = [];
  public copyData: any = [];
  slctdPrtcpnt: string = 'Last Week';
  slctdSatfctn: string = 'Last Week';
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
  public myChartMode = 'NEW';


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
      this.promGrid = this.promGrid;
    } else {
      this.promGrid = [...this.promGrid].sort((a, b) => {
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
      await this.typeWiseFdbckCharts();
      await this.pstvCrticalFdbSlct(this.slctdSatfctn);
      await this.careCntyRptSlct(this.slctdPrtcpnt);

      // await this.positiveCriticalFedbckCharts();
      // await this.careContinuityRptCharts();
    } catch (e) { }
  }

  async typeWiseFdbckCharts() {
    try {
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnPremPromCharts',
        {
          "flag": "TWF"
        });
      if (adChrt.status == 200) {
        console.log("typeWiseFdbckCharts ", adChrt)
        this.scoreWiseRpt.plotData(adChrt['data'], 'donut')//
      }
    } catch (e) { }
  }

  public pstvstsdate_range_chart: any = null;
  async pstvCrticalFdbSlct(option: string) {
    this.slctdSatfctn = option;
    let getSrvrDt: any = await this._hqms.getServerDate('DATE');
    let today: any = new Date(getSrvrDt);
    let endDateToday: any = new Date();
    let prev7Day: any = null;
    this.pstvstsdate_range_chart = null;
    switch (option) {
      case 'Last Week':
        prev7Day = new Date(today.setDate(today.getDate() - 7));
        this.pstvstsdate_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 1 Month':
        this.myChartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 30));
        this.pstvstsdate_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 6 Months':
        this.myChartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 180));
        this.pstvstsdate_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last Year':
        this.myChartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 365));
        this.pstvstsdate_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
    };
    await this.positiveCriticalFedbckCharts();
  }

  async positiveCriticalFedbckCharts() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.pstvstsdate_range_chart != null) {
        let dates = this.pstvstsdate_range_chart.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      let pstvChrt: any = await this._hqms.customGetApiCall('GET', 'fnPremPromCharts',
        {
          "flag": "PCF",
          "from_dt": fromDt,
          "toDate": toDate,
        });
      if (pstvChrt.status == 200) {
        console.log("positiveCriticalFedbckCharts ", pstvChrt)
        let crtDtaSt: any = {
          "labels": [],
          "series": [],
          "chartNames": ['Compliance', 'Partial', 'Non-compliance']
        };
        let allMonths = [...Object.keys(pstvChrt['data']['PARTIAL'] || {}), ...Object.keys(pstvChrt['data']['COMPLIANCE'] || {}),
        ...Object.keys(pstvChrt['data']['NON_COMPLIANCE '] || {})
        ];
        let labels = Array.from(new Set(allMonths));
        if (Object.keys(pstvChrt['data']['COMPLIANCE'] || {}).length > 0) {
          crtDtaSt['series'].push(
            {
              name: "Compliance",
              data: labels.map(mnth => pstvChrt['data'].COMPLIANCE[mnth] || 0)
            });
        };
        if (Object.keys(pstvChrt['data']['PARTIAL'] || {}).length > 0) {
          crtDtaSt['series'].push(
            {
              name: "Partial",
              data: labels.map(mnth => pstvChrt['data'].PARTIAL[mnth] || 0)
            });
        };
        if (Object.keys(pstvChrt['data']['NON_COMPLIANCE'] || {}).length > 0) {
          crtDtaSt['series'].push(
            {
              name: "Non-compliance",
              data: labels.map(mnth => pstvChrt['data'].NON_COMPLIANCE[mnth] || 0)
            }
          );
        };
        crtDtaSt['labels'] = labels;
        this.rCCRpt.plotData(crtDtaSt, 'pie')//
      }
    } catch (e) { }
  }

  public stsdate_range_chart: any = null;
  async careCntyRptSlct(option: string) {
    this.slctdPrtcpnt = option;
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
    await this.careContinuityRptCharts();
  }

  async careContinuityRptCharts() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.stsdate_range_chart != null) {
        let dates = this.stsdate_range_chart.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      let cChart: any = await this._hqms.customGetApiCall('GET', 'fnPremPromCharts',
        {
          "flag": "CCR",
          "from_dt": fromDt,
          "toDate": toDate,
        });
      if (cChart.status == 200) {
        console.log("careContinuityRptCharts ", cChart)
        let crtDtaSt: any = {
          "labels": [],
          "series": [],
          "chartNames": ['Compliance', 'Partial', 'Non-compliance']
        };
        let allMonths = [...Object.keys(cChart['data']['PARTIAL'] || {}), ...Object.keys(cChart['data']['COMPLIANCE'] || {}),
        ...Object.keys(cChart['data']['NON_COMPLIANCE '] || {})
        ];
        let labels = Array.from(new Set(allMonths));
        if (Object.keys(cChart['data']['COMPLIANCE'] || {}).length > 0) {
          crtDtaSt['series'].push(
            {
              name: "Compliance",
              data: labels.map(mnth => cChart['data'].COMPLIANCE[mnth] || 0)
            });
        };
        if (Object.keys(cChart['data']['PARTIAL'] || {}).length > 0) {
          crtDtaSt['series'].push(
            {
              name: "Partial",
              data: labels.map(mnth => cChart['data'].PARTIAL[mnth] || 0)
            });
        };
        if (Object.keys(cChart['data']['NON_COMPLIANCE'] || {}).length > 0) {
          crtDtaSt['series'].push(
            {
              name: "Non-compliance",
              data: labels.map(mnth => cChart['data'].NON_COMPLIANCE[mnth] || 0)
            }
          );
        };
        crtDtaSt['labels'] = labels;
        this.CCRpt.plotData(crtDtaSt, 'pie')//
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
    await this.getPromStats();
    await this.getPromGrid();
  }

  public initailStats = JSON.stringify({
    "prom_report_cnt": 0,
    "ds_pat_cnt": 0,
    "overall_fb_cnt": 0,
    "cc_history_cnt": 0,
    "prom_report_last_updated": null,
    "ds_pat_last_updated": null,
    "overall_fb_last_updated": null,
    "cc_history_last_updated": null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getPromStats() {
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
      let statInfo: any = await this._hqms.customGetApiCall('GET', 'fnPromStats', statsParam);
      if (statInfo.status == 200) {
        this.stats.set({
          "prom_report_cnt": statInfo['data'].prom_report_cnt || 0,
          "ds_pat_cnt": statInfo['data'].ds_pat_cnt || 0,
          "overall_fb_cnt": statInfo['data'].overall_fb_cnt || 0,
          "cc_history_cnt": statInfo['data'].cc_history_cnt || 0,
          "prom_report_last_updated": statInfo['data'].prom_report_last_updated,
          "ds_pat_last_updated": statInfo['data'].ds_pat_last_updated,
          "overall_fb_last_updated": statInfo['data'].overall_fb_last_updated,
          "cc_history_last_updated": statInfo['data'].cc_history_last_updated,
        })
      };
    } catch (e) {
    };
  }

  onFilterClick() {
    let filters = this.promFilters();
    this.promGrid = this.copyData.filter((fl: any) => {
      let uhid = !filters.uhid || fl['uhid'] === filters.uhid;
      let patient_name = !filters.patient_name || fl['patient_name'] === filters.patient_name;
      let room = !filters.room || fl['room'] === filters.room;
      let unit = !filters.unit || fl['unit'] === filters.unit;
      let type = !filters.type || fl['type'] === filters.type;
      return uhid && patient_name && room && unit && type;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.promFilters.set(JSON.parse(this.intialFilters));
      this.promGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, promDashboard: any) {
    try {
      this.router.navigate(
        [
          pageMode == 'VIEW' ? '/prom-details' : (pageMode == 'NEW') ? '/prom-add' : '/care-continuity-add',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: promDashboard == null ? null : promDashboard.prom_feedback_id
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

  async getPromGrid() {
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
      this.promGrid = [];
      let flags: any = {
        // "page_no": pageNo,
        // "page_size": pageSize,
        // "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
        // "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
      }
      this.params = { ...flags }
      let promInfo: any = await this._hqms.customGetApiCall('GET', 'fnPromApi', this.params);
      if (promInfo.status == 200) {
        let sourcedData: any = [];
        totalCnt = promInfo.data[0]['total_row_cnt'];
        promInfo.data.forEach((adtInfo: any, index: number) => {
          let crtPromGrid: any = {
            id: index + 1,
            prom_feedback_id: adtInfo.prom_feedback_id,
            uhid: adtInfo.uhid,
            patient_name: adtInfo.patient_name,
            age: adtInfo.age,
            room: adtInfo.room,
            unit: adtInfo.admitted_unit_name,
            diagnosis: adtInfo.diagnosis,
            period: adtInfo.treatment_period,
            care: adtInfo.care_continuity_req,
            type: adtInfo.prom_type_name,
            created_by: adtInfo.created_by,
            created_at: adtInfo.created_at,
            updated_by: adtInfo.updated_by,
            updated_at: adtInfo.updated_at,
          };
          sourcedData.push(crtPromGrid);
        });
        this.promGrid = [...sourcedData];
        this.copyData = [...sourcedData];
        this.uhidList = [...new Set(sourcedData.map((item: any) => item.uhid))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.patientNameList = [...new Set(sourcedData.map((item: any) => item.patient_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.roomList = [...new Set(sourcedData.map((item: any) => item.room))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.unitList = [...new Set(sourcedData.map((item: any) => item.unit))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.typeList = [...new Set(sourcedData.map((item: any) => item.type))].map((name, index) => ({
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
    await this.getPromGrid();
  }
}
