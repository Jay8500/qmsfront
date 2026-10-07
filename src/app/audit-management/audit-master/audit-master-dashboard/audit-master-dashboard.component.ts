import { Component, Directive, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HqmsService } from '../../../services/hqms.service';
import { SharedModule } from '../../../shared/shared.module';
// import { BlockuiComponent } from '../../components/blockui/blockui.component';
import { DatePipe } from '@angular/common';
// import {AccessDirective } from '../../../smart/access.directive'
interface AuditTable {
  id: number;
  auditId: string;
  audit_template_id: string;
  auditName: string;
  auditType: string;
  category: string;
  sections: number;
  questions: number;
  status: string;
}
export type SortColumn = keyof AuditTable | '';
export type SortDirection = 'asc' | 'desc' | '';
const rotate: { [key: string]: SortDirection } = { asc: 'desc', desc: '', '': 'asc' };
const compare = (v1: string | number, v2: string | number) => (v1 < v2 ? -1 : v1 > v2 ? 1 : 0);
export interface SortEvent {
  column: SortColumn;
  direction: SortDirection;
}
@Directive({
  selector: 'th[sortable]',
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
  selector: 'app-audit-master-dashboard',
  imports: [CommonModule, NgbdSortableHeader, SharedModule,
  //  AccessDirective
   ],//BlockuiComponent
  templateUrl: './audit-master-dashboard.component.html'
})
export class AuditMasterDashboardComponent {
  public intialFilters: any = JSON.stringify({
    audit_name: null,
    audit_type: null,
    category: null,
    status: null
  });
  public trainingFilters = signal(JSON.parse(this.intialFilters));
  public auditNameList: any = [];
  public auditTypeList: any = [];
  public auditCategoryList: any = [];
  public statusList: any = [];
  public auditData: any = [];
  public copyData: any = [];
  public router:any = inject(Router);
  selectedRange: string = 'Last 30 days';

  constructor(private _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }
  async ngOnInit() {
    try {

      await this.setRange(this.selectedRange);
    } catch (e) { }
  }

  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;

  onSort({ column, direction }: SortEvent) {
    // resetting other headers
    for (const header of this.headers) {
      if (header.sortable !== column) {
        header.direction = '';
      }
    }

    // sorting data
    if (direction === '' || column === '') {
      this.auditData = this.auditData;
    } else {
      this.auditData = [...this.auditData].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  viewDetails(item: AuditTable) {
    this.router.navigate(['/audit-master-details'], {
      queryParams: { audit_template_id: item.audit_template_id, status: item.status }
    });
  }

  editAudit(item: AuditTable) {
    this.router.navigate(['/audit-master-edit'], {
      queryParams: { audit_template_id: item.audit_template_id, auditName: item.auditName }
    });
  }

  createNewAudit() {
    this.router.navigate(['/create-audit']);
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

  showFilter = false;
  filterToggle() {
    this.showFilter = !this.showFilter;
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
    await this.getAuditStats();
    await this.getAuditGrid();
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

  async getAuditStats() {
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

  onFilterClick() {
    try {
      let filters = this.trainingFilters();
      this.auditData = this.copyData.filter((fl: any) => {
        let matchName = !filters.audit_name || fl['auditName'] === filters.audit_name;
        let audit_type = !filters.audit_type || fl['auditType'] === filters.audit_type;
        let category = !filters.category || fl['category'] === filters.category;
        let status = !filters.status || fl['status'] === filters.status;
        return matchName && audit_type && category && status;
      });
    } catch (e) {
    }
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.trainingFilters.set(JSON.parse(this.intialFilters));
      this.auditData = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  onPageRoute(pageMode: string, auditCtrl: any) {
    try {
      this.router.navigate(
        [pageMode == 'VIEW' ? '/audit-master-details' : '/create-audit'],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: auditCtrl == null ? null : auditCtrl.audit_template_id
            }
          }
        },
      );
    } catch (e) { };
  }

  async onDelete(delPrp: any) {
    let confirm = await this._hqms.showConfirmMessage(`Confirm delete ${delPrp.auditName}`);
    if (confirm) {
      let savePayload = {
        "action": "D",
        "audit_template_id": delPrp.audit_template_id
      }
      var saveResult: any = await this._hqms.customSaveApiCall("POST", "fnAuditTemplateApi", savePayload);
      if (saveResult.status == 200) {
        this._hqms.hqmsToasterService({
          severity: 'success',
          summary: 'Audit',
          detail: saveResult.message,
        });
        // await this.getAuditGrid();
        this.auditData.forEach((ele: any) => {
          if (ele.audit_template_id == delPrp.audit_template_id) {
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

  public params: any = {};
  async getAuditGrid() {
    try {
      let { pageNo, pageSize } = this.pageNators();
      this.auditData = [];
      let totalCnt = 0;
      let flags: any = {
        "page_no": pageNo,
        "page_size": pageSize,
      };
      this.params = { ...flags }
      let info: any = await this._hqms.customGetApiCall('GET', 'fnAuditTemplateApi',
        flags);
      if (info.status == 200) {
        let sourcedData: any = [];
        totalCnt = info.data[0]['total_row_cnt'];
        info.data.forEach((adtMstr: any, index: number) => {
          let createTrainings: any = {
            id: index + 1,
            auditId: adtMstr.audit_id,
            audit_template_code: adtMstr.audit_template_code,
            category: adtMstr.category_type.trim(),
            sections: adtMstr.total_sections,
            questions: adtMstr.total_questions,
            auditName: adtMstr.audit_name.trim(),
            auditType: adtMstr.audit_type.trim(),
            created_by: adtMstr.created_by,
            created_at: adtMstr.created_at,
            updated_by: adtMstr.updated_by,
            updated_at: adtMstr.updated_at,
            status: adtMstr.status,
            audit_template_id: adtMstr.audit_template_id,
            audit_schedule_status: adtMstr.audit_schedule_status,
          };
          sourcedData.push(createTrainings);
        });
        this.auditData = [...sourcedData];
        this.copyData = [...sourcedData];
        this.auditNameList = [...new Set(sourcedData.map((item: any) => item.auditName))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.auditTypeList = [...new Set(sourcedData.map((item: any) => item.auditType))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.auditCategoryList = [...new Set(sourcedData.map((item: any) => item.category))].map((name, index) => ({
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
    await this.getAuditGrid();
  }
}
