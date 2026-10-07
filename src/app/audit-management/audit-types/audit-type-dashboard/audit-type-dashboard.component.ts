import { HeaderComponent } from '../../../layout/header/header.component';
import { ComparisonBarchartComponent } from '../../../components/comparison-barchart/comparison-barchart.component';
import { Component, CUSTOM_ELEMENTS_SCHEMA, ViewChild, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, signal, inject, computed, OnInit } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
import { DatePipe } from '@angular/common';
import { ScoreWiseReportsComponent } from '../../../components/score-wise-reports/score-wise-reports.component';
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
  selector: 'app-audit-type-dashboard',
  imports: [ComparisonBarchartComponent, CommonModule, NgbdSortableHeader,
  ScoreWiseReportsComponent
    , SharedModule],
  templateUrl: './audit-type-dashboard.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AuditTypeDashboardComponent implements OnInit {
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  @ViewChild('scoreWiseRpt') scoreWiseRpt !: ScoreWiseReportsComponent;
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
      this.auditList = this.auditList;
    } else {
      this.auditList = [...this.auditList].sort((a, b) => {
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
      await this.getAuditStats();
      await this.auditGrid();
    } catch (e) {
    }
  }
  public date_range: any = null;

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
  public apprvlsList:any = [];
  async getAuditStats() {
    try {
      let fromDt = null;
      let toDate = null;
      if (this.date_range != null) {
        let dates = this.date_range.split(" - ");
        fromDt = dates[0];
        toDate = (dates.length > 1 ? dates[1] : dates[0]);
      };
      let statInfo: any = await this._hqms.customGetApiCall('GET', 'fnAuditDashboardStats',
        {
          "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
          "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
        });
      if (statInfo.status == 200) {
        this.stats.set({
          active_audits: statInfo['data'].active_audits,
          completed_audits: statInfo['data'].completed_audits,
          scheduled_audits: statInfo['data'].scheduled_audits,
          total_audit_masters: statInfo['data'].total_audit_masters,
          active_audits_last_updated: statInfo['data'].active_audits_last_updated,
          completed_audits_last_updated: statInfo['data'].completed_audits_last_updated,
          scheduled_audits_last_updated: statInfo['data'].scheduled_audits_last_updated,
          total_audit_masters_last_updated: statInfo['data'].total_audit_masters_last_updated
        })
      };
    } catch (e) {
    };
  }

  async ngOnInit() {
    try {
      await this.setRange(this.selectedRange);
      await this.depWiseChartsRpts();
      await this.recentComplianceRpts();
      await this.nonComplianceRpts();
      await this.getApprovalList();
    } catch (e) {  }
  }


  async getApprovalList(){
    try{
          let info: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "APPRVLVLSTS" });
      if (info.status == 200) {
        this.apprvlsList = info.data.entities.APPRVLVLSTS.values.map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id,
          severity : ele.display_value == 'Approved' ? 'success' : 'danger'
        }))
      };
    }catch(e){};
  }

  async depWiseChartsRpts() {
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

  async recentComplianceRpts() {
    try {
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnRecentComplianceComparisonGetApi',
        {
          "flag": "DWR"
        });
      if (adChrt.status == 200) {
        let crtDtaSt: any = {
          "labels": [],
          "series": [],
          "chartNames": ['Compliance', 'Partial','Non-compliance']
        };
       let allMonths :any = [];
        if(Object.keys(adChrt['data']['COMPLIANCE']  || {}).length > 0 ){
           allMonths = [];
          allMonths.push(Object.keys(adChrt['data']['COMPLIANCE'] ))
         }

        if(Object.keys(adChrt['data']['PARTIAL']  || {}).length > 0 ){
           allMonths = [];
         allMonths.push(Object.keys(adChrt['data']['PARTIAL'] ))
         }

        if(Object.keys(adChrt['data']['NON_COMPLIANCE']  || {}).length > 0 ){
           allMonths = [];
           allMonths.push(Object.keys(adChrt['data']['NON_COMPLIANCE'] ))
         }
        let labels:any = Array.from(new Set(allMonths));
         if(Object.keys(adChrt['data']['COMPLIANCE']  || {}).length > 0 ){
          crtDtaSt['series'].push(
          {
            name: "Compliance",
            data: labels.map(mnth => adChrt['data'].COMPLIANCE[mnth] || 0)
          });
         };
         if(Object.keys(adChrt['data']['PARTIAL']  || {}).length > 0 ){
          crtDtaSt['series'].push(
            {
              name: "Partial",
              data: labels.map(mnth => adChrt['data'].PARTIAL[mnth] || 0)
            });
         };
         if(Object.keys(adChrt['data']['NON_COMPLIANCE']  || {}).length > 0 ){
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
    } catch (e) {
    }
  }

  public nonComplianceAudits: any = [];
  async nonComplianceRpts() {
    try {
      this.nonComplianceAudits = [];
      let adChrt: any = await this._hqms.customGetApiCall('GET', 'fnNonComplianceAuditsGetApi',
        {
          "flag": "DWR"
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
    auditTitle: null,
    department: null,
    location: null,
    auditor: null,
    auditee: null,
    status: null
  });
  public adtFilters = signal(JSON.parse(this.intialFilters));
  public auditTitleList: any = [];
  public departmentList: any = [];
  public auditorList: any = [];
  public auditeeList: any = [];
  public statusList: any = [];
  public locationList: any = [];
  public auditList: any = [];
  public copyData: any = [];
  public params: any = {};
  public appHstry:any =[];

  public is_history_drawer:boolean = false;
  async auditGrid() {
    this.appHstry = [];
    this.auditList = [];
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
      this.auditList = [];
      let flags: any = {
        "page_no": pageNo,
        "page_size": pageSize,
        "from_dt": fromDt == null ? null : this._datePipe.transform(fromDt, 'dd-MMM-yyyy'),
        "to_dt": toDate == null ? null : this._datePipe.transform(toDate, 'dd-MMM-yyyy'),
      };
      this.params = {
        ...flags
      };
      let info: any = await this._hqms.customGetApiCall('GET', 'fnConductAuditGetApi',
        flags);
      if (info.status == 200) {
        let sourcedData: any = [];
        totalCnt = info.data[0]['total_row_cnt'];
        info.data.forEach((adtInfo: any, index: number) => {
          let adts: any = {
            "id": index + 1,
            "audit_template_id": adtInfo.audit_template_id,
            "audit_id": adtInfo.audit_id,
            "auditTitle": (adtInfo.audit_title|| '').trim(),
            "department": (adtInfo.department_name|| '' ).trim(),
            "location": adtInfo.audit_location_name.trim(),
            "auditor": (adtInfo.auditor_name|| '').trim(),
            "auditee": (adtInfo.auditee_name|| '').trim(),
            "auditDate": adtInfo.audit_date,
            "compliance": adtInfo.audit_compliance > 0 ? `${adtInfo.audit_compliance} %` : null,
            "displayCol": adtInfo.audit_compliance,
            "status": adtInfo.status,
            "schedule_id": adtInfo.schedule_id,
            "conduct_audit_status": adtInfo.conduct_audit_status,
            "capa_required": adtInfo.capa_required,
            "enable_conduct": adtInfo.enable_conduct,
            "is_self_approved": adtInfo.is_self_approved,
            created_by: adtInfo.created_by,
            created_at: adtInfo.created_at,
            updated_by: adtInfo.updated_by,
            updated_at: adtInfo.updated_at,
            "can_approve": adtInfo.can_approve,
            "approval_workflow_level": adtInfo.approval_workflow_level,
          };
          sourcedData.push(adts);
        });
        this.auditList = [...sourcedData];
        this.copyData = [...sourcedData];

        this.auditTitleList = [...new Set(sourcedData.map((item: any) =>
          item.auditTitle))].map((name, index) => ({
            label: name,
            value: name
          }));
        this.locationList = [...new Set(sourcedData.map((item: any) =>
          item.location))].map((name, index) => ({
            label: name,
            value: name
          }));
        this.departmentList = [...new Set(sourcedData.map((item: any) =>
          item.department))].map((name, index) => ({
            label: name,
            value: name
          }));
        this.auditorList = [...new Set(sourcedData.map((item: any) =>
          item.auditor))].map((name, index) => ({
            label: name,
            value: name
          }));
        this.auditeeList = [...new Set(sourcedData.map((item: any) =>
          item.auditee))].map((name, index) => ({
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
    await this.auditGrid();
  }

  onFilterClick() {
    let filters = this.adtFilters();
    this.auditList = this.copyData.filter((fl: any) => {
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
      this.auditList = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(routePath: string, ctrl, info: any) {
    try {
      this.router.navigate(
        [
          routePath,
        ],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              id: info['schedule_id']
            }
          }
        },
      );
    } catch (e) { };
  }


}
