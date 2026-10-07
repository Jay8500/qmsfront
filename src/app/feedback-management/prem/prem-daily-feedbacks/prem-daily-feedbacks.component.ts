import { Component, ViewChild, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgApexchartsModule, ChartComponent } from "ng-apexcharts";
import { CommonModule } from '@angular/common';
import { DepartmentRiskComponent } from '../../../components/department-risk/department-risk.component';
import { DischargeFeedbacksComponent } from '../../../components/discharge-feedbacks/discharge-feedbacks.component';
import { SuggestionsPremComponent } from '../../../components/suggestions-prem/suggestions-prem.component';
import { HqmsService } from '../../../services/hqms.service';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';
interface premDailyFdbkTable {
  id: number;
  uhid: any;
  department_name: any;
  issue_type_name: any;
  description: any;
  dt_tm_fdbk: any;//NG
  status: any;//NG
}

export type SortColumn = keyof premDailyFdbkTable | '';
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
  selector: 'app-prem-daily-feedbacks',
  imports: [SelectModule, FormsModule, SharedModule, NgApexchartsModule, CommonModule, NgbdSortableHeader,
   DepartmentRiskComponent, DischargeFeedbacksComponent, SuggestionsPremComponent],
  // RolewiseFeedbacksComponent, SatisfactionReportComponent, ParticipantsReportComponent,
  templateUrl: './prem-daily-feedbacks.component.html',
  styleUrl: './prem-daily-feedbacks.component.scss',
})
export class PremDailyFeedbacksComponent {
  @ViewChild('dep') dep!: DepartmentRiskComponent;
  @ViewChild('ip') ip!: DischargeFeedbacksComponent;
  @ViewChild('fdbk') fdbk!: SuggestionsPremComponent;
  public router = inject(Router);
  public intialFilters: any = JSON.stringify({
    uhid: null,
    department_name: null,
    issue_type_name: null,
    status: null //NG
  });
  public premDailyFdbkFilters = signal(JSON.parse(this.intialFilters));
  public uhidList: any = [];
  public departmentList: any = [];
  public issuesList: any = [];
  public statusList: any = [];
  selectedRange: string = 'Last 30 days';
  public premDailyFdbkGrid: any = [];
  public copyData: any = [];

  topIPRptList = [
    'Last Week',
    'Last 1 Month',
    'Last 6 Months',
    'Last Year'
  ];
  topIPRptText: string = 'Last Week';
  public topIPRpt_date_range_chart: any = null;
  public topIPRpt_chartMode:string = 'NEW';

  topFeedbckRptList = [
    'Last Week',
    'Last 1 Month',
    'Last 6 Months',
    'Last Year'
  ];
  topFeedbckRptText: string = 'Last Week';
  public topFeedbckRpt_date_range_chart: any = null;
  public topFeedbckRpt_chartMode:string = 'NEW';


  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) {}
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
      this.premDailyFdbkGrid = this.premDailyFdbkGrid;
    } else {
      this.premDailyFdbkGrid = [...this.premDailyFdbkGrid].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  // Filter toggle
  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  public premTypeList: any = null;
  async ngOnInit() {
    try {
      let info: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "PREMTYPE" });
      if (info.status == 200) {
        this.premTypeList = info.data.entities.PREMTYPE.values.map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
          value_code: ele.value_code,
        })).filter((ele) => ele.value_code == 'IPFB')[0]['value'];
      };
      await this.setRange(this.selectedRange);
      await this.deprtmntWiseFdbckCharts();
      await this.topIPChartInfo(this.topIPRptText);
      await this.topFeedbckChartInfo(this.topFeedbckRptText);
    } catch (e) { }
  }

  async deprtmntWiseFdbckCharts() {
    try {
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnFbPremDfChartsApi',
        {
          "flag": "DWF"
        });
      if (adChrt.status == 200) {
        this.dep.plotData(adChrt['data'],'pie')//
      }
    } catch (e) { }
  }

  async topIPChartInfo(option: string) {
    this.topIPRptText = option;
    let getSrvrDt: any = await this._hqms.getServerDate('DATE');
    let today: any = new Date(getSrvrDt);
    let endDateToday: any = new Date();
    let prev7Day: any = null;
    this.topIPRpt_date_range_chart = null;
    switch (option) {
      case 'Last Week':
        prev7Day = new Date(today.setDate(today.getDate() - 7));
        this.topIPRpt_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 1 Month':
        this.topIPRpt_chartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 30));
        this.topIPRpt_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 6 Months':
        this.topIPRpt_chartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 180));
        this.topIPRpt_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last Year':
        this.topIPRpt_chartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 365));
        this.topIPRpt_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
    };
    await this.topIpFdbckIssuesCharts();
  }

  async topFeedbckChartInfo(option: string) {
    this.topFeedbckRptText = option;
    let getSrvrDt: any = await this._hqms.getServerDate('DATE');
    let today: any = new Date(getSrvrDt);
    let endDateToday: any = new Date();
    let prev7Day: any = null;
    this.topFeedbckRpt_date_range_chart = null;
    switch (option) {
      case 'Last Week':
        prev7Day = new Date(today.setDate(today.getDate() - 7));
        this.topFeedbckRpt_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 1 Month':
        this.topFeedbckRpt_chartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 30));
        this.topFeedbckRpt_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last 6 Months':
        this.topFeedbckRpt_chartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 180));
        this.topFeedbckRpt_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
      case 'Last Year':
        this.topFeedbckRpt_chartMode = 'EDIT';
        prev7Day = new Date(today.setDate(today.getDate() - 365));
        this.topFeedbckRpt_date_range_chart = `${this._datePipe.transform(prev7Day, "dd-MMM-yyyy")} - ${this._datePipe.transform(endDateToday, "dd-MMM-yyyy")}`;
        break;
    };
    await this.totalFdbckCollectedCharts();
  }

  async topIpFdbckIssuesCharts() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.topIPRpt_date_range_chart != null) {
        let dates = this.topIPRpt_date_range_chart.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnFbPremDfChartsApi',
        {
          "flag": "IPFS",
          "from_dt": fromDt,
          "to_dt": toDate,
        });
      if (adChrt.status == 200) {
        if(this.topIPRpt_chartMode == 'NEW'){
         this.ip.plotData(adChrt['data'],'pie')//
        }else{
          this.ip.updateSeries(adChrt['data'])//
        }
      }
    } catch (e) { }
  }

  async totalFdbckCollectedCharts() {
    try {
        let fromDt = null;
      let toDate = null;
      if (this.topFeedbckRpt_date_range_chart != null) {
        let dates = this.topFeedbckRpt_date_range_chart.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnFbPremDfChartsApi',
        {
          "flag": "TFC",
          "from_dt": fromDt,
          "to_dt": toDate,
        });
      if (adChrt.status == 200) {
        if(this.topFeedbckRpt_chartMode == 'NEW'){
         this.fdbk.plotData(adChrt['data'],'pie')//
        }else{
          this.fdbk.updateSeries(adChrt['data'])//
        }
      }
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
    await this.getPdfStats();
    await this.getPdfGrid();
  }

  public initailStats = JSON.stringify({
    "prem_fb_cnt": 0,
    "daily_fb_cnt": 0,
    "ds_fb_cnt": 0,
    "op_fb_cnt": 0,
    "prem_fb_last_updated": null,
    "daily_fb_last_updated": null,
    "ds_fb_last_updated": null,
    "op_fb_last_updated": null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getPdfStats() {
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
      let statInfo: any = await this._hqms.customGetApiCall('GET', 'fnPremDashboardStats', statsParam);
      if (statInfo.status == 200) {
        this.stats.set({
          "prem_fb_cnt": statInfo['data'][0].prem_fb_cnt || 0,
          "daily_fb_cnt": statInfo['data'][0].daily_fb_cnt || 0,
          "ds_fb_cnt": statInfo['data'][0].ds_fb_cnt || 0,
          "op_fb_cnt": statInfo['data'][0].op_fb_cnt || 0,
          "prem_fb_last_updated": statInfo['data'][0].prem_fb_last_updated,
          "daily_fb_last_updated": statInfo['data'][0].daily_fb_last_updated,
          "ds_fb_last_updated": statInfo['data'][0].ds_fb_last_updated,
          "op_fb_last_updated": statInfo['data'][0].op_fb_last_updated,
        })
      };
    } catch (e) {
    };
  }

  onFilterClick() {
    let filters = this.premDailyFdbkFilters();
    this.premDailyFdbkGrid = this.copyData.filter((fl: any) => {
      let uhid = !filters.uhid || fl['uhid'] === filters.uhid;
      let department_name = !filters.department_name || fl['department_name'] === filters.department_name;
      let issue_type_name = !filters.issue_type_name || fl['issue_type_name'] === filters.issue_type_name;
      let status = !filters.status || fl['status'] === filters.status;
      return uhid && department_name && issue_type_name && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.premDailyFdbkFilters.set(JSON.parse(this.intialFilters));
      this.premDailyFdbkGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, pdfdbckDashboard: any) {
    try {
      this.router.navigate(
        [
          pageMode == 'VIEW' ? '/prem-daily-feedback-details' : (pageMode == 'NEW') ? '/prem-feedback' : (pageMode == 'DailyFeedbacks') ? '/prem-daily-feedbacks' : (pageMode == 'DischargeFeedbacks') ? '/prem-discharge-feedbacks' : '/prem-outpatient-feedbacks',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: pdfdbckDashboard == null ? null : pdfdbckDashboard.prem_type_id
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

  async getPdfGrid() {
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
      this.premDailyFdbkGrid = [];
      let flags: any = {
        prem_feedback_id: null,
        prem_type_id: this.premTypeList,
        // "page_no": pageNo,
        // "page_size": pageSize,
        // "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
        // "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
      }
      this.params = { ...flags }
      let premDailyFdbkInfo: any = await this._hqms.customGetApiCall('GET', 'fnPremFeedbackApi', this.params);
      if (premDailyFdbkInfo.status == 200) {
        let sourcedData: any = [];
        totalCnt = premDailyFdbkInfo.data[0]['total_row_cnt'];
        premDailyFdbkInfo.data.forEach((adtInfo: any, index: number) => {
          let crtPdfGrid: any = {
            id: index + 1,
            prem_type_id: adtInfo.prem_type_id,
            prem_feedback_id: adtInfo.prem_feedback_id,
            uhid: adtInfo.uhid,
            department_name: adtInfo.department_name,
            description: adtInfo.description,
            issue_type_name: adtInfo.issue_type_name,
            // dt_tm_fdbk: adtInfo.dt_tm_fdbk,
            created_by: adtInfo.created_by,
            created_at: adtInfo.created_at,
            updated_by: adtInfo.updated_by,
            updated_at: adtInfo.updated_at,
            status: adtInfo.status,//NG
          };
          sourcedData.push(crtPdfGrid);
        });
        this.premDailyFdbkGrid = [...sourcedData];
        this.copyData = [...sourcedData];
        this.uhidList = [...new Set(sourcedData.map((item: any) => item.uhid))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.departmentList = [...new Set(sourcedData.map((item: any) => item.department_name))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.issuesList = [...new Set(sourcedData.map((item: any) => item.issue_type_name))].map((name, index) => ({
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
    await this.getPdfGrid();
  }
}
