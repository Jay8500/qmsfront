import { Component, CUSTOM_ELEMENTS_SCHEMA, ViewChild, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { HqmsService } from '../../../services/hqms.service';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';
import { ScoreWiseReportsComponent } from '../../../components/score-wise-reports/score-wise-reports.component';
import { KpiIndicatorsComponent } from '../../../components/kpi-indicators/kpi-indicators.component';
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
  selector: 'app-safety-dashboard',
  imports: [CommonModule, NgbdSortableHeader, NgbTooltip, SelectModule, FormsModule, SharedModule, ScoreWiseReportsComponent, KpiIndicatorsComponent],
  templateUrl: './safety-dashboard.component.html',
  styleUrl: './safety-dashboard.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SafetyDashboardComponent implements OnInit {
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  @ViewChild('riskChart') riskChart !: ScoreWiseReportsComponent;
  @ViewChild('depWiseRiskChart') depWiseRiskChart !: ScoreWiseReportsComponent;
  @ViewChild('indcWseRpt') indcWseRpt !: KpiIndicatorsComponent;

  public router = inject(Router);
  public intialFilters: any = JSON.stringify({
    survey_name: null,
    status: null,
  });
  public surveyList: any = [];
  public statusList: any = [];
  public empIdList: any = [];
  public departmentList: any = [];
  public vaccinStatusList: any = [];
  public surveyFilters = signal(JSON.parse(this.intialFilters));
  public safetyGrid: any = [];
  public copyData: any = [];
  public params: any = {}

  onSort({ column, direction }: SortEvent) {
    for (const header of this.headers) {
      if (header.sortable !== column) {
        header.direction = '';
      };
    };
    if (direction === '' || column === '') {
      this.safetyGrid = this.safetyGrid;
    } else {
      this.safetyGrid = [...this.safetyGrid].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  showFilter = false;
  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  selectedRange: string = 'Last 30 days';

  constructor(public _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async setRange(value: string) {
    try {
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
      await this.getSafetyStats();
      await this.getSafetyList();
    } catch (e) {
    }
  }
  public date_range: any = null;

  public initailStats = JSON.stringify({
    "culture_surveys_count": 0,
    "overall_feedbacks_count": 0,
    "culture_surveys_last_updated": null,
    "negative_feedbacks_percentage": 0,
    "positive_feedbacks_percentage": 0,
    "overall_feedbacks_last_updated": null,
    "negative_feedbacks_last_updated": null,
    "positive_feedbacks_last_updated": null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getSafetyStats() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      this.safetyGrid = [];
      let statInfo: any = await this._hqms.customGetApiCall('GET', 'fnSafetyCultureDashboardStats',
        {
          "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
          "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (statInfo.status == 200) {
        this.stats.set({
          culture_surveys_count: statInfo['data'].culture_surveys_count || 0,
          overall_feedbacks_count: statInfo['data'].overall_feedbacks_count || 0,
          negative_feedbacks_percentage: statInfo['data'].negative_feedbacks_percentage || 0,
          positive_feedbacks_percentage: statInfo['data'].positive_feedbacks_percentage || 0,
          culture_surveys_last_updated: statInfo['data'].culture_surveys_last_updated || 0,
          overall_feedbacks_last_updated: statInfo['data'].overall_feedbacks_last_updated,
          negative_feedbacks_last_updated: statInfo['data'].negative_feedbacks_last_updated,
          positive_feedbacks_last_updated: statInfo['data'].positive_feedbacks_last_updated,
        })
      };
    } catch (e) {
    };
  }

  async ngOnInit() {
    try {
      await this.setRange(this.selectedRange);
      await this.getRoleWiseChrts();
      await this.getCultreSurvyChartRpts();
      await this.getParticipantsChartRpts();
    } catch (e) { }
  }

  async getRoleWiseChrts() {
    try {
      let rlsWse: any = await this._hqms.customGetApiCall('GET', 'fnSafetyCultureChrtsApi',
        {
          "flag": "RWF"
        });
      if (rlsWse.status == 200) {
        this.riskChart.plotData(rlsWse['data'], 'donut')//
      }
    } catch (e) { }
  }

  async getCultreSurvyChartRpts() {
    try {
      let cSrvRpt: any = await this._hqms.customGetApiCall('GET', 'fnSafetyCultureChrtsApi',
        {
          "flag": "CTR"
        });
      if (cSrvRpt.status == 200) {
        this.depWiseRiskChart.plotData(cSrvRpt['data'], 'donut')//
      }
    } catch (e) {
    }
  }

  async getParticipantsChartRpts() {
    try {
      let prtcpnt: any = await this._hqms.customGetApiCall('GET', 'fnSafetyCultureChrtsApi',
        {
          "flag": "PCR"
        });
      if (prtcpnt.status == 200) {
        this.indcWseRpt.plotData(prtcpnt['data'], "Employee")
      }
    } catch (e) { }
  }


  onFilterClick() {
    let filters = this.surveyFilters();
    this.safetyGrid = this.copyData.filter((fl: any) => {
      let survey_name = !filters.survey_name || fl['survey_name'] === filters.survey_name;
      let status = !filters.status || fl['status'] === filters.status;
      return survey_name && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.surveyFilters.set(JSON.parse(this.intialFilters));
      this.safetyGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, prp: any) {
    try {
      this.router.navigate(
        [
          pageMode == 'VIEW' ? '/safety-details' : pageMode == 'NEW' ? '/add-survey' : pageMode == 'REVIEWCAPA' ? '/safety-details-capa-review' : '/safety-details-capa'
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: prp == null ? null : prp.survey_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async getSafetyList() {
    this.safetyGrid = [];
    let { pageNo, pageSize } = this.pageNators();
    let totalCnt = 0;
    let flages: any = {
      "page_no": pageNo,
      "page_size": pageSize,
    };
    this.params = { ...flages }
    let gridInfo: any = await this._hqms.customGetApiCall('GET', 'fnSafetyCultureSurveyApi', this.params);
    if (gridInfo.status == 200) {
      let sourcedData: any = [];
      totalCnt = gridInfo.data[0]['total_row_cnt'];
      gridInfo.data.forEach((prp: any, index: number) => {
        let info: any = {
          id: prp.s_no,
          from_date: prp.from_date,
          participants: prp.participants,
          status: prp.status,
          survey_id: prp.survey_id,
          survey_name: prp.survey_name,
          to_date: prp.to_date,
          total_participants: prp.total_participants,
          total_satisfactory_pct: prp.total_satisfactory_pct,
          created_by: prp.created_by,
          created_at: prp.created_at,
          updated_by: prp.updated_by,
          updated_at: prp.updated_at,
        };
        sourcedData.push(info);
      });
      this.safetyGrid = [...sourcedData];
      this.copyData = [...sourcedData];
      this.surveyList = [...new Set(sourcedData.map((item: any) => item.survey_name))].map((name, index) => ({
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

  async changePage(newDisplayPage: number) {
    this.pageNators.update(prev => ({ ...prev, pageNo: newDisplayPage }));
    await this.getSafetyList();
  }
}
