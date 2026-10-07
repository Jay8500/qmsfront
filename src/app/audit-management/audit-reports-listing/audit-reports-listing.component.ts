import { Component, Directive, signal, computed, EventEmitter, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewChildren, QueryList, inject, Input, Output } from '@angular/core';
import { Location } from '@angular/common';
import { HqmsService } from '../../services/hqms.service';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule } from '@angular/common';
import {Validations} from '../../validations'
interface AuditReports {
  id: number;
  auditName: any;
  auditTitle: any;
  department: any;
  auditor: any;
  auditee: any;
  auditDate: any;
}
export type SortColumn = keyof AuditReports | '';
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
  selector: 'app-audit-reports-listing',
  imports: [CommonModule, NgbdSortableHeader, SharedModule],//BlockuiComponent
  templateUrl: './audit-reports-listing.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AuditReportsListingComponent implements OnInit {
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;
  public intialFilters: any = JSON.stringify({
    auditName: null,
    auditTitle: null,
    department: null,
    auditor: null,
    auditee: null,
  });
  public router = inject(Router);
  public FORM_NAME = 'AUDIT_RPT';
  public validation=inject(Validations)
  public auditTypeList: any = [];
  public auditTemplateList: any = [];
  public reportParams: any = signal({
    "audit_type_id": null,
    "audit_template_id": null,
    "schedule_id": null,
    "from_dt": null,
    "to_dt": null,
  });
  public errorMsg:any={
    audit_type_id:'',
    audit_template_id:'',
    from_dt:'',
    to_dt:''
  }
  onGetErrorMsg(ctrl:any){
    let result=this.validation.validateField(
      this.FORM_NAME,
      ctrl,
      this.reportParams()[ctrl]
    );
    this.errorMsg[ctrl]=result?.message || ''
  }
 
  public auditsList: any = [];
  public auditMasterFilters = signal({ ...JSON.parse(this.intialFilters) });
  public auditNameList: any = [];
  public auditTitleList: any = [];
  public departmentList: any = [];
  public auditorList: any = [];
  public auditeeList: any = [];
  
  showFilter = false;

  // Filter Dropdown
  public copyData: any = [];
  constructor(private location: Location, public _hqms: HqmsService, private activatedRoute: ActivatedRoute, public _datePipe: DatePipe) { }

  goBack(): void {
    this.location.back();
  }

  getFormattedSNo(id: number): string {
    return id.toString().padStart(2, '0');
  }
  async ngOnInit() {
    try {
      let getAdtType: any = await this._hqms.customGetApiCall('GET', 'commanEntityValuesGetApi',
        { "entity_codes": "AUDIT_TYPE" });
      if (getAdtType.status == 200) {
        this.auditTypeList = getAdtType.data.entities.AUDIT_TYPE.values.map((ele: any) => ({
          label: ele.display_value,
          value: ele.entity_value_id
        }))
      };

    } catch (e) { };
  }

  async getAuditsOnType(value: string) {
    try {
      let info: any = await this._hqms.customGetApiCall('GET', 'fnTemplateListGet',
        {
          "flag": "AUDIT",
          audit_type_id: value
        });
      if (info.status == 200) {
        this.auditTemplateList = info.data.map((ele: any) => ({
          label: ele.audit_name,
          value: ele.audit_template_id
        }))
      };
    } catch (e) { };
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
      this.auditsList = this.auditsList;
    } else {
      this.auditsList = [...this.auditsList].sort((a, b) => {
        const res = compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  filterToggle() {
    this.showFilter = !this.showFilter;
  }
  public params: any = {};

  async onAuditTypeChange() {
    this.reportParams().audit_template_id = null;
    this.reportParams().from_dt = null;
    this.reportParams().to_dt = null;
    this.auditsList = [];
    await this.getAuditsOnType(this.reportParams().audit_type_id);
  }

  async onAuditTemplateChange() {
    this.reportParams().from_dt = null;
    this.reportParams().to_dt = null;
    this.auditsList = [];
    await this.getAuditsOnType(this.reportParams().audit_template_id);
  }

  async onFromDtChange() {
    this.reportParams().to_dt = null;
    this.auditsList = [];
    await this.getAuditsOnType(this.reportParams().from_dt);
  }

  async onToDtChange() {
    this.auditsList = [];
    await this.getAuditsOnType(this.reportParams().to_dt);
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

  async getAudits() {
    try {
      let getFilters = this.reportParams();
      Object.keys(this.errorMsg).forEach((ctrl:any)=>{this.onGetErrorMsg(ctrl)})
      let isValid=this._hqms.showErrorSummary(this.errorMsg);
      if(isValid){
        this._hqms.hqmsToasterService({
          key: 'prem',
           severity: 'warn',
                summary: 'Audit Reports',
                detail: 'Check the errors',
              });
              return;
         
      }
      console.log(this.errorMsg,"ErrMSG")
      if (
        getFilters['audit_type_id'] == null &&
        getFilters['audit_template_id'] == null &&
        getFilters['from_dt'] == null &&
        getFilters['to_dt'] == null
      ) {
        this._hqms.hqmsToasterService({
          severity: 'error',
          summary: 'Audit Report',
          detail: 'Atleast apply a filter'
        });
        return;
      }
      let { pageNo, pageSize } = this.pageNators();
      this.auditsList = [];
      let totalCnt = 0;
      let flags : any = {
          "audit_type_id": this.reportParams().audit_type_id,
          "audit_template_id": this.reportParams().audit_template_id,
          "schedule_id": this.reportParams().schedule_id,
          "from_dt": this._datePipe.transform(this.reportParams().from_dt, 'dd-MMM-yyyy'),
          "to_dt": this._datePipe.transform(this.reportParams().to_dt, 'dd-MMM-yyyy'),
          "page_no": pageNo,
          "page_size": pageSize,
      };
      this.params = { ...flags }
      let info: any = await this._hqms.customGetApiCall('GET', 'fnAuditReportGetApi',
       flags
      );
      if (info.status == 200) {
        let sourcedData: any = [];
        totalCnt = info.data[0]['total_row_cnt'];
        info.data.forEach((item: any, index: number) => {
          let createFaculty: any = {
            id: index + 1,
            audit_template_id: item.audit_template_id,
            schedule_id: item.schedule_id,
            auditName: item.audit_name,
            auditTitle: item.audit_title,
            department: item.department_name,
            auditor: item.auditor_name,
            auditee: item.auditee_name,
            auditDate: item.audit_date
          };
          sourcedData.push(createFaculty);
        });
        this.auditsList = [...sourcedData];
        this.copyData = [...sourcedData];
        this.auditNameList = [...new Set(sourcedData.map((item: any) => item.auditName))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.auditTitleList = [...new Set(sourcedData.map((item: any) => item.auditTitle))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.departmentList = [...new Set(sourcedData.map((item: any) => item.department))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.auditorList = [...new Set(sourcedData.map((item: any) => item.auditor))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.auditeeList = [...new Set(sourcedData.map((item: any) => item.auditee))].map((name, index) => ({
          label: name,
          value: name
        }));
        this.pageNators.update(current => ({
          ...current,
          totalItems: info.data.length,
          totalPages: Math.ceil(totalCnt)
        }));
      } else {
        this._hqms.hqmsToasterService({
          severity: 'error',
          summary: 'Audit Report',
          detail: info.message
        });
      }
    } catch (e) { };
  }

  onFilterClick() {
    let filters = this.auditMasterFilters();
    this.auditsList = this.copyData.filter((fl: any) => {
      let auditName = !filters.auditName || fl['auditName'] === filters.auditName;
      let auditTitle = !filters.auditTitle || fl['auditTitle'] === filters.auditTitle;
      let department = !filters.department || fl['department'] === filters.department;
      let auditor = !filters.auditor || fl['auditor'] === filters.auditor;
      let auditee = !filters.auditee || fl['auditee'] === filters.auditee;
      return auditName && auditTitle && department && auditor && auditee;
    });
  }

  async onFilterClear(event: any) {
    if (event == null) {
      this.auditMasterFilters.set(JSON.parse(this.intialFilters));
      this.auditsList = [...this.copyData];
    } else {
      this.onFilterClick();
    }
  }

  async changePage(newDisplayPage: number) {
    this.pageNators.update(prev => ({ ...prev, pageNo: newDisplayPage }));
    await this.getAudits();
  }

  onPageRoute(pageMode: string, auditCtrl: any) {
    try {
      this.router.navigate(
        ['/schedule-audit-add'],
        {
          relativeTo: this.activatedRoute,
          state: {
            data: {
              mode: pageMode,
              id: auditCtrl == null ? null : auditCtrl.schedule_id
            }
          }
        },
      );
    } catch (e) { };
  }

  onClear() {
    this.reportParams.set({
      "audit_type_id": null, // audot type
      "audit_template_id": null,
      "schedule_id": null,
      "from_dt": null,
      "to_dt": null,
    });
    this.auditsList = [];
    this.auditNameList = [];
    this.auditTitleList = [];
    this.departmentList = [];
    this.auditorList = [];
    this.auditeeList = [];
  }
}
