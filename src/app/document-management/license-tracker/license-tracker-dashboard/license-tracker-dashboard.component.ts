import { Component, ViewChild, CUSTOM_ELEMENTS_SCHEMA, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../../../layout/header/header.component';
import { NgApexchartsModule, ChartComponent } from "ng-apexcharts";
import { CategoryReportsComponent } from '../../../components/category-reports/category-reports.component';
import { StatusReportComponent } from '../../../components/status-report/status-report.component';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';

// import {
//   ApexNonAxisChartSeries,
//   ApexResponsive,
//   ApexChart,
//   ApexLegend,
//   ApexFill,
//   ApexStroke,
//   ApexDataLabels
// } from "ng-apexcharts";

// export type ChartOptions = {
//   series: ApexNonAxisChartSeries;
//   chart: ApexChart;
//   labels: string[];
//   responsive: ApexResponsive[];
//   colors: string[];
//   legend: ApexLegend;
//   fill: ApexFill;
//   stroke?: ApexStroke;
//   dataLabels?: ApexDataLabels;
// };

interface licenseTrackerTable {
  id: number;
  license_id: any;
  license_name_no: any;
  provider_name: any;
  assigned_to: any;
  issue_date: any;
  expiry_date: any;
  renewal_application_date: any;
  status: any;
}

export type SortColumn = keyof licenseTrackerTable | '';
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
  selector: 'app-license-tracker-dashboard',
  imports: [NgApexchartsModule, CommonModule, NgbdSortableHeader, SelectModule, FormsModule, SharedModule],
  templateUrl: './license-tracker-dashboard.component.html',
  styleUrl: './license-tracker-dashboard.component.scss'
})
export class LicenseTrackerDashboardComponent implements OnInit {
  // @ViewChild("chart") chart!: ChartComponent;
  // public chartOptions: ChartOptions;

  public intialFilters: any = JSON.stringify({
    license_name_no: null,
    assigned_to: null,
    expiry_date: null,
    renewal_application_date: null,
    status: null,
  });
  public licenseTrackerFilters = signal({ ...JSON.parse(this.intialFilters) });
  public licenseNameList: any = [];
  public assignedToList: any = [];
  public statusList: any = [];
  public licenseTrackerGrid: any = [];
  public router = inject(Router);

  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  showFilter = false;

  // Filter Dropdown
  selectedRange: string = 'Last 30 days';
  public copyData: any = [];

  // constructor() {
  //   this.chartOptions = {
  //     series: [25, 25, 25, 25],
  //     chart: {
  //       type: "donut",
  //       width: 380
  //     },
  //     labels: ["Blood Bank", "In-Patient", "ICU", "Out Patient"],
  //     colors: ["#4B7BF5", "#19D4CA", "#FD77A1", "#FDBF4C"],
  //     fill: {
  //       type: "solid"
  //     },
  //     stroke: {
  //       show: false
  //     },
  //     dataLabels: {
  //       enabled: false
  //     },
  //     legend: {
  //       position: "bottom",
  //       fontSize: "14px",
  //       fontWeight: 500,
  //       labels: {
  //         colors: "#333"
  //       },
  //       markers: {
  //         shape: "circle"
  //       },
  //       itemMargin: {
  //         horizontal: 10,
  //         vertical: 5
  //       }
  //     },
  //     responsive: [
  //       {
  //         breakpoint: 480,
  //         options: {
  //           chart: {
  //             width: 250
  //           },
  //           legend: {
  //             position: "bottom"
  //           }
  //         }
  //       }
  //     ]
  //   };
  // }


  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
      await this.setRange(this.selectedRange);
      await this.getLicenseTrackerGrid();
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
      this.licenseTrackerGrid = this.licenseTrackerGrid;
    } else {
      this.licenseTrackerGrid = [...this.licenseTrackerGrid].sort((a, b) => {
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
    await this.getLicenseStats();
  }

  public initailStats = JSON.stringify({
    total_license: 0,
    active_license: 0,
    expired_license: 0,
    total_providers: 0,
    total_license_last_updated: null,
    active_license_last_updated: null,
    expired_license_last_updated: null,
    total_providers_last_updated: null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getLicenseStats() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      this.licenseTrackerGrid = [];
      let getLicenseStats: any = await this._hqms.customGetApiCall('GET', 'fnLicenseDashboardApi',
        {
          "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
          "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (getLicenseStats.status == 200) {
        getLicenseStats = getLicenseStats['data'][0];
        this.stats.set({
          total_license: getLicenseStats.total_license,
          active_license: getLicenseStats.active_license,
          expired_license: getLicenseStats.expired_license,
          total_providers: getLicenseStats.total_providers,
          total_license_last_updated: getLicenseStats.total_license_last_updated,
          active_license_last_updated: getLicenseStats.active_license_last_updated,
          expired_license_last_updated: getLicenseStats.expired_license_last_updated,
          total_providers_last_updated: getLicenseStats.total_providers_last_updated
        })
      };
    } catch (e) { };
  }

  public params: any = {};
  async getLicenseTrackerGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.licenseTrackerGrid = [];
      let totalCnt = 0;
      let flags: any = {

      }
      this.params = { ...flags }
      let getLicenseTrackerList: any = await this._hqms.customGetApiCall('GET', 'fnLicenseApi', this.params);
      if (getLicenseTrackerList.status == 200) {
        let sourcedData: any = [];
        totalCnt = getLicenseTrackerList.data[0]['total_row_cnt'];
        getLicenseTrackerList.data.forEach((licenseTrackers: any, index: number) => {
          let createLicenseTracker: any = {
            id: index + 1,
            license_id: licenseTrackers.license_id,
            license_name_no: licenseTrackers.license_name_no,
            provider_name: licenseTrackers.provider_name,
            assigned_to: licenseTrackers.assigned_to,
            issue_date: licenseTrackers.issue_date,
            expiry_date: licenseTrackers.expiry_date,
            renewal_application_date: licenseTrackers.renewal_application_date,
            status: licenseTrackers.status,
            created_by: licenseTrackers.created_by,
            created_at: licenseTrackers.created_at,
            updated_by: licenseTrackers.updated_by,
            updated_at: licenseTrackers.updated_at,
          };
          sourcedData.push(createLicenseTracker);
        });
        this.licenseTrackerGrid = [...sourcedData];
        this.copyData = [...sourcedData];

        this.licenseNameList = [...new Set(sourcedData.map((item: any) => item.license_name_no))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.assignedToList = [...new Set(sourcedData.map((item: any) => item.assigned_to))].map((name, index) => ({
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
    let filters = this.licenseTrackerFilters();
    this.licenseTrackerGrid = this.copyData.filter((fl: any) => {
      let license_name_no = !filters.license_name_no || fl['license_name_no'] === filters.license_name_no;
      let assigned_to = !filters.assigned_to || fl['assigned_to'] === filters.assigned_to;
      let status = !filters.status || fl['status'] === filters.status;
      return license_name_no && assigned_to && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.licenseTrackerFilters.set(JSON.parse(this.intialFilters));
      this.licenseTrackerGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, licenseTracker: any) {
    try {
      this.router.navigate(
        [
          pageMode == 'VIEW' ? '/license-tracker-details' : '/license-tracker-add',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: licenseTracker == null ? null : licenseTracker.license_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(licenseTracker: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${licenseTracker.license_name_no}`);
    if (confirm) {
      let savePayload = {
        action: "D",
        "license_id": licenseTracker.license_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnLicenseApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'License Tracker',
          detail: saveResult.message,
        });
        // this.licenseTrackerGrid = [...this.copyData.filter((fl: any) => fl.license_id != licenseTracker.license_id)];
        this.licenseTrackerGrid.forEach((ele: any) => {
          if (ele.license_id == licenseTracker.license_id) {
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
    let pages = this.pageNators().totalItems;
    return Array.from({ length: pages }, (_, i) => i + 1);
  })

  async changePage(newDisplayPage: number) {
    this.pageNators.update(prev => ({ ...prev, pageNo: newDisplayPage }));
    await this.licenseTrackerGrid();
  }

}
