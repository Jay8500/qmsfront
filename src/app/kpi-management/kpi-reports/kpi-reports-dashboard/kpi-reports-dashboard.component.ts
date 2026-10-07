import { Component, CUSTOM_ELEMENTS_SCHEMA, ViewChild, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { HeaderComponent } from '../../../layout/header/header.component';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';
import { KpiIndicatorsComponent } from '../../../components/kpi-indicators/kpi-indicators.component';
import { KpiComplianceComponent } from '../../../components/kpi-compliance/kpi-compliance.component';
import { KpiDepartmentsComponent } from '../../../components/kpi-departments/kpi-departments.component';
import { ComparisonBarchartComponent } from '../../../components/comparison-barchart/comparison-barchart.component';
export type SortColumn = '';//keyof auditTable |
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
  selector: 'app-kpi-reports-dashboard',
  imports: [CommonModule, NgbdSortableHeader, NgbTooltip, SharedModule, KpiDepartmentsComponent,
    ComparisonBarchartComponent, KpiIndicatorsComponent
  ],
  templateUrl: './kpi-reports-dashboard.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class KpiReportsDashboardComponent implements OnInit {
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  @ViewChild('departWseRpt') departWseRpt !: KpiDepartmentsComponent;
  @ViewChild('indcWseRpt') indcWseRpt !: KpiIndicatorsComponent;
  @ViewChild('rCCRpt') rCCRpt !: ComparisonBarchartComponent;
  public router = inject(Router);
  public intialFilters: any = JSON.stringify({
    kpi_name: null,
    frequency_name: null,
    kpi_code: null,
    kpi_type_name: null,
    kpi_actual_score_status: null,
  });
  public kpiNameList: any = [];
  public frequencyNameList: any = [];
  public kpiCodeList: any = [];
  public kpiTypeList: any = [];
  public kpiStatusList: any = [];
  onSort({ column, direction }: SortEvent) {
    // // resetting other headers
    for (const header of this.headers) {
      if (header.sortable !== column) {
        header.direction = '';
      };
    };
    // sorting countries
    if (direction === '' || column === '') {
      this.kpiRptList = this.kpiRptList;
    } else {
      this.kpiRptList = [...this.kpiRptList].sort((a, b) => {
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

  getComplianceClass(overallCompliance: any): any {
    if (overallCompliance > 0) {
      // const value = parseInt(overallCompliance.replace('%', ''), 10);
      if (overallCompliance < 45) {
        return 'text-danger';   // red
      } else if (overallCompliance >= 45 && overallCompliance < 75) {
        return 'text-warning';  // orange
      } else {
        return 'text-success';  // green
      }
    }
  }

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
      await this.getKPIStats();
      await this.getKPIGrid();
    } catch (e) {
    }
  }
  public date_range: any = null;

  public initailStats = JSON.stringify({
    total_department_cnt: 0,
    avg_compliance_cnt: 0,
    total_capa_cnt: 0,
    total_indicators_cnt: 0,
    total_department_cnt_last_updated: null,
    avg_compliance_cnt_last_updated: null,
    total_capa_cnt_last_updated: null,
    total_indicators_cnt_last_updated: null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getKPIStats() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      let statInfo: any = await this._hqms.customGetApiCall('GET', 'fnKpiDashboardStats',
        {
          "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
          "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (statInfo.status == 200) {
        this.stats.set({
          total_department_cnt: statInfo['data'][0].total_department_cnt,
          avg_compliance_cnt: statInfo['data'][0].avg_compliance_cnt || 0,
          total_capa_cnt: statInfo['data'][0].total_capa_cnt,
          total_indicators_cnt: statInfo['data'][0].total_indicators_cnt,
          total_department_cnt_last_updated: statInfo['data'][0].total_department_cnt_last_updated,
          avg_compliance_cnt_last_updated: statInfo['data'][0].avg_compliance_cnt_last_updated,
          total_capa_cnt_last_updated: statInfo['data'][0].total_capa_cnt_last_updated,
          total_indicators_cnt_last_updated: statInfo['data'][0].total_indicators_cnt_last_updated
        })
      };
    } catch (e) {
    };
  }

  async ngOnInit() {
    try {
      await this.setRange(this.selectedRange);
      await this.depWiseChartsRpts();
      await this.indicatorWiseChartRpts();
      await this.recentComplianceRpts();
    } catch (e) { }
  }

  async depWiseChartsRpts() {
    try {
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnKpiChartsApi',
        {
          "flag": "DWR"
        });
      if (adChrt.status == 200) {
        this.departWseRpt.plotData(adChrt['data'], 'donut')//
      }
    } catch (e) { }
  }

  async indicatorWiseChartRpts() {
    try {
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnKpiChartsApi',
        {
          "flag": "IWR"
        });
      if (adChrt.status == 200) {
        this.indcWseRpt.plotData(adChrt['data'], "Indicator")
      }
    } catch (e) { }
  }

  async recentComplianceRpts() {
    try {
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnKpiChartsApi',
        {
          "flag": "CWR"
        });
      if (adChrt.status == 200) {
        let crtDtaSt: any = {
          "labels": [],
          "series": [],
          "chartNames": ['Compliance', 'Non-compliance']
        };
        let allMonths: any = [];
        if (Object.keys(adChrt['data']['COMPLIANCE'] || {}).length > 0) {
          allMonths = [];
          allMonths.push(Object.keys(adChrt['data']['COMPLIANCE']))
        };
        if (Object.keys(adChrt['data']['NON_COMPLIANCE'] || {}).length > 0) {
          allMonths = [];
          allMonths.push(Object.keys(adChrt['data']['NON_COMPLIANCE']))
        };
        let labels: any = Array.from(new Set(allMonths));
        if (Object.keys(adChrt['data']['COMPLIANCE'] || {}).length > 0) {
          crtDtaSt['series'].push(
            {
              name: "Compliance",
              data: labels.map(mnth => adChrt['data'].COMPLIANCE[mnth] || 0)
            }
          )
        }

        if (Object.keys(adChrt['data']['NON_COMPLIANCE'] || {}).length > 0) {
          crtDtaSt['series'].push(

            {
              name: "Non-compliance",
              data: labels.map(mnth => adChrt['data'].NON_COMPLIANCE[mnth] || 0)
            },
          )
        }

        crtDtaSt['labels'] = labels;
        console.log("crtDtaSt ", crtDtaSt)
        this.rCCRpt.plotData(crtDtaSt, 'pie')//
      }
    } catch (e) {
      console.log("dfgdf ", e)
    }
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


  public adtFilters = signal(JSON.parse(this.intialFilters));
  public auditTitleList: any = [];
  public departmentList: any = [];
  public auditorList: any = [];
  public auditeeList: any = [];
  public statusList: any = [];
  public locationList: any = [];
  public kpiRptList: any = [];
  public copyData: any = [];
  public params: any = {}

  async getKPIGrid() {
    this.kpiRptList = [];
    let { pageNo, pageSize } = this.pageNators();
    let totalCnt = 0;
    let flages: any = {
      "page_no": pageNo,
      "page_size": pageSize,
    };
    this.params = { ...flages }
    let getKPIrptInfo: any = await this._hqms.customGetApiCall('GET', 'fnKpiCapaSummaryList', this.params);
    if (getKPIrptInfo.status == 200) {
      let sourcedData: any = [];
      totalCnt = getKPIrptInfo.data[0]['total_row_cnt'];
      getKPIrptInfo.data.forEach((capaPrp: any, index: number) => {
        let info: any = {
          id: index + 1,
          kpi_id: capaPrp.kpi_id,
          kpi_name: capaPrp.kpi_name,
          frequency_name: capaPrp.frequency_name,
          kpi_code: capaPrp.kpi_code,
          kpi_type_name: capaPrp.kpi_type_name,
          department_name: capaPrp.department_name,
          unit_of_measure_name: capaPrp.unit_of_measure_name,
          kpi_formula: capaPrp.kpi_formula,
          kpi_actual_score: capaPrp.kpi_actual_score,
          data_capture_period: capaPrp.data_capture_period,
          kpi_actual_score_status: capaPrp.kpi_actual_score_status,
          created_at: capaPrp.created_at,
          created_by: capaPrp.created_by,
          updated_at: capaPrp.updated_at,
          updated_by: capaPrp.updated_by,
          target_benchmark: capaPrp.benchmark[0]['target_benchmark'],
        };
        sourcedData.push(info);
      });
      this.kpiRptList = [...sourcedData];
      this.copyData = [...sourcedData];
      this.kpiNameList = [...new Set(sourcedData.map((item: any) => item.kpi_name))].map((name, index) => ({
        label: name,
        value: name
      }));
      this.frequencyNameList = [...new Set(sourcedData.map((item: any) => item.frequency_name))].map((name, index) => ({
        label: name,
        value: name
      }));
      this.kpiCodeList = [...new Set(sourcedData.map((item: any) => item.kpi_code))].map((name, index) => ({
        label: name,
        value: name
      }));
      this.kpiTypeList = [...new Set(sourcedData.map((item: any) => item.kpi_type_name))].map((name, index) => ({
        label: name,
        value: name
      }));
      this.kpiStatusList = [...new Set(sourcedData.map((item: any) => item.kpi_actual_score_status))].map((name, index) => ({
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

  async changePage(newDisplayPage: number) {
    this.pageNators.update(prev => ({ ...prev, pageNo: newDisplayPage }));
    await this.getKPIGrid();
  }


  onFilterClick() {
    let filters = this.adtFilters();
    this.kpiRptList = this.copyData.filter((fl: any) => {
      let kpi_code = !filters.kpi_code || fl['kpi_code'] === filters.kpi_code;
      let kpi_name = !filters.kpi_name || fl['kpi_name'] === filters.kpi_name;
      let kpi_type_name = !filters.kpi_type_name || fl['kpi_type_name'] === filters.kpi_type_name;
      let frequency_name = !filters.frequency_name || fl['frequency_name'] === filters.frequency_name;
      let kpi_actual_score_status = !filters.kpi_actual_score_status || fl['kpi_actual_score_status'] === filters.kpi_actual_score_status;
      return kpi_code && kpi_name && kpi_type_name && frequency_name && kpi_actual_score_status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.adtFilters.set(JSON.parse(this.intialFilters));
      this.kpiRptList = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, capaProp: any) {
    try {
      this.router.navigate(
        [
          '/capa-details'
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: capaProp == null ? null : capaProp.kpi_id
            }
          }
        },
      );
    } catch (e) { };
  }
}
