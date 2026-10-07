import { HeaderComponent } from '../../../layout/header/header.component';
import { ComparisonBarchartComponent } from '../../../components/comparison-barchart/comparison-barchart.component';
import { Component, CUSTOM_ELEMENTS_SCHEMA, ViewChild, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, signal, inject, computed, OnInit } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';
import { ScoreWiseReportsComponent } from '../../../components/score-wise-reports/score-wise-reports.component';
import { LocationsWiseIncidentComponent } from '../../../components/locations-wise-incident/locations-wise-incident.component';

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
  selector: 'app-ipsg-dashboard',
  imports: [ComparisonBarchartComponent, CommonModule, NgbdSortableHeader
    , SelectModule, FormsModule, SharedModule, LocationsWiseIncidentComponent],
  templateUrl: './ipsg-dashboard.component.html',
  styleUrl: './ipsg-dashboard.component.scss'
})
export class IpsgDashboardComponent implements OnInit {
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  @ViewChild('lctnWiseRpt') lctnWiseRpt !: LocationsWiseIncidentComponent;

  @ViewChild('rCCRpt') rCCRpt !: ComparisonBarchartComponent;
  public router = inject(Router);

  onSort({ column, direction }: SortEvent) {
    // // resetting other headers
    for (const header of this.headers) {
      if (header.sortable !== column) {
        header.direction = '';
      };
    };
    // sorting countries
    if (direction === '' || column === '') {
      this.ipsgMsrsList = this.ipsgMsrsList;
    } else {
      this.ipsgMsrsList = [...this.ipsgMsrsList].sort((a, b) => {
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

  getComplianceClass(compliance: any): any {
    if (compliance > 0) {
      // const value = parseInt(compliance.replace('%', ''), 10);
      if (compliance < 45) {
        return 'text-danger';   // red
      } else if (compliance >= 45 && compliance < 75) {
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
      await this.getIpsgStats();
      await this.ipsgGrid();
    } catch (e) {
    }
  }
  public date_range: any = null;

  public initailStats = JSON.stringify({
    ipsg_audits_count: 0,
    completed_audits: 0,
    scheduled_audits: 0,
    total_audit_masters: 0,
    active_audits_last_updated: null,
    completed_audits_last_updated: null,
    scheduled_audits_last_updated: null,
    total_audit_masters_last_updated: null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });
  async getIpsgStats() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      let statInfo: any = await this._hqms.customGetApiCall('GET', 'fnIpsgDashboardStats',
        {
          "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
          "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (statInfo.status == 200) {
        this.stats.set({
          ipsg_audits_count: statInfo['data'].ipsg_audits_count,
          completed_ipsg_count: statInfo['data'].completed_ipsg_count,
          compliance_rate_percentage: statInfo['data'].compliance_rate_percentage,
          total_auditors_count: statInfo['data'].total_auditors_count,
          ipsg_audits_last_updated: statInfo['data'].ipsg_audits_last_updated,
          completed_ipsg_last_updated: statInfo['data'].completed_ipsg_last_updated,
          compliance_rate_last_updated: statInfo['data'].compliance_rate_last_updated,
          total_auditors_last_updated: statInfo['data'].total_auditors_last_updated
        })
      };
    } catch (e) {
    };
  }

  async ngOnInit() {
    try {
      await this.setRange(this.selectedRange);
      await this.getGoalWiseChart();
      await this.recentComplianceRpts();
      await this.nonComplianceRpts();
    } catch (e) { }
  }

  async getGoalWiseChart() {
    try {
      let chartInfo: any = await this._hqms.customGetApiCall('GET', 'fnIpsgCharts',
        {
          "flag": "GWR",
        });
      this.lctnWiseRpt.plotData(chartInfo['data'], 'Goal Wise Report')
    } catch (e) { }
  }

  async recentComplianceRpts() {
    try {
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnIpsgCharts',
        {
          "flag": "RCC"
        });
      if (adChrt.status == 200) {
        let crtDtaSt: any = {
          "labels": [],
          "series": [],
          "chartNames": ['Compliance', 'Non-compliance']
        };
        let allMonths = [
          ...Object.keys(adChrt['data']['COMPLIANCE'] || {}),
          ...Object.keys(adChrt['data']['NON_COMPLIANCE '] || {}),
        ];
        let labels = Array.from(new Set(allMonths));
        if (Object.keys(adChrt['data']['COMPLIANCE'] || {}).length > 0) {
          crtDtaSt['series'].push(
            {
              name: "Compliance",
              data: labels.map(mnth => adChrt['data'].COMPLIANCE[mnth] || 0)
            });
        };
        if (Object.keys(adChrt['data']['NON_COMPLIANCE'] || {}).length > 0) {
          crtDtaSt['series'].push(
            {
              name: "Non-compliance",
              data: labels.map(mnth => adChrt['data'].NON_COMPLIANCE[mnth] || 0)
            }
          );
        };
        crtDtaSt['labels'] = labels;
        this.rCCRpt.plotData(crtDtaSt, 'pie')//
      }
    } catch (e) { }
  }

  public nonComplianceAudits: any = [];
  async nonComplianceRpts() {
    try {
      this.nonComplianceAudits = [];
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnIpsgCharts',
        {
          "flag": "NCA"
        });
      if (adChrt.status == 200) {
        this.nonComplianceAudits = adChrt.data
      }
    } catch (e) {
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

  // dropdowns filters
  public intialFilters: any = JSON.stringify({
    ipsg_id: null,
    department_name: null,
    auditor_name: null,
    compliance_name: null,
    status: null
  });
  public adtFilters = signal(JSON.parse(this.intialFilters));
  public ipsgIDList: any = [];
  public departmentList: any = [];
  public auditorList: any = [];
  public auditeeList: any = [];
  public statusList: any = [];
  public complainceList: any = [];
  public ipsgMsrsList: any = [];
  public copyData: any = [];
  public params: any = {}
  async ipsgGrid() {
    this.ipsgMsrsList = [];
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
      this.ipsgMsrsList = [];
      let flags: any = {

        "page_no": pageNo,
        "page_size": pageSize,
        "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
        "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),

      }
      this.params = {
        ...flags
      }
      let info: any = await this._hqms.customGetApiCall('GET', 'fnIpsgAuditGrid',
        flags);
      if (info.status == 200) {
        let sourcedData: any = [];
        totalCnt = info.data[0]['total_row_cnt'];
        info.data.forEach((adtInfo: any, index: number) => {
          let adts: any = {
            "id": index + 1,
            "ipsg_id": adtInfo.ipsg_id,
            "department_name": adtInfo.department_name,
            "auditor_name": adtInfo.auditor_name,
            "audit_date": adtInfo.audit_date,
            "compliance_name": adtInfo.compliance_name > 0 ? `${adtInfo.compliance_name} %` : null,
            "displayCol": adtInfo.compliance_name,
            "completed_goals_name": adtInfo.completed_goals_name,
            "created_by": adtInfo.created_by,
            "created_at": adtInfo.created_at,
            "updated_by": adtInfo.updated_by,
            "updated_at": adtInfo.updated_at,
            "status": adtInfo.status,
          };
          sourcedData.push(adts);
        });
        this.ipsgMsrsList = [...sourcedData];
        this.copyData = [...sourcedData];

        this.ipsgIDList = [...new Set(sourcedData.map((item: any) =>
          item.ipsg_id))].map((name, index) => ({
            label: name,
            value: name
          }));
        this.auditorList = [...new Set(sourcedData.map((item: any) =>
          item.auditor_name))].map((name, index) => ({
            label: name,
            value: name
          }));
        this.departmentList = [...new Set(sourcedData.map((item: any) =>
          item.department_name))].map((name, index) => ({
            label: name,
            value: name
          }));

        this.complainceList = [...new Set(sourcedData.map((item: any) =>
          item.compliance_name))].map((name, index) => ({
            label: name,
            value: name
          }));
        this.statusList = [...new Set(sourcedData.map((item: any) =>
          item.status))].map((name, index) => ({
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
    await this.ipsgGrid();
  }



  onFilterClick() {
    let filters = this.adtFilters();
    this.ipsgMsrsList = this.copyData.filter((fl: any) => {
      let audit_title = !filters.auditTitle ||
        fl['auditTitle'] === filters.auditTitle;
      let department = !filters.department ||
        fl['department'] === filters.department;
      let location = !filters.location || fl['location'] ===
        filters.location;
      let auditor_name = !filters.auditor || fl['auditor_name'] ===
        filters.auditor;
      let auditee_name = !filters.auditee || fl['auditee_name'] ===
        filters.auditee;
      let status = !filters.status || fl['status'] === filters.status;
      return audit_title && department && location
        && auditor_name && auditee_name && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.adtFilters.set(JSON.parse(this.intialFilters));
      this.ipsgMsrsList = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, ctrl: any) {
    try {
      this.router.navigate(
        [
          this.assignRoute(pageMode)
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: ctrl == null ? null : ctrl.ipsg_id
            }
          }
        },
      );
    } catch (e) { };
  }

  assignRoute(ctrl) {
    let route = "";
    switch (ctrl) {
      case "VIEW":
        route = '/ipsg-details';
        break;
      case "EDIT":
      case "NEW":
        route = '/ipsg-audit';
        break;
      case "WRITECAPA":
        route = '/ipsg-capa';
        break;
      case "REVIEWCAPA":
        route = '/ipsg-capa-review';
        break;
    };
    return route;
  }
}
