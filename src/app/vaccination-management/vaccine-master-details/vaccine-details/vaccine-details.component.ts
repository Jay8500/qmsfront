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
import { VaccinationAccessService } from '../../vaccination-access.service';
import { VaccinationUploadComponent } from '../vaccination-upload/vaccination-upload.component';

export type SortColumn = string;
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

// SRS 2.x10: Dose Completion % = completed doses / total series × 100. Uses the API value when present,
// otherwise the "1/3" dosage text.
export function doseCompletionPct(row: any): number | null {
  if (row?.dose_completion_pct != null && row.dose_completion_pct !== '') return Math.round(Number(row.dose_completion_pct));
  let match = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(String(row?.dosage ?? ''));
  if (!match || Number(match[2]) == 0) return null;
  return Math.round((Number(match[1]) / Number(match[2])) * 100);
}

@Component({
  selector: 'app-vaccine-details',
  imports: [CommonModule, NgbdSortableHeader, NgbTooltip, SelectModule, FormsModule, SharedModule, ScoreWiseReportsComponent, KpiIndicatorsComponent, VaccinationUploadComponent],
  templateUrl: './vaccine-details.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class VaccineDetailsComponent implements OnInit {
  // Max rows loaded at once; filters, sorting and paging then work on the whole list.
  private readonly LOAD_ALL_SIZE = 5000;
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  @ViewChild('riskChart') riskChart !: ScoreWiseReportsComponent;
  @ViewChild('depWiseRiskChart') depWiseRiskChart !: ScoreWiseReportsComponent;
  @ViewChild('indcWseRpt') indcWseRpt !: KpiIndicatorsComponent;
  public router = inject(Router);
  public access = inject(VaccinationAccessService).access('vaccine-details');
  public showUpload = false;
  public intialFilters: any = JSON.stringify({
    vaccine_name: null,
    user_display_name: null,
    department_name: null,
    next_vaccine_status: null,
  });
  public vaccineNameList: any = [];
  public empNameList: any = [];
  public departmentList: any = [];
  public vaccinStatusList: any = [];
  public vaccinFilters = signal(JSON.parse(this.intialFilters));
  public vaccineDetList: any = [];
  public filteredData: any = [];
  public copyData: any = [];
  public params: any = {}

  onSort({ column, direction }: SortEvent) {
    for (const header of this.headers) {
      if (header.sortable !== column) {
        header.direction = '';
      };
    };
    if (direction !== '' && column !== '') {
      this.filteredData = [...this.filteredData].sort((a: any, b: any) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
    this.showPage(1);
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
      await this.getVaccineStats();
      await this.getVaccineGrid();
    } catch (e) {
    }
  }

  public date_range: any = null;

  private getDateParams() {
    let fromDt = null;
    let toDate = null;
    if (this.date_range != null) {
      let dates = this.date_range.split(" - ");
      fromDt = dates[0];
      toDate = (dates.length > 1 ? dates[1] : dates[0]);
    };
    return {
      "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
      "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
    };
  }

  public initailStats = JSON.stringify({
    vaccinated_emp_cnt: 0,
    vaccines_brands_cnt: 0,
    scheduled_vaccines_cnt: 0,
    no_of_vaccine_cnt: 0,
    vaccinated_emp_cnt_last_updated: null,
    vaccines_brands_cnt_last_updated: null,
    scheduled_vaccines_cnt_last_updated: null,
    no_of_vaccine_cnt_last_updated: null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getVaccineStats() {
    try {
      let statInfo: any = await this._hqms.customGetApiCall('GET', 'vaccnationDashboardStats', this.getDateParams());
      if (statInfo.status == 200) {
        this.stats.set({
          vaccinated_emp_cnt: statInfo['data'][0].vaccinated_emp_cnt || 0,
          vaccines_brands_cnt: statInfo['data'][0].vaccines_brands_cnt || 0,
          scheduled_vaccines_cnt: statInfo['data'][0].scheduled_vaccines_cnt || 0,
          no_of_vaccine_cnt: statInfo['data'][0].no_of_vaccine_cnt || 0,
          vaccinated_emp_cnt_last_updated: statInfo['data'][0].vaccinated_emp_cnt_last_updated,
          vaccines_brands_cnt_last_updated: statInfo['data'][0].vaccines_brands_cnt_last_updated,
          scheduled_vaccines_cnt_last_updated: statInfo['data'][0].scheduled_vaccines_cnt_last_updated,
          no_of_vaccine_cnt_last_updated: statInfo['data'][0].no_of_vaccine_cnt_last_updated
        })
      };
    } catch (e) {
    };
  }

  async ngOnInit() {
    try {
      await this.setRange(this.selectedRange);
      await this.loadCharts();
    } catch (e) { }
  }

  async loadCharts() {
    await this.depWiseChartsRpts();
    await this.statusWiseChartRpts();
    await this.empWiseChartRpts();
    await this.breakdownRpts();
  }

  // Missed by reason (SRS 2.x3) and brand-wise completed doses (section 6), shown as simple bars.
  public missedByReason: any[] = [];
  public brandWise: any[] = [];
  async breakdownRpts() {
    try {
      let mrr: any = await this._hqms.customGetApiCall('GET', 'fnVaccinationDetailsCharts', { "flag": "MRR" });
      this.missedByReason = mrr?.status == 200 ? mrr.data : [];
      let bwr: any = await this._hqms.customGetApiCall('GET', 'fnVaccinationDetailsCharts', { "flag": "BWR" });
      this.brandWise = bwr?.status == 200 ? bwr.data : [];
    } catch (e) { }
  }

  barWidth(list: any[], value: number): number {
    let max = Math.max(...(list || []).map((x: any) => Number(x.value) || 0), 1);
    return Math.round((Number(value) || 0) * 100 / max);
  }

  async depWiseChartsRpts() {
    try {
      let depChart: any = await this._hqms.customGetApiCall('GET', 'fnVaccinationDetailsCharts',
        {
          "flag": "DWR"
        });
      if (depChart.status == 200) {
        this.riskChart.plotData(depChart['data'], 'donut')
      }
    } catch (e) { }
  }

  async statusWiseChartRpts() {
    try {
      let stsWiseChrt: any = await this._hqms.customGetApiCall('GET', 'fnVaccinationDetailsCharts',
        {
          "flag": "SWR"
        });
      if (stsWiseChrt.status == 200) {
        this.depWiseRiskChart.plotData(stsWiseChrt['data'], 'donut')
      }
    } catch (e) {
    }
  }

  async empWiseChartRpts() {
    try {
      let empWiseChrt: any = await this._hqms.customGetApiCall('GET', 'fnVaccinationDetailsCharts',
        {
          "flag": "EWR"
        });
      if (empWiseChrt.status == 200) {
        this.indcWseRpt.plotData(empWiseChrt['data'], "Employee")
      }
    } catch (e) { }
  }

  onFilterClick() {
    let filters = this.vaccinFilters();
    this.filteredData = this.copyData.filter((fl: any) => {
      let user_display_name = !filters.user_display_name || fl['user_display_name'] === filters.user_display_name;
      let vaccine_name = !filters.vaccine_name || fl['vaccine_name'] === filters.vaccine_name;
      let department_name = !filters.department_name || fl['department_name'] === filters.department_name;
      let next_vaccine_status = !filters.next_vaccine_status || fl['next_vaccine_status'] === filters.next_vaccine_status;
      return user_display_name && vaccine_name && department_name && next_vaccine_status;
    });
    this.showPage(1);
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.vaccinFilters.set(JSON.parse(this.intialFilters));
      this.filteredData = [...this.copyData];
      this.showPage(1);
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, vaccProp: any) {
    try {
      this.router.navigate(
        [
          '/vaccine-view'
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: vaccProp == null ? null : vaccProp.vaccination_administration_id,
              back: '/vaccine-details'
            }
          }
        },
      );
    } catch (e) { };
  }

  async onUploadDone(saved: boolean) {
    this.showUpload = false;
    if (saved) {
      await this.getVaccineStats();
      await this.getVaccineGrid();
      await this.loadCharts();
    }
  }

  async getVaccineGrid() {
    try {
      this.copyData = [];
      this.params = { ...this.getDateParams() };
      let getVaccinInfo: any = await this._hqms.customGetApiCall('GET', 'fnVaccinationDetailsGet', {
        "page_no": 1,
        "page_size": this.LOAD_ALL_SIZE,
        ...this.params
      });
      if (getVaccinInfo.status == 200) {
        let sourcedData: any = [];
        getVaccinInfo.data.forEach((vaccPrp: any, index: number) => {
          sourcedData.push({
            id: index + 1,
            vaccination_administration_id: vaccPrp.vaccination_administration_id,
            employee_code: vaccPrp.employee_code,
            user_display_name: vaccPrp.user_display_name,
            vaccine_name: vaccPrp.vaccine_name,
            department_name: vaccPrp.department_name,
            dosage: vaccPrp.dosage,
            dose_completion_pct: doseCompletionPct(vaccPrp),
            brand_batch_no: vaccPrp.brand_batch_no,
            last_vaccinated_date: vaccPrp.last_vaccinated_date,
            next_vaccine_dt: vaccPrp.next_vaccine_dt,
            next_vaccine_status: vaccPrp.next_vaccine_status,
            created_by: vaccPrp.created_by,
            created_at: vaccPrp.created_at,
            updated_by: vaccPrp.updated_by,
            updated_at: vaccPrp.updated_at,
          });
        });
        this.copyData = [...sourcedData];
        this.vaccineNameList = this.toOptions(sourcedData.map((item: any) => item.vaccine_name));
        this.empNameList = this.toOptions(sourcedData.map((item: any) => item.user_display_name));
        this.departmentList = this.toOptions(sourcedData.map((item: any) => item.department_name));
        this.vaccinStatusList = this.toOptions(sourcedData.map((item: any) => item.next_vaccine_status));
      };
      this.onFilterClick();
    } catch (e) { }
  }

  private toOptions(values: any[]) {
    return [...new Set(values.filter((v) => v != null && v !== ''))].map((name) => ({
      label: name,
      value: name
    }));
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

  // Client-side paging over the filtered list.
  showPage(pageNo: number) {
    let { pageSize } = this.pageNators();
    let totalPages = Math.max(1, Math.ceil(this.filteredData.length / pageSize));
    let page = Math.min(Math.max(1, pageNo), totalPages);
    this.vaccineDetList = this.filteredData.slice((page - 1) * pageSize, page * pageSize);
    this.pageNators.update(current => ({
      ...current,
      pageNo: page,
      totalItems: this.filteredData.length,
      totalPages: totalPages
    }));
  }

  changePage(newDisplayPage: number) {
    this.showPage(newDisplayPage);
  }
}
