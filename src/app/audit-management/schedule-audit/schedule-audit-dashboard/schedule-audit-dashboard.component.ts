import { Component, ViewChild, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
// import { StatusWiseReportAuditComponent } from '../../../components/status-wise-report-audit/status-wise-report-audit.component';
// import { AlertModalsComponent } from '../../../components/alert-modals/alert-modals.component';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';
import { ScoreWiseReportsComponent } from '../../../components/score-wise-reports/score-wise-reports.component';

interface scheduleAuditTable {
  id: number;
  audit_name: any;
  audit_title: any;
  audit_type_name: any;
  department_name: any;
  auditor_name: any;
  auditee_name: any;
  audit_date: any;
  schedule_status: any;
  status: any;
};
export type SortColumn = keyof scheduleAuditTable | '';
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
  selector: 'app-schedule-audit-dashboard',
  imports: [CommonModule, NgbdSortableHeader, SharedModule, ScoreWiseReportsComponent],
  // StatusWiseReportAuditComponent,//  AlertModalsComponent,
  templateUrl: './schedule-audit-dashboard.component.html',
})
export class ScheduleAuditDashboardComponent {
  @ViewChild('scoreWiseRpt') scoreWiseRpt !: ScoreWiseReportsComponent;
  @ViewChild('statusWiseRpt') statusWiseRpt !: ScoreWiseReportsComponent;

  public intialFilters: any = JSON.stringify({
    audit_name: null,
    audit_title: null,
    department_name: null,
    auditor_name: null,
    auditee_name: null,
    status: null
  });
  public schFilters = signal(JSON.parse(this.intialFilters));
  public auditList: any = [];
  public auditTitleList: any = [];
  public departmentList: any = [];
  public auditorList: any = [];
  public auditeeList: any = [];
  public statusList: any = [];
  public schlAuditGrid: any = [];
  public copyData: any = [];
  public router = inject(Router);
  selectedRange: string = 'Last 30 days';

  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  async ngOnInit() {
    try {
      await this.setRange(this.selectedRange);
      await this.depWiseCharts();
      await this.statusWiseRpts();
      await this.upcmngCharts();
    } catch (e) { }
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
      this.schlAuditGrid = this.schlAuditGrid;
    } else {
      this.schlAuditGrid = [...this.schlAuditGrid].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }
  // Filter toggle
  filterToggle() {
    this.showFilter = !this.showFilter;
  }

  async depWiseCharts() {
    try {
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnAuditScheduleReportApi',
        {
          "flag": "DWR"
        });
      if (adChrt.status == 200) {
        this.scoreWiseRpt.plotData(adChrt['data'], 'pie')//
      }
    } catch (e) { }
  }

  async statusWiseRpts() {
    try {
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnAuditScheduleReportApi',
        {
          "flag": "SWR"
        });
      if (adChrt.status == 200) {
        this.statusWiseRpt.plotData(adChrt['data'], 'pie')
      }
    } catch (e) { }
  }

  public upmcmngSchdAdts: any = [];
  async upcmngCharts() {
    try {
      this.upmcmngSchdAdts = [];
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnAuditScheduleReportApi',
        {
          "flag": "UPCMNGAUD"
        });
      if (adChrt.status == 200) {
        this.upmcmngSchdAdts = adChrt['data'];
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
    await this.getSchAuditStats();
    await this.getScheduleAuditGrid();
  }

  public initailStats = JSON.stringify({
    active_audits: 0,
    completed_audits: 0,
    scheduled_audits: 0,
    total_audit_masters: 0,
    active_audits_last_updated: null,
    completed_audits_last_updated: null,
    scheduled_audits_last_updated: null,
    total_audit_masters_last_updated: null
  })
  public stats: any = signal({ ...JSON.parse(this.initailStats) });

  async getSchAuditStats() {
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
      let statInfo: any = await this._hqms.customGetApiCall('GET', 'fnAuditDashboardStats', statsParam);
      //fnScheduleAuditDashboardStatsGetApi ---Previous Method
      if (statInfo.status == 200) {
        this.stats.set({
          active_audits: statInfo['data'].active_audits,
          completed_audits: statInfo['data'].completed_audits,
          scheduled_audits: statInfo['data'].scheduled_audits,
          total_audit_masters: statInfo['data'].total_audit_masters,
          active_audits_last_updated: statInfo['data'].active_audits_last_updated,
          completed_audits_last_updated: statInfo['data'].completed_audits_last_updated,
          scheduled_audits_last_updated: statInfo['data'].scheduled_audits_last_updated,
          total_audit_masters_last_updated: statInfo['data'].total_audit_masters_last_updated,
        })
      };
    } catch (e) {
    };
  }

  onFilterClick() {
    let filters = this.schFilters();
    this.schlAuditGrid = this.copyData.filter((fl: any) => {
      let audit_name = !filters.audit_name || fl['audit_name'] === filters.audit_name;
      let audit_title = !filters.audit_title || fl['audit_title'] === filters.audit_title;
      let department_name = !filters.department_name || fl['department_name'] === filters.department_name;
      let auditor_name = !filters.auditor_name || fl['auditor_name'] === filters.auditor_name;
      let auditee_name = !filters.auditee_name || fl['auditee_name'] === filters.auditee_name;
      let status = !filters.status || fl['status'] === filters.status;
      return audit_name && audit_title && department_name && auditor_name && auditee_name && status;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.schFilters.set(JSON.parse(this.intialFilters));
      this.schlAuditGrid = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, schAudit: any) {
    try {
      this.router.navigate(
        [
          '/schedule-audit-add',
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: schAudit == null ? null : schAudit.schedule_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onUpdateClick(schAudit: any, ctrl: string) {
    let confirm = await this._hqms.showConfirmMessage(`${ctrl} Scheduled Audit ${schAudit.audit_name}`);
    if (confirm) {
      let savePayload = {
        action: ctrl == 'Cancel' ? "C" : "D",
        "schedule_id": schAudit.schedule_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnAuditScheduleApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Schedule Audit',
          detail: saveResult.message,
        });
        // this.schlAuditGrid = [...this.copyData.filter((fl: any) => fl.audit_template_id != schAudit.audit_template_id)];
        this.schlAuditGrid.forEach((ele: any) => {
          if (ele.schedule_id == schAudit.schedule_id) {
            if (ctrl == 'Cancel') {
              ele['status'] = 'Cancel';
            } else {
              ele['status'] = 'Inactive';
            };
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

  public params: any = {}
  async getScheduleAuditGrid() {
    try {
      // let fromDt = null;
      // let toDate = null;
      // if (this.date_range != null) {
      //   let dates = this.date_range.split(" - ");
      //   fromDt = dates[0];
      //   toDate = (dates.length > 1 ? dates[1] : dates[0]);
      // };
      let { pageNo, pageSize } = this.pageNators();
      this.schlAuditGrid = [];
      let totalCnt = 0;
      let flags: any = {
        "page_no": pageNo,
        "page_size": pageSize,
        // "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
        // "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
      }
      this.params = { ...flags }
      let schlAuditInfo: any = await this._hqms.customGetApiCall('GET', 'fnAuditScheduleApi',
        flags);
      if (schlAuditInfo.status == 200) {
        let sourcedData: any = [];
        totalCnt = schlAuditInfo.data[0]['total_row_cnt'];
        schlAuditInfo.data.forEach((adtInfo: any, index: number) => {
          let crtSchGrid: any = {
            "id": index + 1,
            // "loc_id": adtInfo["loc_id"],
            // "org_id": adtInfo["org_id"],
            "status": adtInfo["status"],
            "schedule_status": (adtInfo["schedule_status"] || '').trim(),
            "is_active": adtInfo["is_active"],
            "audit_name": (adtInfo["audit_name"] || '').trim(),
            "auditee_id": adtInfo["auditee_id"],
            "auditor_id": adtInfo["auditor_id"],
            "audit_title": adtInfo["audit_title"],
            "schedule_id": adtInfo["schedule_id"],
            "auditee_name": (adtInfo["auditee_name"] || '').trim(),
            "auditor_name": (adtInfo["auditor_name"] || '').trim(),
            "audit_type_id": adtInfo["audit_type_id"],
            "created_by_id": adtInfo["created_by_id"],
            "department_id": adtInfo["department_id"],
            "updated_by_id": adtInfo["updated_by_id"],
            "audit_type_name": (adtInfo["audit_type_name"] || '').trim(),
            "department_name": (adtInfo["department_name"] || '').trim(),
            "patient_details": adtInfo["patient_details"],
            "audit_location_id": adtInfo["audit_location_id"],
            "audit_template_id": adtInfo["audit_template_id"],
            "audit_location_name": adtInfo["audit_location_name"],
            "supporting_documents": adtInfo["supporting_documents"],
            "audit_date": adtInfo["audit_date"],
            "created_by": adtInfo["created_by"],
            "created_at": adtInfo["created_at"],
            "updated_by": adtInfo["updated_by"],
            "updated_at": adtInfo["updated_at"],
            is_past_aduit : new Date(adtInfo["audit_date"]) < new Date() ? false : true
          };
          sourcedData.push(crtSchGrid);
        });
        this.schlAuditGrid = [...sourcedData];
        this.copyData = [...sourcedData];
        this.auditList = [...new Set(sourcedData.map((item: any) =>
          item.audit_name))].map((name, index) => ({
            label: name,
            value: name
          }));
        this.auditTitleList = [...new Set(sourcedData.map((item: any) =>
          item.audit_title))].map((name, index) => ({
            label: name,
            value: name
          }));
        this.departmentList = [...new Set(sourcedData.map((item: any) =>
          item.department_name))].map((name, index) => ({
            label: name,
            value: name
          }));
        this.auditorList = [...new Set(sourcedData.map((item: any) =>
          item.auditor_name))].map((name, index) => ({
            label: name,
            value: name
          }));
        this.auditeeList = [...new Set(sourcedData.map((item: any) =>
          item.auditee_name))].map((name, index) => ({
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
    await this.getScheduleAuditGrid();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'text-success';
      case 'Inactive':
        return 'text-danger';
      default:
        return '';
    }
  }
}
